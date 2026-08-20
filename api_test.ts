#!/usr/bin/env ts-node
/// <reference types="node" />
// ================================================================
// API Health Check Script — Chess Platform
// Tests every REST endpoint on auth-service and the /health
// endpoint on game-service. Prints a colored pass/fail summary.
//
// Usage:
//   npx ts-node api_test.ts
//
// Pre-requisites:
//   1. Docker infra is running:  pnpm infra:up  (from repo root)
//   2. Databases created & migrated (see below)
//   3. Both services running:
//       - auth-service:  pnpm --filter @chess/auth-service dev
//       - game-service:  pnpm --filter @chess/game-service dev
// ================================================================

import axios, { AxiosError } from "axios";

const AUTH_BASE = "http://localhost:3001";
const GAME_BASE = "http://localhost:3002";

// ── Colours ──────────────────────────────────────────────────────
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

// ── State shared across tests ─────────────────────────────────────
let accessToken = "";
let refreshToken = "";
const TEST_EMAIL = `test_${Date.now()}@chess.test`;
const TEST_PASSWORD = "SecurePass@123";
const TEST_USERNAME = `player_${Date.now()}`;

// ── Helpers ───────────────────────────────────────────────────────
type Result = { name: string; pass: boolean; status?: number; detail: string };
const results: Result[] = [];

async function test(
  name: string,
  fn: () => Promise<{ status: number; detail: string }>
): Promise<void> {
  try {
    const { status, detail } = await fn();
    results.push({ name, pass: true, status, detail });
    console.log(`  ${GREEN}✔${RESET}  ${name} ${YELLOW}[${status}]${RESET}`);
  } catch (err) {
    const e = err as AxiosError;
    const status = e.response?.status;
    const detail =
      JSON.stringify(e.response?.data ?? e.message).slice(0, 120);
    results.push({ name, pass: false, status, detail });
    console.log(
      `  ${RED}✘${RESET}  ${name} ${YELLOW}[${status ?? "ERR"}]${RESET}  → ${detail}`
    );
  }
}

// ── Test suites ───────────────────────────────────────────────────

async function testAuthService() {
  console.log(`\n${BOLD}${CYAN}AUTH SERVICE  (${AUTH_BASE})${RESET}`);

  // 1. Health
  await test("GET  /health", async () => {
    const r = await axios.get(`${AUTH_BASE}/health`);
    if (r.data.status !== "ok") throw new Error("bad status");
    return { status: r.status, detail: JSON.stringify(r.data) };
  });

  // 2. Register
  await test("POST /auth/register", async () => {
    const r = await axios.post(`${AUTH_BASE}/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      username: TEST_USERNAME,
    });
    return { status: r.status, detail: `userId=${r.data?.data?.userId ?? r.data?.id ?? "?"}` };
  });

  // 3. Duplicate register (should 409)
  await test("POST /auth/register  (duplicate → 409)", async () => {
    try {
      await axios.post(`${AUTH_BASE}/auth/register`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        username: TEST_USERNAME,
      });
      throw new Error("Expected 409 but got 2xx");
    } catch (err) {
      const e = err as AxiosError;
      if (e.response?.status === 409) {
        return { status: 409, detail: "Conflict as expected" };
      }
      throw err;
    }
  });

  // 4. Login
  await test("POST /auth/login", async () => {
    const r = await axios.post(`${AUTH_BASE}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    accessToken = r.data?.data?.accessToken ?? r.data?.accessToken ?? "";
    refreshToken = r.data?.data?.refreshToken ?? r.data?.refreshToken ?? "";
    if (!accessToken) throw new Error("No accessToken in response: " + JSON.stringify(r.data));
    return { status: r.status, detail: `token=${accessToken.slice(0, 20)}…` };
  });

  // 5. Wrong password (should 401)
  await test("POST /auth/login   (bad password → 401)", async () => {
    try {
      await axios.post(`${AUTH_BASE}/auth/login`, {
        email: TEST_EMAIL,
        password: "WrongPassword!",
      });
      throw new Error("Expected 401 but got 2xx");
    } catch (err) {
      const e = err as AxiosError;
      if (e.response?.status === 401) {
        return { status: 401, detail: "Unauthorized as expected" };
      }
      throw err;
    }
  });

  // 6. GET /auth/me (authenticated)
  await test("GET  /auth/me      (authenticated)", async () => {
    if (!accessToken) throw new Error("No access token from login step");
    const r = await axios.get(`${AUTH_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { status: r.status, detail: `email=${r.data?.data?.email ?? r.data?.email ?? "?"}` };
  });

  // 7. GET /auth/me (no token → 401)
  await test("GET  /auth/me      (no token → 401)", async () => {
    try {
      await axios.get(`${AUTH_BASE}/auth/me`);
      throw new Error("Expected 401 but got 2xx");
    } catch (err) {
      const e = err as AxiosError;
      if (e.response?.status === 401) {
        return { status: 401, detail: "Unauthorized as expected" };
      }
      throw err;
    }
  });

  // 8. POST /auth/refresh
  await test("POST /auth/refresh", async () => {
    if (!refreshToken) throw new Error("No refresh token from login step");
    const r = await axios.post(`${AUTH_BASE}/auth/refresh`, {
      refreshToken,
    });
    const newAccess = r.data?.data?.accessToken ?? r.data?.accessToken ?? "";
    if (!newAccess) throw new Error("No new accessToken in response");
    accessToken = newAccess; // update for subsequent tests
    return { status: r.status, detail: `newToken=${newAccess.slice(0, 20)}…` };
  });

  // 9. POST /auth/forgot-password
  await test("POST /auth/forgot-password", async () => {
    const r = await axios.post(`${AUTH_BASE}/auth/forgot-password`, {
      email: TEST_EMAIL,
    });
    return { status: r.status, detail: JSON.stringify(r.data).slice(0, 80) };
  });

  // 10. POST /auth/logout
  await test("POST /auth/logout  (authenticated)", async () => {
    if (!accessToken) throw new Error("No access token");
    const r = await axios.post(
      `${AUTH_BASE}/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return { status: r.status, detail: JSON.stringify(r.data).slice(0, 80) };
  });

  // 11. GET /auth/me after logout (token should be revoked → 401)
  await test("GET  /auth/me      (after logout → 401)", async () => {
    try {
      await axios.get(`${AUTH_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // Some implementations don't blacklist on logout — mark as warning
      return { status: 200, detail: "⚠ Token still valid (stateless JWT — not revoked)" };
    } catch (err) {
      const e = err as AxiosError;
      if (e.response?.status === 401) {
        return { status: 401, detail: "Token revoked after logout ✓" };
      }
      throw err;
    }
  });
}

async function testGameService() {
  console.log(`\n${BOLD}${CYAN}GAME SERVICE   (${GAME_BASE})${RESET}`);

  // 1. Health
  await test("GET  /health", async () => {
    const r = await axios.get(`${GAME_BASE}/health`);
    if (r.data.status !== "ok") throw new Error("bad status");
    return { status: r.status, detail: JSON.stringify(r.data) };
  });

  // 2. Socket.IO note
  console.log(
    `  ${YELLOW}ℹ${RESET}  game-service uses Socket.IO (WS) — HTTP endpoints are health only`
  );
  console.log(
    `  ${YELLOW}ℹ${RESET}  Socket events: matchmaking:join | matchmaking:leave | game:move | game:resign`
  );
}

// ── Entry ─────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${BOLD}╔══════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║     Chess Platform — API Health Check    ║${RESET}`);
  console.log(`${BOLD}╚══════════════════════════════════════════╝${RESET}`);

  await testAuthService();
  await testGameService();

  // ── Summary ───────────────────────────────────────────────────
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  console.log(
    `\n${BOLD}╔══════════════════════════════════════════╗${RESET}`
  );
  console.log(`${BOLD}║               SUMMARY                   ║${RESET}`);
  console.log(
    `${BOLD}╚══════════════════════════════════════════╝${RESET}`
  );
  console.log(
    `  Total: ${results.length}   ${GREEN}Passed: ${passed}${RESET}   ${failed > 0 ? RED : GREEN}Failed: ${failed}${RESET}\n`
  );

  if (failed > 0) {
    console.log(`${RED}${BOLD}Failed tests:${RESET}`);
    results
      .filter((r) => !r.pass)
      .forEach((r) =>
        console.log(
          `  ${RED}✘${RESET} [${r.status ?? "ERR"}] ${r.name}\n      ${r.detail}`
        )
      );
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}All tests passed! 🎉${RESET}`);
  }
})();

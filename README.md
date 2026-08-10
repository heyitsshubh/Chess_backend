<div align="center">

# ♟ Chess Platform

**A production-grade, real-time multiplayer chess platform built as a TypeScript monorepo.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.x-EF4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build/)
[![Expo](https://img.shields.io/badge/Expo-53-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

[Architecture](#architecture) · [Services](#services) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [API Reference](#api-reference) · [Contributing](#contributing)

</div>

---

## Overview

Chess Platform is a full-stack, microservice-based chess application designed with production engineering principles. It features a **React Native mobile client**, two independently deployable **backend services**, a custom **chess engine**, a **gRPC inter-service communication layer**, and a full **event-driven architecture** backed by Apache Kafka.

The entire codebase lives in a single **pnpm monorepo** orchestrated with **Turborepo** for incremental builds and parallel task execution.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Mobile Client (Expo)                         │
│          React Native · Expo Router · NativeWind · Zustand          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP/REST + WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NGINX API Gateway (:80)                        │
│            Reverse Proxy · Rate Limiting · WebSocket Upgrade        │
│                                                                     │
│    /auth/*  ─────────────────────────────────► Auth Service (:3001) │
│    /game/*  ─────────────────────────────────► Game Service (:3002) │
│    /socket.io/*  ────────────────────────────► Game Service (:3002) │
└─────────────────────────────────────────────────────────────────────┘
                     │                          │
          ┌──────────┘                          └──────────┐
          ▼                                               ▼
┌──────────────────────┐   gRPC (:50051)   ┌──────────────────────────┐
│    Auth Service      │ ◄────────────────► │     Game Service         │
│                      │                    │                          │
│  Express + JWT       │                    │  Express + Socket.IO     │
│  Prisma + Postgres   │                    │  Prisma + Postgres       │
│  Redis (sessions)    │                    │  Redis (queues/pub-sub)  │
│  Resend (email)      │                    │  Kafka (event sourcing)  │
│  bcrypt + zod        │                    │  Chess Engine (WASM)     │
└──────────────────────┘                    └──────────────────────────┘
          │                                               │
          ▼                                               ▼
  ┌───────────────┐                            ┌──────────────────────┐
  │  chess_auth_db│                            │  chess_game_db       │
  │  (PostgreSQL) │                            │  (PostgreSQL)        │
  └───────────────┘                            └──────────────────────┘
                          ┌──────────────┐
                          │    Redis     │  ← Shared cache + pub/sub
                          └──────────────┘
                          ┌──────────────┐
                          │    Kafka     │  ← Event bus (game events)
                          └──────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Microservices** | Auth and Game concerns are fully isolated; each service owns its database and can be scaled independently |
| **gRPC** | High-performance, type-safe inter-service communication for ELO fetching during matchmaking |
| **NGINX Gateway** | Single entry point for all clients; handles WebSocket upgrades, rate limiting, and routing |
| **Event Sourcing (Kafka)** | Game moves and outcomes published as immutable events; enables replay, analytics, and future services |
| **Isolated Prisma schemas** | Each service generates its own Prisma client to prevent schema collision in the monorepo |
| **Turborepo** | Incremental, cached builds with parallel task execution across all packages |

---

## Monorepo Structure

```
chess-platform/
├── apps/
│   ├── auth-service/          ← Authentication microservice (REST + gRPC)
│   ├── game-service/          ← Game & matchmaking microservice (REST + WS)
│   └── mobile-app/            ← React Native app (Expo)
│
├── packages/
│   ├── chess-engine/          ← Custom chess engine (move gen, FEN, perft)
│   ├── shared-grpc/           ← Protobuf definitions + generated stubs
│   ├── shared-errors/         ← Typed error classes shared across services
│   ├── shared-logger/         ← Pino-based structured logger
│   └── shared-config/         ← ESLint + Prettier configuration
│
├── docker/
│   ├── docker-compose.yml     ← PostgreSQL, Redis, Kafka, Zookeeper, NGINX
│   └── nginx/
│       └── nginx.conf         ← Reverse proxy + WebSocket upgrade rules
│
├── integration_test.ts        ← E2E test: Register → Login → WS Matchmaking
├── turbo.json                 ← Turborepo pipeline configuration
├── pnpm-workspace.yaml        ← Workspace package discovery
└── package.json               ← Root scripts + dev tooling
```

---

## Services

### 🔐 Auth Service (`apps/auth-service`)

Handles all user identity, authentication, and session management.

**Responsibilities**
- User registration with email verification (Resend API)
- Login with JWT access tokens + HTTP-only refresh token cookies
- Token refresh and secure logout with token rotation
- gRPC server exposing `GetUserElo` RPC for the Game Service
- Rate limiting per IP via `express-rate-limit` + Redis store

**Internal Architecture (Layered)**
```
src/
├── presentation/          ← Express routers, request validation (Zod)
│   └── routes/
├── application/           ← Use cases (RegisterUser, LoginUser, RefreshToken…)
│   └── use-cases/
├── domain/                ← Entities, interfaces (User, IUserRepository)
│   ├── entities/
│   └── interfaces/
└── infrastructure/        ← Prisma, Redis, Resend, JWT, gRPC server
    ├── database/
    ├── email/
    ├── grpc/
    └── security/
```

**Key Endpoints**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login, receive JWT + refresh cookie |
| `GET`  | `/auth/me` | Get authenticated user profile |
| `POST` | `/auth/refresh` | Rotate refresh token |
| `POST` | `/auth/logout` | Invalidate session |

---

### 🎮 Game Service (`apps/game-service`)

Handles real-time matchmaking, game lifecycle, and move validation.

**Responsibilities**
- WebSocket server (Socket.IO) with JWT middleware authentication
- ELO-based matchmaking queue backed by Redis sorted sets
- gRPC client — calls Auth Service for player ELO during match creation
- Chess move validation via the shared `@chess/engine` package
- Game state persistence in PostgreSQL via Prisma
- Publishes game events (`move_made`, `game_ended`) to Kafka topics

**Socket.IO Events**

| Direction | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Client → Server | `matchmaking:join` | `timeControl: string` | Join the matchmaking queue |
| Client → Server | `matchmaking:leave` | — | Leave the queue |
| Server → Client | `matchmaking:matched` | `{ gameId, white, black, fen }` | Match found |
| Client → Server | `game:move` | `{ gameId, move: number }` | Submit a move |
| Server → Client | `game:move_made` | `{ fen, whiteTime, blackTime }` | Move applied |
| Client → Server | `game:resign` | `gameId: string` | Resign the game |
| Server → Client | `game:end` | `{ winner, reason }` | Game over |

---

### 📦 Shared Packages

| Package | Description |
|---------|-------------|
| `@chess/engine` | Custom chess engine: bitboard move generation, FEN parsing, perft testing |
| `@chess/grpc` | Protobuf `.proto` files + generated TypeScript stubs for Auth ↔ Game gRPC |
| `@chess/errors` | Typed error hierarchy: `AppError`, `AuthError`, `ValidationError`, `NotFoundError` |
| `@chess/logger` | Structured Pino logger with service-name context and pretty-print in dev |
| `@chess/config` | Shared ESLint (TypeScript-strict) and Prettier configurations |

---

### 📱 Mobile App (`apps/mobile-app`)

A premium React Native chess client built with Expo.

**Screen Flow**
```
App Launch
    │
    ├── (no token) ──► Login Screen ──► Register Screen
    │                        │
    └── (has token) ◄────────┘
             │
             ▼
        Home / Lobby
        ├── ELO stats card
        ├── Time control picker (Bullet / Blitz / Rapid)
        ├── [Find a Game] → searching spinner
        └── On match found ──► Live Game Screen
                                ├── Opponent player card + timer
                                ├── Interactive Chessboard
                                │   ├── FEN parsing
                                │   ├── Tap-to-select + tap-to-move
                                │   └── Board flips for Black
                                ├── My player card + timer
                                ├── Turn indicator
                                ├── Resign button
                                └── Game Over banner → Back to Lobby
```

**State Management (Zustand)**
```
authStore
├── token: string | null        ← Access token (SecureStore)
├── user: UserProfile | null    ← Decoded JWT profile
├── login()                     ← POST /auth/login + store token
├── register()                  ← POST /auth/register
├── logout()                    ← Clear token + POST /auth/logout
├── fetchProfile()              ← GET /auth/me
└── hydrate()                   ← Restore token from SecureStore on app open

gameStore
├── status: idle|searching|playing|ended
├── game: ActiveGame | null     ← FEN, players, timers, turn
├── selectedSquare: number | null
├── validMoves: number[]
├── initGame()                  ← Called on matchmaking:matched
├── applyMove()                 ← Called on game:move_made
└── endGame()                   ← Called on game:end
```

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5.5 (strict) |
| HTTP Framework | Express 4 |
| Real-time | Socket.IO 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 14 |
| Cache / Queue | Redis 7 |
| Event Bus | Apache Kafka 7.5 (Confluent) |
| Inter-service RPC | gRPC + Protocol Buffers |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | Zod |
| Email | Resend API |
| Logging | Pino |
| Testing | Vitest |

### Frontend (Mobile)
| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 53) |
| Navigation | Expo Router v4 (file-based) |
| Styling | NativeWind v4 (Tailwind CSS) |
| State Management | Zustand v5 |
| HTTP Client | Axios |
| Real-time | Socket.IO Client |
| Token Storage | expo-secure-store |
| Animations | react-native-reanimated |
| Gradients | expo-linear-gradient |

### Infrastructure & Tooling
| Tool | Purpose |
|------|---------|
| pnpm 9 | Package manager with workspace support |
| Turborepo 2 | Monorepo build orchestration + caching |
| NGINX | API gateway, reverse proxy, WS upgrade |
| Docker Compose | Local infra (Postgres, Redis, Kafka, NGINX) |
| Husky | Git hooks (pre-commit: build + test) |
| Commitlint | Conventional commit enforcement |
| Prettier | Code formatting |
| ESLint | TypeScript-strict linting |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 9.0.0 — `npm install -g pnpm`
- **Docker Desktop** — for infrastructure services
- **Expo Go** app — for running the mobile client on device

### 1. Clone the Repository

```bash
git clone https://github.com/heyitsshubh/Chess_backend.git
cd Chess_backend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

**Auth Service** — create `apps/auth-service/.env`:
```env
NODE_ENV=development
PORT=3001

# PostgreSQL
DATABASE_URL="postgresql://chess_admin:chess_password@localhost:5432/chess_auth_db"

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# Resend (Email)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com

# gRPC
GRPC_PORT=50051
```

**Game Service** — create `apps/game-service/.env`:
```env
NODE_ENV=development
PORT=3002

# PostgreSQL
DATABASE_URL="postgresql://chess_admin:chess_password@localhost:5432/chess_game_db"

# JWT (same secret as Auth Service for token verification)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# gRPC (Auth Service address)
AUTH_GRPC_HOST=localhost
AUTH_GRPC_PORT=50051
```

**Mobile App** — create `apps/mobile-app/.env`:
```env
# Replace with your local machine's IP address (not localhost!)
EXPO_PUBLIC_API_URL=http://192.168.1.10
```

### 4. Start Infrastructure

```bash
pnpm infra:up
```

This starts: **PostgreSQL** · **Redis** · **Kafka** · **Zookeeper** · **NGINX**

Verify all containers are healthy:
```bash
docker ps
```

### 5. Run Database Migrations

```bash
# Auth database
pnpm --filter @chess/auth-service exec prisma migrate dev

# Game database
pnpm --filter @chess/game-service exec prisma migrate dev
```

### 6. Start Backend Services

```bash
# Start both services in parallel (with Turborepo)
pnpm dev

# Or individually:
pnpm --filter @chess/auth-service dev   # → http://localhost:3001
pnpm --filter @chess/game-service dev   # → http://localhost:3002
```

All traffic is proxied through **NGINX on port 80**:
- `http://localhost/auth/*` → Auth Service
- `http://localhost/game/*` → Game Service
- `ws://localhost/socket.io/*` → Game Service

### 7. Run the Mobile App

```bash
cd apps/mobile-app
pnpm start
```

Scan the QR code with **Expo Go** on iOS or Android.

> ⚠️ Make sure `EXPO_PUBLIC_API_URL` in your `.env` points to your **machine's local IP**, not `localhost` — your phone needs to reach your dev machine over the network.

---

## Running Tests

```bash
# All packages (via Turborepo)
pnpm test

# Individual service
pnpm --filter @chess/auth-service test
pnpm --filter @chess/game-service test
pnpm --filter @chess/engine test

# E2E integration test (requires services running)
npx ts-node integration_test.ts
```

### Test Results
```
@chess/engine        2/2 ✓  Perft depth-1, depth-2 (move generation)
@chess/auth-service  3/3 ✓  Register, Login, /me endpoint
@chess/game-service  2/2 ✓  Matchmaking queue, match creation
```

---

## API Reference

All requests go through **NGINX** at `http://localhost` (port 80).

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "grandmaster42",
  "password": "SecurePass123!"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "userId": "cmsn4iuxm000011od4iynjuyq"
  }
}
```

#### Get Profile
```http
GET /auth/me
Authorization: Bearer <accessToken>
```

#### Refresh Token
```http
POST /auth/refresh
Cookie: refreshToken=<token>
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

### WebSocket (Matchmaking & Game)

Connect to `ws://localhost/socket.io/` with:
```javascript
const socket = io('http://localhost', {
  path: '/socket.io/',
  auth: { token: '<accessToken>' }
});
```

---

## Git Workflow

This project follows **Conventional Commits** and feature branch development.

### Branch Strategy

```
main
├── feat/mobile-app-setup    ← React Native app (current)
├── feat/grpc-integration    ← gRPC Auth ↔ Game
├── feat/game-service        ← Game service + matchmaking
└── feat/auth-service        ← Auth service
```

### Commit Convention

```
feat(scope):   New feature
fix(scope):    Bug fix
refactor:      Code refactoring
test:          Adding tests
docs:          Documentation
chore:         Build/tooling changes
```

Example: `feat(mobile): add live game screen with socket events`

### Pre-commit Hooks (Husky)

Every commit automatically runs:
1. **Build** — TypeScript compilation for all services
2. **Test** — Vitest unit test suite across all packages
3. **Commitlint** — Validates commit message format

---

## Project Roadmap

- [x] Monorepo infrastructure (pnpm + Turborepo)
- [x] Chess engine (move generation, FEN, perft)
- [x] Auth Service (JWT, refresh tokens, rate limiting)
- [x] Game Service (Socket.IO matchmaking, move validation)
- [x] gRPC integration (Auth ↔ Game ELO fetch)
- [x] NGINX API Gateway
- [x] React Native mobile app (Expo Router, NativeWind)
- [ ] ELO rating updates after game end
- [ ] Move history panel in game screen
- [ ] Game analysis board (post-game)
- [ ] Friend system & challenge invites
- [ ] Game replay viewer
- [ ] Push notifications (Expo Notifications)
- [ ] Leaderboard / ranking screen
- [ ] Admin dashboard

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat(scope): description"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ♟ by **heyitsshubh**

</div>

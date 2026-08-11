# GitHub Actions — Required Secrets

This file documents all secrets you need to configure in your GitHub repository
settings before the CI/CD workflows will work correctly.

Go to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

---

## CI Workflow (`ci.yml`)

| Secret | Required | Description |
|--------|----------|-------------|
| `TURBO_TEAM` | Optional | Turborepo remote cache team slug (speeds up CI) |
| `TURBO_TOKEN` | Optional | Turborepo remote cache token |
| `RESEND_API_KEY` | Optional | Needed only for integration tests on `main` |

---

## CD Workflow (`cd.yml`)

| Secret | Required | Description |
|--------|----------|-------------|
| `GITHUB_TOKEN` | Auto | Provided automatically — used for GHCR push |
| `DEPLOY_HOST` | ✅ Yes | IP or hostname of your production server |
| `DEPLOY_USER` | ✅ Yes | SSH username (e.g. `ubuntu`, `root`) |
| `DEPLOY_SSH_KEY` | ✅ Yes | Private SSH key (PEM format, begins with `-----BEGIN`) |
| `DEPLOY_PATH` | ✅ Yes | Absolute path on server (e.g. `/opt/chess`) |
| `SLACK_WEBHOOK_URL` | Optional | Slack Incoming Webhook URL for deploy notifications |

---

## Mobile Workflow (`mobile.yml`)

| Secret | Required | Description |
|--------|----------|-------------|
| `EXPO_TOKEN` | ✅ Yes | Expo access token — get it from https://expo.dev/accounts/[user]/settings/access-tokens |
| `EXPO_ACCOUNT` | ✅ Yes | Your Expo username or organization slug |

### How to get EXPO_TOKEN
```bash
npx expo login
npx expo whoami   # confirm logged in
# Then visit: https://expo.dev/accounts/<username>/settings/access-tokens
# Click "Create Token" and copy the value
```

---

## Release Workflow (`release.yml`)

| Secret | Required | Description |
|--------|----------|-------------|
| `GITHUB_TOKEN` | Auto | Provided automatically — used by release-please |

---

## Production `.env` Files (on your server)

Create these at `$DEPLOY_PATH/` on your production server. **Never commit them.**

### `.env.auth`
```env
PORT=3001
DATABASE_URL=postgresql://chess_admin:<password>@postgres:5432/chess_auth_db
JWT_SECRET=<min-32-char-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<min-32-char-secret>
REFRESH_TOKEN_EXPIRES_IN=7d
REDIS_URL=redis://:<REDIS_PASSWORD>@redis:6379
RESEND_API_KEY=re_<your-key>
EMAIL_FROM=noreply@yourdomain.com
GRPC_PORT=50051
```

### `.env.game`
```env
PORT=3002
DATABASE_URL=postgresql://chess_admin:<password>@postgres:5432/chess_game_db
JWT_SECRET=<same-secret-as-auth>
REDIS_URL=redis://:<REDIS_PASSWORD>@redis:6379
KAFKA_BROKERS=kafka:29092
AUTH_GRPC_HOST=auth-service
AUTH_GRPC_PORT=50051
```

### `.env` (for docker-compose.prod.yml)
```env
POSTGRES_PASSWORD=<strong-password>
POSTGRES_USER=chess_admin
REDIS_PASSWORD=<strong-password>
GHCR_OWNER=heyitsshubh
```

# unipd ranking monitor

Watches the "Graduatoria generale di merito" section of the MIDRU and PSAP master pages and posts to a Telegram channel when it changes (e.g. the ranking PDF link appears).

## Setup

1. In Telegram, create a bot with @BotFather and copy the token.
2. Add the bot to your channel as an **admin** (it needs permission to post).
3. Create `.env`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC...
   TELEGRAM_CHAT_ID=@your_channel   # or the numeric -100... id for a private channel
   INTERVAL_MINUTES=10
   ```
4. `bun index.ts`. The first run sends the current status of each page; after that you only get a message when something changes.

Tests: `bun test`

## GitHub Actions

`.github/workflows/monitor.yml` runs `bun index.ts --once` every 10 minutes and commits `state.json` back when it changes.
Set repo secrets `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (Settings → Secrets and variables → Actions).

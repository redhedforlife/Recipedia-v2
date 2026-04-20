#!/bin/zsh

set -e

cd "$(dirname "$0")"

# Finder-launched scripts often get a thinner PATH than an interactive shell.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
[ -f "$HOME/.zprofile" ] && source "$HOME/.zprofile"
[ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc"

echo "Starting Recipedia..."
echo "Project folder: $(pwd)"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found. Install Node.js first, then run this launcher again."
  read -r "?Press Return to close this window."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

PORT=3000
while lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

URL="http://localhost:$PORT"

echo "Leave this window open while using the app."
echo "Press Control-C in this window to stop Recipedia."

echo "Starting development server on port $PORT..."
npm run dev -- --port "$PORT" &
SERVER_PID=$!

sleep 1
if ! kill -0 $SERVER_PID >/dev/null 2>&1; then
  echo "Recipedia failed to start."
  read -r "?Press Return to close this window."
  exit 1
fi

trap 'kill $SERVER_PID >/dev/null 2>&1 || true' EXIT

echo "Waiting for $URL ..."
for _ in {1..60}; do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    echo "Opening $URL"
    open "$URL"
    wait $SERVER_PID
    exit $?
  fi
  sleep 1
done

echo "Recipedia did not become ready in time."
kill $SERVER_PID >/dev/null 2>&1 || true
read -r "?Press Return to close this window."
exit 1

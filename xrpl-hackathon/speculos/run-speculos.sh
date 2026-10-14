#!/usr/bin/env bash
# Starts Speculos (the Ledger device emulator) with the XRP app.
#
# Usage: ./run-speculos.sh [stax|flex|apex_p|nanox|nanosp]   (default: stax)
# The demo app shows the screen (click to tap, keep the mouse down to hold).
# The DMK Speculos transport sends APDUs to http://127.0.0.1:5000.
# To see the screen in a VNC client instead: vnc://127.0.0.1:41000, password
# "speculos" (only this machine can connect).
#
# Seed: the first run writes a random seed to .seed and reuses it after,
# so you keep the same XRP address. Speculos's built-in default seed is
# the same for everyone, so all teams would share one testnet account.
# To use your own seed: SPECULOS_SEED="<24 words or hex>" ./run-speculos.sh
# Never use the seed of a wallet that holds real funds.
set -euo pipefail

MODEL="${1:-stax}"
SPECULOS_IMAGE="${SPECULOS_IMAGE:-ghcr.io/ledgerhq/speculos:latest}"
here="$(cd "$(dirname "$0")" && pwd -P)"

if [ ! -f "$here/apps/$MODEL/app.elf" ]; then
  echo "Unknown model '$MODEL'. Use one of: $(ls "$here/apps" | tr '\n' ' ')" >&2
  exit 1
fi

if [ -z "${SPECULOS_SEED:-}" ]; then
  [ -f "$here/.seed" ] || openssl rand -hex 32 > "$here/.seed"
  SPECULOS_SEED="$(cat "$here/.seed")"
fi

# Speculos doesn't log when its HTTP API is up: say it when the API answers.
# Stops when docker exits ($$ is the docker process after the exec below).
# Lines end with \r\n: `docker run -it` puts the terminal in raw mode.
(
  for _ in $(seq 60); do
    sleep 1
    kill -0 "$$" 2>/dev/null || exit 0
    if curl -sf -o /dev/null http://127.0.0.1:5000; then
      printf '\r\n[run-speculos] Speculos is ready (%s):\r\n' "$MODEL"
      printf '  DMK transport and web page: http://127.0.0.1:5000\r\n'
      printf '  APDU over raw TCP:          127.0.0.1:9999\r\n'
      printf '  VNC (screen):               vnc://127.0.0.1:41000, password: speculos\r\n\r\n'
      exit 0
    fi
  done
  printf "[run-speculos] http://127.0.0.1:5000 didn't answer after 60 s.\r\n" >&2
) &

exec docker run --rm -it --name speculos-xrp \
  -p 127.0.0.1:5000:5000 -p 127.0.0.1:9999:9999 -p 127.0.0.1:41000:41000 \
  -v "$here/apps:/apps:ro" \
  "$SPECULOS_IMAGE" \
  --model "$MODEL" --display headless --api-port 5000 --apdu-port 9999 \
  --vnc-port 41000 --vnc-password speculos \
  --seed "$SPECULOS_SEED" \
  "/apps/$MODEL/app.elf"

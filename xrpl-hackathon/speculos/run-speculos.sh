#!/usr/bin/env bash
# Starts Speculos (the Ledger device emulator) with the XRP app.
#
# Usage: ./run-speculos.sh [stax|flex|apex_p|nanox|nanosp]   (default: stax)
# The demo app shows the screen (click to tap, keep the mouse down to hold).
# The DMK Speculos transport sends APDUs to http://localhost:5000.
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

exec docker run --rm -it --name speculos-xrp \
  -p 5000:5000 -p 9999:9999 \
  -v "$here/apps:/apps:ro" \
  "$SPECULOS_IMAGE" \
  --model "$MODEL" --display headless --api-port 5000 --apdu-port 9999 \
  --seed "$SPECULOS_SEED" \
  "/apps/$MODEL/app.elf"

#!/usr/bin/env bash
# Builds the Ledger XRP app (LedgerHQ/app-xrp) for Speculos, for every Ledger model.
# Output: apps/<model>/app.elf, where <model> is a Speculos --model name.
#
# You don't need to run this: the built files are already in apps/.
# Requirements: git and Docker.
set -euo pipefail

# app-xrp 2.8.1 (master, 2026-09-14). Override with APP_XRP_REF=<commit or tag>.
APP_XRP_REF="${APP_XRP_REF:-a7efd903001bb41fd8df242a428bcf3abc07a72f}"
BUILDER_IMAGE="${BUILDER_IMAGE:-ghcr.io/ledgerhq/ledger-app-builder/ledger-app-dev-tools:latest}"

here="$(cd "$(dirname "$0")" && pwd -P)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

git clone --quiet https://github.com/LedgerHQ/app-xrp.git "$work/app-xrp"
git -C "$work/app-xrp" checkout --quiet "$APP_XRP_REF"

# Each SDK builds into its own build/<target>/ folder.
docker run --rm -v "$work/app-xrp:/app" -w /app "$BUILDER_IMAGE" bash -euc '
  for sdk in NANOX_SDK NANOSP_SDK STAX_SDK FLEX_SDK APEX_P_SDK; do
    echo "--- building with $sdk"
    make -j"$(nproc)" BOLOS_SDK="${!sdk}" >/dev/null
  done
'

# The SDK calls the Nano S Plus target "nanos2"; Speculos calls it "nanosp".
for target in nanox nanos2 stax flex apex_p; do
  model="$target"
  [ "$target" = nanos2 ] && model=nanosp
  mkdir -p "$here/apps/$model"
  cp "$work/app-xrp/build/$target/bin/app.elf" "$here/apps/$model/app.elf"
  echo "apps/$model/app.elf"
done

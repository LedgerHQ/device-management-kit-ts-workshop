# Speculos: build without a device

[Speculos](https://github.com/LedgerHQ/speculos) emulates a Ledger device. It runs the real XRP app, shows the real screens and makes real signatures. The DMK talks to it through `@ledgerhq/device-transport-kit-speculos`.

## Run it

You need Docker.

```bash
docker pull ghcr.io/ledgerhq/speculos:latest
./run-speculos.sh stax
```

Wait for `[run-speculos] Speculos is ready`. It shows the 3 ports: http://127.0.0.1:5000 for the DMK Speculos transport and the web page, 127.0.0.1:9999 for raw APDUs over TCP, and `vnc://127.0.0.1:41000` for VNC.

To see the screen in a VNC client, connect to `vnc://127.0.0.1:41000` with the password `speculos`. On macOS: `open vnc://127.0.0.1:41000`. Speculos accepts connections from your machine only, on all 3 ports.

The demo app shows the device screen on its right side. Click to tap; keep the mouse down to "hold to sign". Speculos's own page, http://127.0.0.1:5000, has only the 3 buttons, so it works for Nano X and Nano S Plus but not for touchscreen models.

| `./run-speculos.sh …` | Device | DMK `DeviceModelId` |
|---|---|---|
| `stax` (default) | Ledger Stax | `STAX` |
| `flex` | Ledger Flex | `FLEX` |
| `apex_p` | Ledger Nano Gen5 | `APEX` |
| `nanox` | Ledger Nano X | `NANO_X` |
| `nanosp` | Ledger Nano S Plus | `NANO_SP` |

Give the DMK the same model as Speculos: `speculosTransportFactory(url, false, DeviceModelId.STAX)`.

## Your seed and address

The first run writes a random seed to `.seed` and uses it after that, so your address stays the same. Each team gets its own testnet account. (Speculos's built-in seed is the same for everybody.)

To use a seed of your choice: `SPECULOS_SEED="<24 words or hex>" ./run-speculos.sh`. Never use the seed of a wallet that holds real funds.

## Troubleshooting

- **`launcher: invalid SDK api_level`**: your Speculos image is too old. Run `docker pull ghcr.io/ledgerhq/speculos:latest`.
- **Port 5000 already in use** (on macOS, often AirPlay Receiver): turn off AirPlay Receiver in System Settings, or stop what uses the port.
- **The app can't connect**: check that http://127.0.0.1:5000 opens, and that the model in the app matches the one you started.

## The app files

`apps/<model>/app.elf` are builds of [LedgerHQ/app-xrp](https://github.com/LedgerHQ/app-xrp) 2.8.1 (Apache-2.0), made with Ledger's official build image. To build them again: `./build-app-xrp.sh` (needs git and Docker).

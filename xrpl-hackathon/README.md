# Build on XRPL with Ledger

Material for the Ledger workshop at the AI & Fintech XRPL Hackathon (New York, Oct 24–25, 2026).

- **Slides:** [`slides.pdf`](slides.pdf)
- **Demo app:** [`app/`](app/). A React app that connects a Ledger with the Device Management Kit (DMK), gets an XRP address, then signs and submits a payment on the XRPL testnet.
- **No device? Use Speculos:** [`speculos/`](speculos/). The Ledger device emulator, with the XRP app already built for every Ledger model.

## Quick start (no device needed)

You need Docker, Node.js 22+ and Chrome (or Edge, Brave).

```bash
# 1. Start the emulator (a Ledger Stax running the XRP app)
docker pull ghcr.io/ledgerhq/speculos:latest
cd speculos && ./run-speculos.sh stax

# 2. In another terminal, start the demo app
cd app && npm install && npm run dev
```

Open http://localhost:5173, then:

1. Click **Connect** (transport: Speculos, model: Stax).
2. Click **Get address**, then **Get 100 test XRP**.
3. Click **Prepare**, then **Sign on device**. On the Speculos screen, on the right, tap through the review, then keep the mouse down on **Hold to sign**.
4. Click **Submit**. You get `tesSUCCESS` and a link to the transaction on the testnet explorer.

**With a real Ledger:** install the XRP app with Ledger Wallet, unlock the device, then choose **USB** or **Bluetooth** in the demo app. Bluetooth needs a Ledger with Bluetooth (not the Nano S Plus).

## The code that matters

| File | What it does |
|---|---|
| [`app/src/ledger/solution.ts`](app/src/ledger/solution.ts) | The 5 DMK steps: build the DMK, connect, create the XRP signer, get the address, sign. About 30 lines. |
| [`app/src/ledger/exercise.ts`](app/src/ledger/exercise.ts) | The same 5 steps with TODOs. Write them yourself. Switch the app header to **Exercise** to run this file. |
| [`app/src/xrpl.ts`](app/src/xrpl.ts) | The XRPL part, with xrpl.js: faucet, build the payment, serialize it, add the signature, submit. |
| [`app/src/useDeviceAction.ts`](app/src/useDeviceAction.ts) | How to follow a device action: pending (and what the user must do on the device), then completed or error. |

```bash
npm install @ledgerhq/device-management-kit @ledgerhq/device-signer-kit-xrp \
  @ledgerhq/device-transport-kit-web-hid @ledgerhq/device-transport-kit-web-ble \
  @ledgerhq/device-transport-kit-speculos rxjs xrpl
```

## How to sign an XRPL transaction with the DMK

The XRP signer (`@ledgerhq/device-signer-kit-xrp`) signs bytes. Your app builds and submits the transaction.

1. Get the address and public key: `signer.getAddress("44'/144'/0'/0/0")`.
2. Build the transaction with xrpl.js (`client.autofill(...)`). Set `SigningPubKey` to the public key, in **uppercase** hex.
3. Serialize it with `encode(tx)` from xrpl.js. Do **not** use `encodeForSigning`: the XRP app adds the signing prefix itself.
4. Sign: `signer.signTransaction(path, hexaStringToBuffer(encoded))`. The output is a **DER signature** (`Uint8Array`).
5. Set `TxnSignature` to `bufferToHexaString(signature, false).toUpperCase()`, call `encode` again and submit.

Things to know:

- Use the path `44'/144'/0'/0/0`. Change the 3rd number for more accounts: `44'/144'/1'/0/0`, `44'/144'/2'/0/0`…
- The signer methods return `{ observable, cancel }`, not a Promise. Subscribe to the observable, or see `useDeviceAction.ts`.
- `autofill` gives about 1 minute to sign before the transaction expires (`tefMAX_LEDGER`). The demo sets `LastLedgerSequence` itself to allow 10 minutes.
- The XRP app shows the transaction fields on the device. Some newer transaction types need the **Blind signing** setting, in the XRP app settings on the device.

## Node.js (agents, bots, backends)

The same signer code works in Node.js. Change the transport:

- Real device over USB: `nodeHidTransportFactory` from `@ledgerhq/device-transport-kit-node-hid`.
- Emulator: `speculosTransportFactory("http://localhost:5000")` from `@ledgerhq/device-transport-kit-speculos`.

Run TypeScript with [`tsx`](https://tsx.is) or a bundler.

## Resources

- [DMK docs](https://developers.ledger.com/docs/device-interaction/getting-started) and the [XRP signer page](https://developers.ledger.com/docs/device-interaction/references/signers/xrp)
- [DMK repository](https://github.com/LedgerHQ/device-sdk-ts): core, signers, transports
- [DMK sample app](https://app.devicesdk.ledger.com/): try the DMK and every signer in the browser
- [XRP app repository](https://github.com/LedgerHQ/app-xrp): what the device shows and supports
- [Speculos](https://github.com/LedgerHQ/speculos): the device emulator
- [xrpl.js docs](https://js.xrpl.org/), [testnet faucet](https://xrpl.org/resources/dev-tools/xrp-faucets), [testnet explorer](https://testnet.xrpl.org/)

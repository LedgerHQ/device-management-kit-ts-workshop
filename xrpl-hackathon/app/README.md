# Demo app: Ledger DMK × XRPL

A React + Vite app. It connects a Ledger (USB, Bluetooth or Speculos), gets an XRP address, then signs and submits a payment on the XRPL testnet.

```bash
npm install
npm run dev   # http://localhost:5173, in Chrome, Edge or Brave
```

See [the main README](../README.md) for the full walkthrough and the XRPL signing steps.

- `src/ledger/solution.ts`: the 5 DMK steps.
- `src/ledger/exercise.ts`: the same steps with TODOs. Pick **Exercise** in the app header to run it.
- `src/xrpl.ts`: the XRPL side (xrpl.js, testnet).

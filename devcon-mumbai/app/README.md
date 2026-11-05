# Demo app: Ledger DMK × Ethereum

A React + Vite app. It connects a Ledger (USB or Bluetooth), gets an Ethereum address, then signs an EIP-1559 transfer. It only signs: nothing is sent to the network.

```bash
npm install
npm run dev   # http://localhost:5173, in Chrome, Edge or Brave
```

See [the main README](../README.md) for the full walkthrough and the Ethereum signing steps.

- `src/ledger/solution.ts`: the 5 DMK steps.
- `src/ledger/exercise.ts`: the same steps with TODOs. Pick **Exercise** in the app header to run it.
- `src/ethereum.ts`: the Ethereum side (viem).

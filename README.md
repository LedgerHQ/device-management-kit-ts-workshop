# DMK TypeScript workshop

Workshop material for Ledger's Device Management Kit (DMK). One folder per event.

| Folder | Event | Contents |
|---|---|---|
| [`devcon-mumbai/`](devcon-mumbai/) | Devcon, Mumbai | React app that gets an Ethereum address and signs an EIP-1559 transfer with the DMK Ethereum signer and viem, over USB or Bluetooth. Signing only, nothing is sent. |
| [`xrpl-hackathon/`](xrpl-hackathon/) | AI & Fintech XRPL Hackathon, New York, Oct 24–25, 2026 | React app that signs XRPL testnet payments with the DMK XRP signer, over USB, Bluetooth or Speculos. Speculos kit with the XRP app built for every Ledger model. |
| [`archive/eth-global-ny-2025/`](archive/eth-global-ny-2025/) | ETHGlobal New York, 2025 | React + Vite exercise: connect a Ledger, get an Ethereum address and sign a transaction with the DMK. Run `npm install && npm run dev` in that folder. |

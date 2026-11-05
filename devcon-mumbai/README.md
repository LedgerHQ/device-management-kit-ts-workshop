# Build on Ethereum with Ledger

Material for the Ledger workshop at Devcon, Mumbai.

- **Demo app:** [`app/`](app/). A React app that connects a Ledger with the Device Management Kit (DMK), gets an Ethereum address, then signs an EIP-1559 transfer. It only signs: nothing is sent to the network, so you don't need any ETH.

## Quick start

You need:

- Node.js 22+ and Chrome (or Edge, Brave). WebHID and Web Bluetooth don't work in Firefox or Safari.
- A Ledger with the Ethereum app installed (install it with Ledger Wallet), unlocked. Bluetooth needs a Ledger with Bluetooth (not the Nano S Plus).
- On Linux: Ledger's udev rules, for USB.

```bash
cd app && npm install && npm run dev
```

Open http://localhost:5173, then:

1. Click **Connect** (USB or Bluetooth) and pick your Ledger in the browser's device picker. If USB can't connect, quit Ledger Wallet: it keeps the device busy.
2. Click **Get address**. If the Ethereum app isn't open, the device asks you to open it.
3. Click **Prepare**, then **Sign on device**. Check the network, amount and destination on the device, then approve.
4. The app recovers the signer from the signed transaction. **Valid** means the signature comes from your device's address.

## The code that matters

| File | What it does |
|---|---|
| [`app/src/ledger/solution.ts`](app/src/ledger/solution.ts) | The 5 DMK steps: build the DMK, connect, create the Ethereum signer, get the address, sign. About 30 lines. |
| [`app/src/ledger/exercise.ts`](app/src/ledger/exercise.ts) | The same 5 steps with TODOs. Write them yourself. Switch the app header to **Exercise** to run this file. |
| [`app/src/ethereum.ts`](app/src/ethereum.ts) | The Ethereum part, with viem: build the transfer, serialize it, add the signature, check who signed. |
| [`app/src/useDeviceAction.ts`](app/src/useDeviceAction.ts) | How to follow a device action: pending (and what the user must do on the device), then completed or error. |

```bash
npm install @ledgerhq/device-management-kit @ledgerhq/device-signer-kit-ethereum \
  @ledgerhq/context-module @ledgerhq/device-transport-kit-web-hid \
  @ledgerhq/device-transport-kit-web-ble rxjs viem
```

## How to sign an Ethereum transaction with the DMK

The Ethereum signer (`@ledgerhq/device-signer-kit-ethereum`) signs bytes. Your app builds the transaction, and sends it if you want to.

1. Get the address and public key: `signer.getAddress("44'/60'/0'/0/0")`.
2. Build an EIP-1559 transaction with viem: `type`, `chainId`, `nonce`, `to`, `value`, `gas`, `maxFeePerGas`, `maxPriorityFeePerGas`.
3. Serialize it with `serializeTransaction(tx)`. You get hex starting with `0x02`. The signer takes bytes: `hexaStringToBuffer(hex)`.
4. Sign: `signer.signTransaction(path, bytes)`. The output is a signature, `{ r, s, v }`.
5. Serialize again with the signature: `serializeTransaction(tx, { r, s, yParity })`, where `yParity` is `v` as 0 or 1 (`v - 27` if the device returns 27 or 28).
6. Check it: `recoverTransactionAddress({ serializedTransaction })` must give your address.

Things to know:

- Use the path `44'/60'/0'/0/0`. Change the 3rd number for more accounts: `44'/60'/1'/0/0`, `44'/60'/2'/0/0`…
- The signer methods return `{ observable, cancel }`, not a Promise. Subscribe to the observable, or see `useDeviceAction.ts`.
- The demo uses Sepolia (chain ID `11155111`), so a signature can't be replayed on Ethereum mainnet. The device shows the network.
- A plain ETH transfer is shown as is on the device. For a contract call, the signer asks the context module (`@ledgerhq/context-module`) for the data to show it in readable form (ERC-7730 clear signing). If the device can't decode a call, it asks you to turn on **Blind signing** in the Ethereum app settings.
- On some devices, the first signature starts with a Transaction Check question. The DMK reports it as the `web3-checks-opt-in` interaction.

### Send it for real

The demo uses a fixed nonce, gas price and tip, and never talks to a network. To broadcast, read them from a Sepolia RPC with viem, and get test ETH for your address from a [Sepolia faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia):

```ts
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

// viem's default Sepolia RPC needs a paid plan: pass your own URL.
const client = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

const nonce = await client.getTransactionCount({ address, blockTag: "pending" });
const { maxFeePerGas, maxPriorityFeePerGas } = await client.estimateFeesPerGas();
// …build, sign and serialize as above, then:
const hash = await client.sendRawTransaction({ serializedTransaction: signedTx });
```

## Going further

`SignerEth` has more methods, all following the same pattern: `signMessage` (EIP-191 personal message), `signTypedData` (EIP-712) and `signDelegationAuthorization` (EIP-7702).

## Node.js (agents, bots, backends)

The same signer code works in Node.js with the USB transport for Node: `nodeHidTransportFactory` from `@ledgerhq/device-transport-kit-node-hid`. Run TypeScript with [`tsx`](https://tsx.is) or a bundler.

## Resources

- [DMK docs](https://developers.ledger.com/docs/device-interaction/getting-started) and the [Ethereum signer page](https://developers.ledger.com/docs/device-interaction/references/signers/eth)
- [DMK repository](https://github.com/LedgerHQ/device-sdk-ts): core, signers, transports
- [DMK sample app](https://app.devicesdk.ledger.com/): try the DMK and every signer in the browser
- [Ethereum app repository](https://github.com/LedgerHQ/app-ethereum): what the device shows and supports
- [viem docs](https://viem.sh/), [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559)

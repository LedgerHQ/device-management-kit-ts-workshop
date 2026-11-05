/**
 * Ethereum side of the demo, with viem.
 * The Ledger signer only signs bytes: building and serializing the transaction
 * is your app's job. This demo never sends it to the network.
 */
import type { Signature } from "@ledgerhq/device-signer-kit-ethereum";
import {
  getAddress as toChecksumAddress,
  parseEther,
  parseGwei,
  recoverTransactionAddress,
  serializeTransaction,
  type Address,
  type Hex,
  type TransactionSerializableEIP1559,
} from "viem";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { sepolia } from "viem/chains";

export const chainName = sepolia.name;

/** A new random address, to use as a transfer destination. */
export const randomAddress = (): Address =>
  privateKeyToAddress(generatePrivateKey());

/** The address as the device returns it, in EIP-55 checksum format. */
export const normalizeAddress = (address: string): Address =>
  toChecksumAddress(address);

/**
 * Build an EIP-1559 transfer. These are the fields the device checks and shows.
 * The chain is Sepolia, so a signature can't be replayed on Ethereum mainnet.
 * Nothing is read from the network: nonce and fees are values you choose.
 */
export function buildTransfer(args: {
  destination: Address;
  amountEth: string;
  nonce: number;
}): TransactionSerializableEIP1559 {
  return {
    type: "eip1559",
    chainId: sepolia.id,
    nonce: args.nonce,
    to: args.destination,
    value: parseEther(args.amountEth),
    gas: 21_000n, // a plain ETH transfer always costs 21,000 gas
    maxFeePerGas: parseGwei("20"),
    maxPriorityFeePerGas: parseGwei("1.5"),
  };
}

/**
 * The bytes to send to the device, as hex: the RLP of the unsigned transaction,
 * starting with the type byte (0x02). The signer hashes and signs them.
 */
export const encodeUnsigned = (tx: TransactionSerializableEIP1559): Hex =>
  serializeTransaction(tx);

/**
 * Put the device's signature in the transaction and serialize it again.
 * `v` is the recovery id: 0 or 1 (some apps return 27 or 28). A typed
 * transaction wants it as `yParity`: 0 or 1.
 */
export const encodeSigned = (
  tx: TransactionSerializableEIP1559,
  { r, s, v }: Signature,
): Hex => serializeTransaction(tx, { r, s, yParity: v >= 27 ? v - 27 : v });

/**
 * Who signed? Recovers the address from the signed transaction.
 * It should be the device's address: this is how you check a signature
 * without sending anything.
 */
export const signerOf = (signedTx: Hex): Promise<Address> =>
  recoverTransactionAddress({
    serializedTransaction: signedTx as `0x02${string}`,
  });

/**
 * XRPL side of the demo, with xrpl.js on testnet.
 * The Ledger signer only signs bytes: building, serializing and submitting
 * the transaction is your app's job.
 */
import { bufferToHexaString } from "@ledgerhq/device-management-kit";
import { Client, Wallet, encode, xrpToDrops, type Payment } from "xrpl";

const TESTNET_URL = "wss://s.altnet.rippletest.net:51233";
const FAUCET_URL = "https://faucet.altnet.rippletest.net/accounts";

export const explorerAccountUrl = (address: string) =>
  `https://testnet.xrpl.org/accounts/${address}`;
export const explorerTxUrl = (hash: string) =>
  `https://testnet.xrpl.org/transactions/${hash}`;

/** A new random testnet address, to use as a payment destination. */
export const randomAddress = () => Wallet.generate().classicAddress;

const client = new Client(TESTNET_URL);

async function connected(): Promise<Client> {
  if (!client.isConnected()) await client.connect();
  return client;
}

/** XRP balance, or null if the account doesn't exist yet (it was never funded). */
export async function getBalance(address: string): Promise<number | null> {
  const c = await connected();
  try {
    return await c.getXrpBalance(address);
  } catch (e) {
    if ((e as { data?: { error?: string } }).data?.error === "actNotFound")
      return null;
    throw e;
  }
}

/** Ask the testnet faucet for free test XRP. */
export async function fundFromFaucet(address: string): Promise<void> {
  const res = await fetch(FAUCET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination: address }),
  });
  if (!res.ok) throw new Error(`Faucet: ${res.status} ${await res.text()}`);
}

/**
 * Build a Payment. xrpl.js fills in Fee and Sequence.
 * SigningPubKey must be the device's public key, in uppercase hex.
 */
export async function preparePayment(args: {
  account: string;
  publicKey: string;
  destination: string;
  amountXrp: string;
}): Promise<Payment> {
  const c = await connected();
  return c.autofill<Payment>({
    TransactionType: "Payment",
    Account: args.account,
    Destination: args.destination,
    Amount: xrpToDrops(args.amountXrp),
    SigningPubKey: args.publicKey.toUpperCase(),
    // autofill() gives about 1 minute to sign. Give 10 minutes instead,
    // so there is time to read the device screen.
    LastLedgerSequence: (await c.getLedgerIndex()) + 150,
  });
}

/**
 * The bytes to send to the device, as hex.
 * Use encode(), NOT encodeForSigning(): the XRP app adds the signing prefix itself.
 */
export const encodeUnsigned = (tx: Payment): string => encode(tx);

/** Put the device's DER signature in the transaction and serialize it again. */
export const encodeSigned = (tx: Payment, signature: Uint8Array): string =>
  encode({
    ...tx,
    TxnSignature: bufferToHexaString(signature, false).toUpperCase(),
  });

/** Submit the signed transaction and wait until a ledger includes it. */
export async function submit(
  signedTxHex: string,
): Promise<{ hash: string; result: string }> {
  const c = await connected();
  const res = await c.submitAndWait(signedTxHex);
  const meta = res.result.meta;
  return {
    hash: res.result.hash,
    result: typeof meta === "object" ? meta.TransactionResult : "unknown",
  };
}

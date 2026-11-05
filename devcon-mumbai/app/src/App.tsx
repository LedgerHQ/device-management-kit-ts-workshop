import {
  DeviceActionStatus,
  type DeviceActionState,
  type DeviceManagementKit,
  type DeviceSessionId,
  type DeviceSessionState,
} from "@ledgerhq/device-management-kit";
import type {
  GetAddressDAError,
  GetAddressDAIntermediateValue,
  GetAddressDAOutput,
  SignTransactionDAError,
  SignTransactionDAIntermediateValue,
  SignTransactionDAOutput,
  SignerEth,
} from "@ledgerhq/device-signer-kit-ethereum";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Address, Hex, TransactionSerializableEIP1559 } from "viem";
import * as eth from "./ethereum";
import { exercise } from "./ledger/exercise";
import { solution } from "./ledger/solution";
import type { TransportChoice, WorkshopSteps } from "./ledger/types";
import { useDeviceAction } from "./useDeviceAction";
import "./App.css";

type Mode = "exercise" | "solution";

const transports: { id: TransportChoice; label: string }[] = [
  { id: "usb", label: "USB" },
  { id: "ble", label: "Bluetooth" },
];

export default function App() {
  const [mode, setMode] = useState<Mode>("solution");

  return (
    <>
      <header className="header">
        <div>
          <h1>Ledger × Ethereum: Device Management Kit</h1>
          <p>
            Connect a Ledger, get an Ethereum address, sign a {eth.chainName}{" "}
            transfer. Running <code>src/ledger/{mode}.ts</code>.
          </p>
        </div>
        <div className="segmented">
          {(["exercise", "solution"] as const).map((m) => (
            <button
              key={m}
              className={mode === m ? "active" : ""}
              onClick={() => setMode(m)}
            >
              {m === "exercise" ? "Exercise" : "Solution"}
            </button>
          ))}
        </div>
      </header>
      <div className="layout">
        {/* key: switching mode starts over with a new DMK */}
        <Workshop key={mode} steps={mode === "exercise" ? exercise : solution} />
      </div>
    </>
  );
}

function Workshop({ steps }: { steps: WorkshopSteps }) {
  // Steps 1–3
  const [transport, setTransport] = useState<TransportChoice>("usb");
  const dmkRef = useRef<DeviceManagementKit | undefined>(undefined);
  const [session, setSession] = useState<{
    id: DeviceSessionId;
    deviceName: string;
    signer: SignerEth;
  }>();
  const [sessionState, setSessionState] = useState<DeviceSessionState>();
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<unknown>();

  // Step 4
  const [path, setPath] = useState("44'/60'/0'/0/0");
  const [checkOnDevice, setCheckOnDevice] = useState(false);
  const addressAction = useDeviceAction<
    GetAddressDAOutput,
    GetAddressDAError,
    GetAddressDAIntermediateValue
  >();
  const [account, setAccount] = useState<{ address: Address; publicKey: string }>();

  // Step 5
  const [destination, setDestination] = useState<string>(eth.randomAddress);
  const [amount, setAmount] = useState("0.001");
  const [nonce, setNonce] = useState("0");
  const [tx, setTx] = useState<TransactionSerializableEIP1559>();
  const [prepareError, setPrepareError] = useState<unknown>();
  const signAction = useDeviceAction<
    SignTransactionDAOutput,
    SignTransactionDAError,
    SignTransactionDAIntermediateValue
  >();
  const [signed, setSigned] = useState<{ hex: Hex; signer: Address }>();

  // Close the DMK when leaving (switching Exercise/Solution).
  useEffect(() => () => dmkRef.current?.close(), []);

  // The DMK keeps a live state for each session: locked, busy, current app…
  useEffect(() => {
    const dmk = dmkRef.current;
    if (!dmk || !session) return;
    const sub = dmk
      .getDeviceSessionState({ sessionId: session.id })
      .subscribe({ next: setSessionState, error: () => setSessionState(undefined) });
    return () => sub.unsubscribe();
  }, [session]);

  const resetAccount = () => {
    addressAction.reset();
    setAccount(undefined);
    resetTransfer();
  };
  const resetTransfer = () => {
    setTx(undefined);
    setPrepareError(undefined);
    signAction.reset();
    setSigned(undefined);
  };

  const connect = async () => {
    setConnecting(true);
    setConnectError(undefined);
    setSession(undefined);
    setSessionState(undefined);
    resetAccount();
    try {
      dmkRef.current?.close();
      dmkRef.current = undefined;
      const dmk = steps.createDmk();
      dmkRef.current = dmk;
      const id = await steps.connect(dmk, transport);
      const signer = steps.createSigner(dmk, id);
      setSession({ id, deviceName: dmk.getConnectedDevice({ sessionId: id }).name, signer });
    } catch (e) {
      setConnectError(e);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (session) await dmkRef.current?.disconnect({ sessionId: session.id });
    setSession(undefined);
    setSessionState(undefined);
    resetAccount();
  };

  const getAddress = async () => {
    if (!session) return;
    resetAccount();
    const output = await addressAction.run(() =>
      steps.getAddress(session.signer, path, checkOnDevice),
    );
    if (output) {
      setAccount({
        address: eth.normalizeAddress(output.address),
        publicKey: output.publicKey,
      });
    }
  };

  const prepare = () => {
    resetTransfer();
    try {
      setTx(
        eth.buildTransfer({
          destination: eth.normalizeAddress(destination),
          amountEth: amount,
          nonce: Number(nonce),
        }),
      );
    } catch (e) {
      setPrepareError(e);
    }
  };

  const sign = async () => {
    if (!session || !tx) return;
    setSigned(undefined);
    const signature = await signAction.run(() =>
      steps.signTransaction(session.signer, path, eth.encodeUnsigned(tx)),
    );
    if (signature) {
      const hex = eth.encodeSigned(tx, signature);
      setSigned({ hex, signer: await eth.signerOf(hex) });
    }
  };

  return (
    <main className="steps">
      <Card n="1–3" title="Connect">
        <div className="segmented">
          {transports.map((t) => (
            <button
              key={t.id}
              className={transport === t.id ? "active" : ""}
              onClick={() => setTransport(t.id)}
              disabled={!!session}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="hint">
          Unlock your Ledger first. Use Chrome, Edge or Brave. If USB can't connect,
          quit Ledger Wallet: it keeps the device busy.
        </p>
        <div className="row">
          {session ? (
            <button onClick={disconnect}>Disconnect</button>
          ) : (
            <button className="primary" onClick={connect} disabled={connecting}>
              {connecting ? "Connecting…" : "Connect"}
            </button>
          )}
        </div>
        <ErrorBox error={connectError} />
        {session && (
          <dl>
            <dt>Device</dt>
            <dd>{session.deviceName}</dd>
            <dt>Session</dt>
            <dd>
              <code>{session.id}</code>
            </dd>
            <dt>Status</dt>
            <dd>
              {sessionState?.deviceStatus ?? "…"}
              {sessionState && "currentApp" in sessionState &&
                ` · app: ${sessionState.currentApp.name} ${sessionState.currentApp.version}`}
            </dd>
          </dl>
        )}
      </Card>

      <Card n="4" title="Get the address" disabled={!session}>
        <div className="row">
          <label className="grow">
            Derivation path
            <input value={path} onChange={(e) => setPath(e.target.value)} />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={checkOnDevice}
              onChange={(e) => setCheckOnDevice(e.target.checked)}
            />
            Verify on device
          </label>
        </div>
        <div className="row">
          <button className="primary" onClick={getAddress} disabled={!session}>
            Get address
          </button>
        </div>
        <ActionStatus state={addressAction.state} error={addressAction.error} />
        {account && (
          <dl>
            <dt>Address</dt>
            <dd>
              <code>{account.address}</code>
            </dd>
            <dt>Public key</dt>
            <dd>
              <code>{account.publicKey}</code>
            </dd>
          </dl>
        )}
      </Card>

      <Card n="5" title="Sign a transfer" disabled={!account}>
        <p className="hint">
          Signing only: nothing is sent to the network, so no ETH is needed.
        </p>
        <div className="row">
          <label className="grow">
            Destination
            <input value={destination} onChange={(e) => setDestination(e.target.value)} />
          </label>
          <label>
            Amount (ETH)
            <input value={amount} onChange={(e) => setAmount(e.target.value)} size={8} />
          </label>
          <label>
            Nonce
            <input value={nonce} onChange={(e) => setNonce(e.target.value)} size={4} />
          </label>
        </div>
        <div className="row">
          <button onClick={prepare} disabled={!account}>
            1. Prepare
          </button>
          <button className="primary" onClick={sign} disabled={!tx}>
            2. Sign on device
          </button>
        </div>
        <ErrorBox error={prepareError} />
        {tx && (
          <details open>
            <summary>Unsigned transaction</summary>
            <pre>{JSON.stringify(tx, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2)}</pre>
            <p className="hint">Sent to the device as:</p>
            <pre className="wrap">{eth.encodeUnsigned(tx)}</pre>
          </details>
        )}
        <ActionStatus state={signAction.state} error={signAction.error} />
        {signed && (
          <>
            <p className={signed.signer === account?.address ? "ok" : "ko"}>
              {signed.signer === account?.address
                ? "Valid: the signature recovers to your device's address"
                : `Signed by ${signed.signer}, not by ${account?.address}`}
            </p>
            <details open>
              <summary>Signed transaction (hex)</summary>
              <pre className="wrap">{signed.hex}</pre>
            </details>
          </>
        )}
      </Card>
    </main>
  );
}

function Card(props: { n: string; title: string; disabled?: boolean; children: ReactNode }) {
  return (
    <section className={props.disabled ? "card disabled" : "card"}>
      <h2>
        <span className="step">Step {props.n}</span> {props.title}
      </h2>
      {props.children}
    </section>
  );
}

const userInteractionText: Record<string, string> = {
  none: "Talking to the device…",
  "unlock-device": "Unlock your device",
  "confirm-open-app": "Approve opening the Ethereum app on your device",
  "verify-address": "Check the address on your device, then approve",
  "web3-checks-opt-in": "Choose on your device whether to turn on Transaction Check",
  "sign-transaction": "Review the transaction on your device, then sign",
};

function ActionStatus(props: {
  state?: DeviceActionState<unknown, unknown, { requiredUserInteraction: string }>;
  error: unknown;
}) {
  const { state, error } = props;
  if (error) return <ErrorBox error={error} />;
  if (!state) return null;
  switch (state.status) {
    case DeviceActionStatus.NotStarted:
      return <p className="pending">Starting…</p>;
    case DeviceActionStatus.Pending: {
      const i = state.intermediateValue.requiredUserInteraction;
      return <p className="pending">{userInteractionText[i] ?? i}</p>;
    }
    case DeviceActionStatus.Stopped:
      return <p className="ko">Cancelled</p>;
    case DeviceActionStatus.Completed:
      return <p className="ok">Done</p>;
    default:
      return null;
  }
}

function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  return <pre className="error wrap">{formatError(error)}</pre>;
}

/**
 * DMK errors are objects with a _tag, a message and sometimes an errorCode.
 * viem errors are Error instances with a shortMessage.
 */
function formatError(error: unknown): string {
  if (typeof error !== "object" || error === null) return String(error);
  const e = error as {
    _tag?: string;
    message?: string;
    shortMessage?: string;
    errorCode?: string;
    originalError?: unknown;
  };
  const parts = [
    e._tag,
    e.shortMessage ?? e.message,
    e.errorCode && `(status ${e.errorCode})`,
  ].filter(Boolean);
  if (e.originalError instanceof Error) parts.push(`← ${e.originalError.message}`);
  return parts.length ? parts.join(" ") : JSON.stringify(error);
}

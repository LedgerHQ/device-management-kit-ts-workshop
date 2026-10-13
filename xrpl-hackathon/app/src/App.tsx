import {
  DeviceActionStatus,
  DeviceModelId,
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
  SignerXrp,
} from "@ledgerhq/device-signer-kit-xrp";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Payment } from "xrpl";
import { exercise } from "./ledger/exercise";
import { solution } from "./ledger/solution";
import type { TransportChoice, WorkshopSteps } from "./ledger/types";
import { SpeculosScreen } from "./SpeculosScreen";
import { useDeviceAction } from "./useDeviceAction";
import * as xrpl from "./xrpl";
import "./App.css";

type Mode = "exercise" | "solution";

const transports: { id: TransportChoice; label: string }[] = [
  { id: "usb", label: "USB" },
  { id: "ble", label: "Bluetooth" },
  { id: "speculos", label: "Speculos (no device)" },
];

const speculosModels: { id: DeviceModelId; label: string }[] = [
  { id: DeviceModelId.STAX, label: "Stax" },
  { id: DeviceModelId.FLEX, label: "Flex" },
  { id: DeviceModelId.APEX, label: "Nano Gen5" },
  { id: DeviceModelId.NANO_X, label: "Nano X" },
  { id: DeviceModelId.NANO_SP, label: "Nano S Plus" },
];

export default function App() {
  const [mode, setMode] = useState<Mode>("solution");
  const [transport, setTransport] = useState<TransportChoice>("speculos");
  const [speculosUrl, setSpeculosUrl] = useState("http://localhost:5000");

  return (
    <>
      <header className="header">
        <div>
          <h1>Ledger × XRPL: Device Management Kit</h1>
          <p>
            Connect a Ledger, get an XRP address, sign and submit a testnet
            payment. Running <code>src/ledger/{mode}.ts</code>.
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
      <div className={transport === "speculos" ? "layout with-screen" : "layout"}>
        {/* key: switching mode starts over with a new DMK */}
        <Workshop
          key={mode}
          steps={mode === "exercise" ? exercise : solution}
          transport={transport}
          setTransport={setTransport}
          speculosUrl={speculosUrl}
          setSpeculosUrl={setSpeculosUrl}
        />
        {transport === "speculos" && (
          <aside className="screen">
            <h2>Speculos screen</h2>
            <p className="hint">
              Click to tap. Keep the mouse down to hold.
            </p>
            <SpeculosScreen url={speculosUrl} />
          </aside>
        )}
      </div>
    </>
  );
}

function Workshop(props: {
  steps: WorkshopSteps;
  transport: TransportChoice;
  setTransport: (t: TransportChoice) => void;
  speculosUrl: string;
  setSpeculosUrl: (url: string) => void;
}) {
  const { steps, transport } = props;
  const [speculosModel, setSpeculosModel] = useState(DeviceModelId.STAX);

  // Steps 1–3
  const dmkRef = useRef<DeviceManagementKit | undefined>(undefined);
  const [session, setSession] = useState<{
    id: DeviceSessionId;
    deviceName: string;
    signer: SignerXrp;
  }>();
  const [sessionState, setSessionState] = useState<DeviceSessionState>();
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<unknown>();

  // Step 4
  const [path, setPath] = useState("44'/144'/0'/0/0");
  const [checkOnDevice, setCheckOnDevice] = useState(false);
  const addressAction = useDeviceAction<
    GetAddressDAOutput,
    GetAddressDAError,
    GetAddressDAIntermediateValue
  >();
  const [account, setAccount] = useState<{ address: string; publicKey: string }>();
  const [balance, setBalance] = useState<number | null>();
  const [faucetBusy, setFaucetBusy] = useState(false);
  const [faucetError, setFaucetError] = useState<unknown>();

  // Step 5
  const [destination, setDestination] = useState(xrpl.randomAddress);
  const [amount, setAmount] = useState("2");
  const [tx, setTx] = useState<Payment>();
  const [prepareError, setPrepareError] = useState<unknown>();
  const signAction = useDeviceAction<
    SignTransactionDAOutput,
    SignTransactionDAError,
    SignTransactionDAIntermediateValue
  >();
  const [signedTxHex, setSignedTxHex] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ hash: string; result: string }>();
  const [submitError, setSubmitError] = useState<unknown>();

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
    setBalance(undefined);
    resetPayment();
  };
  const resetPayment = () => {
    setTx(undefined);
    setPrepareError(undefined);
    signAction.reset();
    setSignedTxHex(undefined);
    setSubmitted(undefined);
    setSubmitError(undefined);
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
      const dmk = steps.createDmk({ url: props.speculosUrl, model: speculosModel });
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
      setAccount({ address: output.address, publicKey: output.publicKey });
      refreshBalance(output.address);
    }
  };

  const refreshBalance = async (address: string) => {
    setBalance(undefined);
    setBalance(await xrpl.getBalance(address));
  };

  const fund = async () => {
    if (!account) return;
    setFaucetBusy(true);
    setFaucetError(undefined);
    try {
      await xrpl.fundFromFaucet(account.address);
      // The faucet's payment needs a ledger close (about 4 s) to show up.
      await new Promise((r) => setTimeout(r, 5000));
      await refreshBalance(account.address);
    } catch (e) {
      setFaucetError(e);
    } finally {
      setFaucetBusy(false);
    }
  };

  const prepare = async () => {
    if (!account) return;
    resetPayment();
    try {
      setTx(
        await xrpl.preparePayment({
          account: account.address,
          publicKey: account.publicKey,
          destination,
          amountXrp: amount,
        }),
      );
    } catch (e) {
      setPrepareError(e);
    }
  };

  const sign = async () => {
    if (!session || !tx) return;
    setSignedTxHex(undefined);
    setSubmitted(undefined);
    const signature = await signAction.run(() =>
      steps.signTransaction(session.signer, path, xrpl.encodeUnsigned(tx)),
    );
    if (signature) setSignedTxHex(xrpl.encodeSigned(tx, signature));
  };

  const submit = async () => {
    if (!signedTxHex || !account) return;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      setSubmitted(await xrpl.submit(signedTxHex));
      refreshBalance(account.address);
    } catch (e) {
      setSubmitError(e);
    } finally {
      setSubmitting(false);
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
              onClick={() => props.setTransport(t.id)}
              disabled={!!session}
            >
              {t.label}
            </button>
          ))}
        </div>
        {transport === "speculos" && (
          <div className="row">
            <label>
              URL
              <input
                value={props.speculosUrl}
                onChange={(e) => props.setSpeculosUrl(e.target.value)}
                disabled={!!session}
              />
            </label>
            <label>
              Model
              <select
                value={speculosModel}
                onChange={(e) => setSpeculosModel(e.target.value as DeviceModelId)}
                disabled={!!session}
              >
                {speculosModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
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
              <a href={xrpl.explorerAccountUrl(account.address)} target="_blank">
                {account.address}
              </a>
            </dd>
            <dt>Public key</dt>
            <dd>
              <code>{account.publicKey}</code>
            </dd>
            <dt>Balance</dt>
            <dd>
              {balance === undefined
                ? "…"
                : balance === null
                  ? "Not funded yet"
                  : `${balance} XRP (testnet)`}{" "}
              <button onClick={fund} disabled={faucetBusy}>
                {faucetBusy ? "Funding…" : "Get 100 test XRP"}
              </button>
            </dd>
          </dl>
        )}
        <ErrorBox error={faucetError} />
      </Card>

      <Card n="5" title="Sign and submit a payment" disabled={!account}>
        <div className="row">
          <label className="grow">
            Destination
            <input value={destination} onChange={(e) => setDestination(e.target.value)} />
          </label>
          <label>
            Amount (XRP)
            <input value={amount} onChange={(e) => setAmount(e.target.value)} size={6} />
          </label>
        </div>
        <p className="hint">
          A new account needs at least 1 XRP (the reserve) to exist.
        </p>
        <div className="row">
          <button onClick={prepare} disabled={!account}>
            1. Prepare
          </button>
          <button className="primary" onClick={sign} disabled={!tx}>
            2. Sign on device
          </button>
          <button onClick={submit} disabled={!signedTxHex || submitting}>
            {submitting ? "Submitting…" : "3. Submit"}
          </button>
        </div>
        <ErrorBox error={prepareError} />
        {tx && (
          <details open>
            <summary>Unsigned transaction</summary>
            <pre>{JSON.stringify(tx, null, 2)}</pre>
          </details>
        )}
        <ActionStatus state={signAction.state} error={signAction.error} />
        {signedTxHex && (
          <details>
            <summary>Signed transaction (hex)</summary>
            <pre className="wrap">{signedTxHex}</pre>
          </details>
        )}
        <ErrorBox error={submitError} />
        {submitted && (
          <p className={submitted.result === "tesSUCCESS" ? "ok" : "ko"}>
            {submitted.result} ·{" "}
            <a href={xrpl.explorerTxUrl(submitted.hash)} target="_blank">
              see it on the explorer
            </a>
          </p>
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
  "confirm-open-app": "Approve opening the XRP app on your device",
  "verify-address": "Check the address on your device, then approve",
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

/** DMK errors are objects with a _tag, a message and sometimes an errorCode. */
function formatError(error: unknown): string {
  if (typeof error !== "object" || error === null) return String(error);
  const e = error as { _tag?: string; message?: string; errorCode?: string; originalError?: unknown };
  const parts = [e._tag, e.message, e.errorCode && `(status ${e.errorCode})`].filter(Boolean);
  if (e.originalError instanceof Error) parts.push(`← ${e.originalError.message}`);
  return parts.length ? parts.join(" ") : JSON.stringify(error);
}

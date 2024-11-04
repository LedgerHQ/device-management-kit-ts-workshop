import { useState } from "react";
import { firstValueFrom } from "rxjs";
import "./App.css";
import {
  DeviceActionStatus,
  DeviceSdkBuilder,
  DeviceStatus,
  type DeviceSessionId,
} from "@ledgerhq/device-management-kit";
import {
  GetAddressDAOutput,
  KeyringEthBuilder,
} from "@ledgerhq/device-signer-kit-ethereum";
import { SignTransactionDAOutput } from "@ledgerhq/device-signer-kit-ethereum/lib/cjs/index.js";
import { ethers } from "ethers";
import { useDeviceSessionState } from "./helpers";
import { LabelizedJSON } from "./components/LabelizedJSON";
import { LabelizedInput } from "./components/LabelizedInput";
import { Divider } from "./components/Divider";
import { SectionContainer } from "./components/SectionContainer";
import { ContextModuleBuilder } from "@ledgerhq/context-module";

const exampleRawTransactionHew =
  "0xf8a90385012bcfb58082fde894dac17f958d2ee523a2206206994597c13d831ec780b844a9059cbb0000000000000000000000008c7cd921644daeb5a9a1d018d67d63d9e1ce776600000000000000000000000000000000000000000000000000000000000186a926a0326e5f620cdfc9bc62d0adaca76eb390aa10b22d8733994a97c046b5e83d96c3a03e26dd677196799f3ed222ac5134c42a82319b477f69175f4251d6334d4750c5";

function App() {
  // Workshop TODO 1: initialize the SDK
  const [sdk] = useState(new DeviceSdkBuilder().build());

  const [deviceSessionId, setSessionId] = useState<DeviceSessionId>();
  const [connectionError, setConnectionError] = useState<unknown>();
  const [derivationPath, setDerivationPath] = useState("44'/60'/0'/0");
  const [rawTransactionHex, setRawTransactionHex] = useState(
    exampleRawTransactionHew
  );
  const [getAddressOutput, setGetAddressOutput] =
    useState<GetAddressDAOutput>();
  const [getAddressError, setGetAddressError] = useState<unknown>();
  const [getAddressState, setGetAddressState] = useState<unknown>();
  const [getAddressLoading, setGetAddressLoading] = useState<boolean>(false);

  const [signTransactionOutput, setSignTransactionOutput] =
    useState<SignTransactionDAOutput>();
  const [signTransactionError, setSignTransactionError] = useState<unknown>();
  const [signTransactionState, setSignTransactionState] = useState<unknown>();
  const [signTransactionLoading, setSignTransactionLoading] =
    useState<boolean>(false);

  const onClickDiscoverDevices = async () => {
    try {
      setSessionId(undefined);
      // Workshop TODO 2: discover device
      const discoveredDevice = await firstValueFrom(sdk.startDiscovering());
      // Workshop TODO 3: connect discovered device & save device session id
      const sessionId = await sdk.connect({ deviceId: discoveredDevice.id });
      setConnectionError(undefined);
      setSessionId(sessionId);
    } catch (e) {
      setConnectionError(e);
    }
  };

  // Workshop TODO 4: instantiate Ethereum Keyring
  const keyringEth = deviceSessionId
    ? new KeyringEthBuilder({
        sdk,
        sessionId: deviceSessionId,
      }).build()
    : undefined;

  const onClickGetEthereumAddress = async () => {
    // Workshop TODO 5: implement the getAddress using the Ethereum Keyring
    if (!keyringEth || !derivationPath) return;
    setGetAddressOutput(undefined);
    setGetAddressError(undefined);
    setGetAddressState(undefined);
    setGetAddressLoading(true);
    keyringEth.getAddress(derivationPath).observable.subscribe({
      next: (getAddressDAState) => {
        switch (getAddressDAState.status) {
          case DeviceActionStatus.Completed:
            setGetAddressOutput(getAddressDAState.output);
            break;
          case DeviceActionStatus.Error:
            setGetAddressError(getAddressDAState.error);
            break;
          default:
            break;
        }
        setGetAddressState(getAddressDAState);
      },
      complete: () => setGetAddressLoading(false),
    });
  };

  const onClickSignTransaction = async () => {
    // Workshop TODO 6: implement the signTransaction using the Ethereum keyring
    if (!keyringEth || !derivationPath || !rawTransactionHex) return;
    setSignTransactionOutput(undefined);
    setSignTransactionError(undefined);
    setSignTransactionState(undefined);
    setSignTransactionLoading(true);
    let transaction: ethers.Transaction;
    try {
      transaction = ethers.Transaction.from(rawTransactionHex);
    } catch (e) {
      setSignTransactionError(e);
      setSignTransactionLoading(false);
      return;
    }
    console.log("transaction", transaction);
    keyringEth
      .signTransaction(derivationPath, transaction, {
        domain: "",
      })
      .observable.subscribe({
        next: (signTransactionDAState) => {
          console.log("signTransactionDAState", signTransactionDAState);
          switch (signTransactionDAState.status) {
            case DeviceActionStatus.Completed:
              setSignTransactionOutput(signTransactionDAState.output);
              break;
            case DeviceActionStatus.Error:
              setSignTransactionError(signTransactionDAState.error);
              break;
            default:
              break;
          }
          setSignTransactionState(signTransactionDAState);
        },
        complete: () => setSignTransactionLoading(false),
      });
  };

  const deviceSessionState = useDeviceSessionState(sdk, deviceSessionId);

  const buttonsDisabled =
    getAddressLoading ||
    !deviceSessionId ||
    deviceSessionState?.deviceStatus !== DeviceStatus.CONNECTED;

  return (
    <div className="card">
      <SectionContainer>
        <h3>Device Management Kit: Device Connection</h3>
        <button onClick={onClickDiscoverDevices}>
          Discover & connect a device (USB)
        </button>
        {connectionError ? (
          <LabelizedJSON label="Connection error" value={connectionError} />
        ) : deviceSessionId ? (
          <div>
            <p>Connected! SessionId: {deviceSessionId}</p>
            <p>
              Device Session status:{" "}
              {deviceSessionState?.deviceStatus ?? "loading"}
            </p>
          </div>
        ) : (
          <p>
            No active session. First discover and connect via USB a Ledger
            device.
          </p>
        )}
      </SectionContainer>
      <Divider />
      <SectionContainer>
        <h3>Ethereum Signer: Get Address</h3>
        <LabelizedInput
          label="Derivation path"
          value={derivationPath}
          disabled={buttonsDisabled}
          onChange={(e) => setDerivationPath(e.target.value)}
        />
        <button disabled={buttonsDisabled} onClick={onClickGetEthereumAddress}>
          Get Ethereum address {getAddressLoading ? "(loading)" : ""}
        </button>
      </SectionContainer>
      {getAddressError ? (
        <LabelizedJSON label="Get address error" value={getAddressError} />
      ) : (
        <LabelizedJSON
          label="GetAddressDeviceAction state"
          value={getAddressState}
        />
      )}
      <Divider />
      <SectionContainer>
        <h3>Ethereum Signer: Sign Transaction</h3>
        <LabelizedInput
          label="Derivation path"
          value={derivationPath}
          disabled={buttonsDisabled}
          onChange={(e) => setDerivationPath(e.target.value)}
        />
        <LabelizedInput
          label="Transaction"
          value={rawTransactionHex}
          disabled={buttonsDisabled}
          onChange={(e) => setRawTransactionHex(e.target.value)}
        />
        <button disabled={buttonsDisabled} onClick={onClickSignTransaction}>
          Sign transaction {signTransactionLoading ? "(loading)" : ""}
        </button>
      </SectionContainer>
      {signTransactionError ? (
        <LabelizedJSON
          label="Sign transaction error"
          value={signTransactionError}
        />
      ) : (
        <LabelizedJSON
          label="SignTransactionDeviceAction state"
          value={signTransactionState}
        />
      )}
    </div>
  );
}

export default App;

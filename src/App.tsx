import { useState } from 'react';
import { firstValueFrom } from 'rxjs';
import './App.css';
import {
  DeviceActionStatus,
  DeviceSdkBuilder,
  DeviceStatus,
  type DeviceSessionId,
} from '@ledgerhq/device-management-kit';
import {
  GetAddressDAOutput,
  KeyringEthBuilder,
} from '@ledgerhq/device-signer-kit-ethereum';
import { SignTransactionDAOutput } from '@ledgerhq/device-signer-kit-ethereum/lib/cjs/index.js';
import { ethers } from "ethers";
import { useDeviceSessionState } from './helpers';

function App() {
  // Workshop TODO 1: initialize the SDK
  const [sdk] = useState(new DeviceSdkBuilder().build());

  const [deviceSessionId, setSessionId] = useState<DeviceSessionId>();
  const [connectionError, setConnectionError] = useState<unknown>();
  const [derivationPath, setDerivationPath] = useState("44'/60'/0'/0");
  const [transaction, setTransaction] = useState("0x02f87101831863388085042d5376f6825208944675c7e5baafbffbca748158becba61ef3b0a26387f4c28a5744191880c080a056dcc0364cdc4e395879d4f647c4e5d6b6112ace65605ecbf7d329b67b2006f2a023def803117565f65f763d2c5d18281ad2ef0ab4335c45da691266b23bc5d814");
  const [getAddressOutput, setGetAddressOutput] = useState<GetAddressDAOutput>();
  const [getAddressError, setGetAddressError] = useState<unknown>();
  const [getAddressState, setGetAddressState] = useState<unknown>();
  const [getAddressLoading, setGetAddressLoading] = useState<boolean>(false);

  const [signTransactionOutput, setSignTransactionOutput] = useState<SignTransactionDAOutput>();
  const [signTransactionError, setSignTransactionError] = useState<unknown>();
  const [signTransactionState, setSignTransactionState] = useState<unknown>();
  const [signTransactionLoading, setSignTransactionLoading] = useState<boolean>(false);

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
    setGetAddressState(undefined)
    setGetAddressLoading(true);
    keyringEth.getAddress(derivationPath).observable.subscribe({
      next: (getAddressDAState) => {
        switch(getAddressDAState.status) {
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
      complete: () => setGetAddressLoading(false)
    });
  };

  const onClickSignTransaction = async () => {
    // Workshop TODO 6: implement the signTransaction using the Ethereum keyring
    if (!keyringEth || !derivationPath || !transaction) return;
    setSignTransactionOutput(undefined);
    setSignTransactionError(undefined);
    setSignTransactionState(undefined)
    setSignTransactionLoading(true);
    keyringEth.signTransaction(derivationPath, ethers.Transaction.from(transaction)).observable.subscribe({
      next: (signTransactionDAState) => {
        switch(signTransactionDAState.status) {
          case DeviceActionStatus.Completed:
            setSignTransactionOutput(signTransactionDAState.output);
            break;
          case DeviceActionStatus.Error:
            setGetAddressError(signTransactionDAState.error);
            break;
          default:
            break;
        }
        setSignTransactionState(signTransactionDAState);
      },
      complete: () => setSignTransactionLoading(false)
    });
  }

  const deviceSessionState = useDeviceSessionState(sdk, deviceSessionId);

  const buttonsDisabled = getAddressLoading || !deviceSessionId || deviceSessionState?.deviceStatus !== DeviceStatus.CONNECTED

  return (
    <div className="card" style={{width: "500px"}}>
      <button onClick={onClickDiscoverDevices}>
        Discover & connect a device (USB)
      </button>
      {connectionError ? (
        <pre>
          Connection error:{'\n'}
          {JSON.stringify(connectionError, null, 2)}
        </pre>
      ) : deviceSessionId ? (
        <div>
          <p>Connected! SessionId: {deviceSessionId}</p>
          <p>Device Session status: {deviceSessionState?.deviceStatus ?? 'loading'}</p>
        </div>
      ) : (
        <p>No active session. First discover and connect via USB a Ledger device.</p>
      )}
      <div style={{height: 1, width: "100%", backgroundColor: "grey", margin: "20px 0px"}} />
      <div style={{display: "flex", flexDirection: "column", rowGap: 20, alignItems: "center"}}>
        <form>
          <label>
            Derivation path:{" "}
          </label>
          <input disabled={buttonsDisabled} value={derivationPath} onChange={(e) => setDerivationPath(e.target.value)} />
        </form>
        <button disabled={buttonsDisabled} onClick={onClickGetEthereumAddress}>
          Get Ethereum address {getAddressLoading ? "(loading)" : ""}
        </button>
      </div>
      {getAddressError ? (
        <>
          <p>Get address error:</p>
          <pre>{JSON.stringify(getAddressError, null, 2)}</pre>
        </>
      ) : (
        <div style={{overflow: "scroll", textAlign: "start"}}>
          <p>GetAddressDeviceAction state:</p>
          <pre>{getAddressState ? JSON.stringify(getAddressState, null, 2) : "undefined"}</pre>
        </div>
      )}
      <div style={{height: 1, width: "100%", backgroundColor: "grey", margin: "20px 0px"}} />
      <div style={{display: "flex", flexDirection: "column", rowGap: 20, alignItems: "center"}}>
        <form>
          <label>
            Derivation path:{" "}
          </label>
          <input disabled={buttonsDisabled} value={derivationPath} onChange={(e) => setDerivationPath(e.target.value)} />
        </form>
        <form>
          <label>
            Transaction:{" "}
          </label>
          <input disabled={buttonsDisabled} value={transaction} onChange={(e) => setTransaction(e.target.value)} />
        </form>
        <button disabled={buttonsDisabled} onClick={onClickSignTransaction}>
          Sign transaction {signTransactionLoading ? "(loading)" : ""}
        </button>
      </div>
      {signTransactionError ? (
        <>
          <p>Sign transaction error:</p>
          <pre>{JSON.stringify(signTransactionError, null, 2)}</pre>
        </>
      ) : (
        <div style={{overflow: "scroll", textAlign: "start"}}>
          <p>SignTransactionDeviceAction state:</p>
          <pre>{signTransactionState ? JSON.stringify(signTransactionState, null, 2) : "undefined"}</pre>
        </div>
      )}
    </div>
  );
}

export default App;

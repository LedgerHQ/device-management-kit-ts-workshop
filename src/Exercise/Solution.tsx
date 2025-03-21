import {
  DeviceActionState,
  DeviceActionStatus,
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  hexaStringToBuffer,
  type DeviceSessionId,
} from "@ledgerhq/device-management-kit";
import {
  webHidIdentifier,
  webHidTransportFactory,
} from "@ledgerhq/device-transport-kit-web-hid";
import {
  GetAddressDAError,
  GetAddressDAIntermediateValue,
  GetAddressDAOutput,
  SignerEth,
  SignerEthBuilder,
  SignTransactionDAError,
  SignTransactionDAIntermediateValue,
  SignTransactionDAOutput,
} from "@ledgerhq/device-signer-kit-ethereum";
import { useState } from "react";
import { firstValueFrom } from "rxjs";
import { UI } from "../components/UI";
import { exampleRawTransactionHex } from "./exampleRawTransactionHex";

/**
 * Notes for the Workshop:
 * - There is no need to import more than what is already imported.
 * - There is normally no need to know how React works.
 * - In case TypeScript autocompletion does not work, do cmd+shift+p to open the command palette and select "TypeScript: Restart TS server"
 */

export const Solution = () => {
  /**
   * Workshop TODO 1: initialize the SDK
   *
   * cf. doc: https://github.com/LedgerHQ/device-sdk-ts/blob/%40ledgerhq/device-management-kit%400.4.0/packages/core/README.md#setting-up-the-sdk
   *
   * Goal:
   * ```ts
   * const [sdk] = useState<DeviceSdk>(mySdkInstance);`
   * ```
   * */
  const [sdk] = useState<DeviceManagementKit>(
    new DeviceManagementKitBuilder()
      .addTransport(webHidTransportFactory)
      .build()
  );

  const [deviceSessionId, setSessionId] = useState<DeviceSessionId>();
  const [connectionError, setConnectionError] = useState<unknown>();
  const [derivationPath, setDerivationPath] = useState("44'/60'/0'/0");
  const [rawTransactionHex, setRawTransactionHex] = useState(
    exampleRawTransactionHex
  );
  const [getAddressOutput, setGetAddressOutput] =
    useState<GetAddressDAOutput>();
  const [getAddressError, setGetAddressError] = useState<
    GetAddressDAError | Error | unknown
  >();
  const [getAddressState, setGetAddressState] =
    useState<
      DeviceActionState<
        GetAddressDAOutput,
        GetAddressDAError,
        GetAddressDAIntermediateValue
      >
    >();

  const [signTransactionOutput, setSignTransactionOutput] =
    useState<SignTransactionDAOutput>();
  const [signTransactionError, setSignTransactionError] = useState<
    SignTransactionDAError | Error | unknown
  >();
  const [signTransactionState, setSignTransactionState] =
    useState<
      DeviceActionState<
        SignTransactionDAOutput,
        SignTransactionDAError,
        SignTransactionDAIntermediateValue
      >
    >();

  const onClickDiscoverDevices = async () => {
    try {
      setSessionId(undefined);
      /**
       * Workshop TODO 2: discover & connect device
       *
       * Goal: obtain a `sessionId` and call `setSessionId(sessionId)`
       *
       * RxJS tip: use `firstValueFrom` to get the first value emitted by an observable, converting it to a Promise (https://rxjs.dev/api/index/function/firstValueFrom)
       *    example: const myDiscoveredDevice = await firstValueFrom(myDiscoverDeviceObservable);
       *
       * cf. doc: https://github.com/LedgerHQ/device-sdk-ts/blob/%40ledgerhq/device-management-kit%400.6.0/packages/core/README.md#connecting-to-a-device
       * */
      const discoveredDevice = await firstValueFrom(
        sdk.startDiscovering({ transport: webHidIdentifier })
      );
      const sessionId = await sdk.connect({ device: discoveredDevice });
      setConnectionError(undefined);
      setSessionId(sessionId);
    } catch (e) {
      setConnectionError(e);
    }
  };

  // NB: here we initialize the Ethereum keyring with the sessionId
  const keyringEth: SignerEth | undefined = deviceSessionId
    ? new SignerEthBuilder({
        dmk: sdk,
        sessionId: deviceSessionId,
      }).build()
    : undefined;

  const onClickGetEthereumAddress = async () => {
    if (!keyringEth || !derivationPath) return;
    setGetAddressOutput(undefined);
    setGetAddressError(undefined);
    setGetAddressState(undefined);
    /**
     * Workshop TODO 3: implement the getAddress using the Ethereum Keyring
     *
     * goal A: call the right method on the keyringEth instance
     * goal B: subscribe to the observable returned by the method
     * goal C: update the state accordingly: setGetAddressState(getAddressDAState)
     * goal D: handle the different statuses of the DeviceActionState
     *    - Completed:  setGetAddressOutput(getAddressDAState.output)
     *    - Error:       setGetAddressError(getAddressDAState.error)
     *
     * RxJS tip: call `subscribe` on an observable to start listening to its events with a callback
     *   example: myObservable.subscribe((value) => console.log(value));
     *
     * cf. doc: https://github.com/LedgerHQ/device-sdk-ts/blob/%40ledgerhq/device-management-kit%400.4.0/packages/signer/keyring-eth/README.md#use-case-1-get-address
     * */
    keyringEth
      .getAddress(derivationPath)
      .observable.subscribe((getAddressDAState) => {
        setGetAddressState(getAddressDAState);
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
      });
  };

  const onClickSignTransaction = async () => {
    if (!keyringEth || !derivationPath || !rawTransactionHex) return;
    setSignTransactionOutput(undefined);
    setSignTransactionError(undefined);
    setSignTransactionState(undefined);
    const transaction: Uint8Array | null =
      hexaStringToBuffer(rawTransactionHex);
    if (transaction == null) {
      setSignTransactionError(
        new Error("Cannot convert rawTransactionHex to Uint8Array")
      );
    } else {
      /**
       * Workshop TODO 4 (Bonus): implement the signTransaction using the Ethereum keyring
       *
       * goal A: call the right method on the keyringEth instance
       * goal B: subscribe to the observable returned by the method
       * goal C: update the state accordingly: setSignTransactionState(signTransactionDAState)
       * goal D: handle the different statuses of the DeviceActionState
       *    - Completed:  setSignTransactionOutput(signTransactionDAState.output)
       *    - Error:      setSignTransactionError(signTransactionDAState.error)
       *
       * RxJS tip: call `subscribe` on an observable to start listening to its events with a callback
       *    example: myObservable.subscribe((value) => console.log(value));
       *
       * cf. doc: https://github.com/LedgerHQ/device-sdk-ts/blob/develop/packages/signer/signer-eth/README.md#use-case-2-sign-transaction
       * */
      keyringEth
        .signTransaction(derivationPath, transaction)
        .observable.subscribe((signTransactionDAState) => {
          setSignTransactionState(signTransactionDAState);
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
        });
    }
  };

  return (
    <UI
      {...{
        deviceSdk: sdk,
        ethereumSigner: keyringEth,
        onClickDiscoverDevices,
        connectionError,
        deviceSessionId,
        derivationPath,
        setDerivationPath,
        onClickGetEthereumAddress,
        getAddressOutput,
        getAddressError,
        getAddressState,
        rawTransactionHex,
        setRawTransactionHex,
        onClickSignTransaction,
        signTransactionOutput,
        signTransactionError,
        signTransactionState,
      }}
    />
  );
};

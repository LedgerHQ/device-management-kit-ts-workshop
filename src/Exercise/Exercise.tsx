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

export function Exercise() {
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
  const [dmk] =
    useState<DeviceManagementKit>(/* TODO: pass the SDK instance here */);

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

  // New state for install app device action
  const [appName, setAppName] = useState("");
  const [installAppOutput, setInstallAppOutput] = useState<unknown>();
  const [installAppError, setInstallAppError] = useState<Error | unknown>();
  const [installAppState, setInstallAppState] =
    useState<DeviceActionState<unknown, unknown, unknown>>();

  // New state for uninstall app device action
  const [uninstallAppName, setUninstallAppName] = useState("");
  const [uninstallAppOutput, setUninstallAppOutput] = useState<unknown>();
  const [uninstallAppError, setUninstallAppError] = useState<Error | unknown>();
  const [uninstallAppState, setUninstallAppState] =
    useState<DeviceActionState<unknown, unknown, unknown>>();

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
       * cf. doc: https://github.com/LedgerHQ/device-sdk-ts/blob/%40ledgerhq/device-management-kit%400.4.0/packages/core/README.md#connecting-to-a-device
       * */
      window.alert("onClickDiscoverDevices not implemented yet.");
      // const sessionId =
      // setSessionId(sessionId); // TODO: uncomment this line when sessionId is defined
      setConnectionError(undefined);
    } catch (e) {
      setConnectionError(e);
    }
  };

  // NB: here we initialize the Ethereum signer with the sessionId
  const signerEth: SignerEth | undefined = deviceSessionId
    ? new SignerEthBuilder({
        dmk,
        sessionId: deviceSessionId,
        originToken: "some-token",
      }).build()
    : undefined;

  const onClickGetEthereumAddress = async () => {
    if (!signerEth || !derivationPath) return;
    setGetAddressOutput(undefined);
    setGetAddressError(undefined);
    setGetAddressState(undefined);
    /**
     * Workshop TODO 3: implement the getAddress using the Ethereum Signer
     *
     * goal A: call the right method on the signerEth instance
     * goal B: subscribe to the observable returned by the method
     * goal C: update the state accordingly: setGetAddressState(getAddressDAState)
     * goal D: handle the different statuses of the DeviceActionState
     *    - Completed:  setGetAddressOutput(getAddressDAState.output)
     *    - Error:      setGetAddressError(getAddressDAState.error)
     *
     * RxJS tip: call `subscribe` on an observable to start listening to its events with a callback
     *   example: myObservable.subscribe((value) => console.log(value));
     *
     * cf. doc: https://github.com/LedgerHQ/device-sdk-ts/blob/%40ledgerhq/device-management-kit%400.4.0/packages/signer/signer-eth/README.md#use-case-1-get-address
     * */
    window.alert("onClickGetEthereumAddress not implemented yet.");
  };

  const onClickSignTransaction = async () => {
    if (!signerEth || !derivationPath || !rawTransactionHex) return;
    setSignTransactionOutput(undefined);
    setSignTransactionError(undefined);
    setSignTransactionState(undefined);
    const transaction: Uint8Array | null =
      hexaStringToBuffer(rawTransactionHex);
    if (transaction == null) {
      setSignTransactionError(
        new Error("Cannot convert rawTransactionHex to Uint8Array")
      );
      return;
    }

    /**
     * Workshop TODO 4 (Bonus): implement the signTransaction using the Ethereum signer
     *
     * goal A: call the right method on the signerEth instance
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
    window.alert("onClickSignTransaction not implemented yet.");
  };

  const onClickInstallApp = async () => {
    if (!deviceSessionId || !appName) return;
    setInstallAppOutput(undefined);
    setInstallAppError(undefined);
    setInstallAppState(undefined);

    /**
     * Workshop TODO 5: implement the installApp using the InstallAppDeviceAction
     *
     * goal A: import and use InstallAppDeviceAction from the DMK
     * goal B: call the right method on the InstallAppDeviceAction instance
     * goal C: subscribe to the observable returned by the method
     * goal D: update the state accordingly: setInstallAppState(installAppDAState)
     * goal E: handle the different statuses of the DeviceActionState
     *    - Completed:  setInstallAppOutput(installAppDAState.output)
     *    - Error:      setInstallAppError(installAppDAState.error)
     *
     * RxJS tip: call `subscribe` on an observable to start listening to its events with a callback
     *    example: myObservable.subscribe((value) => console.log(value));
     *
     * cf. doc: Look for InstallAppDeviceAction documentation in the DMK
     * */
    window.alert("onClickInstallApp not implemented yet.");
  };

  const onClickUninstallApp = async () => {
    if (!deviceSessionId || !uninstallAppName) return;
    setUninstallAppOutput(undefined);
    setUninstallAppError(undefined);
    setUninstallAppState(undefined);

    /**
     * Workshop TODO 6: implement the uninstallApp using the UninstallAppDeviceAction
     *
     * goal A: import and use UninstallAppDeviceAction from the DMK
     * goal B: call the right method on the UninstallAppDeviceAction instance
     * goal C: subscribe to the observable returned by the method
     * goal D: update the state accordingly: setUninstallAppState(uninstallAppDAState)
     * goal E: handle the different statuses of the DeviceActionState
     *    - Completed:  setUninstallAppOutput(uninstallAppDAState.output)
     *    - Error:      setUninstallAppError(uninstallAppDAState.error)
     *
     * RxJS tip: call `subscribe` on an observable to start listening to its events with a callback
     *    example: myObservable.subscribe((value) => console.log(value));
     *
     * cf. doc: Look for UninstallAppDeviceAction documentation in the DMK
     * */
    window.alert("onClickUninstallApp not implemented yet.");
  };

  return (
    <UI
      {...{
        deviceManagementKit: dmk,
        ethereumSigner: signerEth,
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
        // New props for install app
        appName,
        setAppName,
        onClickInstallApp,
        installAppOutput,
        installAppError,
        installAppState,
        // New props for uninstall app
        uninstallAppName,
        setUninstallAppName,
        onClickUninstallApp,
        uninstallAppOutput,
        uninstallAppError,
        uninstallAppState,
      }}
    />
  );
}

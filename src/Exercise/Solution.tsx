import {
  DeviceActionState,
  DeviceActionStatus,
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  hexaStringToBuffer,
  type DeviceSessionId,
  InstallAppDeviceAction,
  UninstallAppDeviceAction,
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
  const [dmk] = useState<DeviceManagementKit>(
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
        dmk.startDiscovering({ transport: webHidIdentifier })
      );
      const sessionId = await dmk.connect({ device: discoveredDevice });
      setConnectionError(undefined);
      setSessionId(sessionId);
    } catch (e) {
      setConnectionError(e);
    }
  };

  // NB: here we initialize the Ethereum signer with the sessionId
  const signerEth: SignerEth | undefined = deviceSessionId
    ? new SignerEthBuilder({
        dmk,
        sessionId: deviceSessionId,
        originToken:
          "1e55ba3959f4543af24809d9066a2120bd2ac9246e626e26a1ff77eb109ca0e5",
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
     *    - Error:       setGetAddressError(getAddressDAState.error)
     *
     * RxJS tip: call `subscribe` on an observable to start listening to its events with a callback
     *   example: myObservable.subscribe((value) => console.log(value));
     *
     * cf. doc: https://github.com/LedgerHQ/device-sdk-ts/blob/%40ledgerhq/device-management-kit%400.4.0/packages/signer/signer-eth/README.md#use-case-1-get-address
     * */
    signerEth
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
    } else {
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
      signerEth
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

  const onClickInstallApp = async () => {
    if (!deviceSessionId || !appName) return;
    setInstallAppOutput(undefined);
    setInstallAppError(undefined);
    setInstallAppState(undefined);

    try {
      // Create and execute the install app device action
      const installAppAction = new InstallAppDeviceAction({
        input: { appName },
      });
      const installResult = dmk.executeDeviceAction({
        sessionId: deviceSessionId,
        deviceAction: installAppAction,
      });

      installResult.observable.subscribe(
        (installAppDAState: DeviceActionState<unknown, unknown, unknown>) => {
          setInstallAppState(installAppDAState);
          switch (installAppDAState.status) {
            case DeviceActionStatus.Completed:
              setInstallAppOutput(installAppDAState.output);
              break;
            case DeviceActionStatus.Error:
              setInstallAppError(installAppDAState.error);
              break;
            default:
              break;
          }
        }
      );
    } catch (e) {
      setInstallAppError(e);
    }
  };

  const onClickUninstallApp = async () => {
    if (!deviceSessionId || !uninstallAppName) return;
    setUninstallAppOutput(undefined);
    setUninstallAppError(undefined);
    setUninstallAppState(undefined);

    try {
      // Create and execute the uninstall app device action
      const uninstallAppAction = new UninstallAppDeviceAction({
        input: { appName: uninstallAppName },
      });
      const uninstallResult = dmk.executeDeviceAction({
        sessionId: deviceSessionId,
        deviceAction: uninstallAppAction,
      });

      uninstallResult.observable.subscribe(
        (uninstallAppDAState: DeviceActionState<unknown, unknown, unknown>) => {
          setUninstallAppState(uninstallAppDAState);
          switch (uninstallAppDAState.status) {
            case DeviceActionStatus.Completed:
              setUninstallAppOutput(uninstallAppDAState.output);
              break;
            case DeviceActionStatus.Error:
              setUninstallAppError(uninstallAppDAState.error);
              break;
            default:
              break;
          }
        }
      );
    } catch (e) {
      setUninstallAppError(e);
    }
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
};

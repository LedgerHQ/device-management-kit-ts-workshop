/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  DeviceActionState,
  DeviceActionStatus,
  DeviceSdk,
  DeviceSdkBuilder,
  type DeviceSessionId,
} from "@ledgerhq/device-management-kit";
import {
  GetAddressDAError,
  GetAddressDAIntermediateValue,
  GetAddressDAOutput,
  KeyringEth,
  KeyringEthBuilder,
  SignTransactionDAError,
  SignTransactionDAIntermediateValue,
  SignTransactionDAOutput,
} from "@ledgerhq/device-signer-kit-ethereum";
import { ethers } from "ethers";
import { useState } from "react";
import { firstValueFrom } from "rxjs";
import { useDeviceSessionState } from "../helpers";
import { UI } from "../components/UI";
import { exampleRawTransactionHex } from "./exampleRawTransactionHex";

export function Exercise() {
  /**
   * Workshop TODO 1: initialize the SDK
   *
   * cf. doc: https://github.com/LedgerHQ/device-sdk-ts/tree/develop/packages/device-management-kit#setting-up-the-sdk
   *
   * Goal:
   * ```ts
   * const [sdk] = useState<DeviceSdk>(mySdkInstance);`
   * ```
   * */
  const [sdk] = useState<DeviceSdk>(); // Pass your DeviceSdk instance here

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
       * RxJS tip: use `firstValueFrom` to get the first value emitted by an observable
       *
       * cf. doc: https://github.com/LedgerHQ/device-sdk-ts/tree/develop/packages/device-management-kit#connecting-to-a-device
       * */
      console.log("Clicked discover devices, method not implemented");
      // setSessionId(sessionId); // Uncomment this line when you have the sessionId

      setConnectionError(undefined);
    } catch (e) {
      setConnectionError(e);
    }
  };

  /**
   * Workshop TODO 3: instantiate Ethereum Keyring
   *
   * cf. doc: https://github.com/LedgerHQ/device-sdk-ts/blob/develop/packages/signer/signer-eth/README.md#setting-up
   * */
  const keyringEth: KeyringEth | undefined = deviceSessionId
    ? undefined // Initialize your KeyringEth instance here
    : undefined;

  const onClickGetEthereumAddress = async () => {
    if (!keyringEth || !derivationPath) return;
    setGetAddressOutput(undefined);
    setGetAddressError(undefined);
    setGetAddressState(undefined);
    /**
     * Workshop TODO 4: implement the getAddress using the Ethereum Keyring
     *
     * goal A: call the right method on the keyringEth instance
     * goal B: subscribe to the observable returned by the method
     * goal C: update the state accordingly: setGetAddressState(getAddressDAState)
     * goal D: handle the different statuses of the DeviceActionState
     *    - Pending:    setGetAddressIntermediateValue(getAddressDAState.intermediateValue)
     *    - Completed:  setGetAddressOutput(getAddressDAState.output)
     *    - Error:       setGetAddressError(getAddressDAState.error)
     *
     * RxJS tip: call `subscribe` on an observable to start listening to its events with a callback
     *
     * cf. doc: https://github.com/LedgerHQ/device-sdk-ts/blob/develop/packages/signer/signer-eth/README.md#use-case-1-get-address
     * */
    console.log("Clicked get Ethereum address, method not implemented");
  };

  const onClickSignTransaction = async () => {
    if (!keyringEth || !derivationPath || !rawTransactionHex) return;
    setSignTransactionOutput(undefined);
    setSignTransactionError(undefined);
    setSignTransactionState(undefined);
    let transaction: ethers.Transaction;
    try {
      transaction = ethers.utils.parseTransaction(rawTransactionHex);
    } catch (e) {
      setSignTransactionError(e);
      return;
    }

    /**
     * Workshop TODO 5 (Bonus): implement the signTransaction using the Ethereum keyring
     *
     * goal A: call the right method on the keyringEth instance
     * goal B: subscribe to the observable returned by the method
     * goal C: update the state accordingly: setSignTransactionState(signTransactionDAState)
     * goal D: handle the different statuses of the DeviceActionState
     *    - Pending:    setSignTransactionIntermediateValue(signTransactionDAState.intermediateValue)
     *    - Completed:  setSignTransactionOutput(signTransactionDAState.output)
     *    - Error:      setSignTransactionError(signTransactionDAState.error)
     *
     * RxJS tip: call `subscribe` on an observable to start listening to its events with a callback
     *
     * cf. doc: https://github.com/LedgerHQ/device-sdk-ts/blob/develop/packages/signer/signer-eth/README.md#use-case-2-sign-transaction
     * */
    console.log("Clicked sign transaction, method not implemented");
  };

  const deviceSessionState = useDeviceSessionState(sdk, deviceSessionId);
  const getAddressLoading = Boolean(
    getAddressState && !getAddressOutput && !getAddressError
  );
  const signTransactionLoading = Boolean(
    signTransactionState && !signTransactionOutput && !signTransactionError
  );

  return (
    <UI
      {...{
        deviceSdk: sdk,
        ethereumSigner: keyringEth,
        onClickDiscoverDevices,
        connectionError,
        deviceSessionId,
        deviceSessionState,
        derivationPath,
        setDerivationPath,
        onClickGetEthereumAddress,
        getAddressLoading,
        getAddressOutput,
        getAddressError,
        getAddressState,
        rawTransactionHex,
        setRawTransactionHex,
        onClickSignTransaction,
        signTransactionLoading,
        signTransactionOutput,
        signTransactionError,
        signTransactionState,
      }}
    />
  );
}

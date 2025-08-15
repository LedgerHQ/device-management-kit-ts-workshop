import {
  type DeviceSessionId,
  DeviceActionState,
  DeviceStatus,
  DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  GetAddressDAOutput,
  GetAddressDAError,
  GetAddressDAIntermediateValue,
  SignTransactionDAOutput,
  SignTransactionDAError,
  SignTransactionDAIntermediateValue,
  SignerEth,
} from "@ledgerhq/device-signer-kit-ethereum";
import { DeviceSessionUI } from "./DeviceSessionUI";
import { Divider } from "./Divider";
import { LabelizedInput } from "./LabelizedInput";
import { LabelizedJSON } from "./LabelizedJSON";
import { SectionContainer } from "./SectionContainer";
import { useDeviceSessionState } from "../helpers";

type UIProps = {
  deviceManagementKit: DeviceManagementKit | undefined;
  ethereumSigner: SignerEth | undefined;
  onClickDiscoverDevices: () => void;
  connectionError: unknown;
  deviceSessionId: DeviceSessionId | undefined;
  derivationPath: string;
  setDerivationPath: (path: string) => void;
  onClickGetEthereumAddress: () => void;
  getAddressOutput: GetAddressDAOutput | undefined;
  getAddressError: GetAddressDAError | Error | unknown | undefined;
  getAddressState:
    | DeviceActionState<
        GetAddressDAOutput,
        GetAddressDAError,
        GetAddressDAIntermediateValue
      >
    | undefined;
  rawTransactionHex: string;
  setRawTransactionHex: (hex: string) => void;
  onClickSignTransaction: () => void;
  signTransactionOutput: SignTransactionDAOutput | undefined;
  signTransactionError: SignTransactionDAError | Error | unknown | undefined;
  signTransactionState:
    | DeviceActionState<
        SignTransactionDAOutput,
        SignTransactionDAError,
        SignTransactionDAIntermediateValue
      >
    | undefined;
};

export const UI: React.FC<UIProps> = ({
  deviceManagementKit,
  ethereumSigner,
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
}) => {
  const deviceSessionState = useDeviceSessionState(
    deviceManagementKit,
    deviceSessionId
  );

  const getAddressLoading = Boolean(
    getAddressState && !getAddressOutput && !getAddressError
  );
  const signTransactionLoading = Boolean(
    signTransactionState && !signTransactionOutput && !signTransactionError
  );

  const buttonsDisabled =
    getAddressLoading ||
    signTransactionLoading ||
    !deviceSessionId ||
    deviceSessionState?.deviceStatus !== DeviceStatus.CONNECTED;

  return (
    <div className="card">
      {deviceManagementKit ? (
        <>
          <SectionContainer>
            <h3>Device Management Kit: Device Connection</h3>
            <button onClick={onClickDiscoverDevices}>
              Discover & connect a device (USB)
            </button>
            {connectionError ? (
              <LabelizedJSON label="Connection error" value={connectionError} />
            ) : (
              <DeviceSessionUI
                deviceSessionId={deviceSessionId}
                deviceSessionState={deviceSessionState}
              />
            )}
          </SectionContainer>
          <Divider />
          {ethereumSigner ? (
            <>
              <SectionContainer>
                <h3>Ethereum Signer: Get Address</h3>
                <LabelizedInput
                  label="Derivation path"
                  value={derivationPath}
                  disabled={buttonsDisabled}
                  onChange={(e) => setDerivationPath(e.target.value)}
                />
                <button
                  disabled={buttonsDisabled}
                  onClick={onClickGetEthereumAddress}
                >
                  Get Ethereum address {getAddressLoading ? "(loading)" : ""}
                </button>
              </SectionContainer>
              {getAddressError ? (
                <LabelizedJSON
                  label="Get address error"
                  value={getAddressError}
                />
              ) : (
                <>
                  <LabelizedJSON
                    label="Get address device action state"
                    value={getAddressState}
                  />
                  <LabelizedJSON
                    label="Get address device action output"
                    value={getAddressOutput}
                  />
                </>
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
                <button
                  disabled={buttonsDisabled}
                  onClick={onClickSignTransaction}
                >
                  Sign transaction {signTransactionLoading ? "(loading)" : ""}
                </button>
              </SectionContainer>
              {signTransactionError ? (
                <LabelizedJSON
                  label="Sign transaction error"
                  value={signTransactionError}
                />
              ) : (
                <>
                  <LabelizedJSON
                    label="Sign transaction device action state"
                    value={signTransactionState}
                  />
                  <LabelizedJSON
                    label="Sign transaction device action output"
                    value={signTransactionOutput}
                  />
                </>
              )}
            </>
          ) : (
            <p>Ethereum Signer not instantiated</p>
          )}
        </>
      ) : (
        <p>Device SDK not instantiated</p>
      )}
    </div>
  );
};

import type {
  DeviceManagementKit,
  DeviceSessionId,
} from "@ledgerhq/device-management-kit";
import type {
  GetAddressDAReturnType,
  SignTransactionDAReturnType,
  SignerEth,
} from "@ledgerhq/device-signer-kit-ethereum";

/** How the app reaches the device. */
export type TransportChoice = "usb" | "ble";

/**
 * The 5 workshop steps.
 * `solution.ts` implements them. `exercise.ts` is where you write them yourself.
 * The UI (App.tsx) calls them in order.
 */
export type WorkshopSteps = {
  /** Step 1: build the Device Management Kit. */
  createDmk(): DeviceManagementKit;

  /** Step 2: discover a device and open a session with it. */
  connect(
    dmk: DeviceManagementKit,
    transport: TransportChoice,
  ): Promise<DeviceSessionId>;

  /** Step 3: create the Ethereum signer for that session. */
  createSigner(dmk: DeviceManagementKit, sessionId: DeviceSessionId): SignerEth;

  /** Step 4: get the Ethereum address (and public key) from the device. */
  getAddress(
    signer: SignerEth,
    derivationPath: string,
    checkOnDevice: boolean,
  ): GetAddressDAReturnType;

  /** Step 5: sign a serialized, unsigned Ethereum transaction on the device. */
  signTransaction(
    signer: SignerEth,
    derivationPath: string,
    unsignedTxHex: string,
  ): SignTransactionDAReturnType;
};

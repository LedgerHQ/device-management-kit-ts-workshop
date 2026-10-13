import type {
  DeviceManagementKit,
  DeviceModelId,
  DeviceSessionId,
} from "@ledgerhq/device-management-kit";
import type {
  GetAddressDAReturnType,
  SignTransactionDAReturnType,
  SignerXrp,
} from "@ledgerhq/device-signer-kit-xrp";

/** How the app reaches the device. */
export type TransportChoice = "usb" | "ble" | "speculos";

/** Where Speculos (the device emulator) runs, and which Ledger model it emulates. */
export type SpeculosConfig = { url: string; model: DeviceModelId };

/**
 * The 5 workshop steps.
 * `solution.ts` implements them. `exercise.ts` is where you write them yourself.
 * The UI (App.tsx) calls them in order.
 */
export type WorkshopSteps = {
  /** Step 1: build the Device Management Kit. */
  createDmk(speculos: SpeculosConfig): DeviceManagementKit;

  /** Step 2: discover a device and open a session with it. */
  connect(
    dmk: DeviceManagementKit,
    transport: TransportChoice,
  ): Promise<DeviceSessionId>;

  /** Step 3: create the XRP signer for that session. */
  createSigner(dmk: DeviceManagementKit, sessionId: DeviceSessionId): SignerXrp;

  /** Step 4: get the XRP address (and public key) from the device. */
  getAddress(
    signer: SignerXrp,
    derivationPath: string,
    checkOnDevice: boolean,
  ): GetAddressDAReturnType;

  /** Step 5: sign a serialized XRPL transaction on the device. */
  signTransaction(
    signer: SignerXrp,
    derivationPath: string,
    unsignedTxHex: string,
  ): SignTransactionDAReturnType;
};

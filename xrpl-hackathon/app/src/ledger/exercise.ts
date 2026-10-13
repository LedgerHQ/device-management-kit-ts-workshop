/* eslint-disable no-unused-vars -- the imports and parameters are for you to use */
/**
 * Workshop exercise: write the 5 steps below.
 *
 * - Everything you need is already imported.
 * - Pick "Exercise" in the app header to run this file, "Solution" to run solution.ts.
 * - If TypeScript autocompletion stops working: Cmd+Shift+P → "TypeScript: Restart TS Server".
 */
import {
  DeviceManagementKitBuilder,
  hexaStringToBuffer,
} from "@ledgerhq/device-management-kit";
import { SignerXrpBuilder } from "@ledgerhq/device-signer-kit-xrp";
import {
  speculosIdentifier,
  speculosTransportFactory,
} from "@ledgerhq/device-transport-kit-speculos";
import {
  webBleIdentifier,
  webBleTransportFactory,
} from "@ledgerhq/device-transport-kit-web-ble";
import {
  webHidIdentifier,
  webHidTransportFactory,
} from "@ledgerhq/device-transport-kit-web-hid";
import { firstValueFrom } from "rxjs";
import type { TransportChoice, WorkshopSteps } from "./types";

const transportIdentifiers: Record<TransportChoice, string> = {
  usb: webHidIdentifier,
  ble: webBleIdentifier,
  speculos: speculosIdentifier,
};

export const exercise: WorkshopSteps = {
  /**
   * Step 1: build the DMK with 3 transports.
   *
   *   new DeviceManagementKitBuilder()
   *     .addTransport(webHidTransportFactory)
   *     .addTransport(...)
   *     .build()
   *
   * The Speculos transport needs the emulator URL and model:
   * speculosTransportFactory(url, false, model)
   */
  createDmk: ({ url, model }) => {
    throw new Error("TODO step 1: build the DMK");
  },

  /**
   * Step 2: discover a device, then connect to it.
   *
   * - dmk.startDiscovering({ transport: transportIdentifiers[transport] })
   *   returns an Observable of discovered devices.
   * - firstValueFrom(observable) gives a Promise of the first one.
   * - dmk.connect({ device }) returns a Promise of the session ID.
   */
  connect: async (dmk, transport) => {
    throw new Error("TODO step 2: discover and connect");
  },

  /**
   * Step 3: create the XRP signer.
   *
   *   new SignerXrpBuilder({ dmk, sessionId }).build()
   */
  createSigner: (dmk, sessionId) => {
    throw new Error("TODO step 3: create the XRP signer");
  },

  /**
   * Step 4: get the address.
   *
   *   signer.getAddress(derivationPath, { checkOnDevice })
   *
   * Return what it returns: { observable, cancel }. The UI subscribes to it.
   */
  getAddress: (signer, derivationPath, checkOnDevice) => {
    throw new Error("TODO step 4: get the address");
  },

  /**
   * Step 5: sign the transaction.
   *
   *   signer.signTransaction(derivationPath, bytes)
   *
   * The signer takes bytes (Uint8Array), not hex:
   * hexaStringToBuffer(unsignedTxHex)!
   */
  signTransaction: (signer, derivationPath, unsignedTxHex) => {
    throw new Error("TODO step 5: sign the transaction");
  },
};


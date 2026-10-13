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

export const solution: WorkshopSteps = {
  // Step 1: build the DMK once, with every transport the app supports.
  createDmk: ({ url, model }) =>
    new DeviceManagementKitBuilder()
      .addTransport(webHidTransportFactory) // USB (WebHID)
      .addTransport(webBleTransportFactory) // Bluetooth (Web Bluetooth)
      .addTransport(speculosTransportFactory(url, false, model)) // emulator
      .build(),

  // Step 2: take the first device found on that transport, then connect.
  // USB and Bluetooth open the browser's device picker.
  connect: async (dmk, transport) => {
    const device = await firstValueFrom(
      dmk.startDiscovering({ transport: transportIdentifiers[transport] }),
    );
    return dmk.connect({ device });
  },

  // Step 3: one signer per session.
  createSigner: (dmk, sessionId) =>
    new SignerXrpBuilder({ dmk, sessionId }).build(),

  // Step 4: returns { observable, cancel }. The observable reports each
  // state of the device action: open the XRP app, ask the user, done.
  getAddress: (signer, derivationPath, checkOnDevice) =>
    signer.getAddress(derivationPath, { checkOnDevice }),

  // Step 5: the device shows the transaction fields and the user approves.
  // The output is a DER signature (Uint8Array).
  signTransaction: (signer, derivationPath, unsignedTxHex) =>
    signer.signTransaction(derivationPath, hexaStringToBuffer(unsignedTxHex)!),
};

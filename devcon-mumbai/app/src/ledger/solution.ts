import {
  DeviceManagementKitBuilder,
  hexaStringToBuffer,
} from "@ledgerhq/device-management-kit";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
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
};

export const solution: WorkshopSteps = {
  // Step 1: build the DMK once, with every transport the app supports.
  createDmk: () =>
    new DeviceManagementKitBuilder()
      .addTransport(webHidTransportFactory) // USB (WebHID)
      .addTransport(webBleTransportFactory) // Bluetooth (Web Bluetooth)
      .build(),

  // Step 2: take the first device found on that transport, then connect.
  // Both transports open the browser's device picker.
  connect: async (dmk, transport) => {
    const device = await firstValueFrom(
      dmk.startDiscovering({ transport: transportIdentifiers[transport] }),
    );
    return dmk.connect({ device });
  },

  // Step 3: one signer per session.
  createSigner: (dmk, sessionId) =>
    new SignerEthBuilder({ dmk, sessionId }).build(),

  // Step 4: returns { observable, cancel }. The observable reports each
  // state of the device action: open the Ethereum app, ask the user, done.
  getAddress: (signer, derivationPath, checkOnDevice) =>
    signer.getAddress(derivationPath, { checkOnDevice }),

  // Step 5: the device shows the transaction fields and the user approves.
  // The output is a signature: { r, s, v }.
  signTransaction: (signer, derivationPath, unsignedTxHex) =>
    signer.signTransaction(derivationPath, hexaStringToBuffer(unsignedTxHex)!),
};

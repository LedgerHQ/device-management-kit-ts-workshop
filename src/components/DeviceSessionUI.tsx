import {
  type DeviceSessionId,
  DeviceStatus,
} from "@ledgerhq/device-management-kit";
import { DeviceSessionState } from "@ledgerhq/device-management-kit/lib/cjs/index.js";

export const DeviceSessionUI: React.FC<{
  deviceSessionId: DeviceSessionId | undefined;
  deviceSessionState: DeviceSessionState | undefined;
}> = ({ deviceSessionId, deviceSessionState }) => {
  if (!deviceSessionId) {
    return (
      <p>
        No active session. First discover and connect via USB a Ledger device.
      </p>
    );
  }

  let backgroundColor = "lightgray";
  switch (deviceSessionState?.deviceStatus) {
    case DeviceStatus.CONNECTED:
      backgroundColor = "lightgreen";
      break;
    case DeviceStatus.NOT_CONNECTED:
      backgroundColor = "lightcoral";
      break;
    case DeviceStatus.LOCKED:
      backgroundColor = "orange";
      break;
    case DeviceStatus.BUSY:
      backgroundColor = "lightyellow";
      break;
  }

  return (
    <div
      style={{
        backgroundColor: "#eee",
        color: "black",
        borderRadius: 5,
        padding: 10,
      }}
    >
      <p>SessionId: {deviceSessionId}</p>
      <p>
        Device Session status: Device{" "}
        <b style={{ padding: 3, borderRadius: 3, backgroundColor }}>
          {deviceSessionState?.deviceStatus ?? "loading"}
        </b>
      </p>
    </div>
  );
};
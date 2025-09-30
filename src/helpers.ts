import { useEffect, useState } from "react";
import {
  DeviceManagementKit,
  type DeviceSessionId,
  type DeviceSessionState,
} from "@ledgerhq/device-management-kit";

export function useDeviceSessionState(
  sdk: DeviceManagementKit | undefined,
  deviceSessionId: DeviceSessionId | undefined
): DeviceSessionState | undefined {
  const [deviceSessionState, setDeviceSessionState] =
    useState<DeviceSessionState>();
  useEffect(() => {
    if (!deviceSessionId || !sdk) {
      setDeviceSessionState(undefined);
      return;
    }
    sdk
      .getDeviceSessionState({ sessionId: deviceSessionId })
      .subscribe(setDeviceSessionState);
  }, [deviceSessionId, sdk]);
  return deviceSessionState;
}

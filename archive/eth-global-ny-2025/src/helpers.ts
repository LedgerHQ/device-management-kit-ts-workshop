import { useEffect, useState } from "react";
import {
  DeviceManagementKit,
  type DeviceSessionId,
  type DeviceSessionState,
} from "@ledgerhq/device-management-kit";

export function useDeviceSessionState(
  dmk: DeviceManagementKit | undefined,
  deviceSessionId: DeviceSessionId | undefined
): DeviceSessionState | undefined {
  const [deviceSessionState, setDeviceSessionState] =
    useState<DeviceSessionState>();
  useEffect(() => {
    if (!deviceSessionId || !dmk) {
      setDeviceSessionState(undefined);
      return;
    }
    dmk
      .getDeviceSessionState({ sessionId: deviceSessionId })
      .subscribe(setDeviceSessionState);
  }, [deviceSessionId, dmk]);
  return deviceSessionState;
}

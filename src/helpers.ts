import { useEffect, useState } from 'react';
import {
  DeviceSdk,
  type DeviceSessionId,
  type DeviceSessionState,
} from '@ledgerhq/device-management-kit';

export function useDeviceSessionState(
  sdk: DeviceSdk,
  deviceSessionId: DeviceSessionId | undefined
): DeviceSessionState | undefined {
  const [deviceSessionState, setDeviceSessionState] =
    useState<DeviceSessionState>();
  useEffect(() => {
    if (!deviceSessionId) {
      setDeviceSessionState(undefined);
      return;
    }
    sdk
      .getDeviceSessionState({ sessionId: deviceSessionId })
      .subscribe(setDeviceSessionState);
  }, [deviceSessionId]);
  return deviceSessionState;
}

import {
  DeviceActionStatus,
  type DeviceActionIntermediateValue,
  type DeviceActionState,
  type ExecuteDeviceActionReturnType,
} from "@ledgerhq/device-management-kit";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Subscription } from "rxjs";

/**
 * Runs a device action (getAddress, signTransaction…) and keeps its latest state.
 *
 * A device action is an Observable of states:
 *   NotStarted → Pending (the device needs the user: unlock, open app, approve…)
 *              → Completed (with output) | Error | Stopped
 */
export function useDeviceAction<
  Output,
  Err,
  Intermediate extends DeviceActionIntermediateValue,
>() {
  const [state, setState] =
    useState<DeviceActionState<Output, Err, Intermediate>>();
  // Thrown before the action could start, e.g. a step that isn't written yet.
  const [startError, setStartError] = useState<unknown>();
  const subscription = useRef<Subscription | undefined>(undefined);

  useEffect(() => () => subscription.current?.unsubscribe(), []);

  const run = useCallback(
    (start: () => ExecuteDeviceActionReturnType<Output, Err, Intermediate>) =>
      new Promise<Output | undefined>((resolve) => {
        subscription.current?.unsubscribe();
        setState(undefined);
        setStartError(undefined);
        try {
          subscription.current = start().observable.subscribe({
            next: (s) => {
              setState(s);
              switch (s.status) {
                case DeviceActionStatus.Completed:
                  resolve(s.output);
                  break;
                case DeviceActionStatus.Error:
                case DeviceActionStatus.Stopped:
                  resolve(undefined);
                  break;
              }
            },
            error: (e) => {
              setStartError(e);
              resolve(undefined);
            },
          });
        } catch (e) {
          setStartError(e);
          resolve(undefined);
        }
      }),
    [],
  );

  const reset = useCallback(() => {
    subscription.current?.unsubscribe();
    setState(undefined);
    setStartError(undefined);
  }, []);

  const error =
    startError ??
    (state?.status === DeviceActionStatus.Error ? state.error : undefined);

  return { state, error, run, reset };
}

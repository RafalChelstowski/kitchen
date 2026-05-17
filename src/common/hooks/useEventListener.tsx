/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable consistent-return */
import { useEffect, useRef } from 'react';

export function useEventListener<T>(
  eventName: string,
  handler: (event: Event & T) => void,
  element = window
): void {
  const savedHandler = useRef<Function>(() => undefined);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;

    if (!isSupported) {
      return;
    }

    const eventListener = (event: Event) => savedHandler?.current?.(event);
    element.addEventListener(eventName, eventListener);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

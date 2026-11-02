import { useSyncExternalStore } from 'react';
import { themeRuntime } from './runtime';

const snapshot = () => themeRuntime.getState().snapshot;
export const useAppTheme = () =>
  useSyncExternalStore(themeRuntime.subscribe, snapshot);

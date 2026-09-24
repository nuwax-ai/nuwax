import { useSyncExternalStore } from 'react';
import { fullPageInstanceCacheManager } from '../runtime/fullPageInstanceCacheManager';

export const useFullPageInstanceCache = () =>
  useSyncExternalStore(
    fullPageInstanceCacheManager.subscribe,
    fullPageInstanceCacheManager.getSnapshot,
    fullPageInstanceCacheManager.getSnapshot,
  );

export type {
  FullPageInstanceEntry,
  FullPageInstanceKind,
  FullPageInstanceSnapshot,
} from '../domain/fullPageInstanceCache';
export { fullPageInstanceCacheManager } from '../runtime/fullPageInstanceCacheManager';
export type { FullPageActivateInput } from '../runtime/fullPageInstanceCacheManager';

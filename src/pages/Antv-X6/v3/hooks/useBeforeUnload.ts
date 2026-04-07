/**
 * Page leave guard hook.
 *
 * Features:
 * 1) Handle browser refresh/close (`beforeunload`)
 * 2) Handle page visibility changes (`visibilitychange`)
 * 3) Attempt synchronous save through `sendBeacon`
 */

import { Graph } from '@antv/x6';
import { useCallback, useEffect, useRef } from 'react';
import { workflowSaveService } from '../services/WorkflowSaveService';
import { workflowProxy } from '../services/workflowProxyV3';

interface UseBeforeUnloadOptions {
  /** Graph getter */
  getGraph: () => Graph | null | undefined;
  /** Save function (for async save) */
  onSave?: () => Promise<boolean>;
  /** Function used to determine whether guard is needed */
  hasUnsavedChanges?: () => boolean;
}

export function useBeforeUnload({
  getGraph,
  onSave,
  hasUnsavedChanges,
}: UseBeforeUnloadOptions) {
  const isSavingRef = useRef(false);

  // Check whether there are unsaved changes.
  const checkUnsavedChanges = useCallback(() => {
    if (hasUnsavedChanges) {
      return hasUnsavedChanges();
    }
    return (
      workflowSaveService.hasPendingChanges() ||
      workflowProxy.hasPendingChanges()
    );
  }, [hasUnsavedChanges]);

  // Perform synchronous save through sendBeacon.
  const syncSaveWithBeacon = useCallback(() => {
    const graph = getGraph();
    if (!graph) return false;

    try {
      const payload = workflowSaveService.buildPayload(graph);
      if (payload) {
        const blob = new Blob([JSON.stringify({ workflowConfig: payload })], {
          type: 'application/json',
        });
        return navigator.sendBeacon('/api/workflow/save', blob);
      }
    } catch (e) {
      console.error('[useBeforeUnload] sendBeacon failed:', e);
    }
    return false;
  }, [getGraph]);

  // Handle beforeunload (browser refresh/close).
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (checkUnsavedChanges()) {
        // Show browser native confirmation.
        e.preventDefault();
        e.returnValue = '';

        // Try synchronous save.
        syncSaveWithBeacon();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [checkUnsavedChanges, syncSaveWithBeacon]);

  // Handle visibility changes (tab switch/minimize).
  useEffect(() => {
    const handleVisibilityChange = () => {
      // When page is hidden (switch tab or minimize window)
      if (document.visibilityState === 'hidden' && checkUnsavedChanges()) {
        // Prefer async save if available.
        if (onSave && !isSavingRef.current) {
          isSavingRef.current = true;
          onSave()
            .then(() => {
              console.log('[useBeforeUnload] Save succeeded when page hidden');
            })
            .catch((err) => {
              console.error(
                '[useBeforeUnload] Save failed when page hidden:',
                err,
              );
            })
            .finally(() => {
              isSavingRef.current = false;
            });
        } else {
          // Fallback to synchronous save via sendBeacon.
          syncSaveWithBeacon();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkUnsavedChanges, syncSaveWithBeacon, onSave]);
}

export default useBeforeUnload;

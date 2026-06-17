import { useThrottledCallback } from '@/hooks/useThrottledCallback';
import { useCallback, useEffect, useRef } from 'react';
import { useModel } from 'umi';

/**
 * Custom hook for autosave updates after modifications.
 * Uses throttling to ensure the last save is always executed.
 *
 * @param run Save executor
 * @param doNext Callback after successful save
 * @param delay Throttle delay in milliseconds, default 300ms
 */
export default function useModifiedSaveUpdateV3({
  run,
  doNext,
  delay = 500,
}: {
  run: () => Promise<boolean>;
  doNext?: () => void;
  delay?: number;
}) {
  const { isModified, setUpdateLoading } = useModel('workflowV3');

  // Manage save status via refs to avoid module-level state conflicts.
  const isSavingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true); // Track mount status.
  // const saveCountRef = useRef<number>(0); // Track save count for debugging.

  // Core save executor.
  const executeSave = useCallback(async () => {
    // const currentSaveCount = ++saveCountRef.current;
    // console.log(
    // `🔄 useModifiedSaveUpdate: throttled save [run #${currentSaveCount}]`,
    // );

    // Check whether the component is still mounted.
    if (!isMountedRef.current) {
      return;
    }

    // Skip when saving is in progress (trailing throttled call will still run).
    if (isSavingRef.current) {
      // console.log('⏸️ useModifiedSaveUpdate: save in progress, skip this run');
      return;
    }

    try {
      isSavingRef.current = true;
      // console.log('✅ useModifiedSaveUpdate: start save');
      setUpdateLoading(true);

      await run();
      doNext?.();

      // console.log('🎉 useModifiedSaveUpdate: save completed successfully');
    } catch (error) {
      // console.error('❌ useModifiedSaveUpdate: save failed', error);
    } finally {
      setUpdateLoading(false);
      isSavingRef.current = false;
    }
  }, [run, doNext, setUpdateLoading]);

  // Wrap save with throttle and keep trailing execution.
  const throttledSave = useThrottledCallback(
    () => {
      // console.log('🚀 useModifiedSaveUpdate: throttled function invoked');
      return executeSave();
    },
    delay,
    {
      leading: true, // Execute the first call immediately.
      trailing: true, // Ensure the last call is executed.
    },
  );

  // Watch modification state and trigger throttled save.
  useEffect(() => {
    // console.log('📝 useModifiedSaveUpdate: isModified changed =', isModified);

    if (isModified && isMountedRef.current) {
      // console.log('⚡ useModifiedSaveUpdate: trigger throttled save');
      // Trigger save through throttled executor.
      throttledSave();
    }
  }, [isModified, throttledSave]);

  // Cleanup on unmount.
  useEffect(() => {
    isMountedRef.current = true;
    // console.log('🔗 useModifiedSaveUpdate: hook initialized');

    return () => {
      // console.log('🧹 useModifiedSaveUpdate: cleanup hook state');
      isMountedRef.current = false;
      isSavingRef.current = false;
    };
  }, []);
}

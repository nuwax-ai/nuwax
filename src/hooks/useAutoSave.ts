import { useEffect } from 'react';
import { useModel } from 'umi';

// 自定义 Hook
export default function useAutoSave({
  run,
  interval = 3000,
  doBefore = () => Promise.resolve(false),
  doNext,
}: {
  run: () => Promise<boolean>;
  interval?: number;
  doBefore?: () => Promise<boolean>;
  doNext?: () => void;
}) {
  const { isModified, setUpdateLoading } = useModel('workflow');

  useEffect(() => {
    let saveTimer = null;
    console.log('useAutoSave:isModified', isModified);
    if (isModified) {
      saveTimer = setTimeout(async () => {
        const result = (await doBefore?.()) || false;
        if (result) {
          return;
        }
        console.log('useAutoSave:run');
        setUpdateLoading(true);
        try {
          await run();
        } catch (error) {
          console.error('useAutoSave:run error', error);
        } finally {
          setUpdateLoading(false);
        }
        doNext?.();
      }, interval);
    }

    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [isModified, run, doBefore, doNext, interval]);
}

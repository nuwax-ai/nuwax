import { useEffect } from 'react';
import { useModel } from 'umi';

// 自定义 Hook
export default function useAutoSave(
  saveCallback: () => Promise<boolean>,
  interval = 3000,
  doNext: () => void,
) {
  const workflowModel = useModel('workflow');

  useEffect(() => {
    let saveTimer = null;
    if (workflowModel.isModified) {
      saveTimer = setTimeout(async () => {
        await saveCallback();
        doNext();
      }, interval);
    }

    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [workflowModel.isModified, saveCallback, interval]);
}

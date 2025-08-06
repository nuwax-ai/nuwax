import { useCallback, useEffect, useRef } from 'react';
import { useModel } from 'umi';

/**
 * 自定义Hook：处理修改后的自动保存更新
 * @param run 执行保存的函数
 * @param doBefore 保存前的预处理函数，返回true时跳过保存
 * @param doNext 保存成功后的回调函数
 */
export default function useModifiedSaveUpdate({
  run,
  doNext,
}: {
  run: () => Promise<boolean>;
  doNext?: () => void;
}) {
  const { isModified, setUpdateLoading } = useModel('workflow');

  // 使用 useRef 管理 timer 和保存状态，避免模块级变量冲突
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const pendingSaveRef = useRef<boolean>(false); // 标记是否有待保存的更新
  const isMountedRef = useRef<boolean>(true); // 追踪组件挂载状态

  // 清理 timer 的函数
  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  // 标记待保存更新的函数
  const markPendingSave = useCallback(() => {
    console.log('useModifiedSaveUpdate: 保存进行中，标记待保存更新');
    pendingSaveRef.current = true;
  }, []);

  // 执行保存的函数
  const executeSave = useCallback(async () => {
    // 检查组件是否还挂载
    if (!isMountedRef.current) {
      console.log('useModifiedSaveUpdate: 组件已卸载，取消保存');
      return;
    }

    // 如果正在保存中，标记有待保存的更新
    if (isSavingRef.current) {
      console.log('useModifiedSaveUpdate: 保存正在进行中，标记待保存');
      markPendingSave();
      return;
    }

    try {
      isSavingRef.current = true;
      pendingSaveRef.current = false; // 开始保存时清除待保存标记

      console.log('useModifiedSaveUpdate:开始保存');
      setUpdateLoading(true);

      await run();
      doNext?.();

      console.log('useModifiedSaveUpdate: 保存成功');
    } catch (error) {
      console.error('useModifiedSaveUpdate:保存失败', error);
    } finally {
      setUpdateLoading(false);
      isSavingRef.current = false;
      // 清理当前 timer 引用
      saveTimerRef.current = null;

      // 检查组件是否还挂载以及是否有待保存的更新
      if (isMountedRef.current && pendingSaveRef.current) {
        console.log('useModifiedSaveUpdate: 检测到待保存更新，立即触发新保存');
        pendingSaveRef.current = false;
        saveTimerRef.current = setTimeout(executeSave, 300);
      }
    }
  }, [run, doNext, setUpdateLoading, markPendingSave]);

  // 监听修改状态变化
  useEffect(() => {
    console.log('useModifiedSaveUpdate:isModified', isModified);
    if (isModified && isMountedRef.current) {
      // 如果正在保存中，标记有待保存的更新
      if (isSavingRef.current) {
        markPendingSave();
        return;
      }

      // 如果已经有 timer 在运行，先清除它（防抖效果）
      clearSaveTimer();

      // 设置新的 timer
      saveTimerRef.current = setTimeout(executeSave, 300);
    }
  }, [isModified, executeSave, clearSaveTimer, markPendingSave]);

  // 组件卸载时的清理
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearSaveTimer();
      isSavingRef.current = false;
      pendingSaveRef.current = false;
    };
  }, [clearSaveTimer]);
}

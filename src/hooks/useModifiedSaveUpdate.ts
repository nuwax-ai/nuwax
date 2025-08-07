import { useCallback, useEffect, useRef } from 'react';
import { useModel } from 'umi';
import { useThrottledCallback } from './useThrottledCallback';

/**
 * 自定义Hook：处理修改后的自动保存更新
 * 使用节流确保最后一次保存必须执行
 *
 * @param run 执行保存的函数
 * @param doNext 保存成功后的回调函数
 * @param delay 节流延迟时间（毫秒），默认 300ms
 */
export default function useModifiedSaveUpdate({
  run,
  doNext,
  delay = 300,
}: {
  run: () => Promise<boolean>;
  doNext?: () => void;
  delay?: number;
}) {
  const { isModified, setUpdateLoading } = useModel('workflow');

  // 使用 useRef 管理保存状态，避免模块级变量冲突
  const isSavingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true); // 追踪组件挂载状态

  // 执行保存的核心函数
  const executeSave = useCallback(async () => {
    // 检查组件是否还挂载
    if (!isMountedRef.current) {
      console.log('useModifiedSaveUpdate: 组件已卸载，取消保存');
      return;
    }

    // 如果正在保存中，跳过本次保存（节流会确保最后一次调用被执行）
    if (isSavingRef.current) {
      console.log('useModifiedSaveUpdate: 保存正在进行中，跳过本次调用');
      return;
    }

    try {
      isSavingRef.current = true;
      console.log('useModifiedSaveUpdate: 开始保存');
      setUpdateLoading(true);

      await run();
      doNext?.();

      console.log('useModifiedSaveUpdate: 保存成功');
    } catch (error) {
      console.error('useModifiedSaveUpdate: 保存失败', error);
    } finally {
      setUpdateLoading(false);
      isSavingRef.current = false;
    }
  }, [run, doNext, setUpdateLoading]);

  // 使用节流包装保存函数，确保最后一次调用必须执行
  const throttledSave = useThrottledCallback(executeSave, delay, {
    leading: true, // 立即执行第一次调用
    trailing: true, // 确保最后一次调用被执行
  });

  // 监听修改状态变化，触发节流保存
  useEffect(() => {
    console.log('useModifiedSaveUpdate: isModified', isModified);
    if (isModified && isMountedRef.current) {
      // 使用节流函数触发保存
      throttledSave();
    }
  }, [isModified, throttledSave]);

  // 组件卸载时的清理
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      isSavingRef.current = false;
    };
  }, []);
}

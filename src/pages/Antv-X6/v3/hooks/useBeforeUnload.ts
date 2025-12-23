/**
 * 页面离开保护 Hook
 *
 * 功能：
 * 1. 处理浏览器刷新/关闭（beforeunload）
 * 2. 处理页面可见性变化（visibilitychange）
 * 3. 尝试使用 sendBeacon 进行同步保存
 */

import { Graph } from '@antv/x6';
import { useCallback, useEffect, useRef } from 'react';
import { workflowSaveService } from '../services/WorkflowSaveService';
import { workflowProxy } from '../services/workflowProxyV3';

interface UseBeforeUnloadOptions {
  /** Graph 获取函数 */
  getGraph: () => Graph | null | undefined;
  /** 保存函数（用于异步保存） */
  onSave?: () => Promise<boolean>;
  /** 用于确定是否需要保护的函数 */
  hasUnsavedChanges?: () => boolean;
}

export function useBeforeUnload({
  getGraph,
  onSave,
  hasUnsavedChanges,
}: UseBeforeUnloadOptions) {
  const isSavingRef = useRef(false);

  // 检查是否有未保存的更改
  const checkUnsavedChanges = useCallback(() => {
    if (hasUnsavedChanges) {
      return hasUnsavedChanges();
    }
    return (
      workflowSaveService.hasPendingChanges() ||
      workflowProxy.hasPendingChanges()
    );
  }, [hasUnsavedChanges]);

  // 使用 sendBeacon 同步保存
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

  // 处理 beforeunload（浏览器刷新/关闭）
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (checkUnsavedChanges()) {
        // 显示确认对话框
        e.preventDefault();
        e.returnValue = '';

        // 尝试同步保存
        syncSaveWithBeacon();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [checkUnsavedChanges, syncSaveWithBeacon]);

  // 处理页面可见性变化（切换标签页/最小化窗口）
  useEffect(() => {
    const handleVisibilityChange = () => {
      // 当页面变为隐藏状态时（切换到其他标签页或最小化）
      if (document.visibilityState === 'hidden' && checkUnsavedChanges()) {
        // 使用异步保存（如果可用）
        if (onSave && !isSavingRef.current) {
          isSavingRef.current = true;
          onSave()
            .then(() => {
              console.log('[useBeforeUnload] 页面隐藏时保存成功');
            })
            .catch((err) => {
              console.error('[useBeforeUnload] 页面隐藏时保存失败:', err);
            })
            .finally(() => {
              isSavingRef.current = false;
            });
        } else {
          // 回退到 sendBeacon 同步保存
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

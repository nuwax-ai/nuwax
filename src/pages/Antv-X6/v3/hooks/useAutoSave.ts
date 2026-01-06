/**
 * 自动保存 Hook
 *
 * 监听画布变更事件，自动触发防抖保存
 */

import Constant, {
  WORKFLOW_VERSION_CONFLICT,
} from '@/constants/codes.constants';
import service from '@/services/workflow';
import { workflowLogger } from '@/utils/logger';
import { Graph } from '@antv/x6';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { workflowSaveService } from '../services/WorkflowSaveService';

interface UseAutoSaveOptions {
  /** 防抖延迟（毫秒） */
  debounceMs?: number;
  /** 保存回调 */
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: any) => void;
}

interface UseAutoSaveReturn {
  /** 手动触发保存 */
  save: () => Promise<boolean>;
  /** 是否有未保存的变更 */
  isDirty: boolean;
  /** 标记为脏数据 */
  markDirty: () => void;
}

export function useAutoSave(
  graph: Graph | null,
  options: UseAutoSaveOptions = {},
): UseAutoSaveReturn {
  const {
    debounceMs = 2000,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
  } = options;

  const isDirtyRef = useRef(false);

  // 核心保存函数
  // @param forceCommit 是否强制提交（忽略版本冲突）
  const doSave = useCallback(
    async (forceCommit = false): Promise<boolean> => {
      if (!graph) {
        workflowLogger.warn('Graph 未初始化');
        return false;
      }

      if (!workflowSaveService.hasPendingChanges()) {
        return true;
      }

      try {
        onSaveStart?.();

        const payload = workflowSaveService.buildPayload(graph);
        if (!payload) {
          workflowLogger.error('构建保存数据失败');
          return false;
        }

        // 构建保存请求参数，版本信息放入 workflowConfig
        const saveParams = {
          workflowConfig: {
            ...payload,
            editVersion: workflowSaveService.getEditVersion(),
            forceCommit: forceCommit ? (1 as const) : (0 as const),
          },
        };

        const result = await service.saveWorkflow(saveParams);

        if (result.code === Constant.success) {
          // 保存成功，更新版本号（data 直接是版本号）
          if (result.data !== null && result.data !== undefined) {
            workflowSaveService.setEditVersion(result.data);
          }
          workflowSaveService.clearDirty();
          isDirtyRef.current = false;
          onSaveSuccess?.();
          workflowLogger.log('useAutoSave 自动保存成功');
          return true;
        } else if (result.code === WORKFLOW_VERSION_CONFLICT) {
          // 自动保存遇到版本冲突时，通知用户但不自动强制提交
          workflowLogger.warn('useAutoSave 版本冲突，自动保存失败');
          onSaveError?.(new Error('版本冲突，工作流已在其他窗口修改'));
          return false;
        } else {
          workflowLogger.error('useAutoSave 保存失败:', result.message);
          onSaveError?.(new Error(result.message));
          return false;
        }
      } catch (error) {
        workflowLogger.error('useAutoSave 保存异常:', error);
        onSaveError?.(error);
        return false;
      }
    },
    [graph, onSaveStart, onSaveSuccess, onSaveError],
  );

  // 防抖保存
  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        doSave();
      }, debounceMs),
    [doSave, debounceMs],
  );

  // 标记脏数据并触发自动保存
  const markDirty = useCallback(() => {
    workflowSaveService.markDirty();
    isDirtyRef.current = true;
    debouncedSave();
  }, [debouncedSave]);

  // 监听画布事件
  useEffect(() => {
    if (!graph) return;

    // 所有需要触发保存的事件
    const events = [
      'node:added',
      'node:removed',
      'node:change:data',
      'node:moved',
      'node:resized',
      'edge:added',
      'edge:removed',
      'edge:connected',
    ];

    const handleChange = () => {
      markDirty();
    };

    // 注册事件监听
    events.forEach((event) => {
      graph.on(event, handleChange);
    });

    // 清理
    return () => {
      events.forEach((event) => {
        graph.off(event, handleChange);
      });
      debouncedSave.cancel();
    };
  }, [graph, markDirty, debouncedSave]);

  // 页面卸载前保存
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    save: doSave,
    isDirty: isDirtyRef.current,
    markDirty,
  };
}

export default useAutoSave;

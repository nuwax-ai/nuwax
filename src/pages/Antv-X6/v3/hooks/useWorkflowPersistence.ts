import Constant from '@/constants/codes.constants';
import { SaveStatusEnum } from '@/models/workflowV3';
import service from '@/services/workflow';
import { FoldFormIdEnum } from '@/types/enums/node';
import { ChildNode, GraphContainerRef } from '@/types/interfaces/graph';
import { debounce } from 'lodash';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { useModel } from 'umi';
import { workflowProxy } from '../services/workflowProxyV3';
import { workflowSaveService } from '../services/WorkflowSaveService';

interface UseWorkflowPersistenceProps {
  graphRef: MutableRefObject<GraphContainerRef | null>;
  graphInstanceRef?: MutableRefObject<any | null>; // Fallback ref for unmount
  changeUpdateTime: () => void;
  getReference: (id: number) => Promise<boolean>;
  setFoldWrapItem?: (data: ChildNode) => void;
}

export const useWorkflowPersistence = ({
  graphRef,
  graphInstanceRef,
  changeUpdateTime,
  getReference,
  setFoldWrapItem,
}: UseWorkflowPersistenceProps) => {
  const { getWorkflow, setSaveStatus, setLastSaveTime, setSaveError } =
    useModel('workflowV3');

  // V3: 全量保存工作流配置
  const saveFullWorkflow = useCallback(async (): Promise<boolean> => {
    try {
      const graph =
        graphRef.current?.getGraphRef?.() || graphInstanceRef?.current;
      if (!graph) {
        console.error('[V3] 画布未初始化');
        return false;
      }

      // 使用新保存服务从画布构建数据（单一数据源）
      let payload = workflowSaveService.buildPayload(graph);

      // 如果画布数据无效（页面离开时画布已清除），回退到使用 workflowProxy 的数据
      if (!payload) {
        console.warn('[V3] 画布数据无效，尝试使用 workflowProxy 数据');
        payload = workflowProxy.buildFullConfig();
        if (!payload) {
          console.error('[V3] 构建保存数据失败，无可用数据源');
          return false;
        }
        console.log('[V3] 使用 workflowProxy 数据保存');
      } else {
        console.log('[V3] 使用单一数据源保存, 节点数:', payload.nodes.length);
      }

      // 标记保存中状态
      setSaveStatus(SaveStatusEnum.Saving);

      const _res = await service.saveWorkflow(payload);

      if (_res.code === Constant.success) {
        workflowSaveService.clearDirty();
        workflowProxy.clearPendingUpdates();
        changeUpdateTime();
        // 更新保存状态为成功
        setSaveStatus(SaveStatusEnum.Saved);
        setLastSaveTime(new Date());
        setSaveError(null);
        console.log('[V3] 保存成功 ✓');
        return true;
      } else {
        console.error('[V3] 工作流保存失败:', _res.message);
        // 更新保存状态为失败
        setSaveStatus(SaveStatusEnum.Failed);
        setSaveError(_res.message || '保存失败');
        return false;
      }
    } catch (error) {
      console.error('[V3] 工作流保存异常:', error);
      // 更新保存状态为失败
      setSaveStatus(SaveStatusEnum.Failed);
      setSaveError(
        error instanceof Error ? error.message : '网络异常，保存失败',
      );
      return false;
    }
  }, [
    changeUpdateTime,
    graphRef,
    setSaveStatus,
    setLastSaveTime,
    setSaveError,
  ]);

  // V3: 防抖保存（自动保存用）
  const debouncedSaveFullWorkflow = useMemo(
    () =>
      debounce(async () => {
        // 使用新保存服务检查脏数据，同时兼容旧代理层
        if (
          workflowSaveService.hasPendingChanges() ||
          workflowProxy.hasPendingChanges()
        ) {
          await saveFullWorkflow();
        }
      }, 1500), // 1.5秒防抖
    [saveFullWorkflow],
  );

  // 自动保存节点配置
  const autoSaveNodeConfig = useCallback(
    async (
      updateFormConfig: ChildNode,
      setCurrentFoldWrapItem?: (data: ChildNode) => void,
    ): Promise<boolean> => {
      if (updateFormConfig.id === FoldFormIdEnum.empty) return false;

      const params = JSON.parse(JSON.stringify(updateFormConfig));
      graphRef.current?.graphUpdateNode(String(params.id), params);

      // V3: 使用代理层更新数据，不调用后端接口
      const proxyResult = workflowProxy.updateNode(params);

      if (proxyResult.success) {
        // 标记为有未保存的更改
        setSaveStatus(SaveStatusEnum.Unsaved);

        // 如果是修改节点的参数，那么就要更新当前节点的参数
        const drawerForm = getWorkflow('drawerForm');
        if (updateFormConfig.id === drawerForm?.id) {
          if (setCurrentFoldWrapItem) {
            setCurrentFoldWrapItem(params);
          } else if (setFoldWrapItem) {
            setFoldWrapItem(params);
          }
        }

        // 更新当前节点的上级参数（使用前端计算）
        if (drawerForm?.id) {
          await getReference(drawerForm.id);
        }
        changeUpdateTime();
        // V3: 触发防抖全量保存
        debouncedSaveFullWorkflow();
        return true;
      }

      console.error('[V3] 节点配置自动保存失败:', proxyResult.message);
      return false;
    },
    [
      getReference,
      changeUpdateTime,
      debouncedSaveFullWorkflow,
      getWorkflow,
      graphRef,
      setFoldWrapItem,
      setSaveStatus,
    ],
  );

  return {
    saveFullWorkflow,
    debouncedSaveFullWorkflow,
    autoSaveNodeConfig,
  };
};

import Constant from '@/constants/codes.constants';
import service, { IgetDetails, IUpdateDetails } from '@/services/workflow';
import { ChildNode, Edge } from '@/types/interfaces/graph';
import { workflowLogger } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';
import { workflowProxy } from '../services/workflowProxyV3';
import { workflowSaveService } from '../services/WorkflowSaveService';
import { getEdges } from '../utils/graphV3';

interface UseWorkflowLifecycleProps {
  workflowId: number;
  spaceId: number;
  handleInitLoading: (loading: boolean) => void;
}

export const useWorkflowLifecycle = ({
  workflowId,
  spaceId,
  handleInitLoading,
}: UseWorkflowLifecycleProps) => {
  const { setSpaceId } = useModel('workflowV3');

  // 防止 React StrictMode 双重调用
  const isInitializedRef = useRef(false);

  // 工作流左上角的详细信息
  const [info, setInfo] = useState<IgetDetails | null>(null);

  // 当前画布中的节点和边的数据
  const [graphParams, setGraphParams] = useState<{
    nodeList: ChildNode[];
    edgeList: Edge[];
  }>({ nodeList: [], edgeList: [] });

  const applyWorkflowDetails = useCallback(
    (data: IgetDetails, syncInfo: boolean) => {
      if (syncInfo) {
        setInfo(data);
        setSpaceId(data.spaceId);
      }

      const _nodeList = data.nodes || [];
      const _edgeList = getEdges(_nodeList);
      setGraphParams({ edgeList: _edgeList, nodeList: _nodeList });

      workflowProxy.initialize({
        workflowId,
        nodes: _nodeList,
        edges: _edgeList,
        systemVariables: data.systemVariables,
        modified: data.modified || new Date().toISOString(),
      });
      workflowProxy.setWorkflowInfo(data);
      workflowSaveService.initialize(data);

      if (data.editVersion !== undefined) {
        workflowSaveService.setEditVersion(data.editVersion);
        workflowLogger.log('Edit version updated:', data.editVersion);
      }
    },
    [setSpaceId, workflowId],
  );

  const getWorkflowDetails = useCallback(async () => {
    const _res = await service.getDetails(workflowId);
    return _res.code === Constant.success ? _res.data : null;
  }, [spaceId, workflowId]);

  // 刷新画布数据
  const refreshGraphData = useCallback(async () => {
    try {
      const data = await getWorkflowDetails();
      if (data) {
        applyWorkflowDetails(data, false);
      }
    } catch (error) {
      console.error('Failed to refresh graph data:', error);
    }
  }, [applyWorkflowDetails, getWorkflowDetails]);

  // 修改当前工作流的基础信息（由 CreateWorkflow 组件调用，接口已在组件内调用过）
  const onConfirm = useCallback(
    async (value: IUpdateDetails, callback?: () => void) => {
      // 直接使用传入的参数更新本地状态（接口已在 CreateWorkflow 组件中调用过）
      const _time = new Date();
      setInfo((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          modified: _time.toString(),
          // 使用传入的 value 更新 name、description、icon 等字段
          name: value.name ?? prev.name,
          description: value.description ?? prev.description,
          icon: value.icon ?? prev.icon,
        };
      });

      if (callback) callback();
    },
    [],
  );

  // 初始化加载数据
  useEffect(() => {
    const initGraphData = async () => {
      // 防止 StrictMode 双重调用
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      handleInitLoading(true);
      try {
        const data = await getWorkflowDetails();
        if (data) {
          applyWorkflowDetails(data, true);
        }
      } catch (error) {
        console.error('Failed to fetch graph data:', error);
      } finally {
        handleInitLoading(false);
      }
    };

    if (workflowId) {
      initGraphData();
    }
  }, [applyWorkflowDetails, getWorkflowDetails, handleInitLoading, workflowId]);

  return {
    info,
    setInfo,
    graphParams,
    setGraphParams,
    onConfirm,
    refreshGraphData,
  };
};

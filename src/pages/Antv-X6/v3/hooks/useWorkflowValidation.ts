/**
 * useWorkflowValidation - 工作流校验和发布相关逻辑
 *
 * 从 indexV3.tsx 提取，负责管理工作流的校验和发布功能
 */

import { useCallback, useState } from 'react';

import Constant from '@/constants/codes.constants';
import * as service from '@/services/workflow';
import { IgetDetails } from '@/services/workflow';
import { GraphContainerRef } from '@/types/interfaces/graph';
import { ErrorParams } from '@/types/interfaces/workflow';

import { workflowProxy } from '../services/workflowProxyV3';

interface UseWorkflowValidationParams {
  workflowId: number;
  info: IgetDetails | null;
  graphRef: React.RefObject<GraphContainerRef | null>;
  getWorkflow: (key: string) => any;
  setGraphParams: (val: any) => void;
  changeDrawer: (val: any) => void;
  setInfo: (val: any) => void;
  setErrorParams: React.Dispatch<React.SetStateAction<ErrorParams>>;
  errorParams: ErrorParams;
  doSubmitFormData: () => Promise<void>;
  saveFullWorkflow: () => Promise<any>;
  getDetails: () => Promise<void>;
}

interface UseWorkflowValidationReturn {
  // 状态
  isValidLoading: boolean;
  setIsValidLoading: (val: boolean) => void;
  showPublish: boolean;
  setShowPublish: (val: boolean) => void;
  // 方法
  validWorkflow: () => Promise<boolean>;
  validPublishWorkflow: () => Promise<boolean>;
  handleShowPublish: () => Promise<void>;
  handleConfirmPublishWorkflow: () => void;
}

export const useWorkflowValidation = ({
  workflowId,
  info,
  graphRef,
  getWorkflow,
  setGraphParams,
  changeDrawer,
  setInfo,
  setErrorParams,
  doSubmitFormData,
  saveFullWorkflow,
  getDetails,
}: UseWorkflowValidationParams): UseWorkflowValidationReturn => {
  // 状态
  const [isValidLoading, setIsValidLoading] = useState(false);
  const [showPublish, setShowPublish] = useState(false);

  /**
   * 校验当前工作流
   */
  const validWorkflow = useCallback(async (): Promise<boolean> => {
    // V3: 校验前先保存工作流
    if (workflowProxy.hasPendingChanges()) {
      const saveResult = await saveFullWorkflow();
      if (!saveResult) {
        console.error('[V3] 工作流保存失败，无法进行校验');
        return false;
      }
    }

    if (getWorkflow('isModified') === true) {
      await doSubmitFormData();
    }

    const _detail = await service.getDetails(workflowId);
    const _nodeList = _detail.data.nodes;
    setGraphParams((prev: any) => ({ ...prev, nodeList: _nodeList }));
    changeDrawer(_detail.data.startNode);
    graphRef.current?.graphSelectNode(String(_detail.data.startNode.id));

    const _res = await service.validWorkflow(info?.id as number);
    if (_res.code === Constant.success) {
      const _arr = _res.data.filter((item) => !item.success);
      if (_arr.length === 0) {
        return true;
      } else {
        const _errorList = _arr.map((child) => ({
          nodeId: child.nodeId,
          error: child.messages.join(','),
        }));
        setErrorParams({
          show: true,
          errorList: _errorList,
        });
        return false;
      }
    } else {
      return false;
    }
  }, [
    workflowId,
    info,
    graphRef,
    getWorkflow,
    setGraphParams,
    changeDrawer,
    setErrorParams,
    doSubmitFormData,
    saveFullWorkflow,
  ]);

  /**
   * 发布前校验工作流
   */
  const validPublishWorkflow = useCallback(async (): Promise<boolean> => {
    // V3: 发布前全量保存
    if (workflowProxy.hasPendingChanges()) {
      await saveFullWorkflow();
    }

    if (getWorkflow('isModified') === true) {
      await doSubmitFormData();
    }

    const _res = await service.validWorkflow(info?.id as number);
    if (_res.code === Constant.success) {
      const _arr = _res.data.filter((item) => !item.success);
      if (_arr.length === 0) {
        return true;
      } else {
        const _errorList = _arr.map((child) => ({
          nodeId: child.nodeId,
          error: child.messages.join(','),
        }));
        setErrorParams({
          show: true,
          errorList: _errorList,
        });
        return false;
      }
    } else {
      return false;
    }
  }, [info, getWorkflow, setErrorParams, doSubmitFormData, saveFullWorkflow]);

  /**
   * 显示发布弹窗
   */
  const handleShowPublish = useCallback(async () => {
    const timer = setTimeout(() => {
      setIsValidLoading(true);
    }, 300);
    const valid = await validPublishWorkflow();
    await getDetails();
    if (valid) {
      setShowPublish(true);
      setErrorParams((prev) => ({ ...prev, errorList: [], show: false }));
    }
    if (timer) {
      clearTimeout(timer);
    }
    setIsValidLoading(false);
  }, [validPublishWorkflow, getDetails, setErrorParams]);

  /**
   * 确认发布工作流
   */
  const handleConfirmPublishWorkflow = useCallback(() => {
    setShowPublish(false);
    const _time = new Date();
    setInfo((prev: IgetDetails | null) => {
      if (!prev) return null;
      return {
        ...prev,
        modified: _time.toString(),
        publishDate: _time.toString(),
        publishStatus: 'Published',
      };
    });
  }, [setInfo]);

  return {
    // 状态
    isValidLoading,
    setIsValidLoading,
    showPublish,
    setShowPublish,
    // 方法
    validWorkflow,
    validPublishWorkflow,
    handleShowPublish,
    handleConfirmPublishWorkflow,
  };
};

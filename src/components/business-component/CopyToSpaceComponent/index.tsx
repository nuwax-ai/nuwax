import MoveCopyComponent from '@/components/MoveCopyComponent';
import { apiCustomPageCopyProject } from '@/services/pageDev';
import { apiPublishTemplateCopy } from '@/services/publish';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import { PageCopyParams } from '@/types/interfaces/pageDev';
import { PublishTemplateCopyParams } from '@/types/interfaces/publish';
import { jumpToWorkflow } from '@/utils/router';
import { message } from 'antd';
import React, { useState } from 'react';
import { useRequest } from 'umi';

/**
 * 复制到空间组件的 Props 接口
 */
export interface CopyToSpaceComponentProps {
  /** 空间ID */
  spaceId: number;
  /** 组件类型（页面、智能体、工作流等） */
  mode: AgentComponentTypeEnum;
  /** 组件ID（根据类型不同，可能是 projectId、agentId、workflowId 等） */
  componentId: number;
  /** 组件标题 */
  title: string;
  /** 是否打开弹窗 */
  open: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 是否为模板复制（智能体、工作流模板复制使用此标识） */
  isTemplate?: boolean;
  /** 取消回调 */
  onCancel: () => void;
  /** 确认回调 */
  onConfirm?: (targetSpaceId: number) => void;
  /** 复制成功回调 */
  onSuccess?: (data: any, targetSpaceId: number) => void;
}

/**
 * 复制到空间组件
 * 统一处理页面、智能体、工作流等不同类型的复制功能
 *
 * @param props 组件属性
 * @returns 复制到空间组件
 */
const CopyToSpaceComponent: React.FC<CopyToSpaceComponentProps> = ({
  spaceId,
  mode,
  componentId,
  title,
  open,
  loading: externalLoading,
  isTemplate = false,
  onCancel,
  onConfirm,
  onSuccess,
}) => {
  // 内部加载状态
  const [internalLoading, setInternalLoading] = useState<boolean>(false);

  // 页面复制接口
  const { run: runPageCopy, loading: loadingPageCopy } = useRequest(
    apiCustomPageCopyProject,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (data: any, params: PageCopyParams[]) => {
        message.success('页面复制成功');
        setInternalLoading(false);
        // 关闭弹窗
        onCancel();

        // 调用成功回调
        if (onSuccess) {
          onSuccess(data, params[0].targetSpaceId);
        }
      },
      onError: () => {
        setInternalLoading(false);
      },
    },
  );

  // 模板复制接口（智能体、工作流等）
  const { run: runTemplateCopy, loading: loadingTemplateCopy } = useRequest(
    apiPublishTemplateCopy,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (data: number, params: PublishTemplateCopyParams[]) => {
        message.success('模板复制成功');
        setInternalLoading(false);
        // 关闭弹窗
        onCancel();
        // 目标空间ID
        const { targetSpaceId } = params[0];
        // 如果是工作流，自动跳转
        if (params[0].targetType === AgentComponentTypeEnum.Workflow) {
          jumpToWorkflow(targetSpaceId, data);
        }
        // 调用成功回调
        if (onSuccess) {
          onSuccess(data, targetSpaceId);
        }
      },
      onError: () => {
        setInternalLoading(false);
      },
    },
  );

  // 合并加载状态
  const loading =
    externalLoading ||
    internalLoading ||
    loadingPageCopy ||
    loadingTemplateCopy;

  /**
   * 处理确认复制
   * @param targetSpaceId 目标空间ID
   */
  const handleConfirm = (targetSpaceId: number) => {
    // 如果提供了外部确认回调，优先使用
    if (onConfirm) {
      onConfirm(targetSpaceId);
      return;
    }

    // 根据组件类型调用不同的接口
    setInternalLoading(true);

    if (mode === AgentComponentTypeEnum.Page) {
      // 页面复制
      const params: PageCopyParams = {
        projectId: componentId,
        targetSpaceId,
      };
      runPageCopy(params);
    } else {
      // 模板复制（智能体、工作流等）
      const params: PublishTemplateCopyParams = {
        targetType: mode,
        targetId: componentId,
        targetSpaceId,
      };
      runTemplateCopy(params);
    }
  };

  return (
    <MoveCopyComponent
      spaceId={spaceId}
      loading={loading}
      type={ApplicationMoreActionEnum.Copy_To_Space}
      mode={mode}
      open={open}
      isTemplate={isTemplate}
      title={title}
      onCancel={onCancel}
      onConfirm={handleConfirm}
    />
  );
};

export default CopyToSpaceComponent;

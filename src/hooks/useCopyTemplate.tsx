import MoveCopyComponent from '@/components/MoveCopyComponent';
import { apiPublishTemplateCopy } from '@/services/publish';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import { PublishTemplateCopyParams } from '@/types/interfaces/publish';
import { jumpToWorkflow } from '@/utils/router';
import { message } from 'antd';
import { useState } from 'react';
import { useRequest } from 'umi';

/**
 * 复制模板 Hook 返回值类型
 */
interface UseCopyTemplateReturn {
  openMove: boolean;
  loadingCopyTemplate: boolean;
  openCopyModal: () => void;
  closeCopyModal: () => void;
  renderCopyModal: (
    spaceId: number,
    targetType: AgentComponentTypeEnum,
    targetId: number,
    title: string,
  ) => JSX.Element;
  handlerConfirmCopyTemplate: (
    targetType: AgentComponentTypeEnum,
    targetId: number,
    targetSpaceId: number,
  ) => void;
}

/**
 * 复制模板 Hook
 * 用于处理工作流、智能体等模板的复制功能
 */
export const useCopyTemplate = (): UseCopyTemplateReturn => {
  // 复制弹窗状态
  const [openMove, setOpenMove] = useState<boolean>(false);

  // 智能体、工作流模板复制
  const { run: runCopyTemplate, loading: loadingCopyTemplate } = useRequest(
    apiPublishTemplateCopy,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (data: number, params: PublishTemplateCopyParams[]) => {
        message.success('模板复制成功');
        // 关闭弹窗
        setOpenMove(false);
        // 目标空间ID
        const { targetSpaceId } = params[0];
        // 跳转（如果是工作流）
        if (params[0].targetType === AgentComponentTypeEnum.Workflow) {
          jumpToWorkflow(targetSpaceId, data);
        }
      },
    },
  );

  /**
   * 处理复制模板确认
   * @param targetType 目标类型（工作流、智能体等）
   * @param targetId 目标ID
   * @param targetSpaceId 目标空间ID
   */
  const handlerConfirmCopyTemplate = (
    targetType: AgentComponentTypeEnum,
    targetId: number,
    targetSpaceId: number,
  ) => {
    runCopyTemplate({
      targetType,
      targetId,
      targetSpaceId,
    });
  };

  /**
   * 打开复制弹窗
   */
  const openCopyModal = () => {
    setOpenMove(true);
  };

  /**
   * 关闭复制弹窗
   */
  const closeCopyModal = () => {
    setOpenMove(false);
  };

  /**
   * 渲染复制弹窗组件
   * @param spaceId 空间ID
   * @param targetType 目标类型
   * @param targetId 目标ID
   * @param title 标题
   */
  const renderCopyModal = (
    spaceId: number,
    targetType: AgentComponentTypeEnum,
    targetId: number,
    title: string,
  ) => {
    return (
      <MoveCopyComponent
        spaceId={spaceId}
        loading={loadingCopyTemplate}
        type={ApplicationMoreActionEnum.Copy_To_Space}
        mode={targetType}
        open={openMove}
        isTemplate={true}
        title={title}
        onCancel={closeCopyModal}
        onConfirm={(targetSpaceId: number) =>
          handlerConfirmCopyTemplate(targetType, targetId, targetSpaceId)
        }
      />
    );
  };

  return {
    openMove,
    loadingCopyTemplate,
    openCopyModal,
    closeCopyModal,
    renderCopyModal,
    handlerConfirmCopyTemplate,
  };
};

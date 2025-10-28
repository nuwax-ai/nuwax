import ActionMenu, { ActionItem } from '@/components/base/ActionMenu';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import { apiCollectAgent, apiUnCollectAgent } from '@/services/agentDev';
import { apiPublishTemplateCopy } from '@/services/publish';
import { AgentComponentTypeEnum, AllowCopyEnum } from '@/types/enums/agent';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import { AgentDetailDto } from '@/types/interfaces/agent';
import { copyTextToClipboard } from '@/utils/clipboard';
import { jumpToAgent } from '@/utils/router';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ChatTitleActionsProps {
  /** 会话信息 */
  agentInfo?: AgentDetailDto | null | undefined;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示复制模板功能，默认为 true */
  showCopyTemplate?: boolean;
}

/**
 * Chat页面标题右侧功能按钮组件
 * 使用通用的ActionMenu组件，支持配置显示数量和更多菜单
 */
const ChatTitleActions: React.FC<ChatTitleActionsProps> = ({
  agentInfo,
  className,
  showCopyTemplate = true,
}) => {
  // 使用 UmiJS model 中的状态管理
  const [isCollected, setIsCollected] = useState<boolean>(
    agentInfo?.collect || false,
  );

  // 复制模板相关状态
  const [openMove, setOpenMove] = useState<boolean>(false);
  const [copyTemplateLoading, setCopyTemplateLoading] =
    useState<boolean>(false);

  // 切换收藏与取消收藏
  const handleToggleCollect = useCallback(() => {
    const targetId = agentInfo?.statistics?.targetId;
    if (!targetId) {
      message.error('智能体信息不完整');
      return;
    }

    if (isCollected) {
      // 取消收藏
      apiUnCollectAgent(targetId)
        .then(() => {
          message.success('已取消收藏');
          // 更新本地状态
          if (agentInfo) {
            setIsCollected(false);
          }
        })
        .catch(() => {
          message.error('取消收藏失败');
        });
    } else {
      // 添加收藏
      apiCollectAgent(targetId)
        .then(() => {
          message.success('已添加到收藏');
          // 更新本地状态
          if (agentInfo) {
            setIsCollected(true);
          }
        })
        .catch(() => {
          message.error('添加收藏失败');
        });
    }
  }, [agentInfo?.statistics?.targetId, isCollected]);

  // 分享功能
  const handleShare = async () => {
    if (agentInfo?.shareLink) {
      // 使用统一的复制工具
      await copyTextToClipboard(
        agentInfo.shareLink,
        () => {
          message.success('分享链接已复制到剪贴板');
        },
        false, // 不显示默认成功消息，使用自定义消息
      );
    } else {
      message.info('暂无分享链接');
    }
  };

  // 智能体、工作流模板复制
  const { run: runCopyTemplate } = useRequest(apiPublishTemplateCopy, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (
      data: number,
      params: {
        targetSpaceId: number;
        targetType: AgentComponentTypeEnum;
        targetId: number;
      }[],
    ) => {
      message.success('模板复制成功');
      setCopyTemplateLoading(false);
      // 关闭弹窗
      setOpenMove(false);
      // 目标空间ID
      const { targetSpaceId } = params[0];
      // 跳转
      jumpToAgent(targetSpaceId, data);
    },
    onError: () => {
      setCopyTemplateLoading(false);
    },
  });

  // 智能体、工作流模板复制
  const handlerConfirmCopyTemplate = (targetSpaceId: number) => {
    setCopyTemplateLoading(true);
    runCopyTemplate({
      targetType: AgentComponentTypeEnum.Agent,
      targetId: agentInfo?.agentId,
      targetSpaceId,
    });
  };

  // 复制模板功能
  const handleCopyTemplate = () => {
    setOpenMove(true);
  };

  // 定义所有操作项
  const actions: ActionItem[] = useMemo(
    () =>
      [
        {
          key: 'share',
          icon: 'icons-chat-share',
          title: '分享',
          onClick: handleShare,
        },
        {
          key: isCollected ? 'collected' : 'collect',
          icon: isCollected ? 'icons-chat-collected' : 'icons-chat-collect',
          title: '收藏',
          onClick: handleToggleCollect,
          className: isCollected ? styles.collected : '',
        },
        // 复制模板功能 - 根据配置和权限决定是否显示
        ...(showCopyTemplate && agentInfo?.allowCopy === AllowCopyEnum.Yes
          ? [
              {
                key: 'copy-template',
                icon: 'icons-chat-copy',
                title: '复制模板',
                onClick: handleCopyTemplate,
                className: styles['copy-template'],
              },
            ]
          : []),
      ].filter(Boolean) as ActionItem[],
    [isCollected, agentInfo, showCopyTemplate],
  );

  return (
    <div className={cx(styles['title-actions'], className)}>
      <ActionMenu
        actions={actions}
        visibleCount={actions.length} // 显示所有操作项
        showArrow={false}
        className={styles['action-menu']}
      />
      {/* 复制模板弹窗 */}
      <MoveCopyComponent
        spaceId={agentInfo?.spaceId || 0}
        loading={copyTemplateLoading}
        type={ApplicationMoreActionEnum.Copy_To_Space}
        open={openMove}
        isTemplate={true}
        title={agentInfo?.name}
        onCancel={() => setOpenMove(false)}
        onConfirm={handlerConfirmCopyTemplate}
      />
    </div>
  );
};

export default ChatTitleActions;

import ActionMenu, { ActionItem } from '@/components/base/ActionMenu';
import { apiCollectAgent, apiUnCollectAgent } from '@/services/agentDev';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { OpenCloseEnum } from '@/types/enums/space';
import { AgentDetailDto } from '@/types/interfaces/agent';
import { copyTextToClipboard } from '@/utils/clipboard';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ChatTitleActionsProps {
  /** 会话信息 */
  agentInfo?: AgentDetailDto | null | undefined;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * Chat页面标题右侧功能按钮组件
 * 使用通用的ActionMenu组件，支持配置显示数量和更多菜单
 */
const ChatTitleActions: React.FC<ChatTitleActionsProps> = ({
  agentInfo,
  className,
}) => {
  // 使用 UmiJS model 中的历史会话和定时任务状态管理
  const { openHistoryConversation, openTimedTask } =
    useModel('conversationInfo');
  const [isCollected, setIsCollected] = useState<boolean>(
    agentInfo?.collect || false,
  );

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

  // 定时任务功能 - 直接调用 model 中的方法
  const handleAddTimedTask = () => {
    openTimedTask(CreateUpdateModeEnum.Create);
  };

  // 历史会话功能 - 直接调用 model 中的方法
  const handleHistoryConversation = () => {
    openHistoryConversation();
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
        // 定时任务功能 - 根据配置决定是否显示
        ...(agentInfo?.openScheduledTask === OpenCloseEnum.Open
          ? [
              {
                key: 'timed-task',
                icon: 'icons-chat-clock',
                title: '添加定时任务',
                onClick: handleAddTimedTask,
                className: styles['timed-task'],
              },
            ]
          : []),
        {
          key: 'history-conversation',
          icon: 'icons-chat-history',
          title: '历史会话',
          onClick: handleHistoryConversation,
          className: styles['history-conversation'],
        },
      ].filter(Boolean) as ActionItem[],
    [isCollected, agentInfo, openHistoryConversation, openTimedTask],
  );

  return (
    <div className={cx(styles['title-actions'], className)}>
      <ActionMenu
        actions={actions}
        visibleCount={2} // 只显示前2项：分享和收藏
        moreText="更多"
        moreIcon="icons-chat-info"
        showArrow={false}
        className={styles['action-menu']}
      />
    </div>
  );
};

export default ChatTitleActions;

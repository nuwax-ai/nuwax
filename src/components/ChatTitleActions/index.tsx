import ActionMenu, { ActionItem } from '@/components/base/ActionMenu';
import { apiCollectAgent, apiUnCollectAgent } from '@/services/agentDev';
import { AgentDetailDto } from '@/types/interfaces/agent';
import { copyTextToClipboard } from '@/utils/clipboard';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
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
  // 使用 UmiJS model 中的历史会话状态管理
  const { openHistoryConversation } = useModel('conversationInfo');

  // 切换收藏与取消收藏
  const handleToggleCollect = () => {
    if (!agentInfo?.statistics?.targetId) {
      message.error('智能体信息不完整');
      return;
    }

    if (agentInfo.collect) {
      // 取消收藏
      apiUnCollectAgent(agentInfo.statistics.targetId)
        .then(() => {
          message.success('已取消收藏');
          // 更新本地状态
          if (agentInfo) {
            agentInfo.collect = false;
          }
        })
        .catch(() => {
          message.error('取消收藏失败');
        });
    } else {
      // 添加收藏
      apiCollectAgent(agentInfo.statistics.targetId)
        .then(() => {
          message.success('已添加到收藏');
          // 更新本地状态
          if (agentInfo) {
            agentInfo.collect = true;
          }
        })
        .catch(() => {
          message.error('添加收藏失败');
        });
    }
  };

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

  // 定时任务功能
  const handleTimedTask = () => {
    message.info('定时任务功能开发中...');
  };

  // 历史会话功能 - 直接调用 model 中的方法
  const handleHistoryConversation = () => {
    openHistoryConversation();
  };

  // 定义所有操作项
  const actions: ActionItem[] = useMemo(
    () => [
      {
        key: 'share',
        icon: 'icons-chat-share',
        title: '分享',
        onClick: handleShare,
      },
      {
        key: agentInfo?.collect ? 'collected' : 'collect',
        icon: agentInfo?.collect
          ? 'icons-chat-collected'
          : 'icons-chat-collect',
        title: '收藏',
        onClick: handleToggleCollect,
        className: agentInfo?.collect ? styles.collected : '',
      },
      {
        key: 'timed-task',
        icon: 'icons-chat-clock',
        title: '定时任务',
        onClick: handleTimedTask,
        className: styles['timed-task'],
      },
      {
        key: 'history-conversation',
        icon: 'icons-chat-history',
        title: '历史会话',
        onClick: handleHistoryConversation,
        className: styles['history-conversation'],
      },
    ],
    [agentInfo, openHistoryConversation],
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

import SvgIcon from '@/components/base/SvgIcon';
import { apiCollectAgent, apiUnCollectAgent } from '@/services/agentDev';
import { copyTextToClipboard } from '@/utils/clipboard';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ChatTitleActionsProps {
  /** 会话信息 */
  agentInfo?: {
    shareLink?: string;
    agentId?: number;
    collect?: boolean;
  };
  /** 自定义样式类名 */
  className?: string;
}

/**
 * Chat页面标题右侧功能按钮组件
 * 包含分享、收藏、定时任务、历史会话四个功能
 */
const ChatTitleActions: React.FC<ChatTitleActionsProps> = ({
  agentInfo,
  className,
}) => {
  // 切换收藏与取消收藏
  const handleToggleCollect = () => {
    if (!agentInfo?.agentId) {
      message.error('智能体信息不完整');
      return;
    }

    if (agentInfo.collect) {
      // 取消收藏
      apiUnCollectAgent(agentInfo.agentId)
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
      apiCollectAgent(agentInfo.agentId)
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

  // 历史会话功能
  const handleHistoryConversation = () => {
    message.info('历史会话功能开发中...');
  };

  return (
    <div className={cx(styles['title-actions'], className)}>
      {/* 分享按钮 */}
      <div
        className={cx(styles['action-item'])}
        onClick={handleShare}
        onKeyDown={(e) => e.key === 'Enter' && handleShare()}
        tabIndex={0}
        role="button"
        aria-label="分享会话链接"
      >
        <SvgIcon name="icons-chat-share" className={styles['action-icon']} />
        <span className={styles['action-text']}>分享</span>
      </div>

      {/* 收藏按钮 */}
      <div
        className={cx(styles['action-item'])}
        onClick={handleToggleCollect}
        onKeyDown={(e) => e.key === 'Enter' && handleToggleCollect()}
        tabIndex={0}
        role="button"
        aria-label={agentInfo?.collect ? '取消收藏' : '添加到收藏'}
      >
        {agentInfo?.collect ? (
          <SvgIcon
            name="icons-chat-collected"
            className={cx(styles['action-icon'], styles['collected'])}
          />
        ) : (
          <SvgIcon
            name="icons-chat-collect"
            className={styles['action-icon']}
          />
        )}
        <span className={styles['action-text']}>收藏</span>
      </div>

      {/* 定时任务按钮 */}
      <div
        className={cx(styles['action-item'], styles['timed-task'])}
        onClick={handleTimedTask}
        onKeyDown={(e) => e.key === 'Enter' && handleTimedTask()}
        tabIndex={0}
        role="button"
        aria-label="设置定时任务"
      >
        <SvgIcon name="icons-chat-clock" className={styles['action-icon']} />
        <span className={styles['action-text']}>定时任务</span>
      </div>

      {/* 历史会话按钮 */}
      <div
        className={cx(styles['action-item'], styles['history-conversation'])}
        onClick={handleHistoryConversation}
        onKeyDown={(e) => e.key === 'Enter' && handleHistoryConversation()}
        tabIndex={0}
        role="button"
        aria-label="查看历史会话"
      >
        <SvgIcon name="icons-chat-history" className={styles['action-icon']} />
        <span className={styles['action-text']}>历史会话</span>
      </div>
    </div>
  );
};

export default ChatTitleActions;

import { UnifiedChatSession } from '@/components/business-component';
import { AgentConfigInfo } from '@/types/interfaces/agent';

import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * Props 类型定义
 */
export interface AgentConversationChatPanelProps {
  /** 当前智能体 ID */
  agentId?: number;
  /** 智能体完整配置信息（包含名称、图标、类型、开发会话 ID 等） */
  agentConfigInfo?: AgentConfigInfo;
  /** 自定义容器类名 */
  className?: string;
  /** 设置智能体配置信息的方法（新建会话时用于同步 devConversationId） */
  onAgentConfigInfo?: (info: AgentConfigInfo) => void;
  /** 沙箱电脑 ID 变更回调（通知父组件更新终端连接地址） */
  onChangeSelectedComputerId?: (id: string) => void;
  /** 打开编辑智能体基础信息弹窗 */
  onEditAgent?: () => void;
  /** 文件树侧边栏是否可见（由父组件 ConversationAgent 管理） */
  isFileTreeSidebarVisible?: boolean;
  /** 切换文件树侧边栏显隐 */
  onToggleFileTreeSidebar?: () => void;
  /**
   * 是否隐藏顶部 Header（嵌入编排面板「调试」Tab 时使用）
   * @default false
   */
  hideHeader?: boolean;
}

const AgentConversationChatPanel: React.FC<
  AgentConversationChatPanelProps
> = ({}) => {
  // ==================== 主渲染 ====================
  return (
    <div className={cx(styles.container, 'flex', 'h-full')}>
      {/* 主内容区域：消息列表 + 状态栏 + 输入框 */}
      <div
        className={cx(
          styles['main-content'],
          'flex-1',
          'flex',
          'flex-col',
          'overflow-hide',
        )}
      >
        <UnifiedChatSession />
      </div>
    </div>
  );
};

export default AgentConversationChatPanel;

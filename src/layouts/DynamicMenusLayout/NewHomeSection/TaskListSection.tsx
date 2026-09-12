/**
 * 任务列表渲染块（单栏/经典两形态共用）：空态 + 会话行 + 加载指示。
 * 纯表现组件——数据与选中策略经 props 注入，选中判定走 sidebarSelectionPolicy。
 */
import { Spin } from 'antd';
import classNames from 'classnames';
import React from 'react';

import { ConversationInfo } from '@/types/interfaces/conversationInfo';

import { isTaskConversationActive } from '../sidebarSelectionPolicy';
import ConversationItem from './components/ConversationItem';
import EmptyState from './components/EmptyState';
import styles from './index.less';

const cx = classNames.bind(styles);

interface TaskListSectionProps {
  /** 单栏紧凑行（经典形态不传） */
  compact?: boolean;
  list: ConversationInfo[];
  loading: boolean;
  keyword: string;
  chatId: string | undefined;
  /** 当前会话命中项目子会话 id：任务列表与项目分组选中互斥 */
  activeProjectChildId: string | null;
  onConversationClick: (item: ConversationInfo) => void;
  onFlagChanged: (
    conversationId: number,
    kind: 'pinned' | 'archived',
    enabled: boolean,
  ) => void;
}

const TaskListSection: React.FC<TaskListSectionProps> = ({
  compact = false,
  list,
  loading,
  keyword,
  chatId,
  activeProjectChildId,
  onConversationClick,
  onFlagChanged,
}) => (
  <>
    {!loading && list.length === 0 && <EmptyState keyword={keyword} />}

    <div className={cx(styles['conversation-list'])}>
      {list.map((item) => (
        <ConversationItem
          key={item.id}
          compact={compact}
          item={item}
          isActive={isTaskConversationActive(
            chatId,
            item.id,
            activeProjectChildId,
          )}
          onClick={() => onConversationClick(item)}
          pinned={item.pinned === true}
          archived={item.archived === true}
          onFlagChanged={(kind, enabled) =>
            onFlagChanged(item.id, kind, enabled)
          }
        />
      ))}

      {loading && (
        <div className={cx(styles['load-more'])}>
          <Spin size="small" />
        </div>
      )}
    </div>
  </>
);

export default TaskListSection;

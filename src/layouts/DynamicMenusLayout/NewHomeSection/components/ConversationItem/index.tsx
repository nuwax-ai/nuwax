import ConversationContextMenu from '@/components/business-component/ConversationContextMenu';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiAgentConversationArchive,
  apiAgentConversationPin,
} from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import {
  InboxOutlined,
  PushpinFilled,
  PushpinOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { formatRelativeTime } from '../../utils';
import ConversationStatusMark from '../ConversationStatusMark';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ConversationItemProps {
  compact?: boolean;
  item: ConversationInfo;
  isActive: boolean;
  onClick: () => void;
  /** 服务端置顶状态，影响列表排序与本项图标 */
  pinned?: boolean;
  /** 服务端归档状态（已归档视图内展示，供菜单「取消归档」） */
  archived?: boolean;
  /** 服务端收藏状态（菜单「收藏/取消收藏」按此选择接口路径与文案） */
  collected?: boolean;
  /**
   * 行首状态标记（单栏 style3 启用）：执行中转圈替换「执行中」文字胶囊，
   * 结束未读亮蓝点。经典布局不传维持现状（2026-09-17 定调：style1/2 待定）。
   */
  leadingMark?: boolean;
  /** 会话结束未读 id 快照（leadingMark 开启时消费） */
  unreadConversationIds?: ReadonlySet<string>;
  onFlagChanged?: (kind: 'pinned' | 'archived', enabled: boolean) => void;
  onCollectedChanged?: (collected: boolean) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  item,
  compact = false,
  isActive,
  onClick,
  pinned = false,
  archived = false,
  collected = false,
  leadingMark = false,
  unreadConversationIds,
  onFlagChanged,
  onCollectedChanged,
}) => {
  const executingText = dict(
    'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
  );

  // 归档行内二次确认（2026-09-19 定调，参考原型）：hover 归档图标→红色「确认」
  // 二次点击执行；⋯菜单「归档」经 onArchive 汇入同一状态，入口确认口径统一
  const [archiveArming, setArchiveArming] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const handleArchiveConfirm = async () => {
    if (archiving) return;
    setArchiving(true);
    try {
      const res = await apiAgentConversationArchive(item.id, true).catch(
        () => null,
      );
      if (res?.code === SUCCESS_CODE) {
        onFlagChanged?.('archived', true);
        message.success(
          dict('PC.Components.ConversationContextMenu.archivedToast'),
        );
        setArchiveArming(false);
      } else {
        message.error(dict('PC.Common.Global.operationFailed'));
      }
    } finally {
      setArchiving(false);
    }
  };

  // 行首置顶/取消置顶（2026-09-20 定调）：未置顶 hover 展开空心图钉、已置顶
  // 常显实心图钉可点击取消；接口与 ⋯菜单同源，成功后同步调用方列表
  const [pinning, setPinning] = useState(false);
  const handleTogglePinned = async () => {
    if (pinning) return;
    setPinning(true);
    try {
      const next = !pinned;
      const res = await apiAgentConversationPin(item.id, next).catch(
        () => null,
      );
      if (res?.code === SUCCESS_CODE) {
        onFlagChanged?.('pinned', next);
        message.success(
          dict(
            next
              ? 'PC.Components.ConversationContextMenu.pinnedToast'
              : 'PC.Components.ConversationContextMenu.unpinnedToast',
          ),
        );
      } else {
        message.error(dict('PC.Common.Global.operationFailed'));
      }
    } finally {
      setPinning(false);
    }
  };
  // 智能体名副标题已全网撤收（2026-09-19 定调：经典布局任务列表项只展示会话
  // 标题；单栏 compact 此前即不展示），时间统一内联在标题行尾

  return (
    <ConversationContextMenu
      conversationId={item.id}
      currentTopic={
        item.topic || item.agent?.name || dict('PC.Constants.Menus.newChat')
      }
      pinned={pinned}
      archived={archived}
      collected={collected}
      onFlagChanged={onFlagChanged}
      onCollectedChanged={onCollectedChanged}
      onArchive={archived ? undefined : () => setArchiveArming(true)}
      showMoreButton
    >
      {(moreButton) => (
        <div
          className={cx(styles['conversation-item'], {
            [styles['active']]: isActive,
            [styles.compact]: compact,
            // 确认态常显：鼠标移出行后红色「确认」不随 hover 消失
            [styles['archive-arming']]: archiveArming,
          })}
          onClick={onClick}
          role="button"
          tabIndex={0}
          aria-current={isActive ? 'page' : undefined}
          onKeyDown={(event) => {
            if (archiveArming && event.key === 'Escape') {
              event.stopPropagation();
              setArchiveArming(false);
              return;
            }
            if (event.target !== event.currentTarget) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onClick();
            }
          }}
        >
          <div className={cx(styles['conversation-item-content'])}>
            <div className={cx(styles['conversation-topic-row'])}>
              {leadingMark && (
                <ConversationStatusMark
                  taskStatus={item.taskStatus}
                  unread={unreadConversationIds?.has(String(item.id))}
                />
              )}
              {/* 行首置顶位（2026-09-20 定调）：已置顶=常显实心图钉（点击取消）、
                  未置顶=hover 展开空心图钉（点击置顶） */}
              <button
                type="button"
                className={cx(styles['pin-toggle'], {
                  [styles['pin-toggle-pinned']]: pinned,
                })}
                aria-label={dict(
                  pinned
                    ? 'PC.Components.ConversationContextMenu.unpin'
                    : 'PC.Components.ConversationContextMenu.pin',
                )}
                title={dict(
                  pinned
                    ? 'PC.Components.ConversationContextMenu.unpin'
                    : 'PC.Components.ConversationContextMenu.pin',
                )}
                disabled={pinning}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleTogglePinned();
                }}
              >
                {pinned ? <PushpinFilled /> : <PushpinOutlined />}
              </button>
              {/* 原生省略号替代 Typography.Text ellipsis：antd 的省略检测会在
                每次重渲染插入 <em> 强制同步重排，长列表高频刷新下造成秒级卡顿 */}
              <span className={cx(styles['conversation-topic'])}>
                {item.topic ||
                  item.agent?.name ||
                  dict('PC.Constants.Menus.newChat')}
              </span>
              {/* leadingMark 开启时「执行中」由行首转圈表达（文字胶囊仅经典布局保留） */}
              {!leadingMark && item.taskStatus === TaskStatus.EXECUTING && (
                <span className={cx(styles['status-tag'])}>
                  {executingText}
                </span>
              )}
              {/* 归档行内二次确认：hover 显示归档图标（时间让位），点击换红色
                  「确认」再点执行；位置与 ⋯ 并排贴行右缘 */}
              <span className={cx(styles['archive-action'])}>
                {archiveArming ? (
                  <button
                    type="button"
                    className={cx(styles['archive-confirm'])}
                    disabled={archiving}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleArchiveConfirm();
                    }}
                  >
                    {dict('PC.Common.Global.confirm')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={cx(styles['archive-trigger'])}
                    aria-label={dict(
                      'PC.Components.ConversationContextMenu.archive',
                    )}
                    title={dict(
                      'PC.Components.ConversationContextMenu.archive',
                    )}
                    onClick={(event) => {
                      event.stopPropagation();
                      setArchiveArming(true);
                    }}
                  >
                    <InboxOutlined />
                  </button>
                )}
              </span>
              {moreButton}
              <span className={cx(styles['conversation-date'])}>
                {formatRelativeTime(item.modified)}
              </span>
            </div>
          </div>
        </div>
      )}
    </ConversationContextMenu>
  );
};

export default ConversationItem;

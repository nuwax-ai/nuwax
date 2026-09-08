import {
  apiAgentConversationDelete,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import {
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  MoreOutlined,
  PushpinOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { Dropdown, Input, message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import {
  clearConversationFlags,
  toggleConversationFlag,
} from './conversationLocalFlags';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ConversationContextMenuProps {
  /** 右键触发区（会话列表项）；传函数时可拿到「⋯」按钮自行布局（触屏/移动端兜底入口） */
  children:
    | React.ReactElement
    | ((moreButton: React.ReactNode) => React.ReactElement);
  conversationId: number;
  currentTopic?: string;
  /** 置顶状态（过渡方案：本地 localStorage 标记，后端字段就绪后迁移） */
  pinned?: boolean;
  /** 归档状态（同上） */
  archived?: boolean;
  /** 收藏状态（同上） */
  collected?: boolean;
  /** 自定义重命名入口（缺省时组件内置 Modal + API + 全局事件） */
  onRename?: () => void;
  /** 自定义删除入口（缺省时组件内置确认框 + API + 全局事件） */
  onDelete?: () => void;
  /** 内置删除成功后的回调（如列表本地移除） */
  onDeleted?: () => void;
  /** 内置重命名成功后的回调 */
  onRenamed?: (topic: string) => void;
  /** 渲染「⋯」按钮（触屏/移动端右键不可用时的兜底入口） */
  showMoreButton?: boolean;
}

/**
 * 会话列表右键菜单（飞书式）：置顶 / 归档 / 收藏 / 重命名 / 删除。
 * - 置顶/归档/收藏为过渡方案：本地 localStorage 标记（conversationLocalFlags），
 *   变更后派发 conversation-flags-changed 供列表重排/过滤；后端会话级字段
 *   （M2 契约）就绪后迁移到服务端。
 * - 重命名与删除接现有接口（apiAgentConversationUpdate / Delete），成功后派发
 *   conversation-updated / conversation-deleted 全局事件供侧栏列表同步。
 */
const ConversationContextMenu: React.FC<ConversationContextMenuProps> = ({
  children,
  conversationId,
  currentTopic = '',
  pinned = false,
  archived = false,
  collected = false,
  onRename,
  onDelete,
  onDeleted,
  onRenamed,
  showMoreButton = false,
}) => {
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTopic, setRenameTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 内置删除：确认框 + API + 全局事件（供侧栏列表同步刷新）
  const handleDelete = () => {
    Modal.confirm({
      title: t('PC.Common.Global.deleteConfirmTitle'),
      content: t('PC.Common.Global.deleteConfirmContent'),
      okButtonProps: { danger: true },
      okText: t('PC.Common.Global.delete'),
      cancelText: t('PC.Common.Global.cancel'),
      onOk: async () => {
        const res = await apiAgentConversationDelete(conversationId);
        if (res?.success) {
          clearConversationFlags(conversationId);
          window.dispatchEvent(
            new CustomEvent('conversation-deleted', {
              detail: { id: conversationId },
            }),
          );
          onDeleted?.();
        }
      },
    });
  };

  // 本地标记 toggle：toast 反馈，列表经 conversation-flags-changed 事件重排/过滤
  const handleToggleFlag = (
    kind: 'pinned' | 'archived' | 'collected',
  ): void => {
    const next = toggleConversationFlag(conversationId, kind);
    const toastKeyMap = {
      pinned: next
        ? 'PC.Components.ConversationContextMenu.pinnedToast'
        : 'PC.Components.ConversationContextMenu.unpinnedToast',
      archived: next
        ? 'PC.Components.ConversationContextMenu.archivedToast'
        : 'PC.Components.ConversationContextMenu.unarchivedToast',
      collected: next
        ? 'PC.Components.ConversationContextMenu.collectedToast'
        : 'PC.Components.ConversationContextMenu.uncollectedToast',
    } as const;
    message.success(t(toastKeyMap[kind]));
  };

  const menuProps = useMemo(
    () => ({
      items: [
        {
          key: 'pin',
          icon: <PushpinOutlined />,
          label: pinned
            ? t('PC.Components.ConversationContextMenu.unpin')
            : t('PC.Components.ConversationContextMenu.pin'),
        },
        {
          key: 'archive',
          icon: <InboxOutlined />,
          label: archived
            ? t('PC.Components.ConversationContextMenu.unarchive')
            : t('PC.Components.ConversationContextMenu.archive'),
        },
        {
          key: 'favorite',
          icon: collected ? <StarFilled /> : <StarOutlined />,
          label: collected
            ? t('PC.Components.ConversationContextMenu.unfavorite')
            : t('PC.Components.ConversationContextMenu.favorite'),
        },
        { type: 'divider' as const },
        {
          key: 'rename',
          icon: <EditOutlined />,
          label: t('PC.Components.ConversationContextMenu.rename'),
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          danger: true,
          label: t('PC.Common.Global.delete'),
        },
      ],
      onClick: ({ key }: { key: string }) => {
        if (key === 'pin') {
          handleToggleFlag('pinned');
        } else if (key === 'archive') {
          handleToggleFlag('archived');
        } else if (key === 'favorite') {
          handleToggleFlag('collected');
        } else if (key === 'rename') {
          if (onRename) {
            onRename();
          } else {
            setRenameTopic(currentTopic);
            setRenameOpen(true);
          }
        } else if (key === 'delete') {
          if (onDelete) {
            onDelete();
          } else {
            handleDelete();
          }
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinned, archived, collected, currentTopic, onRename, onDelete],
  );

  const handleRenameSubmit = async () => {
    const trimmed = renameTopic.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await apiAgentConversationUpdate({
        id: conversationId,
        topic: trimmed,
      });
      if (res?.success) {
        window.dispatchEvent(
          new CustomEvent('conversation-updated', {
            detail: { id: conversationId, topic: trimmed },
          }),
        );
        onRenamed?.(trimmed);
        setRenameOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const moreButton = showMoreButton ? (
    <Dropdown menu={menuProps} trigger={['click']}>
      <span className={cx('more-btn')} onClick={(e) => e.stopPropagation()}>
        <MoreOutlined />
      </span>
    </Dropdown>
  ) : null;

  const triggerNode =
    typeof children === 'function' ? children(moreButton) : children;

  return (
    <>
      <Dropdown menu={menuProps} trigger={['contextMenu']}>
        {triggerNode}
      </Dropdown>
      <Modal
        title={t('PC.Components.HistoryConversationList.renameModalTitle')}
        open={renameOpen}
        onOk={handleRenameSubmit}
        onCancel={() => setRenameOpen(false)}
        confirmLoading={submitting}
        okButtonProps={{ disabled: !renameTopic.trim() }}
        okText={t('PC.Common.Global.confirm')}
        cancelText={t('PC.Common.Global.cancel')}
        destroyOnHidden
      >
        <Input
          value={renameTopic}
          onChange={(e) => setRenameTopic(e.target.value)}
          onPressEnter={handleRenameSubmit}
          maxLength={50}
        />
      </Modal>
    </>
  );
};

export default ConversationContextMenu;

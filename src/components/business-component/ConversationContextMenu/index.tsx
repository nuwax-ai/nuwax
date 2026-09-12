import SvgIcon from '@/components/base/SvgIcon';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiAgentConversationArchive,
  apiAgentConversationDelete,
  apiAgentConversationPin,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import { toggleFavoriteConversation } from '@/utils/conversationFavorites';
import {
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  PushpinOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { Dropdown, Input, message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ConversationContextMenuProps {
  /** 右键触发区（会话列表项）；传函数时可拿到「⋯」按钮自行布局（触屏/移动端兜底入口） */
  children:
    | React.ReactElement
    | ((moreButton: React.ReactNode) => React.ReactElement);
  conversationId: number;
  currentTopic?: string;
  /** 服务端置顶状态 */
  pinned?: boolean;
  /** 服务端归档状态 */
  archived?: boolean;
  /** 收藏状态（本地存储，后端收藏接口未上线） */
  collected?: boolean;
  /** 服务端置顶/归档成功后同步调用方列表 */
  onFlagChanged?: (kind: 'pinned' | 'archived', enabled: boolean) => void;
  /** 收藏切换成功后同步调用方列表 */
  onCollectedChanged?: (collected: boolean) => void;
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
 * 会话列表右键菜单：置顶 / 归档 / 收藏 / 重命名 / 删除。
 * - 置顶/归档调用会话级后端接口，成功后同步调用方列表；
 * - 收藏接口未 ready，暂走本地存储（utils/conversationFavorites），
 *   历史会话页「已收藏」视图按本地收藏 id 过滤；
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
  onFlagChanged,
  onCollectedChanged,
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

  // 服务端标记 toggle：成功后才更新调用方列表，失败不做乐观变更
  const handleToggleFlag = async (
    kind: 'pinned' | 'archived',
  ): Promise<void> => {
    const next = kind === 'pinned' ? !pinned : !archived;
    const res = await (kind === 'pinned'
      ? apiAgentConversationPin(conversationId, next)
      : apiAgentConversationArchive(conversationId, next)
    ).catch(() => null);
    if (res?.code !== SUCCESS_CODE) {
      message.error(t('PC.Common.Global.operationFailed'));
      return;
    }
    onFlagChanged?.(kind, next);
    const toastKeyMap = {
      pinned: next
        ? 'PC.Components.ConversationContextMenu.pinnedToast'
        : 'PC.Components.ConversationContextMenu.unpinnedToast',
      archived: next
        ? 'PC.Components.ConversationContextMenu.archivedToast'
        : 'PC.Components.ConversationContextMenu.unarchivedToast',
    } as const;
    message.success(t(toastKeyMap[kind]));
  };

  // 收藏 toggle：后端接口未上线，本地存储直接生效（乐观更新）
  const handleToggleCollect = () => {
    const next = toggleFavoriteConversation(conversationId);
    onCollectedChanged?.(next);
    message.success(
      t(
        next
          ? 'PC.Components.ConversationContextMenu.collectedToast'
          : 'PC.Components.ConversationContextMenu.uncollectedToast',
      ),
    );
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
          key: 'collect',
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
          void handleToggleFlag('pinned');
        } else if (key === 'archive') {
          void handleToggleFlag('archived');
        } else if (key === 'collect') {
          handleToggleCollect();
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
    [
      pinned,
      archived,
      collected,
      currentTopic,
      onRename,
      onDelete,
      onFlagChanged,
      onCollectedChanged,
    ],
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
        {/* 与项目面板行图标族统一（icons-common-more，2026-09-12 需求）；
            SvgIcon 内联字号优先于 CSS，须显式 15px 与项目子行 ⋯ 同款 */}
        <SvgIcon name="icons-common-more" style={{ fontSize: 15 }} />
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

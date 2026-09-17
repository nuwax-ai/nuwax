/**
 * 会话页面缓存遥测的独立 debug 悬浮按钮（2026-09-17 从 ConversationDebugFab
 * 拆出）：点击弹出「Runtime telemetry / Conversation page cache」面板，
 * 含 LRU 实例列表与「执行中的页面实例」分区。按钮位于会话调试按钮左侧。
 *
 * TODO(正式上线前移除): 本调试入口连同 ConversationCacheDebugPanel / ConversationDebugFab
 * 属于开发期调试面板——打包部署测试环境须保留可见（2026-09-17 用户定调，
 * 提测走 build:prod:m，不能按 NODE_ENV 裁剪），正式上线前统一删除，
 * 删除入口时同步清理 i18n 词条 conversationCacheDebugEntry。
 */
import { t } from '@/services/i18nRuntime';
import { DatabaseOutlined } from '@ant-design/icons';
import { Popover, Tooltip, theme } from 'antd';
import React, { useMemo, useState } from 'react';
import ConversationCacheDebugPanel from './ConversationCacheDebugPanel';

const ConversationCacheDebugFab: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { token } = theme.useToken();

  const content = useMemo(() => <ConversationCacheDebugPanel />, []);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      trigger="click"
      content={content}
    >
      <Tooltip
        title={t('PC.Components.ChatInputHome.conversationCacheDebugEntry')}
        open={open ? false : undefined}
      >
        <button
          type="button"
          data-testid="conversation-cache-entry"
          aria-label={t(
            'PC.Components.ChatInputHome.conversationCacheDebugEntry',
          )}
          style={{
            position: 'absolute',
            top: 8,
            right: 38,
            zIndex: 11,
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: '1px solid rgba(0, 0, 0, 10%)',
            background: 'rgba(255, 255, 255, 85%)',
            color: token.colorTextTertiary,
            fontSize: 12,
            opacity: 0.65,
            cursor: 'pointer',
          }}
        >
          <DatabaseOutlined />
        </button>
      </Tooltip>
    </Popover>
  );
};

export default ConversationCacheDebugFab;

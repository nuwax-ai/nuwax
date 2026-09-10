/**
 * 会话框右上角的 debug 悬浮按钮：收纳「会话密度」（三档折叠密度）与
 * 「会话显示」（渲染版本 / V2 预设 / 逐类覆盖）两个调试入口，
 * 不再占用输入区工具栏位。复用 ChatInputHome 的样式模块（无本地 less）。
 */
import styles from '@/components/ChatInputHome/index.less';
import { useConversationDensity } from '@/hooks/useConversationDensity';
import { t } from '@/services/i18nRuntime';
import type { ConversationDensity } from '@/utils/conversationDensity';
import { BugOutlined, CheckOutlined } from '@ant-design/icons';
import { Popover, Tooltip, theme } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import ConversationDisplaySettings from './ConversationDisplaySettings';

const cx = classNames.bind(styles);

// 会话密度三档（P1-6）：compact/normal/detailed 控制过程内容折叠密度
const DENSITY_OPTIONS: ConversationDensity[] = [
  'compact',
  'normal',
  'detailed',
];

const DENSITY_I18N: Record<
  ConversationDensity,
  { label: string; desc: string }
> = {
  compact: {
    label: 'PC.Components.ChatInputHome.densityCompact',
    desc: 'PC.Components.ChatInputHome.densityCompactDesc',
  },
  normal: {
    label: 'PC.Components.ChatInputHome.densityNormal',
    desc: 'PC.Components.ChatInputHome.densityNormalDesc',
  },
  detailed: {
    label: 'PC.Components.ChatInputHome.densityDetailed',
    desc: 'PC.Components.ChatInputHome.densityDetailedDesc',
  },
};

export interface ConversationDebugFabProps {
  conversationId?: number | string | null;
}

const ConversationDebugFab: React.FC<ConversationDebugFabProps> = ({
  conversationId,
}) => {
  const [open, setOpen] = useState(false);
  const { token } = theme.useToken();
  const { density, setDensity } = useConversationDensity();

  const content = useMemo(
    () => (
      <div style={{ width: 300 }} data-testid="conversation-debug-panel">
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 12,
              color: token.colorTextTertiary,
              marginBottom: 4,
            }}
          >
            {t('PC.Components.ChatInputHome.conversationDensity')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {DENSITY_OPTIONS.map((option) => {
              const active = density === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDensity(option)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '6px 8px',
                    border: 0,
                    borderRadius: 6,
                    background: active ? token.colorBgTextHover : 'transparent',
                    color: token.colorText,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 13 }}>
                      {t(DENSITY_I18N[option].label)}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: token.colorTextTertiary,
                      }}
                    >
                      {t(DENSITY_I18N[option].desc)}
                    </span>
                  </span>
                  {active && (
                    <CheckOutlined
                      style={{ fontSize: 12, color: token.colorPrimary }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 12,
              color: token.colorTextTertiary,
              marginBottom: 4,
            }}
          >
            {t('PC.Components.ChatInputHome.conversationDisplay')}
          </div>
          <ConversationDisplaySettings conversationId={conversationId} />
        </div>
      </div>
    ),
    [density, conversationId, token, setDensity],
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      trigger="click"
      content={content}
    >
      <Tooltip
        title={t('PC.Components.ChatInputHome.conversationDebugEntry')}
        open={open ? false : undefined}
      >
        <button
          type="button"
          className={cx(
            'flex',
            'items-center',
            'content-center',
            'cursor-pointer',
          )}
          data-testid="conversation-debug-entry"
          aria-label={t('PC.Components.ChatInputHome.conversationDebugEntry')}
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            zIndex: 11,
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: '1px solid rgba(0, 0, 0, 10%)',
            background: 'rgba(255, 255, 255, 85%)',
            color: token.colorTextTertiary,
            fontSize: 12,
            opacity: 0.65,
          }}
        >
          <BugOutlined />
        </button>
      </Tooltip>
    </Popover>
  );
};

export default ConversationDebugFab;

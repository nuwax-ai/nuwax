/**
 * 会话详情头部「渲染线」调试切换（V2 双线重构后续接入）：
 * 本页基线恒 V1（经典 Markdown），仅按会话显式切到 V2 工作轨迹做调试比对；
 * 不接全局偏好链——全局默认值变化不改变本页存量观感（与 ChatContentArea 的
 * URL>会话覆盖>全局>默认 链路刻意不同，详见 plans/20260831 双线调试开关计划）。
 */
import { useConversationRendererPreference } from '@/hooks/useConversationRendererPreference';
import { t } from '@/services/i18nRuntime';
import type { ConversationRendererVersion } from '@/utils/conversationRendererPreference';
import { EyeOutlined } from '@ant-design/icons';
import { Popover, Segmented, Tooltip, theme } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
// 复用本目录既有样式模块（icon-box 与头部 TooltipIcon 同款；勿新建本地 less）。
// 与 ChatInputHomeIndependent/ConversationDisplaySettings 同款别名导入模式。
import styles from '@/components/business-component/ConversationDetails/index.less';

const cx = classNames.bind(styles);

interface RendererLineToggleProps {
  conversationId: number | null;
}

const RendererLineToggle: React.FC<RendererLineToggleProps> = ({
  conversationId,
}) => {
  const [open, setOpen] = useState(false);
  const { sessionOverride, setSessionVersion } =
    useConversationRendererPreference(conversationId);
  const { token } = theme.useToken();

  const handleChange = (value: ConversationRendererVersion) => {
    setSessionVersion(value);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      trigger="click"
      content={
        <div
          style={{
            display: 'grid',
            gap: 8,
            padding: 4,
            maxWidth: 264,
          }}
        >
          <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
            {t('PC.Components.ConversationDetails.rendererLineHint')}
          </span>
          <Segmented
            block
            data-testid="conversation-details-renderer-toggle"
            disabled={!conversationId}
            options={[
              {
                value: 'v1',
                label: t('PC.Components.ConversationDetails.rendererLineV1'),
              },
              {
                value: 'v2',
                label: t('PC.Components.ConversationDetails.rendererLineV2'),
              },
            ]}
            value={sessionOverride ?? 'v1'}
            onChange={(value) =>
              handleChange(value as ConversationRendererVersion)
            }
          />
          {sessionOverride ? (
            <a
              role="button"
              tabIndex={0}
              onClick={() => setSessionVersion(null)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  setSessionVersion(null);
                }
              }}
              style={{ fontSize: 12 }}
            >
              {t('PC.Components.ConversationDetails.rendererLineReset')}
            </a>
          ) : null}
        </div>
      }
    >
      <Tooltip
        title={t('PC.Components.ConversationDetails.rendererLineToggle')}
        open={open ? false : undefined}
      >
        <button
          type="button"
          data-testid="conversation-details-renderer-entry"
          aria-label={t('PC.Components.ConversationDetails.rendererLineToggle')}
          className={cx(
            'flex',
            'items-center',
            'justify-center',
            'cursor-pointer',
            styles['icon-box'],
          )}
          style={{ background: 'transparent', cursor: 'pointer' }}
        >
          <EyeOutlined style={{ fontSize: 16 }} aria-hidden="true" />
        </button>
      </Tooltip>
    </Popover>
  );
};

export default RendererLineToggle;

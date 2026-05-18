import { t } from '@/services/i18nRuntime';
import {
  CheckOutlined,
  CloseOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { Button, Space, Tag, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo } from 'react';
import type {
  AcpPermissionInteraction,
  AcpPermissionOption,
  AcpRequestPermissionResponse,
} from '../../../types';
import AllowAlwaysIcon from './AllowAlwaysIcon';
import styles from './index.less';
import {
  getAcpPermissionShortcutHint,
  useAcpPermissionShortcuts,
} from './useAcpPermissionShortcuts';

const { Text } = Typography;

/** 产品上不展示「始终拒绝」选项（后端仍可能下发，前端过滤） */
const HIDDEN_OPTION_KINDS = new Set(['reject_always']);

interface AcpPermissionCardProps {
  interaction: AcpPermissionInteraction;
  /** 固定在会话输入框上方时为 true */
  docked?: boolean;
  /** 固定栏统一外壳 class（与 MCP Ask 共用） */
  dockShellClassName?: string;
  /** 层叠时仅顶层为 true，避免后方卡片抢占 Esc/数字键 */
  keyboardShortcutsEnabled?: boolean;
  onRespond?: (response: AcpRequestPermissionResponse) => void;
}

function renderOptionIcon(option: AcpPermissionOption): React.ReactNode {
  if (option.kind === 'allow_always') {
    return <AllowAlwaysIcon />;
  }
  if (option.kind.startsWith('allow')) {
    return <CheckOutlined />;
  }
  return <CloseOutlined />;
}

/**
 * ACP 权限审批卡片（支持消息内嵌 / 输入框上方固定 dock）
 */
const AcpPermissionCard: React.FC<AcpPermissionCardProps> = ({
  interaction,
  docked = false,
  dockShellClassName,
  keyboardShortcutsEnabled = true,
  onRespond,
}) => {
  const request = interaction.intervention.acp.request;
  const toolCall = request.toolCall || {};
  const isSubmitting = interaction.responseStatus === 'submitting';
  const isSubmitted = interaction.responseStatus === 'submitted';
  const isFailed = interaction.responseStatus === 'failed';
  const disabled = isSubmitting || isSubmitted || !onRespond;

  const handleSelect = useCallback(
    (optionId: string) => {
      onRespond?.({
        outcome: {
          outcome: 'selected',
          optionId,
        },
      });
    },
    [onRespond],
  );

  const handleCancel = useCallback(() => {
    onRespond?.({
      outcome: {
        outcome: 'cancelled',
      },
    });
  }, [onRespond]);

  const title =
    toolCall.title?.trim() || t('PC.Components.AcpPermissionCard.defaultTitle');

  const visibleOptions = useMemo(
    () =>
      (request.options ?? []).filter(
        (option) => !HIDDEN_OPTION_KINDS.has(option.kind),
      ),
    [request.options],
  );

  useAcpPermissionShortcuts({
    enabled: !disabled && keyboardShortcutsEnabled,
    options: visibleOptions,
    onSelect: handleSelect,
    onCancel: handleCancel,
  });

  return (
    <div
      className={classNames(styles.card, dockShellClassName, {
        [styles.cardDocked]: docked,
      })}
      tabIndex={-1}
      role="group"
      aria-label={title}
    >
      <header className={styles.header}>
        {docked ? (
          <div className={styles.iconWrap} aria-hidden>
            <SafetyOutlined />
          </div>
        ) : (
          <SafetyOutlined className={styles.icon} />
        )}
        <div className={styles.headerMain}>
          {docked ? (
            <span className={styles.eyebrow}>
              {t('PC.Components.AcpPermissionCard.eyebrow')}
            </span>
          ) : null}
          <Text strong className={styles.title}>
            {title}
          </Text>
        </div>
        {toolCall.kind ? (
          <Tag color="processing" className={styles.kindTag}>
            {toolCall.kind}
          </Tag>
        ) : null}
        {isSubmitted ? (
          <Tag color="success" className={styles.statusTag}>
            {t('PC.Components.AcpPermissionCard.submitted')}
          </Tag>
        ) : null}
      </header>

      <div className={styles.body}>
        <div className={styles.actions}>
          <Space size={8} wrap>
            {visibleOptions.map((option) => {
              const isAllow = option.kind.startsWith('allow');
              const shortcut = getAcpPermissionShortcutHint(option.kind);
              return (
                <Button
                  key={option.optionId}
                  size="small"
                  type={isAllow ? 'primary' : 'default'}
                  danger={option.kind.startsWith('reject')}
                  icon={renderOptionIcon(option)}
                  loading={
                    isSubmitting &&
                    interaction.selectedOptionId === option.optionId
                  }
                  disabled={disabled}
                  onClick={() => handleSelect(option.optionId)}
                  title={
                    shortcut
                      ? t(
                          'PC.Components.AcpPermissionCard.shortcutHint',
                          option.name || option.optionId,
                          shortcut,
                        )
                      : undefined
                  }
                >
                  <span className={styles.buttonLabel}>
                    {option.name || option.optionId}
                    {shortcut && !isSubmitted && (
                      <span className={styles.shortcutGroup}>
                        <kbd className={styles.shortcut}>{shortcut}</kbd>
                        {option.kind === 'allow_once' && (
                          <kbd className={styles.shortcut}>↵</kbd>
                        )}
                      </span>
                    )}
                  </span>
                </Button>
              );
            })}
            {!isSubmitted && (
              <Button
                size="small"
                disabled={disabled}
                onClick={handleCancel}
                title={t('PC.Components.AcpPermissionCard.cancelShortcutHint')}
              >
                <span className={styles.buttonLabel}>
                  {t('PC.Common.Global.cancel')}
                  <kbd className={styles.shortcut}>Esc</kbd>
                </span>
              </Button>
            )}
          </Space>
        </div>
      </div>

      {isFailed && interaction.errorMessage ? (
        <Text type="danger" className={styles.error}>
          {interaction.errorMessage}
        </Text>
      ) : null}
    </div>
  );
};

export default AcpPermissionCard;

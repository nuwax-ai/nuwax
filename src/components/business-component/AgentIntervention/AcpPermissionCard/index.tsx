import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
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
} from '../types/acpIntervention';
import styles from './index.less';
import {
  getAcpPermissionShortcutHint,
  useAcpPermissionShortcuts,
} from './useAcpPermissionShortcuts';

const { Text } = Typography;

const HIDDEN_OPTION_KINDS = new Set(['reject_always']);

interface AcpPermissionCardProps {
  interaction: AcpPermissionInteraction;
  docked?: boolean;
  dockShellClassName?: string;
  keyboardShortcutsEnabled?: boolean;
  onRespond?: (response: AcpRequestPermissionResponse) => void;
}

function AllowAlwaysIcon() {
  return (
    <span className={styles.multiCheck} aria-hidden>
      <CheckOutlined className={styles.multiCheckItem} />
      <CheckOutlined className={styles.multiCheckItem} />
      <CheckOutlined className={styles.multiCheckItem} />
    </span>
  );
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

  const title =
    toolCall.title?.trim() || t('PC.Components.AcpPermissionCard.defaultTitle');

  const visibleOptions = useMemo(
    () =>
      (request.options ?? [])
        .filter((option) => !HIDDEN_OPTION_KINDS.has(option.kind))
        .sort((a, b) => {
          const orderA = getAcpPermissionShortcutHint(a.kind) || '9';
          const orderB = getAcpPermissionShortcutHint(b.kind) || '9';
          return orderA.localeCompare(orderB);
        }),
    [request.options],
  );

  useAcpPermissionShortcuts({
    enabled: !disabled && keyboardShortcutsEnabled,
    options: visibleOptions,
    onSelect: handleSelect,
    onCancel: () => {},
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
              const camelCaseKind = option.kind.replace(
                /_([a-z])/g,
                (_, letter) => letter.toUpperCase(),
              );
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
                >
                  <span className={styles.buttonLabel}>
                    <EllipsisTooltip
                      text={
                        t(
                          `PC.Components.AcpPermissionCard.${camelCaseKind}` as any,
                        ) ||
                        option.name ||
                        option.optionId
                      }
                      className={styles['button-text']}
                    />
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

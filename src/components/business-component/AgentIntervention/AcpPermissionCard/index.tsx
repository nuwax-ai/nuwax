import ChangeFileGitDiffView, {
  DiffModeEnum,
} from '@/components/business-component/ChangeFileGitDiffView';
import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import { t } from '@/services/i18nRuntime';
import { normalizeFileDiffItems } from '@/utils/fileChangeDiff';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { Button, Tag, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AcpPermissionInteraction,
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

  const [activeIndex, setActiveIndex] = useState(0);
  const [submitType, setSubmitType] = useState<'confirm' | 'cancel' | null>(
    null,
  );

  const handleSelect = useCallback(
    (optionId: string, type: 'confirm' | 'cancel' = 'confirm') => {
      if (isSubmitting || isSubmitted || !onRespond) {
        return;
      }
      setSubmitType(type);
      onRespond?.({
        outcome: {
          outcome: 'selected',
          optionId,
        },
      });
    },
    [onRespond, isSubmitting, isSubmitted],
  );

  useEffect(() => {
    if (!isSubmitting) {
      setSubmitType(null);
    }
  }, [isSubmitting]);

  const title =
    toolCall.title?.trim() || t('PC.Components.AcpPermissionCard.defaultTitle');
  const rawCommand = (toolCall.rawInput as any)?.command;
  const displayTitle = title === 'bash' && rawCommand ? rawCommand : title;
  const fileDiffItems = useMemo(
    () =>
      normalizeFileDiffItems({
        input: toolCall.rawInput,
        locations: toolCall.locations,
      }),
    [toolCall.rawInput, toolCall.locations],
  );

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

  const rejectOption = useMemo(
    () => (request.options ?? []).find((o) => o.kind.startsWith('reject')),
    [request.options],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [visibleOptions]);

  const handleCancel = useCallback(() => {
    if (rejectOption) {
      handleSelect(rejectOption.optionId, 'cancel');
    }
  }, [rejectOption, handleSelect]);

  const isSubmitLoading =
    isSubmitting && (submitType === 'confirm' || !submitType);
  const isCancelLoading = isSubmitting && submitType === 'cancel';

  useAcpPermissionShortcuts({
    enabled: !disabled && keyboardShortcutsEnabled,
    options: visibleOptions,
    onSelect: handleSelect,
    onCancel: handleCancel,
    activeIndex,
    setActiveIndex,
  });

  return (
    <div
      className={classNames(styles.card, dockShellClassName, {
        [styles.cardDocked]: docked,
      })}
      tabIndex={-1}
      role="group"
      aria-label={displayTitle}
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
            {displayTitle}
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
        {fileDiffItems.length ? (
          <div className={styles.filePreview}>
            {fileDiffItems.map((item) => (
              <div key={item.path} className={styles.filePreviewItem}>
                <div className={styles.filePath}>
                  <Text
                    style={{ width: '100%', color: 'inherit', margin: 0 }}
                    ellipsis={{ tooltip: item.path }}
                  >
                    {item.path}
                  </Text>
                </div>
                <div className={styles.diffPreview}>
                  <ChangeFileGitDiffView
                    fileId={`${toolCall.toolCallId || item.path}-${item.path}`}
                    fileName={item.path}
                    originalContent={item.oldText}
                    modifiedContent={item.newText}
                    diffViewMode={DiffModeEnum.Unified}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div className={styles.actions}>
          {visibleOptions.map((option, index) => {
            const isAllow = option.kind.startsWith('allow');
            const isActive = index === activeIndex;
            const camelCaseKind = option.kind.replace(
              /_([a-z])/g,
              (_, letter) => letter.toUpperCase(),
            );
            const label =
              t(`PC.Components.AcpPermissionCard.${camelCaseKind}` as any) ||
              option.name ||
              option.optionId;
            return (
              <Button
                key={option.optionId}
                className={classNames(styles.actionBtn, {
                  [styles.allowBtn]: isAllow && !isActive,
                  [styles.rejectBtn]:
                    option.kind.startsWith('reject') && !isActive,
                  [styles['active-btn']]: isActive,
                })}
                // loading={
                //   isSubmitting &&
                //   interaction.selectedOptionId === option.optionId
                // }
                disabled={disabled}
                onClick={() => setActiveIndex(index)}
                onDoubleClick={() => handleSelect(option.optionId)}
              >
                <span className={styles.buttonLabel}>
                  <span className={styles['option-index']}>{index + 1}</span>
                  <EllipsisTooltip
                    text={label}
                    className={styles['button-text']}
                  />
                  {isActive && !isSubmitted && (
                    <span className={styles['arrow-indicators']}>
                      <ArrowUpOutlined className={styles.arrowIcon} />
                      <ArrowDownOutlined className={styles.arrowIcon} />
                    </span>
                  )}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      <footer className={styles.footer}>
        <Button
          className={styles['cancel-btn']}
          loading={isCancelLoading}
          disabled={disabled || !rejectOption}
          onClick={() =>
            rejectOption && handleSelect(rejectOption.optionId, 'cancel')
          }
        >
          <span className={styles.buttonLabel}>
            {t('PC.Components.McpAskQuestionCard.skip')}
            <kbd className={styles.shortcut}>Esc</kbd>
          </span>
        </Button>
        <Button
          className={styles['submit-btn']}
          loading={isSubmitLoading}
          disabled={disabled}
          onClick={() => {
            const activeOption = visibleOptions[activeIndex];
            if (activeOption) {
              handleSelect(activeOption.optionId, 'confirm');
            }
          }}
        >
          <span className={styles.buttonLabel}>
            {t('PC.Common.Global.confirm')}
            <kbd className={styles.shortcut}>↵</kbd>
          </span>
        </Button>
      </footer>

      {isFailed && interaction.errorMessage ? (
        <Text type="danger" className={styles.error}>
          {interaction.errorMessage}
        </Text>
      ) : null}
    </div>
  );
};

export default AcpPermissionCard;

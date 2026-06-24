import { t } from '@/services/i18nRuntime';
import type {
  RcoderAcpPermissionInteraction,
  RcoderRequestPermissionResponse,
} from '@/types/interfaces/acpPermission';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Checkbox, Tag, Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

const { Text } = Typography;

interface AcpPermissionCardProps {
  interaction: RcoderAcpPermissionInteraction;
  onRespond?: (
    response: RcoderRequestPermissionResponse,
    options?: { saveRule?: boolean },
  ) => void;
}

const formatJson = (value: unknown): string => {
  if (value === undefined || value === null) {
    return t('PC.Common.Global.noData');
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const AcpPermissionCard: React.FC<AcpPermissionCardProps> = ({
  interaction,
  onRespond,
}) => {
  const [saveRule, setSaveRule] = useState(false);
  const request = interaction.permission.request_permission_request;
  const toolCall = request.tool_call;
  const ruleSuggestion = interaction.permission.save_rule;
  const isSubmitting = interaction.responseStatus === 'submitting';
  const isSubmitted = interaction.responseStatus === 'submitted';
  const disabled = isSubmitting || isSubmitted || !onRespond;

  const rawInputText = useMemo(
    () => formatJson(toolCall.raw_input),
    [toolCall.raw_input],
  );

  const ruleDescription = useMemo(() => {
    if (!ruleSuggestion) return '';
    return `${ruleSuggestion.tool_name}: ${ruleSuggestion.suggested_pattern}`;
  }, [ruleSuggestion]);

  const handleSelect = (optionId: string) => {
    onRespond?.(
      {
        outcome: {
          Selected: {
            option_id: optionId,
          },
        },
      },
      { saveRule },
    );
  };

  const handleCancel = () => {
    onRespond?.({
      outcome: {
        Cancelled: {},
      },
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            {t('PC.Components.AcpPermissionCard.eyebrow')}
          </div>
          <div className={styles.title}>
            {toolCall.title?.trim() ||
              t('PC.Components.AcpPermissionCard.defaultTitle')}
          </div>
        </div>
        {toolCall.kind && <Tag>{toolCall.kind}</Tag>}
      </div>

      <div className={styles.meta}>
        <Text type="secondary">
          {t('PC.Components.AcpPermissionCard.toolCallId')}
        </Text>
        <Text code copyable>
          {toolCall.tool_call_id || '-'}
        </Text>
      </div>

      <div className={styles.rawInput}>
        <div className={styles.sectionTitle}>
          {t('PC.Components.AcpPermissionCard.rawInput')}
        </div>
        <pre>{rawInputText}</pre>
      </div>

      {!!ruleSuggestion && (
        <div className={styles.saveRule}>
          <Checkbox
            checked={saveRule}
            disabled={disabled}
            onChange={(event) => setSaveRule(event.target.checked)}
          >
            {t('PC.Components.AcpPermissionCard.saveRule')}
          </Checkbox>
          <div className={styles.ruleDescription}>{ruleDescription}</div>
        </div>
      )}

      <div className={styles.options}>
        {request.options?.map((option) => (
          <Button
            key={option.option_id}
            type={option.kind.startsWith('allow') ? 'primary' : 'default'}
            danger={option.kind.startsWith('reject')}
            icon={
              option.kind.startsWith('allow') ? (
                <CheckOutlined />
              ) : (
                <CloseOutlined />
              )
            }
            loading={
              isSubmitting && interaction.selectedOptionId === option.option_id
            }
            disabled={disabled}
            onClick={() => handleSelect(option.option_id)}
          >
            {option.name || option.option_id}
          </Button>
        ))}
        <Button disabled={disabled} onClick={handleCancel}>
          {t('PC.Common.Global.cancel')}
        </Button>
      </div>

      {interaction.responseStatus === 'failed' && (
        <div className={styles.error}>{interaction.errorMessage}</div>
      )}
      {isSubmitted && (
        <div className={styles.submitted}>
          {t('PC.Components.AcpPermissionCard.submitted')}
        </div>
      )}
    </div>
  );
};

export default AcpPermissionCard;

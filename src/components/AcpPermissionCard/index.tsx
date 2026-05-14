import { t } from '@/services/i18nRuntime';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
} from '@/types/interfaces/acpIntervention';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Tag, Typography } from 'antd';
import React, { useMemo } from 'react';
import styles from './index.less';

const { Text } = Typography;

interface AcpPermissionCardProps {
  interaction: AcpPermissionInteraction;
  onRespond?: (response: AcpRequestPermissionResponse) => void;
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
  const request = interaction.intervention.acp.request;
  const toolCall = request.toolCall || {};
  const isSubmitting = interaction.responseStatus === 'submitting';
  const isSubmitted = interaction.responseStatus === 'submitted';
  const disabled = isSubmitting || isSubmitted || !onRespond;

  const rawInputText = useMemo(
    () => formatJson(toolCall.rawInput),
    [toolCall.rawInput],
  );

  const handleSelect = (optionId: string) => {
    onRespond?.({
      outcome: {
        outcome: 'selected',
        optionId,
      },
    });
  };

  const handleCancel = () => {
    onRespond?.({
      outcome: {
        outcome: 'cancelled',
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
        <Text type="secondary">toolCallId</Text>
        <Text code copyable>
          {toolCall.toolCallId || '-'}
        </Text>
      </div>

      <div className={styles.rawInput}>
        <div className={styles.sectionTitle}>rawInput</div>
        <pre>{rawInputText}</pre>
      </div>

      <div className={styles.options}>
        {request.options?.map((option) => (
          <Button
            key={option.optionId}
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
              isSubmitting && interaction.selectedOptionId === option.optionId
            }
            disabled={disabled}
            onClick={() => handleSelect(option.optionId)}
          >
            {option.name || option.optionId}
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

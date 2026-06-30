import { t } from '@/services/i18nRuntime';
import type {
  RcoderAcpPermissionInteraction,
  RcoderRequestPermissionResponse,
} from '@/types/interfaces/acpPermission';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Tag, Typography } from 'antd';
import React, { useMemo } from 'react';
import styles from './index.less';

const { Text } = Typography;

interface AcpPermissionCardProps {
  interaction: RcoderAcpPermissionInteraction;
  onRespond?: (response: RcoderRequestPermissionResponse) => void;
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

  const toolCallId = toolCall.toolCallId || '';
  const toolCallKind = toolCall.kind || '';
  const options = request.options || [];

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
        {toolCallKind && <Tag>{toolCallKind}</Tag>}
      </div>

      <div className={styles.meta}>
        <Text type="secondary">
          {t('PC.Components.AcpPermissionCard.toolCallId')}
        </Text>
        <Text code copyable>
          {toolCallId || '-'}
        </Text>
      </div>

      <div className={styles.rawInput}>
        <div className={styles.sectionTitle}>
          {t('PC.Components.AcpPermissionCard.rawInput')}
        </div>
        <pre>{rawInputText}</pre>
      </div>

      <div className={styles.options}>
        {options.map((option) => {
          const optionId = option.optionId || '';
          const kind = option.kind || '';
          const name = option.name || optionId;
          const isAllow = kind.startsWith('allow');
          const isReject = kind.startsWith('reject');
          return (
            <Button
              key={optionId}
              type={isAllow ? 'primary' : 'default'}
              danger={isReject}
              icon={isAllow ? <CheckOutlined /> : <CloseOutlined />}
              loading={
                isSubmitting && interaction.selectedOptionId === optionId
              }
              disabled={disabled}
              onClick={() => handleSelect(optionId)}
            >
              {name}
            </Button>
          );
        })}
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

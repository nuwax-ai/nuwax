import { t } from '@/services/i18nRuntime';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
} from '@/types/interfaces/acpIntervention';
import {
  CheckOutlined,
  CloseOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { Button, Space, Tag, Typography } from 'antd';
import React from 'react';
import styles from './index.less';

const { Text } = Typography;

interface AcpPermissionCardProps {
  interaction: AcpPermissionInteraction;
  onRespond?: (response: AcpRequestPermissionResponse) => void;
}

const AcpPermissionCard: React.FC<AcpPermissionCardProps> = ({
  interaction,
  onRespond,
}) => {
  const request = interaction.intervention.acp.request;
  const toolCall = request.toolCall || {};
  const isSubmitting = interaction.responseStatus === 'submitting';
  const isSubmitted = interaction.responseStatus === 'submitted';
  const isFailed = interaction.responseStatus === 'failed';
  const disabled = isSubmitting || isSubmitted || !onRespond;

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

  const title =
    toolCall.title?.trim() || t('PC.Components.AcpPermissionCard.defaultTitle');

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <SafetyOutlined className={styles.icon} />
        <Text strong className={styles.title}>
          {title}
        </Text>
        {toolCall.kind && (
          <Tag color="processing" className={styles.kindTag}>
            {toolCall.kind}
          </Tag>
        )}
        {isSubmitted && (
          <Tag color="success" className={styles.statusTag}>
            {t('PC.Components.AcpPermissionCard.submitted')}
          </Tag>
        )}
      </div>

      <div className={styles.actions}>
        <Space size={8} wrap>
          {request.options?.map((option) => {
            const isAllow = option.kind.startsWith('allow');
            return (
              <Button
                key={option.optionId}
                size="small"
                type={isAllow ? 'primary' : 'default'}
                danger={option.kind.startsWith('reject')}
                icon={isAllow ? <CheckOutlined /> : <CloseOutlined />}
                loading={
                  isSubmitting &&
                  interaction.selectedOptionId === option.optionId
                }
                disabled={disabled}
                onClick={() => handleSelect(option.optionId)}
              >
                {option.name || option.optionId}
              </Button>
            );
          })}
          {!isSubmitted && (
            <Button size="small" disabled={disabled} onClick={handleCancel}>
              {t('PC.Common.Global.cancel')}
            </Button>
          )}
        </Space>
      </div>

      {isFailed && interaction.errorMessage && (
        <Text type="danger" className={styles.error}>
          {interaction.errorMessage}
        </Text>
      )}
    </div>
  );
};

export default AcpPermissionCard;

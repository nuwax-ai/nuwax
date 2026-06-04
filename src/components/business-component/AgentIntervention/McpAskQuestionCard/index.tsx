import { t } from '@/services/i18nRuntime';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Form, Space, Steps, Tag, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useInterventionEscapeKey } from '../hooks/useInterventionEscapeKey';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types/mcpAskIntervention';
import {
  getInteractionSteps,
  getSkipLabel,
  isSkipAllowed,
  isWizardPresentation,
  parseInteractionFields,
} from '../utils/parseMcpAskSchema';
import styles from './index.less';
import McpAskFormField from './McpAskFormField';

const { Text } = Typography;

interface McpAskQuestionCardProps {
  interaction: McpAskInteraction;
  dockShellClassName?: string;
  keyboardShortcutsEnabled?: boolean;
  onRespond?: (payload: McpAskRespondPayload) => void;
}

const McpAskQuestionCard: React.FC<McpAskQuestionCardProps> = ({
  interaction,
  dockShellClassName,
  keyboardShortcutsEnabled = true,
  onRespond,
}) => {
  const [form] = Form.useForm<Record<string, unknown>>();
  const [currentStep, setCurrentStep] = useState(0);
  const { input, toolCallId } = interaction;
  const ui = input.ui;

  const isSubmitting = interaction.responseStatus === 'submitting';
  const isSubmitted = interaction.responseStatus === 'submitted';
  const isCancelled = interaction.responseStatus === 'cancelled';
  const isSkipped = interaction.responseStatus === 'skipped';
  const isFailed = interaction.responseStatus === 'failed';
  const disabled =
    isSubmitting || isSubmitted || isCancelled || isSkipped || !onRespond;

  const steps = useMemo(() => getInteractionSteps(ui), [ui]);
  const isWizard = isWizardPresentation(ui);
  const allowSkip = isSkipAllowed(ui);
  const skipLabel =
    getSkipLabel(ui) || t('PC.Components.McpAskQuestionCard.skip');

  const activeStep = steps[currentStep];
  const visibleFields = useMemo(() => {
    if (isWizard && steps.length > 1) {
      return parseInteractionFields(ui, activeStep?.fields);
    }
    return parseInteractionFields(ui);
  }, [ui, isWizard, steps.length, activeStep?.fields]);
  const isLastStep = currentStep >= steps.length - 1;

  const title = input.title || ui.title;
  const description = input.description || ui.description;

  useEffect(() => {
    setCurrentStep(0);
  }, [input.requestId]);

  useEffect(() => {
    const initial = ui.initialValue || interaction.formData;
    if (initial) {
      form.setFieldsValue(initial);
    }
  }, [form, ui.initialValue, interaction.formData, input.requestId]);

  const buildPayload = (
    action: McpAskRespondPayload['action'],
    formData?: Record<string, unknown>,
  ): McpAskRespondPayload => ({
    interventionId: input.requestId,
    toolCallId,
    revision: input.revision,
    source: 'mcp_ask',
    protocol: 'mcp',
    action,
    formData,
    answeredAt: Date.now(),
    answeredBy: { kind: 'web' },
  });

  const validateStepFields = async (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step?.fields?.length) {
      return;
    }
    await form.validateFields(step.fields);
  };

  const handleNext = async () => {
    await validateStepFields(currentStep);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (isWizard) {
      for (let i = 0; i < steps.length; i += 1) {
        await validateStepFields(i);
      }
    } else {
      await form.validateFields();
    }
    const values = form.getFieldsValue(true);
    onRespond?.(buildPayload('submit', values));
  };

  const handleCancel = useCallback(() => {
    onRespond?.({
      interventionId: input.requestId,
      toolCallId,
      revision: input.revision,
      source: 'mcp_ask',
      protocol: 'mcp',
      action: 'cancel',
      answeredAt: Date.now(),
      answeredBy: { kind: 'web' },
    });
  }, [onRespond, input.requestId, input.revision, toolCallId]);

  useInterventionEscapeKey({
    enabled: !disabled && keyboardShortcutsEnabled,
    onEscape: handleCancel,
    respectFormFieldFocus: false,
  });

  const handleSkip = () => {
    onRespond?.(buildPayload('skip'));
  };

  const stepItems = steps.map((step) => ({
    title: step.title,
  }));

  const renderStatusTag = () => {
    if (isSubmitted) {
      return (
        <Tag color="success" className={styles.statusTag}>
          {t('PC.Components.McpAskQuestionCard.submitted')}
        </Tag>
      );
    }
    if (isSkipped) {
      return (
        <Tag className={styles.statusTag}>
          {t('PC.Components.McpAskQuestionCard.skipped')}
        </Tag>
      );
    }
    if (isCancelled) {
      return (
        <Tag className={styles.statusTag}>
          {t('PC.Components.McpAskQuestionCard.cancelled')}
        </Tag>
      );
    }
    return null;
  };

  return (
    <div
      className={classNames(styles.shell, dockShellClassName)}
      role="region"
      aria-label={title}
    >
      <header className={styles.header}>
        <div className={styles.iconWrap} aria-hidden>
          <QuestionCircleOutlined />
        </div>
        <div className={styles.headerMain}>
          <span className={styles.eyebrow}>
            {t('PC.Components.McpAskQuestionCard.eyebrow')}
          </span>
          <Text strong className={styles.title}>
            {title}
          </Text>
          {description ? (
            <Text type="secondary" className={styles.desc}>
              {description}
            </Text>
          ) : null}
        </div>
        {renderStatusTag()}
      </header>

      {isWizard && steps.length > 1 ? (
        <div className={styles.wizardBlock}>
          <Steps
            className={styles.steps}
            size="small"
            current={currentStep}
            items={stepItems}
          />
          {activeStep?.description ? (
            <div className={styles.stepCallout}>
              <Text type="secondary" className={styles.stepCalloutText}>
                {activeStep.description}
              </Text>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={styles.formSurface}>
        <Form
          form={form}
          layout="vertical"
          className={styles.form}
          disabled={disabled}
          requiredMark="optional"
        >
          {visibleFields.map((field) => (
            <McpAskFormField
              key={field.name}
              field={field}
              disabled={disabled}
            />
          ))}
        </Form>
      </div>

      {!isSubmitted && !isCancelled && !isSkipped ? (
        <footer className={styles.footer}>
          {isWizard && steps.length > 1 ? (
            <Text type="secondary" className={styles.stepMeta}>
              {t(
                'PC.Components.McpAskQuestionCard.stepOf',
                String(currentStep + 1),
                String(steps.length),
              )}
            </Text>
          ) : (
            <span />
          )}
          <Space size={8} wrap className={styles.footerActions}>
            {isWizard && currentStep > 0 ? (
              <Button disabled={disabled} onClick={handlePrev}>
                {t('PC.Components.McpAskQuestionCard.prevStep')}
              </Button>
            ) : null}
            {isWizard && !isLastStep ? (
              <Button
                type="primary"
                disabled={disabled}
                onClick={() => void handleNext()}
              >
                {t('PC.Components.McpAskQuestionCard.nextStep')}
              </Button>
            ) : (
              <Button
                type="primary"
                loading={isSubmitting}
                disabled={disabled}
                onClick={() => void handleSubmit()}
              >
                {ui.submitLabel || t('PC.Common.Global.confirm')}
              </Button>
            )}
            {allowSkip ? (
              <Button disabled={disabled} onClick={handleSkip}>
                {skipLabel}
              </Button>
            ) : null}
            <Button
              disabled={disabled}
              onClick={handleCancel}
              title={t('PC.Components.McpAskQuestionCard.cancelShortcutHint')}
            >
              <span className={styles.buttonLabel}>
                {ui.cancelLabel || t('PC.Common.Global.cancel')}
                <kbd className={styles.shortcut}>Esc</kbd>
              </span>
            </Button>
          </Space>
        </footer>
      ) : null}

      {isFailed && interaction.errorMessage ? (
        <Text type="danger" className={styles.error}>
          {interaction.errorMessage}
        </Text>
      ) : null}
    </div>
  );
};

export default McpAskQuestionCard;

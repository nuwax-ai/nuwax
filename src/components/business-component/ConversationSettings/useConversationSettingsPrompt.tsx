import NewConversationSet from '@/components/NewConversationSet';
import { dict } from '@/services/i18nRuntime';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import { hasConversationVariableValue } from '@/utils/conversationVariables';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { Form, Modal } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

type SettingsValues = Record<string, string | number>;

const ConversationSettingsDialog = ({
  variables,
  initialValues,
  finish,
}: {
  variables: BindConfigWithSub[];
  initialValues?: SettingsValues;
  finish: (values: SettingsValues | null) => void;
}) => {
  const [form] = Form.useForm<SettingsValues>();

  const handleConfirm = (values: SettingsValues) => {
    const missingFields = variables.filter(
      ({ name, require }) =>
        require && !hasConversationVariableValue(values[name]),
    );
    if (!missingFields.length) {
      finish(values);
      return;
    }
    form.setFields(
      missingFields.map(({ name }) => ({
        name,
        errors: [dict('PC.Common.Global.required')],
      })),
    );
  };

  return (
    <Modal
      open
      title={dict('PC.Components.NewConversationSet.startConversation')}
      okText={dict('PC.Components.NewConversationSet.startConversation')}
      cancelText={dict('PC.Common.Global.cancel')}
      maskClosable={false}
      onCancel={() => finish(null)}
      onOk={() => form.submit()}
    >
      <NewConversationSet
        form={form}
        variables={variables}
        userFillVariables={initialValues}
        onConfirm={handleConfirm}
      />
    </Modal>
  );
};

export function useConversationSettingsPrompt(scope: string) {
  const [settings, setSettings] = useState<{
    variables: BindConfigWithSub[];
    initialValues?: SettingsValues;
  }>();
  const resolveRef = useRef<(values: SettingsValues | null) => void>();

  const finish = useCallback((values: SettingsValues | null) => {
    if (!resolveRef.current) return;
    resolveRef.current(values);
    resolveRef.current = undefined;
    setSettings(undefined);
  }, []);

  useEffect(() => {
    const cancel = () => finish(null);
    eventBus.on(EVENT_NAMES.AUTH_SESSION_CLEARED, cancel);
    return () => {
      eventBus.off(EVENT_NAMES.AUTH_SESSION_CLEARED, cancel);
      cancel();
    };
  }, [scope, finish]);

  const requestSettings = (
    agentVariables?: BindConfigWithSub[] | null,
    initialValues?: SettingsValues,
  ) => {
    const fields = (agentVariables ?? []).filter(
      (item) => !item.systemVariable,
    );
    if (!fields.some((item) => item.require)) return undefined;
    if (resolveRef.current) return Promise.resolve(null);
    return new Promise<SettingsValues | null>((resolve) => {
      resolveRef.current = resolve;
      setSettings({ variables: fields, initialValues });
    });
  };

  const settingsDialog = settings && (
    <ConversationSettingsDialog {...settings} finish={finish} />
  );
  return { requestSettings, settingsDialog };
}

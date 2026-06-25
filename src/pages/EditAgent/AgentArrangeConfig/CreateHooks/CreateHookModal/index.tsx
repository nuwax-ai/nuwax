import {
  getDefaultHookConfigJson,
  HOOK_EVENT_OPTIONS,
  HOOK_STATUS_ENABLED,
  HOOK_TYPE_OPTIONS,
} from '@/constants/hook.constants';
import { apiAgentComponentHookUpdate } from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type { HookConfig } from '@/types/interfaces/agent';
import type { CreateHookModalProps } from '@/types/interfaces/agentConfig';
import { Button, Form, Input, message, Modal, Select } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface HookFormValues {
  name: string;
  event: string;
  matcher?: string;
  type: string;
  config: string;
}

/**
 * 新建 / 编辑 Hook 弹窗
 */
const CreateHookModal: React.FC<CreateHookModalProps> = ({
  open,
  mode = CreateUpdateModeEnum.Create,
  hooksInfo,
  currentHook,
  hookList,
  editIndex,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm<HookFormValues>();
  const hookType = Form.useWatch('type', form);

  const { run: runHookUpdate, loading } = useRequest(
    apiAgentComponentHookUpdate,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: () => {
        message.success(t('PC.Pages.AgentArrangeCreateHooks.updateSuccess'));
        onConfirm(nextHooks);
      },
    },
  );

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    if (mode === CreateUpdateModeEnum.Update && currentHook) {
      form.setFieldsValue({
        name: currentHook.name ?? '',
        event: currentHook.event ?? HOOK_EVENT_OPTIONS[0].value,
        matcher: currentHook.matcher ?? '',
        type: currentHook.type ?? HOOK_TYPE_OPTIONS[0].value,
        config:
          currentHook.config ??
          getDefaultHookConfigJson(currentHook.type ?? 'command'),
      });
      return;
    }

    form.setFieldsValue({
      name: '',
      event: HOOK_EVENT_OPTIONS[0].value,
      matcher: '',
      type: HOOK_TYPE_OPTIONS[0].value,
      config: getDefaultHookConfigJson('command'),
    });
  }, [open, mode, currentHook, form]);

  const handleTypeChange = (type: string) => {
    form.setFieldValue('config', getDefaultHookConfigJson(type));
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    let parsedConfig: string = values.config.trim();

    try {
      JSON.parse(parsedConfig);
    } catch {
      message.error(t('PC.Pages.AgentArrangeCreateHookModal.configInvalid'));
      return;
    }

    const nextHook: HookConfig = {
      name: values.name.trim(),
      event: values.event,
      matcher: values.matcher?.trim() || undefined,
      type: values.type,
      config: parsedConfig,
      status:
        mode === CreateUpdateModeEnum.Update && currentHook
          ? currentHook.status ?? HOOK_STATUS_ENABLED
          : HOOK_STATUS_ENABLED,
    };

    const nextHooks = [...hookList];
    if (mode === CreateUpdateModeEnum.Update && editIndex !== undefined) {
      nextHooks[editIndex] = nextHook;
    } else {
      nextHooks.push(nextHook);
    }

    runHookUpdate({
      id: hooksInfo?.id as number,
      targetId: hooksInfo?.targetId ?? -1,
      bindConfig: { hooks: nextHooks },
    });
  };

  const title =
    mode === CreateUpdateModeEnum.Update
      ? t('PC.Pages.AgentArrangeCreateHookModal.titleEdit')
      : t('PC.Pages.AgentArrangeCreateHookModal.titleCreate');

  return (
    <Modal
      title={title}
      open={open}
      width={560}
      destroyOnClose
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('PC.Pages.AgentArrangeCreateHookModal.cancel')}
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={loading}
          onClick={handleSave}
        >
          {t('PC.Pages.AgentArrangeCreateHookModal.save')}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" preserve={false}>
        <div className={cx('flex', 'gap-12')}>
          <Form.Item
            className={cx('flex-1')}
            name="name"
            label={t('PC.Pages.AgentArrangeCreateHookModal.name')}
            rules={[
              {
                required: true,
                message: t('PC.Pages.AgentArrangeCreateHookModal.nameRequired'),
              },
            ]}
          >
            <Input
              placeholder={t(
                'PC.Pages.AgentArrangeCreateHookModal.namePlaceholder',
              )}
            />
          </Form.Item>
          <Form.Item
            className={cx('flex-1')}
            name="event"
            label={t('PC.Pages.AgentArrangeCreateHookModal.event')}
            rules={[
              {
                required: true,
                message: t(
                  'PC.Pages.AgentArrangeCreateHookModal.eventRequired',
                ),
              },
            ]}
          >
            <Select options={HOOK_EVENT_OPTIONS} />
          </Form.Item>
        </div>

        <Form.Item
          name="matcher"
          label={t('PC.Pages.AgentArrangeCreateHookModal.matcher')}
        >
          <Input
            placeholder={t(
              'PC.Pages.AgentArrangeCreateHookModal.matcherPlaceholder',
            )}
          />
        </Form.Item>
        <p className={cx(styles['form-hint'])}>
          {t('PC.Pages.AgentArrangeCreateHookModal.matcherHint')}
        </p>

        <Form.Item
          name="type"
          label={t('PC.Pages.AgentArrangeCreateHookModal.type')}
          rules={[
            {
              required: true,
              message: t('PC.Pages.AgentArrangeCreateHookModal.typeRequired'),
            },
          ]}
        >
          <Select options={HOOK_TYPE_OPTIONS} onChange={handleTypeChange} />
        </Form.Item>

        <Form.Item
          name="config"
          label={t('PC.Pages.AgentArrangeCreateHookModal.config')}
          rules={[
            {
              required: true,
              message: t('PC.Pages.AgentArrangeCreateHookModal.configInvalid'),
            },
          ]}
        >
          <Input.TextArea rows={8} className={cx(styles['config-textarea'])} />
        </Form.Item>
        <p className={cx(styles['form-hint'])}>
          {t(
            'PC.Pages.AgentArrangeCreateHookModal.configHint',
            hookType ?? 'command',
          )}
        </p>
      </Form>
    </Modal>
  );
};

export default CreateHookModal;

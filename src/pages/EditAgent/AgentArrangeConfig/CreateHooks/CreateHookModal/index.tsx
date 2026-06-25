import CodeEditor from '@/components/CodeEditor';
import CustomFormModal from '@/components/CustomFormModal';
import {
  getDefaultHookConfigJson,
  HOOK_EVENT_OPTIONS,
  HOOK_TYPE_OPTIONS,
} from '@/constants/hook.constants';
import { apiAgentComponentHookUpdate } from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import { HookStatusEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { CodeLangEnum } from '@/types/enums/plugin';
import type { HookConfig } from '@/types/interfaces/agent';
import type { CreateHookModalProps } from '@/types/interfaces/agentConfig';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, message, Select } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';
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
  const pendingHooksRef = useRef<HookConfig[]>([]);

  // 更新 Hook 配置
  const { run: runHookUpdate, loading } = useRequest(
    apiAgentComponentHookUpdate,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: () => {
        message.success(t('PC.Pages.AgentArrangeCreateHooks.updateSuccess'));
        onConfirm(pendingHooksRef.current);
      },
    },
  );

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    // 编辑 Hook
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

    // 新建 Hook
    form.setFieldsValue({
      name: '',
      event: HOOK_EVENT_OPTIONS[0].value,
      matcher: '',
      type: HOOK_TYPE_OPTIONS[0].value,
      config: getDefaultHookConfigJson('command'),
    });
  }, [open, mode, currentHook, form]);

  // 切换 Hook 类型
  const handleTypeChange = (type: string) => {
    form.setFieldValue('config', getDefaultHookConfigJson(type));
  };

  // 保存 Hook 配置
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
          ? currentHook.status ?? HookStatusEnum.Enabled
          : HookStatusEnum.Enabled,
    };

    const nextHooks = [...hookList];
    // 编辑 Hook
    if (mode === CreateUpdateModeEnum.Update && editIndex !== undefined) {
      nextHooks[editIndex] = nextHook;
    } else {
      // 新建 Hook
      nextHooks.push(nextHook);
    }

    pendingHooksRef.current = nextHooks;
    // 更新 Hook 配置
    runHookUpdate({
      id: hooksInfo?.id as number,
      targetId: hooksInfo?.targetId ?? -1,
      bindConfig: { hooks: nextHooks },
    });
  };

  // 弹窗标题
  const title =
    mode === CreateUpdateModeEnum.Update
      ? t('PC.Pages.AgentArrangeCreateHookModal.titleEdit')
      : t('PC.Pages.AgentArrangeCreateHookModal.titleCreate');

  return (
    <CustomFormModal
      form={form}
      title={title}
      open={open}
      width={560}
      loading={loading}
      onCancel={onCancel}
      onConfirm={handleSave}
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark={customizeRequiredMark}
        autoComplete="off"
      >
        <div className={cx('flex', 'gap-10')}>
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
          <CodeEditor
            codeLanguage={CodeLangEnum.JSON}
            height="240px"
            codeOptimizeVisible={false}
            className={cx(styles['config-editor'])}
            editorOptions={{
              wordWrap: 'bounded',
              wrappingStrategy: 'advanced',
              wrappingIndent: 'indent',
              scrollBeyondLastLine: false,
              minimap: { enabled: false },
            }}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreateHookModal;

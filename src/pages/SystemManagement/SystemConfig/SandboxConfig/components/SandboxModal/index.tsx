import { XModalForm } from '@/components/ProComponents';
import { t } from '@/services/i18nRuntime';
import {
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import React, { useEffect } from 'react';

import {
  SANDBOX_ISOLATION_OPTIONS,
  SANDBOX_TYPE_OPTIONS,
} from '@/constants/system.constants';
import { SandboxTypeEnum } from '@/types/enums/systemManage';
import { SandboxConfigItem as SandboxItem } from '@/types/interfaces/systemManage';
import BindItemsPicker from '../BindItemsPicker';

// Default sandbox configuration values
const DEFAULT_SANDBOX_CONFIG_VALUE = {
  agentPort: 9086,
  vncPort: 9088,
  fileServerPort: 60001,
  maxUsers: 30,
};

interface SandboxModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  initialData?: SandboxItem | null;
  onCancel: () => void;
  onFinish: (values: any) => Promise<boolean>;
}

const SandboxModal: React.FC<SandboxModalProps> = ({
  open,
  mode,
  initialData,
  onCancel,
  onFinish,
}) => {
  const [form] = Form.useForm();
  const type = Form.useWatch('type', form);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        form.setFieldsValue({
          name: initialData.name,
          type: initialData.type || SandboxTypeEnum.Agent,
          isolation: initialData.isolation,
          bindItems: initialData.bindItems || [],
          configValue: initialData.configValue,
        });
      } else {
        form.resetFields();
        // Set default values
        form.setFieldsValue({
          type: SandboxTypeEnum.Agent,
          configValue: DEFAULT_SANDBOX_CONFIG_VALUE,
        });
      }
    }
  }, [open, mode, initialData, form]);

  return (
    <XModalForm
      title={
        mode === 'add'
          ? t('PC.Pages.SystemConfigSandboxModal.addTitle')
          : t('PC.Pages.SystemConfigSandboxModal.editTitle')
      }
      open={open}
      form={form}
      grid={true}
      autoFocusFirstInput
      width={800}
      modalProps={{
        destroyOnHidden: true,
        onCancel: onCancel,
      }}
      submitter={{
        searchConfig: {
          resetText: t('PC.Common.Global.cancel'),
          submitText: t('PC.Common.Global.save'),
        },
      }}
      onFinish={onFinish}
    >
      <ProFormText
        name="name"
        label={t('PC.Pages.SystemConfigSandboxModal.name')}
        placeholder={t('PC.Pages.SystemConfigSandboxModal.namePlaceholder')}
        colProps={{ span: 12 }}
        rules={[
          {
            required: true,
            message: t('PC.Pages.SystemConfigSandboxModal.nameRequired'),
          },
          {
            max: 100,
            message: t('PC.Pages.SystemConfigSandboxModal.nameMaxLength'),
          },
        ]}
        fieldProps={{
          maxLength: 100,
          showCount: true,
        }}
      />
      <ProFormSelect
        name="type"
        label={t('PC.Pages.SystemConfigSandboxModal.type')}
        colProps={{ span: 12 }}
        disabled={mode === 'edit'}
        options={SANDBOX_TYPE_OPTIONS}
        rules={[
          {
            required: true,
            message: t('PC.Pages.SystemConfigSandboxModal.typeRequired'),
          },
        ]}
      />
      <ProFormText
        name={['configValue', 'hostWithScheme']}
        label={t('PC.Pages.SystemConfigSandboxModal.host')}
        placeholder={t('PC.Pages.SystemConfigSandboxModal.hostPlaceholder')}
        colProps={{ span: 12 }}
        rules={[
          {
            required: true,
            message: t('PC.Pages.SystemConfigSandboxModal.hostRequired'),
          },
          {
            max: 255,
            message: t('PC.Pages.SystemConfigSandboxModal.hostMaxLength'),
          },
          {
            pattern: /^https?:\/\/.+/,
            message: t('PC.Pages.SystemConfigSandboxModal.hostInvalid'),
          },
        ]}
        fieldProps={{
          maxLength: 255,
          showCount: true,
        }}
      />
      <ProFormDigit
        name={['configValue', 'maxUsers']}
        label={t('PC.Pages.SystemConfigSandboxModal.maxUsers')}
        placeholder="30"
        colProps={{ span: 12 }}
        fieldProps={{ precision: 0, min: 1, max: 9999 }}
        rules={[
          {
            required: true,
            message: t('PC.Pages.SystemConfigSandboxModal.maxUsersRequired'),
          },
          {
            type: 'number',
            max: 9999,
            message: t('PC.Pages.SystemConfigSandboxModal.maxUsersMax'),
          },
        ]}
      />

      <ProFormDigit
        name={['configValue', 'agentPort']}
        label={t('PC.Pages.SystemConfigSandboxModal.agentPort')}
        placeholder="9086"
        colProps={{ span: 8 }}
        fieldProps={{ precision: 0, min: 1, max: 65535 }}
        rules={[
          {
            required: true,
            message: t('PC.Pages.SystemConfigSandboxModal.agentPortRequired'),
          },
        ]}
      />
      <ProFormDigit
        name={['configValue', 'vncPort']}
        label={t('PC.Pages.SystemConfigSandboxModal.vncPort')}
        placeholder="9088"
        colProps={{ span: 8 }}
        fieldProps={{ precision: 0, min: 1, max: 65535 }}
        rules={[
          {
            required: true,
            message: t('PC.Pages.SystemConfigSandboxModal.vncPortRequired'),
          },
        ]}
      />
      <ProFormDigit
        name={['configValue', 'fileServerPort']}
        label={t('PC.Pages.SystemConfigSandboxModal.fileServerPort')}
        placeholder="60001"
        colProps={{ span: 8 }}
        fieldProps={{ precision: 0, min: 1, max: 65535 }}
        rules={[
          {
            required: true,
            message: t(
              'PC.Pages.SystemConfigSandboxModal.fileServerPortRequired',
            ),
          },
        ]}
      />
      <ProFormText
        name={['configValue', 'apiKey']}
        label={t('PC.Pages.SystemConfigSandboxModal.apiKey')}
        placeholder={t('PC.Pages.SystemConfigSandboxModal.apiKeyPlaceholder')}
        colProps={{ span: type === SandboxTypeEnum.PageApp ? 12 : 24 }}
        fieldProps={{
          maxLength: 128,
          showCount: true,
        }}
      />

      {type === SandboxTypeEnum.PageApp && (
        <>
          <ProFormSelect
            name="isolation"
            label={t('PC.Pages.SystemConfigSandboxModal.isolation')}
            colProps={{ span: 12 }}
            options={SANDBOX_ISOLATION_OPTIONS}
            rules={[
              {
                required: true,
                message: t(
                  'PC.Pages.SystemConfigSandboxModal.isolationRequired',
                ),
              },
            ]}
          />
          <Form.Item
            name="bindItems"
            label={t('PC.Pages.SystemConfigSandboxModal.bindItems')}
            className="w-full"
            style={{ width: '100%' }}
          >
            <BindItemsPicker />
          </Form.Item>
        </>
      )}
    </XModalForm>
  );
};

export default SandboxModal;

import { CopyIconButton } from '@/components/base';
import { XModalForm } from '@/components/ProComponents';
import UploadAvatar from '@/components/UploadAvatar';
import { dict } from '@/services/i18nRuntime';
import {
  AuthIdpOAuth2ProviderEnum,
  AuthIdpTypeEnum,
  AuthIdpWechatModeEnum,
  type AuthIdpInfo,
} from '@/types/interfaces/authIdp';
import {
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Form, Input, Typography } from 'antd';
import React, { useEffect } from 'react';
import {
  getOAuth2ProviderOptions,
  getTypeOptions,
  getWechatModeOptions,
} from './constants';
import styles from './index.less';
import {
  CAS_MAPPING_KEYS,
  CUSTOM_OAUTH2_DEFAULT_MAPPING,
  CUSTOM_OAUTH2_MAPPING_KEYS,
  fromAuthIdpInfo,
  type AuthIdpFormValues,
} from './utils';

interface AuthMethodFormModalProps {
  open: boolean;
  /** 编辑的记录；为空时新增 */
  record?: AuthIdpInfo | null;
  onCancel: () => void;
  /** 返回 true 关闭弹窗 */
  onFinish: (values: AuthIdpFormValues) => Promise<boolean>;
}

const urlRule = {
  type: 'url' as const,
  message: dict('PC.Pages.SystemAuthMethod.urlInvalid'),
};

/** 字段映射：平台字段 ← IdP 返回属性名，一行一个 */
const MappingFields: React.FC<{
  name: 'casMapping' | 'oauth2Mapping';
  keys: string[];
  placeholders?: Record<string, string>;
}> = ({ name, keys, placeholders }) => (
  <div className={styles['mapping-grid']}>
    {keys.map((key) => (
      <Form.Item
        key={key}
        name={[name, key]}
        label={dict(
          `PC.Pages.SystemAuthMethod.mapping${key[0].toUpperCase()}${key.slice(
            1,
          )}`,
        )}
      >
        <Input
          placeholder={
            placeholders?.[key] ?? dict('PC.Pages.SystemAuthMethod.unmapped')
          }
        />
      </Form.Item>
    ))}
  </div>
);

/**
 * 新增 / 编辑登录方式
 *
 * 三种类型字段平铺在同一表单，按 type 显隐；编辑时类型锁定。
 * secret 编辑态留空 = 不修改。
 */
const AuthMethodFormModal: React.FC<AuthMethodFormModalProps> = ({
  open,
  record,
  onCancel,
  onFinish,
}) => {
  const [form] = Form.useForm<AuthIdpFormValues>();
  const type = Form.useWatch('type', form);
  const provider = Form.useWatch('oauth2Provider', form);
  const icon = Form.useWatch('icon', form);
  const isEdit = !!record;
  const isCustom = provider === AuthIdpOAuth2ProviderEnum.Custom;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      record
        ? fromAuthIdpInfo(record)
        : {
            type: AuthIdpTypeEnum.Cas,
            autoRegisterBind: false,
            oauth2Provider: AuthIdpOAuth2ProviderEnum.Feishu,
            oauth2AuthMethod: 'post',
            oauth2UsePkce: false,
            wechatMode: AuthIdpWechatModeEnum.QrCode,
          },
    );
  }, [open, record, form]);

  // 切到自定义提供方且映射为空时，填入默认映射作起点
  useEffect(() => {
    if (isCustom && !form.getFieldValue('oauth2Mapping')) {
      form.setFieldValue('oauth2Mapping', { ...CUSTOM_OAUTH2_DEFAULT_MAPPING });
    }
  }, [isCustom, form]);

  // 新增时 secret 必填；编辑时留空表示不修改
  const secretRules = isEdit
    ? []
    : [
        {
          required: true,
          message: dict('PC.Pages.SystemAuthMethod.secretRequired'),
        },
      ];
  const secretPlaceholder = isEdit
    ? dict('PC.Pages.SystemAuthMethod.secretKeepPlaceholder')
    : undefined;

  return (
    <XModalForm<AuthIdpFormValues>
      title={
        isEdit
          ? dict('PC.Pages.SystemAuthMethod.editTitle')
          : dict('PC.Pages.SystemAuthMethod.addTitle')
      }
      open={open}
      form={form}
      width={640}
      modalProps={{ destroyOnHidden: true, onCancel }}
      onFinish={onFinish}
    >
      <ProFormText name="id" hidden />
      <ProFormRadio.Group
        name="type"
        label={dict('PC.Pages.SystemAuthMethod.type')}
        options={getTypeOptions()}
        radioType="button"
        disabled={isEdit}
        rules={[{ required: true }]}
      />
      <ProFormText
        name="name"
        label={dict('PC.Pages.SystemAuthMethod.name')}
        placeholder={dict('PC.Pages.SystemAuthMethod.namePlaceholder')}
        fieldProps={{ maxLength: 50, showCount: true }}
        rules={[
          {
            required: true,
            whitespace: true,
            message: dict('PC.Pages.SystemAuthMethod.nameRequired'),
          },
        ]}
      />

      {type === AuthIdpTypeEnum.Cas && (
        <>
          <ProFormText
            name="casServerUrl"
            label={dict('PC.Pages.SystemAuthMethod.casServerUrl')}
            placeholder="https://sso.example.com/cas"
            rules={[
              {
                required: true,
                message: dict('PC.Pages.SystemAuthMethod.casServerUrlRequired'),
              },
              urlRule,
            ]}
          />
          <Form.Item
            label={dict('PC.Pages.SystemAuthMethod.fieldMapping')}
            tooltip={dict('PC.Pages.SystemAuthMethod.casMappingTip')}
          >
            <MappingFields name="casMapping" keys={CAS_MAPPING_KEYS} />
          </Form.Item>
        </>
      )}

      {type === AuthIdpTypeEnum.OAuth2 && (
        <>
          <ProFormSelect
            name="oauth2Provider"
            label={dict('PC.Pages.SystemAuthMethod.provider')}
            options={getOAuth2ProviderOptions()}
            allowClear={false}
            rules={[{ required: true }]}
          />
          <ProFormText
            name="oauth2ClientId"
            label={
              provider === AuthIdpOAuth2ProviderEnum.Wecom
                ? dict('PC.Pages.SystemAuthMethod.wecomCorpId')
                : 'Client ID'
            }
            rules={[
              {
                required: true,
                message: dict('PC.Pages.SystemAuthMethod.clientIdRequired'),
              },
            ]}
          />
          <ProFormText.Password
            name="oauth2ClientSecret"
            label="Client Secret"
            placeholder={secretPlaceholder}
            fieldProps={{ autoComplete: 'new-password' }}
            rules={secretRules}
          />
          {provider === AuthIdpOAuth2ProviderEnum.Wecom && (
            <ProFormText
              name="oauth2AgentId"
              label="AgentId"
              rules={[
                {
                  required: true,
                  message: dict('PC.Pages.SystemAuthMethod.agentIdRequired'),
                },
              ]}
            />
          )}
          {isCustom && (
            <>
              <ProFormText
                name="oauth2AuthorizeUrl"
                label={dict('PC.Pages.SystemAuthMethod.authorizeUrl')}
                rules={[{ required: true }, urlRule]}
              />
              <ProFormText
                name="oauth2TokenUrl"
                label={dict('PC.Pages.SystemAuthMethod.tokenUrl')}
                rules={[{ required: true }, urlRule]}
              />
              <ProFormText
                name="oauth2UserinfoUrl"
                label={dict('PC.Pages.SystemAuthMethod.userinfoUrl')}
                rules={[{ required: true }, urlRule]}
              />
              <ProFormText
                name="oauth2Scope"
                label="Scope"
                placeholder="openid profile email"
                tooltip={dict('PC.Pages.SystemAuthMethod.scopeTip')}
                rules={[{ required: true }]}
              />
              <ProFormRadio.Group
                name="oauth2AuthMethod"
                label={dict('PC.Pages.SystemAuthMethod.authMethod')}
                options={[
                  {
                    label: dict('PC.Pages.SystemAuthMethod.authMethodPost'),
                    value: 'post',
                  },
                  {
                    label: dict('PC.Pages.SystemAuthMethod.authMethodBasic'),
                    value: 'basic',
                  },
                ]}
              />
              <ProFormSwitch
                name="oauth2UsePkce"
                label={dict('PC.Pages.SystemAuthMethod.usePkce')}
              />
              <Form.Item
                label={dict('PC.Pages.SystemAuthMethod.fieldMapping')}
                tooltip={dict('PC.Pages.SystemAuthMethod.oauth2MappingTip')}
              >
                <MappingFields
                  name="oauth2Mapping"
                  keys={CUSTOM_OAUTH2_MAPPING_KEYS}
                  placeholders={CUSTOM_OAUTH2_DEFAULT_MAPPING}
                />
              </Form.Item>
            </>
          )}
        </>
      )}

      {type === AuthIdpTypeEnum.Wechat && (
        <>
          <ProFormRadio.Group
            name="wechatMode"
            label={dict('PC.Pages.SystemAuthMethod.wechatMode')}
            options={getWechatModeOptions()}
            tooltip={dict('PC.Pages.SystemAuthMethod.wechatModeTip')}
            rules={[{ required: true }]}
          />
          <ProFormText
            name="wechatAppId"
            label="AppID"
            rules={[
              {
                required: true,
                message: dict('PC.Pages.SystemAuthMethod.appIdRequired'),
              },
            ]}
          />
          <ProFormText.Password
            name="wechatAppSecret"
            label="AppSecret"
            placeholder={secretPlaceholder}
            fieldProps={{ autoComplete: 'new-password' }}
            rules={secretRules}
          />
        </>
      )}

      <Form.Item label={dict('PC.Pages.SystemAuthMethod.icon')}>
        <Form.Item name="icon" noStyle>
          <Input hidden />
        </Form.Item>
        <UploadAvatar
          imageUrl={icon}
          onUploadSuccess={(url) => form.setFieldValue('icon', url)}
          svgIconName="icons-workspace-agent"
        />
      </Form.Item>
      <ProFormDigit
        name="sort"
        label={dict('PC.Pages.SystemAuthMethod.sort')}
        tooltip={dict('PC.Pages.SystemAuthMethod.sortTip')}
        min={0}
        fieldProps={{ precision: 0 }}
      />
      <ProFormSwitch
        name="autoRegisterBind"
        label={dict('PC.Pages.SystemAuthMethod.autoRegisterBind')}
        extra={dict('PC.Pages.SystemAuthMethod.autoRegisterBindTip')}
      />

      {isEdit && record?.callbackUrl && (
        <Form.Item
          label={dict('PC.Pages.SystemAuthMethod.callbackUrl')}
          extra={dict('PC.Pages.SystemAuthMethod.callbackUrlTip')}
        >
          <div className={styles['callback-row']}>
            <Typography.Text code ellipsis={{ tooltip: record.callbackUrl }}>
              {record.callbackUrl}
            </Typography.Text>
            <CopyIconButton text={record.callbackUrl} />
          </div>
        </Form.Item>
      )}
    </XModalForm>
  );
};

export default AuthMethodFormModal;

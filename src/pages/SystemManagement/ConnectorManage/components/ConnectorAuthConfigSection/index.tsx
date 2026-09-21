import { dict } from '@/services/i18nRuntime';
import type {
  ConnectorAuthType,
  CreateConnectorProviderParams,
  SaveConnectorOauthConfigParams,
} from '@/types/interfaces/systemManage';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Select,
  Typography,
} from 'antd';
import React, { memo } from 'react';
import styles from './index.less';

/**
 * 连接器认证配置区（新增 / 编辑连接器抽屉共用）
 *
 * 按认证方式（表单 authType 字段）切换展示，两处抽屉行为保持一致：
 * - no_auth：免鉴权提示（无配置项）
 * - bearer：固定约定提示（建连收集 Token，自动注入 Authorization 头）
 * - api_key：凭证字段名 + 注入位置（header 时含请求头名称）+ 值前缀
 * - custom：凭证字段 + 注入规则两组动态行（行可增删；凭证字段
 *   至少一行填了字段名，提交时列表级校验拦截）
 * - oauth2 / oauth2_device（扫描授权（设备码））：表单结构一致——
 *   OAUTH APP 模式二选一；platform 展示平台 App 配置（授权端点 /
 *   令牌端点必填，scopes / 回调地址；Client ID / Secret 仅 oauth2
 *   展示，设备码模式的 App 凭证由平台托管），byo 仅提示；区别仅
 *   platform 模式的 placeholder（device_code 以飞书设备码流程为例）
 *
 * 表单字段直接挂在所属抽屉的 form 上（name 与两处抽屉的表单值类型
 * ConnectorAuthFormValues 对齐），本组件不维护自身状态。
 */

/** 注入位置（api_key 的注入位置 / custom 注入规则的位置） */
export type InjectionLocation = 'header' | 'query';

/** 自定义认证 - 凭证字段行（连接界面逐项收集） */
export interface CustomCredentialFieldRow {
  name?: string;
  label?: string;
  secret?: boolean;
}

/** 自定义认证 - 注入规则行（凭证字段 → 请求位置） */
export interface CustomInjectRuleRow {
  field?: string;
  location?: InjectionLocation;
  targetName?: string;
}

/** 认证配置相关表单值（新增/编辑连接器抽屉的表单值共用部分） */
export interface ConnectorAuthFormValues {
  authType?: ConnectorAuthType;
  /** api_key：凭证字段名 */
  credentialFieldName?: string;
  /** api_key：注入位置 */
  injectionLocation?: InjectionLocation;
  /** api_key：请求头名称（仅注入位置 = header） */
  requestHeaderName?: string;
  /** api_key：值前缀 */
  valuePrefix?: string;
  /** 自定义认证：凭证字段动态行 */
  customCredentialFields?: CustomCredentialFieldRow[];
  /** 自定义认证：注入规则动态行 */
  customInjectRules?: CustomInjectRuleRow[];
  /** OAuth 2.0：OAUTH APP 模式（二选一） */
  oauthAppMode?: 'platform' | 'byo';
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthAuthUrl?: string;
  oauthTokenUrl?: string;
  /** scopes：空格或逗号分隔字符串（提交前拆成数组） */
  oauthScopes?: string;
}

/** 新增/编辑连接器提交值：基础信息 + 认证配置（两处抽屉表单值的共用基类） */
export interface ConnectorProviderSubmitValues extends ConnectorAuthFormValues {
  service: string;
  displayName?: string;
  description?: string;
  /** 图标 URL（UploadAvatar 上传成功回写，随表单一起提交） */
  icon?: string;
  baseUrl?: string;
  category?: string;
  /** 标签：逗号分隔字符串（提交前拆成数组） */
  tags?: string;
}

export interface ConnectorAuthConfigSectionProps {
  /** 所属抽屉的表单实例（useWatch 监听认证方式 / 注入位置 / OAUTH 模式） */
  form: FormInstance;
  /**
   * 编辑模式：CLIENT SECRET 不强制重填（加密落库不回显，留空 = 保持已存密钥，
   * 其余 App 配置项仍随保存提交）
   */
  editMode?: boolean;
}

/** 注入位置选项（函数包裹，避免模块顶层调用 dict 早于 i18n 初始化） */
const getInjectionLocationOptions = (): Array<{
  label: string;
  value: InjectionLocation;
}> => [
  {
    label: dict('PC.Pages.ConnectorManage.formOptionInjectHeader'),
    value: 'header',
  },
  {
    label: dict('PC.Pages.ConnectorManage.formOptionInjectQuery'),
    value: 'query',
  },
];

/** 自定义认证「注入规则」行的位置下拉（短文案，与设计稿一致） */
const getRuleLocationOptions = (): Array<{
  label: string;
  value: InjectionLocation;
}> => [
  {
    label: dict('PC.Pages.ConnectorManage.formOptionRuleHeader'),
    value: 'header',
  },
  {
    label: dict('PC.Pages.ConnectorManage.formOptionRuleQuery'),
    value: 'query',
  },
];

/** OAuth 2.0 - OAUTH APP 模式（二选一） */
const getOauthAppModeOptions = (): Array<{
  label: string;
  value: 'platform' | 'byo';
}> => [
  {
    label: dict('PC.Pages.ConnectorManage.formOptionOauthPlatform'),
    value: 'platform',
  },
  {
    label: dict('PC.Pages.ConnectorManage.formOptionOauthByo'),
    value: 'byo',
  },
];

/**
 * oauth2 同族认证方式（oauth2 / oauth2_device 扫描授权（设备码））：
 * 表单结构、提交口径（顶层 oauthAppMode + 不传 authConfig、authType 原值
 * oauth2_device 提交）、platform 模式平台 App 配置接口链路完全共用，
 * 仅 platform 模式 placeholder 不同
 */
export const isOauthLikeAuthType = (authType?: string): boolean =>
  authType === 'oauth2' || authType === 'oauth2_device';

/**
 * oauth2 / 扫描授权（设备码）- platform 模式 App 配置 placeholder 集
 * （oauth2 通用 IdP 口径；设备码以飞书流程为例）
 */
const getOauthPlatformPlaceholders = (authType?: string) =>
  authType === 'oauth2_device'
    ? {
        clientId: dict('PC.Pages.ConnectorManage.placeholderDeviceClientId'),
        authUrl: 'https://accounts.feishu.cn/oauth/v1/device_authorization',
        tokenUrl: 'https://open.feishu.cn/open-apis/authen/v2/oauth/token',
        scopes: dict('PC.Pages.ConnectorManage.placeholderDeviceScopes'),
      }
    : {
        clientId: dict('PC.Pages.ConnectorManage.placeholderPlatformClientId'),
        authUrl: 'https://idp.example.com/oauth',
        tokenUrl: 'https://idp.example.com/oauth',
        scopes: dict('PC.Pages.ConnectorManage.placeholderPlatformScopes'),
      };

/** OAuth 2.0 固定回调地址（展示用，请到 IdP 登记） */
const OAUTH_CALLBACK_URL =
  'https://testagent.xspaceagi.com/api/connector/oauth/callback';

/**
 * 表单值 → authConfig（按认证方式组装）
 * - no_auth / bearer：固定约定，无配置项，传空对象
 * - api_key：keyName + injectTo（header 时含 headerName）+ prefix（没填不传）
 * - custom：fields 凭证字段 + inject 注入规则两组动态行（完全没填的行不提交）
 * - oauth2 / oauth2_device：不走本函数 —— 提交接口不传 authConfig，App 模式
 *   提交为顶层 oauthAppMode（byo / platform）；platform 的 App 配置另调
 *   POST /api/system/connector/oauth-config
 */
const buildAuthConfig = (
  values: ConnectorAuthFormValues,
): Record<string, unknown> => {
  switch (values.authType) {
    case 'api_key': {
      const config: Record<string, unknown> = {
        keyName: values.credentialFieldName?.trim() ?? '',
        injectTo: values.injectionLocation ?? 'header',
      };
      if (values.injectionLocation === 'header') {
        config.headerName = values.requestHeaderName?.trim() ?? '';
      }
      if (values.valuePrefix?.trim()) {
        config.prefix = values.valuePrefix.trim();
      }
      return config;
    }
    case 'custom': {
      // 凭证字段行 → fields（name / label / secret），完全没填的行不提交
      const fields = (values.customCredentialFields ?? [])
        .filter((row) => row?.name?.trim())
        .map((row) => ({
          name: row.name?.trim() ?? '',
          label: row.label?.trim() || row.name?.trim() || '',
          secret: row.secret === true,
        }));
      // 注入规则行 → inject（from=凭证字段，to="位置:名称" 拼接串，
      // 如 header:x-api-key / query:apiKey；名称没填时回退凭证字段名）
      const inject = (values.customInjectRules ?? [])
        .filter((row) => row?.field?.trim())
        .map((row) => ({
          from: row.field?.trim() ?? '',
          to: `${row.location ?? 'header'}:${
            row.targetName?.trim() || row.field?.trim() || ''
          }`,
        }));
      return { fields, inject };
    }
    default:
      return {};
  }
};

/**
 * 表单值 → 创建 / 更新连接器的提交 body（新增 POST 与编辑 PUT meta 共用）
 *
 * 与接口参考传参一致：
 * { service, displayName, description, authType, baseUrl, category, tags, authConfig }
 * oauth2 差异（与新增一致）：不传 authConfig，App 模式提交为顶层 oauthAppMode
 */
export const toConnectorProviderPayload = (
  values: ConnectorProviderSubmitValues,
): CreateConnectorProviderParams => {
  const isOauth2 = isOauthLikeAuthType(values.authType);
  return {
    service: values.service.trim(),
    displayName: values.displayName?.trim() ?? '',
    description: values.description ?? '',
    // 图标：未上传时传空串（后端按空处理）
    icon: values.icon ?? '',
    // '' 仅用于列表筛选枚举，表单默认 no_auth，不会出现
    authType: (values.authType || 'no_auth') as Exclude<ConnectorAuthType, ''>,
    baseUrl: values.baseUrl?.trim() ?? '',
    category: values.category ?? '',
    // 标签：逗号分隔字符串 → 去空白后的数组
    tags: String(values.tags ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    ...(isOauth2
      ? {
          oauthAppMode:
            values.oauthAppMode === 'byo'
              ? ('byo' as const)
              : ('platform' as const),
        }
      : { authConfig: buildAuthConfig(values) }),
  };
};

/**
 * oauth2 + platform 模式 → oauth-config 接口入参
 * （POST /api/system/connector/oauth-config；由调用方在创建/保存成功后追加调用）
 */
export const toConnectorOauthConfigParams = (
  values: ConnectorProviderSubmitValues,
  service: string,
): SaveConnectorOauthConfigParams => ({
  service,
  clientId: values.oauthClientId?.trim() ?? '',
  clientSecret: values.oauthClientSecret?.trim() ?? '',
  authUrl: values.oauthAuthUrl?.trim() ?? '',
  tokenUrl: values.oauthTokenUrl?.trim() ?? '',
  // scopes：空格或逗号分隔 → 去空白后的数组
  scopes: String(values.oauthScopes ?? '')
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean),
});

const ConnectorAuthConfigSection: React.FC<ConnectorAuthConfigSectionProps> = ({
  form,
  editMode,
}) => {
  const authType = Form.useWatch('authType', form) as
    | ConnectorAuthType
    | undefined;
  const injectionLocation = Form.useWatch('injectionLocation', form) as
    | InjectionLocation
    | undefined;
  const oauthAppMode = Form.useWatch('oauthAppMode', form);
  /**
   * platform 模式 App 配置 placeholder：oauth2 通用 IdP 口径，
   * 扫描授权（设备码）按飞书设备码流程示例
   */
  const platformPlaceholders = getOauthPlatformPlaceholders(authType);

  return (
    <div className={styles.authSection}>
      <div className={styles.authSectionTitle}>
        {dict('PC.Pages.ConnectorManage.formAuthSectionTitle')}
      </div>
      {authType === 'no_auth' ? (
        <div className={styles.authHint}>
          {dict('PC.Pages.ConnectorManage.tipNoAuth')}
        </div>
      ) : authType === 'bearer' ? (
        // Bearer 为固定约定：自动收集 Token 并注入 Authorization 头，无需配置
        <div className={styles.authHint}>
          {dict('PC.Pages.ConnectorManage.tipBearer')}
        </div>
      ) : authType === 'custom' ? (
        <>
          {/* ===== 凭证字段（连接界面逐项收集）：动态行，支持添加/删除；
              列表级校验：至少要有一行填了字段名，否则提交拦截
              （空行提交时会被过滤，等于没有凭证字段可收集） ===== */}
          <Form.List
            name="customCredentialFields"
            rules={[
              {
                validator: async (_, value) => {
                  const rows =
                    (value as Array<{ name?: string }> | undefined) ?? [];
                  if (!rows.some((row) => row?.name?.trim())) {
                    return Promise.reject(
                      new Error(
                        dict(
                          'PC.Pages.ConnectorManage.formCredentialFieldRequired',
                        ),
                      ),
                    );
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, meta) => (
              <>
                <div className={styles.customGroupHeader}>
                  <span className={styles.customGroupTitle}>
                    {dict('PC.Pages.ConnectorManage.formCredentialGroupTitle')}
                  </span>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => add({ name: '', label: '', secret: true })}
                  >
                    {dict('PC.Pages.ConnectorManage.btnAdd')}
                  </Button>
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <div className={styles.customRow} key={key}>
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      className={styles.customField}
                    >
                      {/* 紧凑动态行只限字数不加 showCount（计数后缀会挤占行内输入宽度） */}
                      <Input
                        placeholder={dict(
                          'PC.Pages.ConnectorManage.placeholderCredentialRowName',
                        )}
                        maxLength={100}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'label']}
                      className={styles.customField}
                    >
                      <Input
                        placeholder={dict(
                          'PC.Pages.ConnectorManage.placeholderCredentialRowLabel',
                        )}
                        maxLength={100}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'secret']}
                      valuePropName="checked"
                      className={styles.customFixed}
                    >
                      <Checkbox>
                        {dict('PC.Pages.ConnectorManage.formSecretCheckbox')}
                      </Checkbox>
                    </Form.Item>
                    <CloseOutlined
                      className={styles.customRowRemove}
                      onClick={() => remove(name)}
                    />
                  </div>
                ))}
                {/* 列表级校验错误：Form.List 的 rules 错误需自行渲染 */}
                {meta.errors.length > 0 ? (
                  <div className={styles.customListError}>{meta.errors[0]}</div>
                ) : null}
              </>
            )}
          </Form.List>
          {/* ===== 注入规则（凭证字段 → 请求位置）：动态行，支持添加/删除 ===== */}
          <Form.List name="customInjectRules">
            {(fields, { add, remove }) => (
              <>
                <div
                  className={`${styles.customGroupHeader} ${styles.customGroupHeaderGap}`}
                >
                  <span className={styles.customGroupTitle}>
                    {dict('PC.Pages.ConnectorManage.formInjectGroupTitle')}
                  </span>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      add({ field: '', location: 'header', targetName: '' })
                    }
                  >
                    {dict('PC.Pages.ConnectorManage.btnAdd')}
                  </Button>
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <div className={styles.customRow} key={key}>
                    <Form.Item
                      {...restField}
                      name={[name, 'field']}
                      className={styles.customField}
                    >
                      <Input
                        placeholder={dict(
                          'PC.Pages.ConnectorManage.placeholderInjectRuleField',
                        )}
                        maxLength={100}
                      />
                    </Form.Item>
                    <span className={styles.customArrow}>→</span>
                    <Form.Item
                      {...restField}
                      name={[name, 'location']}
                      className={styles.customLocation}
                    >
                      <Select options={getRuleLocationOptions()} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'targetName']}
                      className={styles.customField}
                    >
                      <Input
                        placeholder={dict(
                          'PC.Pages.ConnectorManage.placeholderInjectRuleTargetName',
                        )}
                        maxLength={100}
                      />
                    </Form.Item>
                    <CloseOutlined
                      className={styles.customRowRemove}
                      onClick={() => remove(name)}
                    />
                  </div>
                ))}
              </>
            )}
          </Form.List>
          {/* 提示常驻认证配置底部 */}
          <div className={styles.authHint}>
            {dict('PC.Pages.ConnectorManage.tipCustomAuth')}
          </div>
        </>
      ) : isOauthLikeAuthType(authType) ? (
        <>
          <Form.Item
            name="oauthAppMode"
            label={dict('PC.Pages.ConnectorManage.formOauthAppMode')}
          >
            <Select options={getOauthAppModeOptions()} />
          </Form.Item>
          {oauthAppMode === 'byo' ? (
            // byo：平台不维护公共 App，连接时用户在授权弹窗自填，此处无配置项
            <div className={styles.authHint}>
              {dict('PC.Pages.ConnectorManage.tipOauthByo')}
            </div>
          ) : (
            <>
              {/* CLIENT ID / CLIENT SECRET：仅 oauth2（标准授权码流程）展示。
                  扫描授权（设备码）platform 模式的 App 凭证由平台侧统一
                  托管，用户无需填写，不展示这两项（required 校验随字段
                  卸载自动失效；编辑回显的已存值经 form preserve 保留，
                  切回 oauth2 仍可继续编辑） */}
              {authType !== 'oauth2_device' && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="oauthClientId"
                      label="CLIENT ID"
                      rules={[
                        {
                          required: true,
                          message: dict(
                            'PC.Pages.ConnectorManage.formClientIdRequired',
                          ),
                        },
                      ]}
                    >
                      <Input
                        placeholder={platformPlaceholders.clientId}
                        maxLength={100}
                        showCount
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    {/* 密文输入：新增必填；编辑不强制重填（留空保持已存配置） */}
                    <Form.Item
                      name="oauthClientSecret"
                      label="CLIENT SECRET"
                      rules={
                        editMode
                          ? []
                          : [
                              {
                                required: true,
                                message: dict(
                                  'PC.Pages.ConnectorManage.formClientSecretRequired',
                                ),
                              },
                            ]
                      }
                    >
                      <Input.Password
                        placeholder={
                          editMode
                            ? dict(
                                'PC.Pages.ConnectorManage.placeholderClientSecretKeep',
                              )
                            : dict(
                                'PC.Pages.ConnectorManage.placeholderClientSecretFirst',
                              )
                        }
                        maxLength={100}
                        autoComplete="new-password"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="oauthAuthUrl"
                    label={dict('PC.Pages.ConnectorManage.formAuthUrlLabel')}
                    rules={[
                      {
                        required: true,
                        message: dict(
                          'PC.Pages.ConnectorManage.formAuthUrlRequired',
                        ),
                      },
                    ]}
                  >
                    <Input
                      placeholder={platformPlaceholders.authUrl}
                      maxLength={100}
                      showCount
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="oauthTokenUrl"
                    label={dict('PC.Pages.ConnectorManage.formTokenUrlLabel')}
                    rules={[
                      {
                        required: true,
                        message: dict(
                          'PC.Pages.ConnectorManage.formTokenUrlRequired',
                        ),
                      },
                    ]}
                  >
                    <Input
                      placeholder={platformPlaceholders.tokenUrl}
                      maxLength={100}
                      showCount
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="oauthScopes"
                label={dict('PC.Pages.ConnectorManage.formOauthScopes')}
              >
                {/* scopes 上限 10000（oauth2 / 扫描授权两种认证方式一致，
                    部分 IdP 的 scope 清单较长） */}
                <Input
                  placeholder={platformPlaceholders.scopes}
                  maxLength={10000}
                  showCount
                  allowClear
                />
              </Form.Item>
              {/* 回调地址：只读提示条，支持一键复制 */}
              <div className={styles.callbackBar}>
                <span>{dict('PC.Pages.ConnectorManage.tipOauthCallback')}</span>
                <Typography.Text
                  className={styles.callbackUrl}
                  copyable={{ text: OAUTH_CALLBACK_URL }}
                >
                  {OAUTH_CALLBACK_URL}
                </Typography.Text>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="credentialFieldName"
                label={dict('PC.Pages.ConnectorManage.formCredentialNameLabel')}
              >
                <Input
                  placeholder={dict(
                    'PC.Pages.ConnectorManage.placeholderCredentialNameExample',
                  )}
                  maxLength={100}
                  showCount
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="injectionLocation"
                label={dict('PC.Pages.ConnectorManage.formInjectionLocation')}
              >
                <Select options={getInjectionLocationOptions()} />
              </Form.Item>
            </Col>
          </Row>
          {/* 第二行：header 模式左列为请求头名称（query 模式留空占位），值前缀固定右列 */}
          <Row gutter={16}>
            <Col span={12}>
              {injectionLocation === 'header' ? (
                <Form.Item
                  name="requestHeaderName"
                  label={dict('PC.Pages.ConnectorManage.formRequestHeaderName')}
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.ConnectorManage.placeholderRequestHeaderExample',
                    )}
                    maxLength={100}
                    showCount
                    allowClear
                  />
                </Form.Item>
              ) : null}
            </Col>
            <Col span={12}>
              <Form.Item
                name="valuePrefix"
                label={dict('PC.Pages.ConnectorManage.formValuePrefixOptional')}
              >
                <Input
                  placeholder={dict(
                    'PC.Pages.ConnectorManage.placeholderValuePrefixExample',
                  )}
                  maxLength={100}
                  showCount
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
          {/* 提示常驻认证配置底部（两种注入位置都展示） */}
          <div className={styles.authHint}>
            {dict('PC.Pages.ConnectorManage.tipQueryInjection')}
          </div>
        </>
      )}
    </div>
  );
};

export default memo(ConnectorAuthConfigSection);

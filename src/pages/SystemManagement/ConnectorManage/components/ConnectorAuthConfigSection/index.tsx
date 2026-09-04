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
 * - custom：凭证字段 + 注入规则两组动态行（行可增删）
 * - oauth2：OAUTH APP 模式二选一；platform 展示平台 App 配置（Client ID /
 *   Secret / 授权端点 / 令牌端点 / scopes / 回调地址），byo 仅提示
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
  baseUrl?: string;
  category?: string;
  /** 标签：逗号分隔字符串（提交前拆成数组） */
  tags?: string;
}

export interface ConnectorAuthConfigSectionProps {
  /** 所属抽屉的表单实例（useWatch 监听认证方式 / 注入位置 / OAUTH 模式） */
  form: FormInstance;
  /**
   * 编辑模式：CLIENT SECRET 不强制重填（加密落库不回显，留空 = 保存时
   * 跳过 oauth-config 调用，保持已存配置不被空值覆盖）
   */
  editMode?: boolean;
}

const INJECTION_LOCATION_OPTIONS: Array<{
  label: string;
  value: InjectionLocation;
}> = [
  { label: '请求头 header', value: 'header' },
  { label: '查询参数 query', value: 'query' },
];

/** 自定义认证「注入规则」行的位置下拉（短文案，与设计稿一致） */
const RULE_LOCATION_OPTIONS: Array<{
  label: string;
  value: InjectionLocation;
}> = [
  { label: '请求头', value: 'header' },
  { label: '查询参数', value: 'query' },
];

/** OAuth 2.0 - OAUTH APP 模式（二选一） */
const OAUTH_APP_MODE_OPTIONS = [
  {
    label: 'platform · 全局公共 App（配置一次，全员共用）',
    value: 'platform',
  },
  {
    label: 'byo · 个人 App（每个用户连接时自填）',
    value: 'byo',
  },
] as const;

/** OAuth 2.0 固定回调地址（展示用，请到 IdP 登记） */
const OAUTH_CALLBACK_URL =
  'https://testagent.xspaceagi.com/api/connector/oauth/callback';

/**
 * 表单值 → authConfig（按认证方式组装）
 * - no_auth / bearer：固定约定，无配置项，传空对象
 * - api_key：keyName + injectTo（header 时含 headerName）+ prefix（没填不传）
 * - custom：fields 凭证字段 + inject 注入规则两组动态行（完全没填的行不提交）
 * - oauth2：不走本函数 —— 提交接口不传 authConfig，App 模式提交为顶层
 *   oauthAppMode（byo / platform）；platform 的 App 配置另调
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
  const isOauth2 = values.authType === 'oauth2';
  return {
    service: values.service.trim(),
    displayName: values.displayName?.trim() ?? '',
    description: values.description ?? '',
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

  return (
    <div className={styles.authSection}>
      <div className={styles.authSectionTitle}>认证配置</div>
      {authType === 'no_auth' ? (
        <div className={styles.authHint}>
          免鉴权连接器不收集任何凭证，连接即可直接执行。
        </div>
      ) : authType === 'bearer' ? (
        // Bearer 为固定约定：自动收集 Token 并注入 Authorization 头，无需配置
        <div className={styles.authHint}>
          {
            '建连时收集一个 Token，执行时自动注入 Authorization: Bearer <token>，无需额外配置。'
          }
        </div>
      ) : authType === 'custom' ? (
        <>
          {/* ===== 凭证字段（连接界面逐项收集）：动态行，支持添加/删除 ===== */}
          <Form.List name="customCredentialFields">
            {(fields, { add, remove }) => (
              <>
                <div className={styles.customGroupHeader}>
                  <span className={styles.customGroupTitle}>
                    凭证字段（连接界面逐项收集）
                  </span>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => add({ name: '', label: '', secret: true })}
                  >
                    添加
                  </Button>
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <div className={styles.customRow} key={key}>
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      className={styles.customField}
                    >
                      <Input placeholder="字段名 如 apiKey" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'label']}
                      className={styles.customField}
                    >
                      <Input placeholder="显示名 如 API Key" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'secret']}
                      valuePropName="checked"
                      className={styles.customFixed}
                    >
                      <Checkbox>密文框</Checkbox>
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
          {/* ===== 注入规则（凭证字段 → 请求位置）：动态行，支持添加/删除 ===== */}
          <Form.List name="customInjectRules">
            {(fields, { add, remove }) => (
              <>
                <div
                  className={`${styles.customGroupHeader} ${styles.customGroupHeaderGap}`}
                >
                  <span className={styles.customGroupTitle}>
                    注入规则（凭证字段 → 请求位置）
                  </span>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      add({ field: '', location: 'header', targetName: '' })
                    }
                  >
                    添加
                  </Button>
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <div className={styles.customRow} key={key}>
                    <Form.Item
                      {...restField}
                      name={[name, 'field']}
                      className={styles.customField}
                    >
                      <Input placeholder="凭证字段 如 apiKey" />
                    </Form.Item>
                    <span className={styles.customArrow}>→</span>
                    <Form.Item
                      {...restField}
                      name={[name, 'location']}
                      className={styles.customLocation}
                    >
                      <Select options={RULE_LOCATION_OPTIONS} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'targetName']}
                      className={styles.customField}
                    >
                      <Input placeholder="名称 如 X-Api-Key" />
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
            凭证加密落库；执行时按注入规则写入请求头 / 查询参数（格式
            header:名称 或 query:名称）。
          </div>
        </>
      ) : authType === 'oauth2' ? (
        <>
          <Form.Item name="oauthAppMode" label="OAUTH APP 模式（二选一）">
            <Select options={[...OAUTH_APP_MODE_OPTIONS]} />
          </Form.Item>
          {oauthAppMode === 'byo' ? (
            // byo：平台不维护公共 App，连接时用户在授权弹窗自填，此处无配置项
            <div className={styles.authHint}>
              该连接器为 byo 模式：平台不维护公共
              App。用户连接时在授权弹窗中自行填写自己的 App（Client ID / Secret
              / 授权端点 / 令牌端点），配置按用户隔离加密保存。
            </div>
          ) : (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="oauthClientId"
                    label="CLIENT ID"
                    rules={[{ required: true, message: '请输入 Client ID' }]}
                  >
                    <Input placeholder="在 IdP 注册的 Client ID" allowClear />
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
                        : [{ required: true, message: '请输入 Client Secret' }]
                    }
                  >
                    <Input.Password
                      placeholder={
                        editMode
                          ? '留空保持不变（加密落库）'
                          : '首次必填（加密落库）'
                      }
                      autoComplete="new-password"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="oauthAuthUrl" label="授权端点 AUTHURL">
                    <Input
                      placeholder="https://idp.example.com/oauth"
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="oauthTokenUrl" label="令牌端点 TOKENURL">
                    <Input
                      placeholder="https://idp.example.com/oauth"
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="oauthScopes"
                label="SCOPES（空格或逗号分隔，可选）"
              >
                <Input placeholder="如 read:user repo" allowClear />
              </Form.Item>
              {/* 回调地址：只读提示条，支持一键复制 */}
              <div className={styles.callbackBar}>
                <span>回调地址（请到 IdP 登记）：</span>
                <Typography.Text
                  className={styles.callbackUrl}
                  copyable={{ text: OAUTH_CALLBACK_URL }}
                >
                  {OAUTH_CALLBACK_URL}
                </Typography.Text>
              </div>
              <div className={styles.authHint}>
                该 App
                配置为共享：平台级管理员维护后全员共用（自建连接器为空间共享）。
                <br />
                client_secret 加密落库，界面与日志不回显明文。
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="credentialFieldName" label="凭证字段名">
                <Input placeholder="如 apiKey" allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="injectionLocation" label="注入位置">
                <Select options={INJECTION_LOCATION_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          {/* 第二行：header 模式左列为请求头名称（query 模式留空占位），值前缀固定右列 */}
          <Row gutter={16}>
            <Col span={12}>
              {injectionLocation === 'header' ? (
                <Form.Item name="requestHeaderName" label="请求头名称">
                  <Input placeholder="如 Authorization" allowClear />
                </Form.Item>
              ) : null}
            </Col>
            <Col span={12}>
              <Form.Item name="valuePrefix" label="值前缀（可选）">
                <Input placeholder="如 Token（可留空）" allowClear />
              </Form.Item>
            </Col>
          </Row>
          {/* 提示常驻认证配置底部（两种注入位置都展示） */}
          <div className={styles.authHint}>
            注入 query 时，查询参数名即『凭证字段名』。
          </div>
        </>
      )}
    </div>
  );
};

export default memo(ConnectorAuthConfigSection);

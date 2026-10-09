import {
  AuthIdpOAuth2ProviderEnum,
  AuthIdpTypeEnum,
  AuthIdpWechatModeEnum,
  type AuthIdpFieldMapping,
  type AuthIdpInfo,
  type AuthIdpSaveParams,
} from '@/types/interfaces/authIdp';

/** 后端对 secret 的脱敏回显值 */
const MASKED_SECRET = '******';

/** 自定义 OAuth2 默认字段映射（与后端默认值一致，作回显占位） */
export const CUSTOM_OAUTH2_DEFAULT_MAPPING: AuthIdpFieldMapping = {
  externalId: 'sub',
  userName: 'preferred_username',
  nickName: 'name',
  email: 'email',
  avatar: 'picture',
};

/** CAS 可映射的平台字段 */
export const CAS_MAPPING_KEYS = ['userName', 'nickName', 'email', 'phone'];
/** 自定义 OAuth2 可映射的平台字段 */
export const CUSTOM_OAUTH2_MAPPING_KEYS = Object.keys(
  CUSTOM_OAUTH2_DEFAULT_MAPPING,
);

/**
 * 弹窗表单值：三种类型的字段平铺在一张表单上，按 type 取用。
 * 平铺而非嵌套，方便 Form.useWatch 与切换类型时的字段显隐。
 */
export interface AuthIdpFormValues {
  id?: number;
  type: AuthIdpTypeEnum;
  name: string;
  icon?: string;
  sort?: number;
  autoRegisterBind?: boolean;
  // CAS
  casServerUrl?: string;
  casMapping?: AuthIdpFieldMapping;
  // OAuth2
  oauth2Provider?: AuthIdpOAuth2ProviderEnum;
  oauth2ClientId?: string;
  oauth2ClientSecret?: string;
  oauth2AgentId?: string;
  oauth2AuthorizeUrl?: string;
  oauth2TokenUrl?: string;
  oauth2UserinfoUrl?: string;
  oauth2Scope?: string;
  oauth2UsePkce?: boolean;
  oauth2AuthMethod?: string;
  oauth2Mapping?: AuthIdpFieldMapping;
  // 微信
  wechatMode?: AuthIdpWechatModeEnum;
  wechatAppId?: string;
  wechatAppSecret?: string;
}

const trim = (value?: string) => (value ?? '').trim();

/** 去掉空值；全空返回 undefined（不传即用后端默认） */
const compactMapping = (
  mapping?: AuthIdpFieldMapping,
): AuthIdpFieldMapping | undefined => {
  const entries = Object.entries(mapping ?? {})
    .map(([k, v]) => [k, trim(v)] as const)
    .filter(([, v]) => v);
  return entries.length ? Object.fromEntries(entries) : undefined;
};

/** secret 为空或为脱敏回显值时不传（后端约定 = 不修改） */
const secretOrUndefined = (value?: string) => {
  const v = trim(value);
  return v && v !== MASKED_SECRET ? v : undefined;
};

/** 丢弃值为 undefined 的键，保持请求体干净 */
const compact = <T extends object>(obj: T): T =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;

/** 表单值 → 保存参数：只带当前类型的 config 段 */
export function toAuthIdpSavePayload(
  values: AuthIdpFormValues,
): AuthIdpSaveParams {
  const payload: AuthIdpSaveParams = {
    ...(values.id ? { id: values.id } : {}),
    type: values.type,
    name: trim(values.name),
    icon: trim(values.icon) || undefined,
    sort: values.sort,
    autoRegisterBind: values.autoRegisterBind ? 1 : 0,
  };

  if (values.type === AuthIdpTypeEnum.Cas) {
    payload.casConfig = compact({
      serverUrl: trim(values.casServerUrl),
      fieldMapping: compactMapping(values.casMapping),
    });
  }

  if (values.type === AuthIdpTypeEnum.OAuth2) {
    const provider = values.oauth2Provider as AuthIdpOAuth2ProviderEnum;
    const isCustom = provider === AuthIdpOAuth2ProviderEnum.Custom;
    payload.oauth2Config = compact({
      provider,
      clientId: trim(values.oauth2ClientId),
      clientSecret: secretOrUndefined(values.oauth2ClientSecret),
      agentId:
        provider === AuthIdpOAuth2ProviderEnum.Wecom
          ? trim(values.oauth2AgentId) || undefined
          : undefined,
      ...(isCustom
        ? {
            authorizeUrl: trim(values.oauth2AuthorizeUrl),
            tokenUrl: trim(values.oauth2TokenUrl),
            userinfoUrl: trim(values.oauth2UserinfoUrl),
            scope: trim(values.oauth2Scope)
              .split(/\s+/)
              .filter(Boolean)
              .join(' '),
            usePkce: !!values.oauth2UsePkce,
            authMethod: values.oauth2AuthMethod || 'post',
            fieldMapping: compactMapping(values.oauth2Mapping),
          }
        : {}),
    });
  }

  if (values.type === AuthIdpTypeEnum.Wechat) {
    payload.wechatConfig = compact({
      mode: values.wechatMode as AuthIdpWechatModeEnum,
      appId: trim(values.wechatAppId),
      appSecret: secretOrUndefined(values.wechatAppSecret),
    });
  }

  return payload;
}

/** 列表项 → 编辑表单初值：secret 一律置空（留空 = 不修改） */
export function fromAuthIdpInfo(info: AuthIdpInfo): AuthIdpFormValues {
  const config = info.config ?? {};
  const values: AuthIdpFormValues = {
    id: info.id,
    type: info.type,
    name: info.name,
    icon: info.icon,
    sort: info.sort,
    autoRegisterBind: info.autoRegisterBind === 1,
  };

  if (info.type === AuthIdpTypeEnum.Cas) {
    values.casServerUrl = config.serverUrl;
    values.casMapping = { ...(config.fieldMapping ?? {}) };
  }

  if (info.type === AuthIdpTypeEnum.OAuth2) {
    const isCustom = config.provider === AuthIdpOAuth2ProviderEnum.Custom;
    Object.assign(values, {
      oauth2Provider: config.provider,
      oauth2ClientId: config.clientId,
      oauth2ClientSecret: '',
      oauth2AgentId: config.agentId,
      oauth2AuthorizeUrl: config.authorizeUrl,
      oauth2TokenUrl: config.tokenUrl,
      oauth2UserinfoUrl: config.userinfoUrl,
      oauth2Scope: config.scope,
      oauth2UsePkce: !!config.usePkce,
      oauth2AuthMethod: config.authMethod || 'post',
      oauth2Mapping: isCustom
        ? { ...CUSTOM_OAUTH2_DEFAULT_MAPPING, ...(config.fieldMapping ?? {}) }
        : undefined,
    });
  }

  if (info.type === AuthIdpTypeEnum.Wechat) {
    values.wechatMode = config.mode;
    values.wechatAppId = config.appId;
    values.wechatAppSecret = '';
  }

  return values;
}

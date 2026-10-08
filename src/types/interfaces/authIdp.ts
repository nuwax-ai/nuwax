/** 登录方式类型 */
export enum AuthIdpTypeEnum {
  Cas = 'CAS',
  OAuth2 = 'OAUTH2',
  Wechat = 'WECHAT',
}

/** 标准 OAuth2 提供方 */
export enum AuthIdpOAuth2ProviderEnum {
  Feishu = 'FEISHU',
  Wecom = 'WECOM',
  Dingtalk = 'DINGTALK',
  Github = 'GITHUB',
  Custom = 'CUSTOM',
}

/** 微信登录形态：网站扫码 / 公众号网页授权（两种形态各配一行） */
export enum AuthIdpWechatModeEnum {
  QrCode = 'QRCODE',
  OA = 'OA',
}

/** 字段映射：平台字段 ← IdP 返回属性名 */
export type AuthIdpFieldMapping = Record<string, string>;

export interface AuthIdpCasConfig {
  serverUrl: string;
  /** key：userName / nickName / email / phone */
  fieldMapping?: AuthIdpFieldMapping;
}

export interface AuthIdpOAuth2Config {
  provider: AuthIdpOAuth2ProviderEnum;
  /** 企业微信为 corpid */
  clientId: string;
  /** 回显为 ******；编辑时不传表示不修改 */
  clientSecret?: string;
  /** 企业微信必填 */
  agentId?: string;
  /** 以下仅 CUSTOM */
  authorizeUrl?: string;
  tokenUrl?: string;
  userinfoUrl?: string;
  /** 空格分隔 */
  scope?: string;
  usePkce?: boolean;
  /** post（默认）/ basic */
  authMethod?: string;
  /** key：externalId / userName / nickName / email / avatar */
  fieldMapping?: AuthIdpFieldMapping;
}

export interface AuthIdpWechatConfig {
  mode: AuthIdpWechatModeEnum;
  appId: string;
  /** 回显为 ******；编辑时不传表示不修改 */
  appSecret?: string;
}

/** 管理端列表项（config 已脱敏，结构随 type 变化） */
export interface AuthIdpInfo {
  id: number;
  type: AuthIdpTypeEnum;
  typeDesc?: string;
  name: string;
  icon?: string;
  /** 1 启用 / 0 停用 */
  enabled: number;
  /** 未登录自动跳转：1 是（租户内唯一） */
  autoRedirect: number;
  /** 自动注册/绑定：1 免中间页 */
  autoRegisterBind: number;
  sort?: number;
  config?: Partial<
    AuthIdpCasConfig & AuthIdpOAuth2Config & AuthIdpWechatConfig
  >;
  /** 平台回调地址（只读，登记到 IdP 侧） */
  callbackUrl?: string;
}

/** 新增 / 编辑参数（只带当前类型的 config 段） */
export interface AuthIdpSaveParams {
  id?: number;
  type: AuthIdpTypeEnum;
  name: string;
  icon?: string;
  sort?: number;
  autoRegisterBind?: number;
  casConfig?: AuthIdpCasConfig;
  oauth2Config?: AuthIdpOAuth2Config;
  wechatConfig?: AuthIdpWechatConfig;
}

/** 登录页可用的三方登录方式 */
export interface AuthIdpLoginItem {
  /** 发起授权时作 provider 参数 */
  id: number;
  type: AuthIdpTypeEnum;
  name: string;
  icon?: string;
  /** 仅 WECHAT 有值 */
  wechatMode?: AuthIdpWechatModeEnum | null;
}

export interface AuthIdpLoginList {
  items: AuthIdpLoginItem[];
  /** 未登录自动跳转的登录方式 ID，未设置为 null */
  autoRedirectIdpId?: number | null;
}

/** 当前用户绑定的外部身份 */
export interface UserIdentityInfo {
  /** 绑定关系 ID（解绑用） */
  id: number;
  idpId: number;
  idpType: AuthIdpTypeEnum;
  /** 配置已删除时为空 */
  providerName?: string;
  externalUserName?: string;
  externalIdMasked?: string;
  lastLoginTime?: string;
  created?: string;
}

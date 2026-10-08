import {
  AuthIdpOAuth2ProviderEnum,
  AuthIdpTypeEnum,
  AuthIdpWechatModeEnum,
  type AuthIdpInfo,
} from '@/types/interfaces/authIdp';
import { describe, expect, it } from 'vitest';
import {
  CUSTOM_OAUTH2_DEFAULT_MAPPING,
  fromAuthIdpInfo,
  toAuthIdpSavePayload,
  type AuthIdpFormValues,
} from './utils';

const base: AuthIdpFormValues = {
  type: AuthIdpTypeEnum.Cas,
  name: '  企业统一认证 ',
  icon: '',
  sort: 1,
  autoRegisterBind: false,
};

describe('toAuthIdpSavePayload', () => {
  it('CAS 只带 casConfig，字段映射去掉空值，名称去空白', () => {
    const payload = toAuthIdpSavePayload({
      ...base,
      casServerUrl: ' https://sso.example.com/cas ',
      casMapping: { userName: 'uid', nickName: ' ', email: 'mail', phone: '' },
      // 切换类型残留的其它段不应带出
      oauth2ClientId: 'leftover',
    });
    expect(payload).toEqual({
      type: AuthIdpTypeEnum.Cas,
      name: '企业统一认证',
      icon: undefined,
      sort: 1,
      autoRegisterBind: 0,
      casConfig: {
        serverUrl: 'https://sso.example.com/cas',
        fieldMapping: { userName: 'uid', email: 'mail' },
      },
    });
  });

  it('CAS 映射全空时不传 fieldMapping', () => {
    const payload = toAuthIdpSavePayload({
      ...base,
      casServerUrl: 'https://sso.example.com/cas',
      casMapping: { userName: '' },
    });
    expect(payload.casConfig).toEqual({
      serverUrl: 'https://sso.example.com/cas',
    });
  });

  it('OAuth2 非自定义提供方不带 CUSTOM 字段；secret 为空或掩码时不传', () => {
    for (const secret of ['', '  ', '******', undefined]) {
      const payload = toAuthIdpSavePayload({
        ...base,
        id: 2,
        type: AuthIdpTypeEnum.OAuth2,
        oauth2Provider: AuthIdpOAuth2ProviderEnum.Feishu,
        oauth2ClientId: 'cli_x',
        oauth2ClientSecret: secret,
        oauth2AuthorizeUrl: 'https://leftover',
        autoRegisterBind: true,
      });
      expect(payload).toEqual({
        id: 2,
        type: AuthIdpTypeEnum.OAuth2,
        name: '企业统一认证',
        icon: undefined,
        sort: 1,
        autoRegisterBind: 1,
        oauth2Config: {
          provider: AuthIdpOAuth2ProviderEnum.Feishu,
          clientId: 'cli_x',
        },
      });
    }
  });

  it('企业微信带 agentId', () => {
    const payload = toAuthIdpSavePayload({
      ...base,
      type: AuthIdpTypeEnum.OAuth2,
      oauth2Provider: AuthIdpOAuth2ProviderEnum.Wecom,
      oauth2ClientId: 'corp',
      oauth2ClientSecret: 's3cret',
      oauth2AgentId: ' 1000002 ',
    });
    expect(payload.oauth2Config).toEqual({
      provider: AuthIdpOAuth2ProviderEnum.Wecom,
      clientId: 'corp',
      clientSecret: 's3cret',
      agentId: '1000002',
    });
  });

  it('自定义提供方带端点、PKCE、凭证方式与非空映射', () => {
    const payload = toAuthIdpSavePayload({
      ...base,
      type: AuthIdpTypeEnum.OAuth2,
      oauth2Provider: AuthIdpOAuth2ProviderEnum.Custom,
      oauth2ClientId: 'id',
      oauth2ClientSecret: 'secret',
      oauth2AuthorizeUrl: 'https://idp/authorize',
      oauth2TokenUrl: 'https://idp/token',
      oauth2UserinfoUrl: 'https://idp/userinfo',
      oauth2Scope: ' openid  profile ',
      oauth2UsePkce: true,
      oauth2AuthMethod: 'basic',
      oauth2Mapping: { externalId: 'id', userName: '', email: 'mail' },
    });
    expect(payload.oauth2Config).toEqual({
      provider: AuthIdpOAuth2ProviderEnum.Custom,
      clientId: 'id',
      clientSecret: 'secret',
      authorizeUrl: 'https://idp/authorize',
      tokenUrl: 'https://idp/token',
      userinfoUrl: 'https://idp/userinfo',
      scope: 'openid profile',
      usePkce: true,
      authMethod: 'basic',
      fieldMapping: { externalId: 'id', email: 'mail' },
    });
  });

  it('微信只带 wechatConfig；appSecret 掩码不传', () => {
    const payload = toAuthIdpSavePayload({
      ...base,
      id: 4,
      type: AuthIdpTypeEnum.Wechat,
      wechatMode: AuthIdpWechatModeEnum.OA,
      wechatAppId: 'wx1',
      wechatAppSecret: '******',
    });
    expect(payload.wechatConfig).toEqual({
      mode: AuthIdpWechatModeEnum.OA,
      appId: 'wx1',
    });
    expect(payload.casConfig).toBeUndefined();
    expect(payload.oauth2Config).toBeUndefined();
  });
});

describe('fromAuthIdpInfo', () => {
  const info = (patch: Partial<AuthIdpInfo>): AuthIdpInfo => ({
    id: 1,
    type: AuthIdpTypeEnum.OAuth2,
    name: 'GitHub 登录',
    icon: 'https://icon',
    enabled: 1,
    autoRedirect: 0,
    autoRegisterBind: 1,
    sort: 3,
    ...patch,
  });

  it('OAuth2 回显不回填掩码 secret', () => {
    const values = fromAuthIdpInfo(
      info({
        config: {
          provider: AuthIdpOAuth2ProviderEnum.Github,
          clientId: 'Ov23',
          clientSecret: '******',
        },
      }),
    );
    expect(values).toMatchObject({
      id: 1,
      type: AuthIdpTypeEnum.OAuth2,
      name: 'GitHub 登录',
      icon: 'https://icon',
      sort: 3,
      autoRegisterBind: true,
      oauth2Provider: AuthIdpOAuth2ProviderEnum.Github,
      oauth2ClientId: 'Ov23',
      oauth2ClientSecret: '',
    });
  });

  it('CAS 回显服务地址与映射', () => {
    const values = fromAuthIdpInfo(
      info({
        type: AuthIdpTypeEnum.Cas,
        autoRegisterBind: 0,
        config: {
          serverUrl: 'http://cas',
          fieldMapping: { userName: 'uid', phone: 'mobile' },
        },
      }),
    );
    expect(values).toMatchObject({
      casServerUrl: 'http://cas',
      casMapping: { userName: 'uid', phone: 'mobile' },
      autoRegisterBind: false,
    });
  });

  it('自定义 OAuth2 映射缺省时回显默认映射，保存后原样回传', () => {
    const values = fromAuthIdpInfo(
      info({
        config: {
          provider: AuthIdpOAuth2ProviderEnum.Custom,
          clientId: 'x',
          clientSecret: '******',
        },
      }),
    );
    expect(values.oauth2Mapping).toEqual(CUSTOM_OAUTH2_DEFAULT_MAPPING);
    expect(values.oauth2AuthMethod).toBe('post');
  });

  it('微信回显形态与 AppID', () => {
    const values = fromAuthIdpInfo(
      info({
        type: AuthIdpTypeEnum.Wechat,
        config: {
          mode: AuthIdpWechatModeEnum.OA,
          appId: 'wx',
          appSecret: '******',
        },
      }),
    );
    expect(values).toMatchObject({
      wechatMode: AuthIdpWechatModeEnum.OA,
      wechatAppId: 'wx',
      wechatAppSecret: '',
    });
  });
});

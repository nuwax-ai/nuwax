import { dict } from '@/services/i18nRuntime';
import {
  AuthIdpOAuth2ProviderEnum,
  AuthIdpTypeEnum,
  AuthIdpWechatModeEnum,
} from '@/types/interfaces/authIdp';

/** 类型标签颜色 */
export const TYPE_COLOR: Record<AuthIdpTypeEnum, string> = {
  [AuthIdpTypeEnum.Cas]: 'blue',
  [AuthIdpTypeEnum.OAuth2]: 'green',
  [AuthIdpTypeEnum.Wechat]: 'orange',
};

// 文案运行时读取，保证切换语言后生效
export const getTypeOptions = () => [
  {
    label: dict('PC.Pages.SystemAuthMethod.typeCas'),
    value: AuthIdpTypeEnum.Cas,
  },
  {
    label: dict('PC.Pages.SystemAuthMethod.typeOAuth2'),
    value: AuthIdpTypeEnum.OAuth2,
  },
  {
    label: dict('PC.Pages.SystemAuthMethod.typeWechat'),
    value: AuthIdpTypeEnum.Wechat,
  },
];

export const getOAuth2ProviderOptions = () => [
  {
    label: dict('PC.Pages.SystemAuthMethod.providerFeishu'),
    value: AuthIdpOAuth2ProviderEnum.Feishu,
  },
  {
    label: dict('PC.Pages.SystemAuthMethod.providerWecom'),
    value: AuthIdpOAuth2ProviderEnum.Wecom,
  },
  {
    label: dict('PC.Pages.SystemAuthMethod.providerDingtalk'),
    value: AuthIdpOAuth2ProviderEnum.Dingtalk,
  },
  { label: 'GitHub', value: AuthIdpOAuth2ProviderEnum.Github },
  {
    label: dict('PC.Pages.SystemAuthMethod.providerCustom'),
    value: AuthIdpOAuth2ProviderEnum.Custom,
  },
];

export const getWechatModeOptions = () => [
  {
    label: dict('PC.Pages.SystemAuthMethod.wechatQrCode'),
    value: AuthIdpWechatModeEnum.QrCode,
  },
  {
    label: dict('PC.Pages.SystemAuthMethod.wechatOA'),
    value: AuthIdpWechatModeEnum.OA,
  },
];

export const labelOf = (
  options: { label: string; value: string }[],
  value?: string,
) => options.find((o) => o.value === value)?.label ?? value ?? '--';

import { dict } from '@/services/i18nRuntime';

/**
 * IM 机器人平台类型
 */
export enum IMPlatformEnum {
  Feishu = 'feishu',
  Dingtalk = 'dingtalk',
  Wework = 'wework',
  WechatIlink = 'wechat_ilink',
}

/**
 * IM 机器人 platform 展示名称
 */
export const IM_PLATFORM_LABEL_MAP: Record<IMPlatformEnum, string> = {
  [IMPlatformEnum.Feishu]: dict('PC.Constants.ImChannel.platformFeishu'),
  [IMPlatformEnum.Dingtalk]: dict('PC.Constants.ImChannel.platformDingtalk'),
  [IMPlatformEnum.Wework]: dict('PC.Constants.ImChannel.platformWework'),
  [IMPlatformEnum.WechatIlink]: dict('PC.Constants.ImChannel.platformWechat'),
};

/**
 * IM 机器人 platform 图标
 */
export const IM_PLATFORM_ICON_MAP: Record<IMPlatformEnum, string> = {
  [IMPlatformEnum.Feishu]: '/icon/brand/feishu.png',
  [IMPlatformEnum.Dingtalk]: '/icon/brand/dingtalk.png',
  [IMPlatformEnum.Wework]: '/icon/brand/wework.png',
  [IMPlatformEnum.WechatIlink]: '/icon/brand/wechat_ilink.png',
};

/**
 * 二维码生成 API
 */
export const QR_CODE_GENERATOR_URL =
  'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=';

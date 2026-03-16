/**
 * IM 机器人平台类型
 */
export enum IMPlatformEnum {
  Feishu = 'feishu',
  Dingtalk = 'dingtalk',
  Wework = 'wework',
}

/**
 * IM 机器人 platform 展示名称
 */
export const IM_PLATFORM_LABEL_MAP: Record<IMPlatformEnum, string> = {
  [IMPlatformEnum.Feishu]: '飞书',
  [IMPlatformEnum.Dingtalk]: '钉钉',
  [IMPlatformEnum.Wework]: '企业微信',
};

/**
 * IM 机器人 platform 图标
 */
export const IM_PLATFORM_ICON_MAP: Record<IMPlatformEnum, string> = {
  [IMPlatformEnum.Feishu]: '/icon/brand/feishu.png',
  [IMPlatformEnum.Dingtalk]: '/icon/brand/dingtalk.png',
  [IMPlatformEnum.Wework]: '/icon/brand/wework.png',
};

// 为主题配置添加类型
import type { AliasToken } from 'antd/es/theme/interface';

const themeTokens: Partial<AliasToken> = {
  // 品牌主色 - 项目主色调
  colorPrimary: '#5147ff',

  // 功能色
  colorSuccess: '#3bb346',
  colorWarning: '#fc8800',
  colorError: '#f93920',
  colorInfo: '#0077fa',

  // 基础色 - 用于派生文本和背景色
  colorTextBase: '#15171f',
  colorBgBase: '#ffffff',

  // 超链接颜色
  colorLink: '#5147ff',

  // 字体配置
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  fontFamilyCode:
    'Monaco, "Menlo", "Ubuntu Mono", "Consolas", "Liberation Mono", "Courier New", monospace',

  // 字号配置
  fontSize: 14,

  // 线条配置
  lineWidth: 1,
  lineType: 'solid',

  // 圆角配置
  borderRadius: 8,

  // 尺寸配置
  sizeUnit: 4,
  sizeStep: 4,
  sizePopupArrow: 8,

  // 控制组件高度
  controlHeight: 32,

  // Z轴配置
  zIndexBase: 0,
  zIndexPopupBase: 1000,

  // // 图片透明度
  opacityImage: 1,

  // 动画配置
  motionUnit: 0.1,
  motionBase: 0,
  // motionEaseOutCirc: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
  // motionEaseInOutCirc: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
  // motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  // motionEaseOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  // motionEaseInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  // motionEaseInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
  // motionEaseOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  // motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',

  // 风格配置
  wireframe: false,
  motion: true,

  // 预设颜色
  blue: '#1890ff',
  purple: '#722ed1',
  cyan: '#13c2c2',
  green: '#52c41a',
  magenta: '#eb2f96',
  pink: '#eb2f96',
  red: '#f5222d',
  orange: '#fa8c16',
  yellow: '#fadb14',
  volcano: '#fa541c',
  geekblue: '#2f54eb',
  lime: '#a0d911',
  gold: '#faad14',
};

export default themeTokens;

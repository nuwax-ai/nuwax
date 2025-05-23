// 为主题配置添加类型
import type { AliasToken } from 'antd/es/theme/interface';

const themeTokens: Partial<AliasToken> = {
  // 主色调配置
  colorPrimary: '#5147FF', // 主色
  colorSuccess: '#00B23C', // 成功色
  colorWarning: '#FF8C00', // 警告色
  colorError: '#FF4D4F', // 错误色
  colorInfo: '#1890FF', // 信息色

  colorPrimaryHover: '#4538FF',
  colorPrimaryActive: '#412BFF',
  colorSuccessHover: '#00A838',

  // 边框和圆角
  borderRadius: 8, // 全局圆角
  borderRadiusLG: 12, // 大圆角
  borderRadiusSM: 4, // 小圆角

  // 字体配置
  fontSize: 14, // 基础字体大小
  fontSizeLG: 16, // 大字体
  fontSizeSM: 12, // 小字体
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',

  // 间距配置
  padding: 16, // 基础内边距
  paddingLG: 24, // 大内边距
  paddingSM: 12, // 小内边距
  margin: 16, // 基础外边距

  // 阴影配置
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.15)',

  // 线条配置
  lineWidth: 1, // 边框宽度
  lineType: 'solid', // 边框类型

  // 控制组件配置
  controlHeight: 32, // 控件高度
  controlHeightLG: 40, // 大控件高度
  controlHeightSM: 24, // 小控件高度
};

export default themeTokens;

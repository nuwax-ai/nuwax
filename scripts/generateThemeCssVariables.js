const fs = require('fs');
const path = require('path');

// 手动导入主题配置（因为是 JS 文件，需要转换）
const themeTokens = {
  colorPrimary: '#5147FF',
  colorSuccess: '#00B23C',
  colorWarning: '#FF8C00',
  colorError: '#FF4D4F',
  colorInfo: '#1890FF',
  colorPrimaryHover: '#4538FF',
  colorPrimaryActive: '#412BFF',
  colorSuccessHover: '#00A838',
  borderRadius: 8,
  borderRadiusLG: 12,
  borderRadiusSM: 4,
  fontSize: 14,
  fontSizeLG: 16,
  fontSizeSM: 12,
  padding: 16,
  paddingLG: 24,
  paddingSM: 12,
  margin: 16,
  controlHeight: 32,
  controlHeightLG: 40,
  controlHeightSM: 24,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

const generateThemeCssVariables = () => {
  // 1. 生成 CSS 变量文件（:root）
  const cssVariablesContent = `
/* 自动生成的 CSS 变量文件 - 请勿手动修改 */
/* 生成时间: ${new Date().toLocaleString()} */

:root {
  /* 主色调 */
  --xagi-primary-color: ${themeTokens.colorPrimary};
  --xagi-primary-color-hover: ${themeTokens.colorPrimaryHover};
  --xagi-primary-color-active: ${themeTokens.colorPrimaryActive};
  --xagi-primary-color-selected: rgba(81, 71, 255, 0.1);
  --xagi-primary-color-disabled: rgba(150, 159, 255, 0.5);
  
  /* 功能色 */
  --xagi-success-color: ${themeTokens.colorSuccess};
  --xagi-success-color-hover: ${themeTokens.colorSuccessHover};
  --xagi-warning-color: ${themeTokens.colorWarning};
  --xagi-error-color: ${themeTokens.colorError};
  --xagi-info-color: ${themeTokens.colorInfo};
  
  /* 边框和圆角 */
  --xagi-border-radius: ${themeTokens.borderRadius}px;
  --xagi-border-radius-lg: ${themeTokens.borderRadiusLG}px;
  --xagi-border-radius-sm: ${themeTokens.borderRadiusSM}px;
  --xagi-border-color-base: rgba(68, 83, 130, 0.25);
  
  /* 字体 */
  --xagi-font-size: ${themeTokens.fontSize}px;
  --xagi-font-size-lg: ${themeTokens.fontSizeLG}px;
  --xagi-font-size-sm: ${themeTokens.fontSizeSM}px;
  
  /* 间距 */
  --xagi-padding: ${themeTokens.padding}px;
  --xagi-padding-lg: ${themeTokens.paddingLG}px;
  --xagi-padding-sm: ${themeTokens.paddingSM}px;
  --xagi-margin: ${themeTokens.margin}px;
  
  /* 控件高度 */
  --xagi-control-height: ${themeTokens.controlHeight}px;
  --xagi-control-height-lg: ${themeTokens.controlHeightLG}px;
  --xagi-control-height-sm: ${themeTokens.controlHeightSM}px;
  
  /* 阴影 */
  --xagi-box-shadow: ${themeTokens.boxShadow};
  --xagi-box-shadow-secondary: ${themeTokens.boxShadowSecondary};
}
`;

  // 2. 生成 Less 变量文件
  const lessVariablesContent = `
/* 自动生成的 Less 变量文件 - 请勿手动修改 */
/* 生成时间: ${new Date().toLocaleString()} */
/* 使用方式: @import 'styles/themeVariables.less'; */

/* 主色调变量 */
@xagi-primary-color: var(--xagi-primary-color);
@xagi-primary-color-hover: var(--xagi-primary-color-hover);
@xagi-primary-color-active: var(--xagi-primary-color-active);
@xagi-primary-color-selected: var(--xagi-primary-color-selected);
@xagi-primary-color-disabled: var(--xagi-primary-color-disabled);

/* 功能色变量 */
@xagi-success-color: var(--xagi-success-color);
@xagi-success-color-hover: var(--xagi-success-color-hover);
@xagi-warning-color: var(--xagi-warning-color);
@xagi-error-color: var(--xagi-error-color);
@xagi-info-color: var(--xagi-info-color);

/* 边框和圆角变量 */
@xagi-border-radius: var(--xagi-border-radius);
@xagi-border-radius-lg: var(--xagi-border-radius-lg);
@xagi-border-radius-sm: var(--xagi-border-radius-sm);
@xagi-border-color-base: var(--xagi-border-color-base);

/* 字体变量 */
@xagi-font-size: var(--xagi-font-size);
@xagi-font-size-lg: var(--xagi-font-size-lg);
@xagi-font-size-sm: var(--xagi-font-size-sm);

/* 间距变量 */
@xagi-padding: var(--xagi-padding);
@xagi-padding-lg: var(--xagi-padding-lg);
@xagi-padding-sm: var(--xagi-padding-sm);
@xagi-margin: var(--xagi-margin);

/* 控件高度变量 */
@xagi-control-height: var(--xagi-control-height);
@xagi-control-height-lg: var(--xagi-control-height-lg);
@xagi-control-height-sm: var(--xagi-control-height-sm);

/* 阴影变量 */
@xagi-box-shadow: var(--xagi-box-shadow);
@xagi-box-shadow-secondary: var(--xagi-box-shadow-secondary);

/* 常用组合变量 */
@xagi-button-border-radius: @xagi-border-radius;
@xagi-card-border-radius: @xagi-border-radius-lg;
@xagi-input-border-radius: @xagi-border-radius;

/* 响应式断点（可选） */
@xagi-screen-xs: 480px;
@xagi-screen-sm: 576px;
@xagi-screen-md: 768px;
@xagi-screen-lg: 992px;
@xagi-screen-xl: 1200px;
@xagi-screen-xxl: 1600px;
`;

  // 3. 写入文件
  const cssVariablesPath = path.join(
    __dirname,
    '../src/styles/themeCssVariables.less',
  );
  const lessVariablesPath = path.join(
    __dirname,
    '../src/styles/themeVariables.less',
  );

  fs.writeFileSync(cssVariablesPath, cssVariablesContent.trim());
  fs.writeFileSync(lessVariablesPath, lessVariablesContent.trim());

  console.log('✅ CSS 变量文件已生成:', cssVariablesPath);
  console.log('✅ Less 变量文件已生成:', lessVariablesPath);
};

generateThemeCssVariables();

const fs = require('fs');
const path = require('path');

// 手动导入主题配置（因为是 JS 文件，需要转换）
const themeTokens = {
  colorPrimary: '#5147ff',
  colorSuccess: '#00b23c',
  colorWarning: '#ff8c00',
  colorError: '#ff4d4f',
  colorInfo: '#1890ff',
  colorPrimaryHover: '#4538ff',
  colorPrimaryActive: '#412bff',
  colorSuccessHover: '#00a838',
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
  boxShadow: '0 2px 8px rgba(0, 0, 0, 15%)',
  boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 15%)',
};

/**
 * 标准化内容，移除多余的空格和换行符
 * @param {string} content - 原始内容
 * @returns {string} - 标准化后的内容
 */
const normalizeContent = (content) => {
  return content
    .replace(/\s+/g, ' ') // 将多个空白字符（包括换行、制表符等）替换为单个空格
    .replace(/\s*{\s*/g, '{') // 移除大括号前后的空格
    .replace(/\s*}\s*/g, '}') // 移除大括号前后的空格
    .replace(/\s*:\s*/g, ':') // 移除冒号前后的空格
    .replace(/\s*;\s*/g, ';') // 移除分号前后的空格
    .replace(/\s*,\s*/g, ',') // 移除逗号前后的空格
    .trim(); // 移除首尾空格
};

/**
 * 检查文件是否存在并比较内容(排除生成时间的影响)
 * @param {string} filePath - 文件路径
 * @param {string} newContent - 新内容
 * @returns {boolean} - 是否需要更新文件
 */
const shouldUpdateFile = (filePath, newContent) => {
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.log(`📁 文件不存在，将创建新文件: ${filePath}`);
    return true;
  }

  // 文件存在，比较内容（忽略空格和换行符差异）
  const existingContent = fs.readFileSync(filePath, 'utf-8');

  // 标准化内容后再比较
  const normalizedExistingContent = normalizeContent(existingContent);
  const normalizedNewContent = normalizeContent(newContent);

  if (normalizedExistingContent === normalizedNewContent) {
    console.log(`🔄 文件内容一致，无需更新: ${filePath}`);
    return false;
  }

  console.log(`📝 文件内容不一致，需要更新: ${filePath}`);
  console.log(`📊 现有内容长度: ${normalizedExistingContent.length}`);
  console.log(`📊 新内容长度: ${normalizedNewContent.length}`);
  return true;
};

/**
 * 写入文件，如果需要更新
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 * @returns {boolean} - 是否写入了文件
 */
const writeFileIfNeeded = (filePath, content) => {
  // 确保目录存在
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 创建目录: ${dirPath}`);
  }

  // 检查是否需要更新文件
  if (shouldUpdateFile(filePath, content)) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ 文件已更新: ${filePath}`);
    return true;
  }

  return false;
};

const generateThemeCssVariables = () => {
  // 1. 生成 CSS 变量文件（:root）
  const cssVariablesContent = `
/* 自动生成的 CSS 变量文件 - 请勿手动修改 */

:root {
  /* 主色调 */
  --xagi-primary-color: ${themeTokens.colorPrimary};
  --xagi-primary-color-hover: ${themeTokens.colorPrimaryHover};
  --xagi-primary-color-active: ${themeTokens.colorPrimaryActive};
  --xagi-primary-color-selected: rgba(81, 71, 255, 10%);
  --xagi-primary-color-disabled: rgba(150, 159, 255, 50%);
  
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
  --xagi-border-color-base: rgba(68, 83, 130, 25%);
  
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

  // 3. 确定文件路径
  const cssVariablesPath = path.join(
    __dirname,
    '../src/styles/themeCssVariables.less',
  );
  const lessVariablesPath = path.join(
    __dirname,
    '../src/styles/themeVariables.less',
  );

  // 4. 写入文件（如果需要）
  let cssUpdated = writeFileIfNeeded(
    cssVariablesPath,
    cssVariablesContent.trim(),
  );
  let lessUpdated = writeFileIfNeeded(
    lessVariablesPath,
    lessVariablesContent.trim(),
  );

  // 5. 输出总结
  if (cssUpdated || lessUpdated) {
    console.log('🎉 主题变量文件已更新');
  } else {
    console.log('✨ 所有文件内容已是最新，无需更新');
  }
};

generateThemeCssVariables();

const fs = require('fs');
const path = require('path');

/**
 * 生成版本信息常量文件
 * 从 package.json 读取版本信息并生成 TypeScript 常量文件
 */
const generateVersion = () => {
  try {
    // 读取 package.json
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const appName = packageJson.name || 'unknown';
    const appVersion = packageJson.version || '0.0.0';

    // 生成版本常量文件内容
    const versionContent = `/**
 * 应用版本信息
 * 此文件由 scripts/generate-version.js 自动生成，请勿手动修改
 */
export const APP_VERSION = '${appVersion}';
export const APP_NAME = '${appName}';
`;

    // 确定输出文件路径
    const versionFilePath = path.join(__dirname, '../src/constants/version.ts');

    // 确保目录存在
    const dirPath = path.dirname(versionFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 创建目录: ${dirPath}`);
    }

    // 检查文件是否存在以及内容是否相同
    let shouldWrite = true;
    if (fs.existsSync(versionFilePath)) {
      const existingContent = fs.readFileSync(versionFilePath, 'utf-8');
      if (existingContent === versionContent) {
        shouldWrite = false;
        console.log('✨ 版本文件内容已是最新，无需更新');
      }
    }

    // 写入文件
    if (shouldWrite) {
      fs.writeFileSync(versionFilePath, versionContent, 'utf-8');
      console.log(`✅ 版本文件已更新: ${versionFilePath}`);
      console.log(`📦 应用名称: ${appName}`);
      console.log(`🔖 版本号: ${appVersion}`);
    }
  } catch (error) {
    console.error('❌ 生成版本文件失败:', error);
    process.exit(1);
  }
};

generateVersion();

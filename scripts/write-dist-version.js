const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 构建后向 dist/ 写入 version.json（umi build 会清空 dist，故必须 post 钩子执行）。
 * 消费方：Electron 壳关于页「本地化（loopback）内置版本」
 * （src/main/services/frontendDistVersion.ts 读取）。
 */
const writeDistVersion = () => {
  try {
    const root = path.join(__dirname, '..');
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
    );
    let gitHash = '';
    try {
      gitHash = execSync('git rev-parse --short HEAD', {
        cwd: root,
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
    } catch {
      // 非 git 环境容错
    }
    const payload = {
      name: packageJson.name || 'nuwax-frontend',
      version: packageJson.version || '0.0.0',
      ...(gitHash ? { gitHash } : {}),
      buildAt: new Date().toISOString(),
    };
    const distDir = path.join(root, 'dist');
    if (!fs.existsSync(distDir)) {
      console.error('❌ dist/ 不存在，请先执行构建');
      process.exit(1);
    }
    fs.writeFileSync(
      path.join(distDir, 'version.json'),
      JSON.stringify(payload, null, 2) + '\n',
      'utf8',
    );
    console.log('✅ dist/version.json 已写入:', JSON.stringify(payload));
  } catch (error) {
    console.error('❌ 写入 dist/version.json 失败:', error);
    process.exit(1);
  }
};

writeDistVersion();

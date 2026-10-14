const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

/**
 * 构建后将同一份构建信息写入 version.json 和入口 HTML（不改变业务 JS 哈希）。
 * HTML 标记代表当前页面实际版本；version.json 可独立检查部署的最新版本。
 */
const escapeAttribute = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[character]),
  );

const withBuildMetadata = (html, payload) => {
  if (!/<head\b[^>]*>[\s\S]*?<\/head\s*>/i.test(html)) {
    throw new Error('dist/index.html 缺少 head，无法写入构建标记');
  }
  return html.replace(
    /(<head\b[^>]*>)([\s\S]*?)(<\/head\s*>)/i,
    (_head, open, body, close) => {
      // 重跑时清除旧标记；无 git 环境也不能把上次构建的 hash 留在新入口中。
      const clean = body.replace(/<meta\b[^>]*>\s*/gi, (tag) =>
        /\bname\s*=\s*(["'])nuwax-build-(?:git-hash|version|at)\1/i.test(tag)
          ? ''
          : tag,
      );
      const tags = [
        `<meta name="nuwax-build-version" content="${escapeAttribute(
          payload.version,
        )}">`,
        ...(payload.buildAt
          ? [
              `<meta name="nuwax-build-at" content="${escapeAttribute(
                payload.buildAt,
              )}">`,
            ]
          : []),
        ...(payload.gitHash
          ? [
              `<meta name="nuwax-build-git-hash" content="${escapeAttribute(
                payload.gitHash,
              )}">`,
            ]
          : []),
      ].join('');
      // 必须先于 head 中任何同步脚本，供入口模块求值时固定当前页面版本。
      // 标准入口的 charset 仍保持第一个标记。
      const leadingCharset =
        clean.match(
          /^\s*<meta\b[^>]*\bcharset\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)[^>]*>\s*/i,
        )?.[0] || '';
      return `${open}${leadingCharset}${tags}${clean.slice(
        leadingCharset.length,
      )}${close}`;
    },
  );
};

const writeDistVersion = ({
  root = path.join(__dirname, '..'),
  distDir = path.join(root, 'dist'),
  buildAt = new Date().toISOString(),
  resolveGitHash = () =>
    execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim(),
} = {}) => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
  );
  let gitHash = '';
  try {
    const resolved = resolveGitHash();
    if (typeof resolved === 'string' && /^[0-9a-f]{7,40}$/i.test(resolved))
      gitHash = resolved;
  } catch {
    /* 非 Git 环境不伪造版本 */
  }
  const payload = {
    name: packageJson.name || 'nuwax-frontend',
    version: packageJson.version || '0.0.0',
    ...(gitHash ? { gitHash } : {}),
    buildAt,
  };
  const indexFile = path.join(distDir, 'index.html');
  // 先验证入口，避免只更新 version.json 后错误地报告构建成功。
  const html = withBuildMetadata(fs.readFileSync(indexFile, 'utf8'), payload);
  fs.writeFileSync(indexFile, html, 'utf8');
  fs.writeFileSync(
    path.join(distDir, 'version.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  );
  console.log(
    '✅ dist/version.json 与入口构建标记已写入:',
    JSON.stringify(payload),
  );
  return payload;
};

module.exports = { withBuildMetadata, writeDistVersion };

if (require.main === module) {
  try {
    writeDistVersion();
  } catch (error) {
    console.error('❌ 写入 dist 构建信息失败:', error);
    process.exit(1);
  }
}

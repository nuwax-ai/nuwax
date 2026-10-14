const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// M 端产物来源。提测链默认走内网 gitlab；GitHub 只是镜像，两边同名分支内容并不一致。
// 用环境变量 MOBILE_BUILD_SOURCE / MOBILE_BUILD_BRANCH 指定：npm run 的附加参数只会落到
// 复合命令最后一段（build:prod:m 的尾巴是 deploy-asset-retention），传不到本脚本。
const REPOSITORIES = {
  gitlab:
    'https://git.yichamao.com/agent-platform/agent-platform-front-weapp.git',
  github: 'https://github.com/nuwax-ai/nuwax-mobile.git',
};
const DEFAULT_BRANCH = 'feat/nuwa-zhuoda-2026.09.30';
const TARGET_DIR = 'unpackage/dist/build/web';
const DIST_M_DIR = path.join(__dirname, '../dist/m');

/**
 * 解析 M 端产物来源：环境变量 > 位置参数（兼容直接 node 调用）> 默认值。
 *
 * @param {string[]} argv 位置参数
 * @param {Record<string, string | undefined>} env 环境变量
 * @returns {{ source: string, branch: string, repoUrl: string }}
 */
function resolveMobileBuildOptions(argv = [], env = {}) {
  const envSource = String(env.MOBILE_BUILD_SOURCE ?? '')
    .trim()
    .toLowerCase();
  if (envSource && !REPOSITORIES[envSource]) {
    throw new Error(
      `MOBILE_BUILD_SOURCE 只支持 ${Object.keys(REPOSITORIES).join(
        ' / ',
      )}，收到：${envSource}`,
    );
  }
  const argSource = argv.find((a) => REPOSITORIES[a]);
  const source = envSource || argSource || 'gitlab';
  const branch =
    String(env.MOBILE_BUILD_BRANCH ?? '').trim() ||
    argv.find((a) => !REPOSITORIES[a]) ||
    DEFAULT_BRANCH;
  return { source, branch, repoUrl: REPOSITORIES[source] };
}

function copyRecursiveSync(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function downloadDirectory({ source, branch, repoUrl }) {
  console.log(
    `📡 Fetching mobile build from ${source} ${repoUrl}@${branch}/${TARGET_DIR}...`,
  );
  fs.mkdirSync(DIST_M_DIR, { recursive: true });

  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' });
  } catch (err) {
    console.error(
      '❌ Git is required to download the directory. Please install Git.',
    );
    process.exit(1);
  }

  const TEMP_DIR = path.join(__dirname, '../.tmp_mobile_build');
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  try {
    console.log('🔄 Cloning repository (sparse checkout)...');
    execFileSync(
      'git',
      [
        'clone',
        '--filter=blob:none',
        '--no-checkout',
        '--depth',
        '1',
        '-b',
        branch,
        repoUrl,
        TEMP_DIR,
      ],
      { stdio: 'inherit' },
    );
    execFileSync('git', ['sparse-checkout', 'set', TARGET_DIR], {
      cwd: TEMP_DIR,
      stdio: 'inherit',
    });
    execFileSync('git', ['checkout'], { cwd: TEMP_DIR, stdio: 'inherit' });
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: TEMP_DIR,
      encoding: 'utf8',
    }).trim();

    const sourcePath = path.join(TEMP_DIR, TARGET_DIR);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(
        `Directory ${TARGET_DIR} not found in the repository branch ${branch}.`,
      );
    }
    console.log('📦 Moving files to dist/m...');
    copyRecursiveSync(sourcePath, DIST_M_DIR);
    console.log(
      `✅ Mobile build placed in dist/m/（来源 ${source}，${branch}@${commit}）`,
    );
  } catch (error) {
    console.error('❌ Error downloading mobile build:', error.message);
    process.exit(1);
  } finally {
    if (fs.existsSync(TEMP_DIR)) {
      console.log('🧹 Cleaning up temporary files...');
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  }
}

module.exports = { DEFAULT_BRANCH, REPOSITORIES, resolveMobileBuildOptions };

if (require.main === module) {
  let options;
  try {
    options = resolveMobileBuildOptions(process.argv.slice(2), process.env);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
  downloadDirectory(options);
}

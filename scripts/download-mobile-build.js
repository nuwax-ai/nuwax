const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// M 端产物来源：优先读本地 nuwax-mobile 检出的 origin 远端——各机器的远端拓扑由本地 git 配置
// 决定（origin 指向 GitHub 还是内网 GitLab 跟着本地配置走，M 端后续也会默认同步到 GitLab）；
// 本地没有该检出（普通用户打本包的常态）时回退 GitHub 的 nuwax-mobile 仓库。
// MOBILE_BUILD_REPO 可临时覆写；MOBILE_BUILD_BRANCH 覆写分支。
// 注意 npm run 的附加参数只会落到复合命令最后一段（build:prod:m 的尾巴是 deploy-asset-retention），传不到本脚本。
const MOBILE_DIR_NAME = 'nuwax-mobile';
const FALLBACK_REPO_URL = 'https://github.com/nuwax-ai/nuwax-mobile.git';
const DEFAULT_BRANCH = 'feat/nuwa-zhuoda-2026.09.30';
const TARGET_DIR = 'unpackage/dist/build/web';
const DIST_M_DIR = path.join(__dirname, '../dist/m');

function runGit(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

/**
 * 找本地 nuwax-mobile 检出并读它配置的 origin 远端地址；找不到返回 null（由调用方回退）。
 *
 * 借助 --git-common-dir 定位主工作区：deploy 在 .deploy-worktree 等链接 worktree 里
 * 跑构建时，兄弟目录以主检出的位置为准，而不是 worktree 自己的落点。
 *
 * @param {string} [repoRoot] nuwax 主仓检出根目录
 * @param {(args: string[], cwd: string) => string} [git] 执行 git 的函数（测试注入）
 * @returns {string | null} origin 远端地址；未检出 / 无 origin 时为 null
 */
function findLocalMobileOriginUrl(
  repoRoot = path.join(__dirname, '..'),
  git = runGit,
) {
  try {
    const gitCommonDir = git(
      ['rev-parse', '--git-common-dir'],
      repoRoot,
    ).trim();
    const mainRoot = path.resolve(repoRoot, gitCommonDir, '..');
    const mobileDir = path.resolve(mainRoot, '..', MOBILE_DIR_NAME);
    if (!fs.existsSync(mobileDir)) {
      return null;
    }
    return git(['remote', 'get-url', 'origin'], mobileDir).trim() || null;
  } catch {
    return null;
  }
}

/**
 * 解析 M 端产物来源：仓库地址 = MOBILE_BUILD_REPO > 本地 nuwax-mobile 的 origin >
 * GitHub nuwax-mobile 回退；分支 = MOBILE_BUILD_BRANCH > 位置参数（兼容直接 node 调用）> 默认值。
 *
 * @param {string[]} argv 位置参数（分支名）
 * @param {Record<string, string | undefined>} env 环境变量
 * @param {{ findOriginUrl?: () => string | null }} [injection] 测试注入
 * @returns {{ source: string, branch: string, repoUrl: string }}
 */
function resolveMobileBuildOptions(argv = [], env = {}, injection = {}) {
  const legacySource = String(env.MOBILE_BUILD_SOURCE ?? '').trim();
  if (legacySource) {
    throw new Error(
      'MOBILE_BUILD_SOURCE 已废弃：脚本不再配置 GitLab/GitHub 地址。' +
        'M 端产物源现在默认读本地 nuwax-mobile 检出的 origin 远端，需要覆写请用 MOBILE_BUILD_REPO=<仓库地址>',
    );
  }
  const branch =
    String(env.MOBILE_BUILD_BRANCH ?? '').trim() ||
    argv.find(Boolean) ||
    DEFAULT_BRANCH;
  const envRepo = String(env.MOBILE_BUILD_REPO ?? '').trim();
  if (envRepo) {
    return { source: 'MOBILE_BUILD_REPO', branch, repoUrl: envRepo };
  }
  const findOriginUrl = injection.findOriginUrl ?? findLocalMobileOriginUrl;
  const localUrl = findOriginUrl();
  if (localUrl) {
    return {
      source: `本地 ${MOBILE_DIR_NAME} origin`,
      branch,
      repoUrl: localUrl,
    };
  }
  console.warn(
    `⚠️ 未找到本地 ${MOBILE_DIR_NAME} 检出（或未配置 origin），M 端产物源回退 ${FALLBACK_REPO_URL}；` +
      '如需改源请检出 nuwax-mobile 到主检出旁边，或设置 MOBILE_BUILD_REPO=<仓库地址>',
  );
  return { source: 'GitHub 回退', branch, repoUrl: FALLBACK_REPO_URL };
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
    `📡 Fetching mobile build from ${repoUrl}@${branch}/${TARGET_DIR}（源：${source}）...`,
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
      `✅ Mobile build placed in dist/m/（来源 ${source} ${repoUrl}，${branch}@${commit}）`,
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

module.exports = {
  DEFAULT_BRANCH,
  MOBILE_DIR_NAME,
  FALLBACK_REPO_URL,
  findLocalMobileOriginUrl,
  resolveMobileBuildOptions,
};

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

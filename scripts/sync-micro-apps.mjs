import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const expectedPackages = {
  qiankun: '2.10.17-beta.0',
  '@tiny-codes/vite-plugin-qiankun': '2.4.0',
};

/** 所有命令显式传 cwd，不 checkout、不升级子模块，也不写共享源码。 */
export function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const capture = options.capture ?? false;
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      shell: false,
      signal: options.signal,
    });
    let stdout = '';
    let stderr = '';
    let processError;
    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    // AbortError 可能早于 close；必须等进程退出后才能让调用方回滚 Git。
    child.on('error', (error) => {
      processError = error;
    });
    child.on('close', (code) => {
      if (processError) {
        reject(processError);
        return;
      }
      if (code !== 0) {
        const error = new Error(
          `${command} ${args.join(' ')} failed (${code})${
            stderr ? `\n${stderr.trim()}` : ''
          }`,
        );
        error.exitCode = code;
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function localPath(root, value, label) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value)) {
    throw new Error(`${label} 必须是仓库内相对路径`);
  }
  const resolved = path.resolve(root, value);
  if (resolved === root || !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${label} 不得越出 ${root}`);
  }
  return resolved;
}

async function readJson(filename) {
  return JSON.parse(await fs.readFile(filename, 'utf8'));
}

async function filesUnder(directory, prefix = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`适配文件不支持符号链接：${relative}`);
    }
    if (entry.isDirectory()) {
      files.push(
        ...(await filesUnder(path.join(directory, entry.name), relative)),
      );
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }
  return files;
}

export async function readMicroAppRegistry(root) {
  const registry = await readJson(path.join(root, 'micro-frontends/apps.json'));
  if (!Array.isArray(registry) || registry.length === 0) {
    throw new Error('micro-frontends/apps.json 必须登记至少一个已确认的应用');
  }
  const ids = new Set();
  const names = new Set();
  const result = [];
  for (const item of registry) {
    if (!/^[a-z][a-z0-9-]*$/.test(item.id) || ids.has(item.id)) {
      throw new Error(`微应用 id 无效或重复：${item.id}`);
    }
    ids.add(item.id);
    const adapterPath = localPath(root, item.adapter, 'adapter');
    const adapterRoot = path.dirname(adapterPath);
    const adapterContents = await fs.readFile(adapterPath, 'utf8');
    const adapter = JSON.parse(adapterContents);
    if (adapter.projectDir) localPath(root, adapter.projectDir, 'projectDir');
    const buildEnvironment = adapter.buildEnvironment ?? {};
    if (
      typeof buildEnvironment !== 'object' ||
      Object.entries(buildEnvironment).some(
        ([key, value]) =>
          !/^VITE_[A-Z0-9_]+$/.test(key) || typeof value !== 'string',
      ) ||
      (item.id === 'message' &&
        buildEnvironment.VITE_IM_AUTH_MODE !== 'platform')
    ) {
      throw new Error(
        `${item.id} buildEnvironment 仅允许 VITE_* 字符串，消息必须固定 VITE_IM_AUTH_MODE=platform`,
      );
    }
    const assetBase = `/micro-apps/${item.id}/`;
    if (
      adapter.branch !== 'main' ||
      !/^[a-f0-9]{40}$/.test(adapter.pin ?? '') ||
      adapter.assetBase !== assetBase ||
      adapter.entry !== `${assetBase}index.html` ||
      !/^\/[a-z][a-z0-9-]*$/.test(adapter.businessBase ?? '') ||
      adapter.businessBase.startsWith('/micro-apps') ||
      !/^[a-z][a-z0-9-]*$/.test(adapter.appName ?? '') ||
      names.has(adapter.appName)
    ) {
      throw new Error(
        `${item.id} 的 main pin、appName、entry 或业务/资源路径契约无效`,
      );
    }
    names.add(adapter.appName);
    result.push({
      id: item.id,
      adapter,
      adapterPath,
      adapterContents,
      adapterRoot,
      source: localPath(root, adapter.sourceDir, 'sourceDir'),
      patch: localPath(adapterRoot, adapter.patch, 'patch'),
      overlay: localPath(adapterRoot, adapter.overlay, 'overlay'),
    });
  }
  return result;
}

/** 使用主仓 index 的 gitlink；子仓 HEAD、dirty 文件和 main 的新提交都不改变本次输入。 */
export async function getPinnedSource(
  root,
  app,
  execute = runCommand,
  { checkMainHistory = true } = {},
) {
  const git = (args, cwd = root) =>
    execute('git', args, { cwd, capture: true });
  const staged = await git([
    'ls-files',
    '--stage',
    '--',
    app.adapter.sourceDir,
  ]);
  const escapedPath = app.adapter.sourceDir.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  );
  const match = staged.match(
    new RegExp(`^160000 ([a-f0-9]{40}) 0\t${escapedPath}$`),
  );
  if (!match) {
    throw new Error(
      `${app.id} 缺少 stage 0 gitlink，请先 git submodule update --init 并登记固定提交`,
    );
  }
  const pin = match[1];
  if (pin !== app.adapter.pin) {
    throw new Error(
      `${app.id} gitlink ${pin} 与 adapter.pin ${app.adapter.pin} 不一致`,
    );
  }
  const modules = await git([
    'config',
    '-f',
    '.gitmodules',
    '--get-regexp',
    '^submodule\\..*\\.path$',
  ]);
  const module = modules
    .split('\n')
    .find(
      (line) => line.slice(line.indexOf(' ') + 1) === app.adapter.sourceDir,
    );
  if (!module) throw new Error(`${app.id} 未在 .gitmodules 登记`);
  const moduleKey = module.slice(0, module.indexOf(' ')).replace(/\.path$/, '');
  const branch = await git([
    'config',
    '-f',
    '.gitmodules',
    '--get',
    `${moduleKey}.branch`,
  ]);
  if (branch !== 'main')
    throw new Error(`${app.id} 子模块 branch 必须是 main，当前为 ${branch}`);
  const url = await git([
    'config',
    '-f',
    '.gitmodules',
    '--get',
    `${moduleKey}.url`,
  ]);
  try {
    await git(['rev-parse', '--verify', `${pin}^{commit}`], app.source);
    if (checkMainHistory) {
      await git(
        ['merge-base', '--is-ancestor', pin, 'refs/remotes/origin/main'],
        app.source,
      );
    }
  } catch (cause) {
    throw new Error(
      `${app.id} 固定提交不可用${
        checkMainHistory ? '或不在本地 origin/main 历史' : ''
      }；请先初始化/核查子模块，构建不会自动 fetch/升级`,
      { cause },
    );
  }
  return { branch, url, commit: pin };
}

export async function adapterFingerprint(app) {
  const files = await filesUnder(app.overlay);
  const hash = createHash('sha256');
  hash.update(await fs.readFile(app.adapterPath));
  hash.update(await fs.readFile(app.patch));
  for (const file of files) {
    hash.update(file);
    hash.update(await fs.readFile(path.join(app.overlay, file)));
  }
  return {
    sha256: hash.digest('hex'),
    files: [
      'adapter.json',
      app.adapter.patch,
      ...files.map((file) => `${app.adapter.overlay}/${file}`),
    ],
  };
}

export async function snapshotAdapter(app, directory) {
  await fs.mkdir(directory, { recursive: true });
  const adapterPath = path.join(directory, 'adapter.json');
  const patch = localPath(directory, app.adapter.patch, 'patch');
  const overlay = localPath(directory, app.adapter.overlay, 'overlay');
  await fs.mkdir(path.dirname(patch), { recursive: true });
  await fs.writeFile(adapterPath, app.adapterContents);
  await fs.copyFile(app.patch, patch);
  await fs.cp(app.overlay, overlay, { recursive: true });
  const snapshot = { ...app, adapterPath, patch, overlay };
  const fingerprint = await adapterFingerprint(snapshot);
  const current = await adapterFingerprint(app);
  if (current.sha256 !== fingerprint.sha256) {
    throw new Error(`${app.id} 适配文件在读取期间变化，请完成编辑后重新构建`);
  }
  return { snapshot, fingerprint };
}

async function validateBuild(dist, app) {
  const index = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
  if (
    !index.includes(app.adapter.appName) ||
    /<script\b[^>]*type\s*=\s*["']module["']/i.test(index)
  ) {
    throw new Error(`${app.id} 入口未完成 qiankun 2.x lifecycle 转换`);
  }
  if (!index.includes(app.adapter.assetBase)) {
    throw new Error(
      `${app.id} 入口未引用独立资源目录 ${app.adapter.assetBase}`,
    );
  }
  const files = await filesUnder(dist);
  if (!files.some((file) => /\.js$/.test(file))) {
    throw new Error(`${app.id} dist 缺少 JavaScript 产物`);
  }
}

/** 保留完整诊断消息，但行列号不应因适配插入代码而产生伪新增。 */
export function normalizeTypeDiagnostics(output, project) {
  const result = [];
  let current;
  for (const line of output.split(/\r?\n/)) {
    const located = line.match(/^(.+?)\(\d+,\d+\): error (TS\d+): (.*)$/);
    const global = line.match(/^error (TS\d+): (.*)$/);
    if (located || global) {
      current = {
        path: located ? located[1].replaceAll('\\', '/') : '<project>',
        code: located ? located[2] : global[1],
        message: located ? located[3] : global[2],
      };
      result.push(current);
    } else if (current && /^\s+\S/.test(line)) {
      current.message += `\n${line.trim()}`;
    } else {
      current = undefined;
    }
  }
  const normalize = (value) =>
    value
      .replaceAll(project.replaceAll('\\', '/'), '<app>')
      .replace(/\(\d+,\d+\)/g, '(location)');
  return result.map((item) => ({
    path: normalize(item.path),
    code: item.code,
    message: normalize(item.message),
  }));
}

export function newTypeDiagnostics(upstream, adapted) {
  const remaining = new Map();
  for (const item of upstream) {
    const key = JSON.stringify(item);
    remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }
  return adapted.filter((item) => {
    const key = JSON.stringify(item);
    const count = remaining.get(key) ?? 0;
    if (count === 0) return true;
    remaining.set(key, count - 1);
    return false;
  });
}

async function compareTypeBaseline({
  app,
  project,
  baseline,
  pnpm,
  env,
  reportRoot,
}) {
  const args = ['exec', 'tsc', '-b', '--pretty', 'false', '--force'];
  const check = async (cwd, label) => {
    let output;
    let failed = false;
    try {
      output = await pnpm(args, { cwd, env, capture: true });
    } catch (error) {
      // 编译器诊断失败可以作精确对照；工具失败/中断不能视为类型基线。
      if (![1, 2].includes(error.exitCode)) throw error;
      output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
      failed = true;
    }
    await fs.writeFile(
      path.join(reportRoot, `${app.id}-typecheck-${label}.log`),
      output,
    );
    const diagnostics = normalizeTypeDiagnostics(output, cwd);
    if (failed && diagnostics.length === 0)
      throw new Error(
        `${app.id} ${label} 类型检查失败但没有可核对的 TypeScript 诊断`,
      );
    return diagnostics;
  };
  // 两份源码使用同一 frozen install 依赖，并强制重算，避免共享 tsbuildinfo 掩盖变化。
  await fs.symlink(
    path.join(project, 'node_modules'),
    path.join(baseline, 'node_modules'),
    'junction',
  );
  const upstream = await check(baseline, 'main');
  const adapted = await check(project, 'adapter');
  const added = newTypeDiagnostics(upstream, adapted);
  const report = {
    status: added.length ? 'new-errors' : 'matched-upstream-baseline',
    upstreamDiagnostics: upstream.length,
    adapterDiagnostics: adapted.length,
    newDiagnostics: added.length,
    baselineSha256: createHash('sha256')
      .update(JSON.stringify(upstream))
      .digest('hex'),
    command: args,
  };
  await fs.writeFile(
    path.join(reportRoot, `${app.id}-typecheck.json`),
    `${JSON.stringify({ ...report, upstream, adapted, added }, null, 2)}\n`,
  );
  if (added.length)
    throw new Error(
      `${app.id} 适配新增 ${added.length} 条类型诊断：\n${JSON.stringify(
        added,
        null,
        2,
      )}`,
    );
  console.info(
    `[micro-apps] ${app.id}: main 类型基线 ${upstream.length}，适配 ${adapted.length}，新增 0`,
  );
  return report;
}

export async function acquireMicroAppLock(cache) {
  const lock = path.join(cache, '.sync.lock');
  await fs.mkdir(cache, { recursive: true });
  try {
    await fs.mkdir(lock);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    let live = true;
    try {
      const owner = Number(await fs.readFile(path.join(lock, 'pid'), 'utf8'));
      if (owner > 0) process.kill(owner, 0);
    } catch (cause) {
      // 仅回收明确已退出的 owner。写 pid 前的短暂窗口仍视为占用。
      live = cause.code !== 'ESRCH';
    }
    if (live) throw new Error('另一微应用构建或升级正在运行，请等待它完成');
    await fs.rm(lock, { recursive: true, force: true });
    await fs.mkdir(lock);
  }
  await fs.writeFile(path.join(lock, 'pid'), String(process.pid));
  return () => fs.rm(lock, { recursive: true, force: true });
}

export async function syncMicroApps({
  root: inputRoot = scriptRoot,
  execute = runCommand,
  keepBuild = process.env.MICRO_APP_KEEP_BUILD === '1',
} = {}) {
  const root = path.resolve(inputRoot);
  const cache = path.join(root, '.cache/micro-apps');
  const destination = path.join(root, 'public/micro-apps');
  const previousDist = path.join(root, 'dist/micro-apps');
  const release = await acquireMicroAppLock(cache);
  let scratch;
  try {
    // 先移除旧发布产物；任何校验/install/build 失败都不能留下可被宿主复制的旧版本。
    await fs.rm(destination, { recursive: true, force: true });
    await fs.rm(previousDist, { recursive: true, force: true });
    const packages = await readJson(path.join(root, 'package.json'));
    if (!/^pnpm@\d+\.\d+\.\d+$/.test(packages.packageManager ?? '')) {
      throw new Error(
        '主仓 packageManager 必须精确声明 pnpm 版本，以固定所有子应用构建工具',
      );
    }
    for (const [name, expected] of Object.entries(expectedPackages)) {
      const actual =
        packages.dependencies?.[name] ?? packages.devDependencies?.[name];
      if (actual !== expected)
        throw new Error(`${name} 必须精确固定为 ${expected}，当前为 ${actual}`);
    }
    const apps = await readMicroAppRegistry(root);
    scratch = await fs.mkdtemp(path.join(cache, 'build-'));
    const publish = path.join(scratch, 'publish');
    await fs.mkdir(publish);
    // 显式固定工具版本：monorepo 子目录可能没有 packageManager，不能悄悄落到全局 pnpm。
    const pnpm = (args, options) =>
      execute('corepack', [packages.packageManager, ...args], options);
    const pnpmVersion = await pnpm(['--version'], { cwd: root, capture: true });
    const manifests = [];
    for (const app of apps) {
      const source = await getPinnedSource(root, app, execute);
      // 冻结适配输入；构建期间其它任务继续编辑适配层也不会使 manifest 与资产错配。
      const { snapshot, fingerprint: adapter } = await snapshotAdapter(
        app,
        path.join(scratch, 'adapters', app.id),
      );
      const working = path.join(scratch, app.id);
      const archive = path.join(scratch, `${app.id}.tar`);
      await fs.mkdir(working);
      await execute(
        'git',
        ['archive', '--format=tar', `--output=${archive}`, source.commit],
        { cwd: app.source },
      );
      await execute('tar', ['-xf', archive, '-C', working], { cwd: root });
      const rawMain = path.join(scratch, `${app.id}-main`);
      if (app.adapter.typeCheckBaseline === true)
        await fs.cp(working, rawMain, { recursive: true });
      // 缓存仍位于主仓目录内；创建独立 Git 上下文，防止 git apply 因主仓子目录作用域静默跳过 patch。
      await execute('git', ['init', '--quiet'], { cwd: working });
      await execute('git', ['apply', '--check', snapshot.patch], {
        cwd: working,
      });
      await execute('git', ['apply', snapshot.patch], { cwd: working });
      // monorepo 仅构建明确登记的前端子目录；patch 仍以完整仓库为上下文。
      const project = app.adapter.projectDir
        ? localPath(working, app.adapter.projectDir, 'projectDir')
        : working;
      await fs.cp(snapshot.overlay, project, { recursive: true });
      const env = {
        ...process.env,
        ...app.adapter.buildEnvironment,
        NUWAX_MICRO_APP_HOST_ROOT: root,
      };
      const ownWorkspace = await fs
        .access(path.join(project, 'pnpm-workspace.yaml'))
        .then(
          () => true,
          () => false,
        );
      // 无独立 workspace 的前端不得向上继承宿主 packages/*，但保留子仓自身 workspace 的依赖补丁。
      const projectPnpm = (args, options) =>
        pnpm(
          [...(!ownWorkspace ? ['--ignore-workspace'] : []), ...args],
          options,
        );
      await projectPnpm(['install', '--frozen-lockfile'], {
        cwd: project,
        env,
      });
      await fs.rm(path.join(project, 'dist'), { recursive: true, force: true });
      let typecheck;
      if (app.adapter.typeCheckBaseline === true) {
        const baseline = app.adapter.projectDir
          ? localPath(rawMain, app.adapter.projectDir, 'projectDir')
          : rawMain;
        typecheck = await compareTypeBaseline({
          app,
          project,
          baseline,
          pnpm: projectPnpm,
          env,
          reportRoot: scratch,
        });
        // 仅在真实 main/适配诊断匹配后拆出资产构建，任何 vite 失败继续中止。
        await projectPnpm(['exec', 'vite', 'build'], { cwd: project, env });
      } else {
        await projectPnpm(['run', 'build'], { cwd: project, env });
      }
      await validateBuild(path.join(project, 'dist'), app);
      const manifest = {
        schemaVersion: 1,
        id: app.id,
        appName: app.adapter.appName,
        entry: app.adapter.entry,
        assetBase: app.adapter.assetBase,
        businessBase: app.adapter.businessBase,
        source,
        projectDir: app.adapter.projectDir ?? '.',
        workspaceMode: ownWorkspace ? 'project-workspace' : 'standalone',
        buildEnvironment: app.adapter.buildEnvironment ?? {},
        ...(typecheck ? { typecheck } : {}),
        adapter,
        toolchain: {
          node: process.version,
          pnpm: pnpmVersion,
          ...expectedPackages,
        },
        builtAt: new Date().toISOString(),
      };
      const output = path.join(publish, app.id);
      await fs.cp(path.join(project, 'dist'), output, { recursive: true });
      await fs.writeFile(
        path.join(output, 'version.json'),
        `${JSON.stringify(manifest, null, 2)}\n`,
      );
      manifests.push(manifest);
      console.info(
        `[micro-apps] ${app.id}: main@${
          source.commit
        } adapter@${adapter.sha256.slice(0, 12)}`,
      );
    }
    await fs.writeFile(
      path.join(publish, 'manifest.json'),
      `${JSON.stringify({ schemaVersion: 1, apps: manifests }, null, 2)}\n`,
    );
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.rename(publish, destination);
    return manifests;
  } catch (error) {
    await fs.rm(destination, { recursive: true, force: true });
    await fs.rm(previousDist, { recursive: true, force: true });
    throw error;
  } finally {
    if (scratch && !keepBuild)
      await fs.rm(scratch, { recursive: true, force: true });
    if (scratch && keepBuild)
      console.info(`[micro-apps] 隔离构建目录：${scratch}`);
    await release();
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  syncMicroApps().catch((error) => {
    console.error(`[micro-apps] ${error.message}`);
    if (error.cause) console.error(error.cause.message);
    process.exitCode = 1;
  });
}

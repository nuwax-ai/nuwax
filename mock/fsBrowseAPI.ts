/**
 * 目录选择弹窗 Mock（fs/roots + fs/children + fs/mkdir + fs/rename，dev 纯浏览器
 * 走查数据源）。
 *
 * 对应前端 service apiBrowseFsRoots / apiBrowseFsChildren / apiFsMkdir /
 * apiFsRename（wiki「选择目录/弹框选目录」契约：GET /api/computer/static/fs/roots、
 * GET /api/computer/static/fs/children，POST /api/computer/static/fs/mkdir、
 * POST /api/computer/static/fs/rename，按绝对路径逐级浏览并支持新建/重命名）。
 * 默认在 config/config.development.ts 的 mock.exclude 中关闭——真机走查
 * （nuwawork 壳 + 本机 nuwax-file-server）必须走真实网关链路；纯浏览器 UI 走查时
 * 把本文件移出 exclude 并重启 dev server。
 *
 * 注意：Umi mock 层只 watch mock/ 目录，增删 exclude 需重启 dev server。
 */

interface MockFsEntry {
  name: string;
  path: string;
  isDir: boolean;
  isSymlink?: boolean;
}

const HOME = '/Users/demo';

const MOCK_CHILDREN: Record<string, MockFsEntry[]> = {
  '/': [
    { name: 'Applications', path: '/Applications', isDir: true },
    { name: 'Users', path: '/Users', isDir: true },
    { name: 'opt', path: '/opt', isDir: true },
  ],
  '/Users': [{ name: 'demo', path: HOME, isDir: true }],
  [HOME]: [
    { name: 'Desktop', path: `${HOME}/Desktop`, isDir: true },
    { name: 'Downloads', path: `${HOME}/Downloads`, isDir: true },
    { name: 'Documents', path: `${HOME}/Documents`, isDir: true },
    { name: 'workspace', path: `${HOME}/workspace`, isDir: true },
    { name: 'README.md', path: `${HOME}/README.md`, isDir: false },
  ],
  [`${HOME}/Desktop`]: [
    { name: '笔记', path: `${HOME}/Desktop/笔记`, isDir: true },
  ],
  [`${HOME}/Desktop/笔记`]: [
    { name: '周报.md', path: `${HOME}/Desktop/笔记/周报.md`, isDir: false },
  ],
  [`${HOME}/Downloads`]: [
    { name: '安装包.dmg', path: `${HOME}/Downloads/安装包.dmg`, isDir: false },
    {
      name: '合同扫描件.pdf',
      path: `${HOME}/Downloads/合同扫描件.pdf`,
      isDir: false,
    },
  ],
  [`${HOME}/Documents`]: [
    { name: 'demo', path: `${HOME}/Documents/demo`, isDir: true },
  ],
  [`${HOME}/workspace`]: [
    {
      name: 'agent-platform',
      path: `${HOME}/workspace/agent-platform`,
      isDir: true,
    },
    { name: 'web-console', path: `${HOME}/workspace/web-console`, isDir: true },
    { name: '.gitignore', path: `${HOME}/workspace/.gitignore`, isDir: false },
  ],
  [`${HOME}/workspace/agent-platform`]: [
    { name: 'src', path: `${HOME}/workspace/agent-platform/src`, isDir: true },
    {
      name: 'pom.xml',
      path: `${HOME}/workspace/agent-platform/pom.xml`,
      isDir: false,
    },
  ],
  [`${HOME}/workspace/web-console`]: [
    {
      name: 'index.html',
      path: `${HOME}/workspace/web-console/index.html`,
      isDir: false,
    },
  ],
};

const ok = (res: any, data: any) => {
  res.json({
    code: '0000',
    displayCode: '0000',
    message: 'success',
    data,
    tid: `mock-${Date.now()}`,
    success: true,
  });
};

const fail = (res: any, message: string) => {
  res.json({
    code: '4000',
    displayCode: '4000',
    message,
    data: null,
    tid: `mock-${Date.now()}`,
    success: false,
  });
};

const joinPath = (parent: string, name: string) =>
  parent === '/' ? `/${name}` : `${parent}/${name}`;

export default {
  'GET /api/computer/static/fs/roots': (_req: any, res: any) => {
    ok(res, {
      roots: [
        { name: 'Macintosh HD', path: '/', isDir: true },
        { name: HOME, path: HOME, isDir: true },
      ],
      home: HOME,
    });
  },
  'GET /api/computer/static/fs/children': (req: any, res: any) => {
    const path = String(req.query.path ?? '');
    const entries = MOCK_CHILDREN[path];
    ok(res, { path, entries: entries ?? [] });
  },
  'POST /api/computer/static/fs/mkdir': (req: any, res: any) => {
    const { parentPath, dirName } = req.body ?? {};
    const parent = String(parentPath ?? '');
    const name = String(dirName ?? '').trim();
    if (!MOCK_CHILDREN[parent]) return fail(res, 'Path not found');
    if (!name || /[\\/]/.test(name) || name === '.' || name === '..') {
      return fail(res, 'Invalid directory name');
    }
    const entry: MockFsEntry = {
      name,
      path: joinPath(parent, name),
      isDir: true,
    };
    if (MOCK_CHILDREN[parent].some((item) => item.name === name)) {
      return fail(res, 'Directory already exists');
    }
    MOCK_CHILDREN[parent] = [...MOCK_CHILDREN[parent], entry];
    MOCK_CHILDREN[entry.path] = [];
    ok(res, entry);
  },
  'POST /api/computer/static/fs/rename': (req: any, res: any) => {
    const { path, newName } = req.body ?? {};
    const oldPath = String(path ?? '');
    const name = String(newName ?? '').trim();
    const sepIndex = oldPath.lastIndexOf('/');
    const parent = sepIndex > 0 ? oldPath.slice(0, sepIndex) : '/';
    const oldName = oldPath.slice(sepIndex + 1);
    const siblings = MOCK_CHILDREN[parent];
    const target = siblings?.find((item) => item.name === oldName);
    if (!siblings || !target) return fail(res, 'Path not found');
    if (!name || /[\\/]/.test(name) || name === '.' || name === '..') {
      return fail(res, 'Invalid directory name');
    }
    if (siblings.some((item) => item.name === name)) {
      return fail(res, 'Directory already exists');
    }
    const entry: MockFsEntry = {
      ...target,
      name,
      path: joinPath(parent, name),
    };
    MOCK_CHILDREN[parent] = siblings.map((item) =>
      item.name === oldName ? entry : item,
    );
    // 子树键同步迁移（mock 只维护一层写入的空目录，深度子树按前缀搬运）
    for (const key of Object.keys(MOCK_CHILDREN)) {
      if (key === oldPath) {
        MOCK_CHILDREN[entry.path] = MOCK_CHILDREN[key];
        delete MOCK_CHILDREN[key];
      } else if (key.startsWith(`${oldPath}/`)) {
        MOCK_CHILDREN[entry.path + key.slice(oldPath.length)] =
          MOCK_CHILDREN[key];
        delete MOCK_CHILDREN[key];
      }
    }
    MOCK_CHILDREN[entry.path] ??= [];
    ok(res, entry);
  },
};

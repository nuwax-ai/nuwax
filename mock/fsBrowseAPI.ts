/**
 * 目录选择弹窗 Mock（fs/roots + fs/children，dev 纯浏览器走查数据源）。
 *
 * 对应前端 service apiBrowseFsRoots / apiBrowseFsChildren（wiki「选择目录/
 * 弹框选目录」契约：GET /api/computer/fs/roots、GET /api/computer/fs/children，
 * 按绝对路径逐级浏览）。默认在 config/config.development.ts 的 mock.exclude
 * 中关闭——真机走查（nuwawork 壳 + 本机 nuwax-file-server）必须走真实网关
 * 链路；纯浏览器 UI 走查时把本文件移出 exclude 并重启 dev server。
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

export default {
  'GET /api/computer/fs/roots': (_req: any, res: any) => {
    res.json({
      code: '0000',
      displayCode: '0000',
      message: 'success',
      data: {
        roots: [
          { name: 'Macintosh HD', path: '/', isDir: true },
          { name: HOME, path: HOME, isDir: true },
        ],
        home: HOME,
      },
      tid: `mock-${Date.now()}`,
      success: true,
    });
  },
  'GET /api/computer/fs/children': (req: any, res: any) => {
    const path = String(req.query.path ?? '');
    const entries = MOCK_CHILDREN[path];
    if (!entries) {
      res.json({
        code: '0000',
        displayCode: '0000',
        message: 'success',
        data: { path, entries: [] },
        tid: `mock-${Date.now()}`,
        success: true,
      });
      return;
    }
    res.json({
      code: '0000',
      displayCode: '0000',
      message: 'success',
      data: { path, entries },
      tid: `mock-${Date.now()}`,
      success: true,
    });
  },
};

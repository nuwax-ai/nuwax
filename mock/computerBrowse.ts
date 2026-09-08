/**
 * 个人电脑目录浏览 Mock（dev 走查数据源）。
 *
 * 对应前端 service apiBrowseSandboxDirectory（假定端点
 * GET /api/sandbox/:sandboxId/directory?relativePath=&recursive=false）：
 * file-server 侧「customTargetDir + relativePath 单层列目录」能力已就绪，
 * 缺的是云端网关「会话创建前按 sandboxId 路由」的契约；网关就绪后删除本
 * mock，service 仅换 URL 即接真实链路（WorkspaceDirPickerModal 不感知）。
 *
 * 目录树参照需求原型（nuwax_desktop.html FS_ROOT 样例），供首页工作目录
 * 选择弹窗交互走查：根 = workspace/Desktop/Downloads/Pictures/...，
 * workspace 下挂 agent-platform / web-console 等子目录。
 *
 * 注意：Umi mock 层只 watch mock/ 目录，修改后需重启 dev server 或 touch
 * 本文件触发重载。
 */

interface MockDirEntry {
  name: string;
  isDir: boolean;
}

const MOCK_TREE: Record<string, MockDirEntry[]> = {
  '': [
    { name: 'workspace', isDir: true },
    { name: 'Desktop', isDir: true },
    { name: 'Downloads', isDir: true },
    { name: 'Pictures', isDir: true },
    { name: 'Documents', isDir: true },
    { name: 'README.md', isDir: false },
  ],
  workspace: [
    { name: 'agent-platform', isDir: true },
    { name: 'web-console', isDir: true },
    { name: 'nuwax', isDir: true },
  ],
  'workspace/agent-platform': [
    { name: 'src', isDir: true },
    { name: 'pom.xml', isDir: false },
  ],
  'workspace/web-console': [{ name: 'index.html', isDir: false }],
  'workspace/nuwax': [
    { name: 'src', isDir: true },
    { name: 'package.json', isDir: false },
  ],
  Desktop: [{ name: '笔记', isDir: true }],
  'Desktop/笔记': [{ name: '周报.md', isDir: false }],
  Downloads: [
    { name: '安装包.dmg', isDir: false },
    { name: '合同扫描件.pdf', isDir: false },
  ],
  Pictures: [{ name: '壁纸.png', isDir: false }],
  Documents: [{ name: 'demo', isDir: true }],
};

const normalizeRelativePath = (raw: unknown): string =>
  String(raw ?? '')
    .split('/')
    .map((seg) => seg.trim())
    .filter((seg) => seg && seg !== '.')
    .join('/');

export default {
  'GET /api/sandbox/:sandboxId/directory': (req: any, res: any) => {
    const relativePath = normalizeRelativePath(req.query.relativePath);
    const files = MOCK_TREE[relativePath];
    if (!files) {
      res.status(404).json({
        code: '4040',
        message: `MOCK 目录不存在: /${relativePath}`,
        data: null,
        success: false,
      });
      return;
    }
    res.json({
      code: '0000',
      displayCode: '0000',
      message: 'success',
      data: { files, recursive: false },
      tid: `mock-${Date.now()}`,
      success: true,
    });
  },
};

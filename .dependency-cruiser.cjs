/**
 * 分层红线依赖规则 —— docs/engineering-conventions.md §4
 *
 * 用法：
 *   pnpm run lint:arch            # 校验（忽略存量基线，只报新增违规）
 *   pnpm run lint:arch:baseline   # 重新生成存量基线（仅在合规清理后使用，勿随手跑）
 *
 * 存量违规冻结于 .dependency-cruiser-known-violations.json（只防新增、不阻断存量），
 * 盘点与清理进度见 docs/refactor/layering-audit.md。
 */
const fs = require('fs');
const path = require('path');

// 「页面之间禁止互相 import（自引允许）」：按页面目录动态生成规则，新页面自动纳入。
// eslint 的 no-restricted-imports 无法表达「自引允许」，由此处承担（别名/相对路径通吃）。
const pagesDir = path.join(__dirname, 'src', 'pages');
const pageNames = fs.existsSync(pagesDir)
  ? fs
      .readdirSync(pagesDir)
      .filter((name) => fs.statSync(path.join(pagesDir, name)).isDirectory())
  : [];

const pagesNotToOtherPages = pageNames.map((name) => ({
  name: `pages-not-to-other-pages[${name}]`,
  comment:
    '页面之间禁止互相 import（engineering-conventions §4.3）；跨页共享请下沉 business-component/hooks/services/types。',
  severity: 'error',
  from: { path: `^src/pages/${name}/` },
  // 负向前瞻排除自引：目标必须是其他页面目录
  to: { path: `^src/pages/(?!${name}/)` },
}));

module.exports = {
  forbidden: [
    // —— engineering-conventions §4 明文禁令 ——
    {
      name: 'components-not-to-models',
      comment: '组件层禁止直接依赖 Models。',
      severity: 'error',
      from: { path: '^src/(components|features)/' },
      to: { path: '^src/models/' },
    },
    {
      name: 'hooks-not-to-components',
      comment: 'Hooks 禁止依赖 Components。',
      severity: 'error',
      from: { path: '^src/hooks/' },
      to: { path: '^src/components/' },
    },
    {
      name: 'services-not-to-hooks-or-components',
      comment: '服务层只可依赖 Utils/Types，禁止依赖 Hooks/Components。',
      severity: 'error',
      from: { path: '^src/services/' },
      to: { path: '^src/(hooks|components)/' },
    },
    {
      name: 'utils-not-to-services',
      comment: '工具层禁止依赖 Services。',
      severity: 'error',
      from: { path: '^src/utils/' },
      to: { path: '^src/services/' },
    },
    // —— 反向依赖页面层 ——
    {
      name: 'non-pages-not-to-pages',
      comment: '非页面层禁止反向依赖页面层；wrappers 引 403 页为路由兜底显式例外。',
      severity: 'error',
      from: { path: '^src/(components|hooks|services|utils|layouts|features)/' },
      to: { path: '^src/pages/' },
    },
    ...pagesNotToOtherPages,
    // —— 会话域红线（eslint error 规则的 depcruise 镜像，兜住相对路径引用）——
    {
      name: 'pages-not-to-conversation-internals',
      comment: '页面层只消费 @/features/conversation/react/*。',
      severity: 'error',
      from: { path: '^src/pages/' },
      to: { path: '^src/features/conversation/(domain|runtime|adapters)/' },
    },
    // —— 循环依赖 ——
    {
      name: 'no-circular',
      comment: '循环依赖（存量冻结于基线，只防新增）。',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules|^src/\\.umi',
    },
    moduleSystems: ['es6', 'cjs'],
    // 注意：不能用 src/.umi/tsconfig.json——其 moduleResolution:"bundler" 会让
    // depcruise 不应用 paths 映射、@/ 别名全部解析失败；专用 tsconfig 用 node 解析。
    tsConfig: { fileName: path.join(__dirname, 'tsconfig.depcruise.json') },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
  },
};

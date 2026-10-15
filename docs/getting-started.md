# 新同事上手：本地开发环境

目标：从克隆到 `npm run dev` 跑起来、能改能测能提测。遇到问题先跑 `npm run doctor`。

## 1. 环境要求

| 项 | 要求 | 说明 |
| --- | --- | --- |
| Node | > 18（团队实测 22/24） | Node 25 的残缺全局 localStorage 已在 vitest setup 兼容 |
| pnpm | `package.json` 的 `packageManager`（当前 `pnpm@10.27.0`） | 用 `corepack enable` 管理；**不要用 npm install 混装**。`npm run <脚本>` 可以照常用 |
| git | 需能访问内网 `git.yichamao.com` | 子模块（资料库/消息微应用）在内网；没有权限也能开发主包，见下文 |

## 2. 首次初始化

```bash
git clone <仓库地址> nuwax && cd nuwax
corepack enable
pnpm install                              # postinstall 会执行 max setup，生成 src/.umi
git submodule update --init --recursive   # 拉微应用子模块（无权限可跳过）
npm run sync:micro-apps                   # 构建微应用到 public/micro-apps（首次约 40s，之后命中缓存秒级）
npm run doctor                            # 体检，全部 ✅ 即可
npm run dev                               # 默认 http://localhost:3000，PORT=3002 npm run dev 换端口
```

没有子模块权限：跳过后两步中的子模块相关操作即可。主包功能完整，只有资料库、消息两个菜单页面不可用；构建时会打印「子模块未初始化…跳过」警告，属预期。

## 3. 日常循环

| 场景 | 命令 |
| --- | --- |
| 拉代码 / 切分支后 | `pnpm install`（锁文件变了才需要）→ `git submodule update --init` → `npm run doctor` 按提示处理 |
| 改会话相关代码 | `npm run test:conversation`（必跑，约 20 秒） |
| 改其他代码 | `npx vitest run <相关测试目录或文件>`；全量 `npx vitest run` |
| 改分层敏感代码 | `npm run lint:arch`（只拦新增违规） |
| 改类型门覆盖的域 | `npm run typecheck`（分域，见 [typecheck-domains](./typecheck-domains.md)；全库 `tsc` 有存量错误，不作门） |
| 改 scripts/ 或提测脚本 | `npm run test:scripts` |
| 提交 | `git commit` 走 husky：prettier + conventional message（`type(scope): subject`） |
| 提测 | 全链 `bash scripts/deploy_sync_test.sh`；代码已在 dev 用快速通道 `bash deploy_test.sh`，见 [提测 runbook](./deploy-sync-test-runbook.md) |

## 4. 需求流程（按大小）

- 小修 / BUG（≤3 文件、无新接口、无需产品拍板）：直接改 + 跑对应质量门。
- 中等需求：先写 `plans/<日期>-<slug>-plan.md`（模板 `templates/plan.md`）。
- 新功能 / 跨模块：intent → spec → plan 完整链，见 [AGENTS.md](../AGENTS.md)「AI SDLC 规则层」。

## 5. 接下来读什么

1. [架构总览](./architecture/overview.md)：目录职责、分层规则、几个核心域的位置。
2. [工程规范](./engineering-conventions.md)：命名、分层禁令、I18n。
3. [测试策略](./testing-strategy.md)：几类测试各管什么、怎么跑。
4. 按负责模块读：[会话域](./conversation/README.md) · [微应用](./micro-apps-runbook.md) · [桌面宿主适配](./desktop-host-adaptation-matrix.md)。
5. [scripts 索引](../scripts/README.md)：所有脚本一览。

## 6. 常见问题

| 现象 | 处理 |
| --- | --- |
| vitest 大面积文件级报错（找不到 tsconfig / 别名） | `src/.umi` 缺失：`pnpm run setup` |
| 测试报 esbuild / TextEncoder 错误 | 测试直接或间接 import 了 umi 模块，需在测试里 mock（vitest 不能加载 umi） |
| 资料库/消息页面空白或 404 | `npm run doctor` → `npm run sync:micro-apps` |
| `git status` 总显示 `submodules/... (new commits)` | 子仓 HEAD 没跟上 gitlink：`git submodule update --init`，不要 `git add` 它 |
| 构建报 gitlink 与 adapter.pin 不一致 | 见 [微应用手册 §5](./micro-apps-runbook.md#5-合并分支时的子模块冲突) |
| 提测脚本中途失败 | 修完直接重跑，支持断点续跑；网络抖动会自动退避重试 |

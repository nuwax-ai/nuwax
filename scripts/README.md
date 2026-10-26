# scripts/ 脚本索引

按用途分组；「入口」列是推荐的调用方式（`npm run <x>` 或直接命令）。新增脚本请同步登记到本表，一次性脚本用完请删除或标注。

脚本层自身的测试：`npm run test:scripts`（doctor + 提测 + 微应用构建/升级 + 类型门，全部 `node --test`，不依赖网络）。

## 环境与日常开发

| 脚本 | 入口 | 作用 |
| --- | --- | --- |
| `doctor.mjs` | `npm run doctor`；`predev` 自动跑 `--quick` | 只读体检：Node/pnpm 版本、`node_modules`、`src/.umi`、子模块初始化与 HEAD、gitlink↔`adapter.pin` 一致性、patch 合并残留、本地微应用产物是否过期、gitlab 远端与提测配置。每条问题附一条修复命令；`--quick` 永不拦截启动 |
| `generate-version.js` | `predev` / `prebuild:*` 自动 | 生成 `src/constants/version.ts`（只含 APP_VERSION/APP_NAME，不烤 git 哈希） |
| `write-dist-version.js` | `postbuild:*` 自动 | 构建后写 `dist/version.json` 与入口 HTML 版本标记（gitHash 运行时从这里读） |
| `sync-openui-runtime.sh` | `npm run sync:openui-runtime` | 从 `@nuwax-ai/openui-runtime` 同步 OpenUI 运行时资源到 public |
| `build-file-preview-pptx.mjs` | `npm run build:file-preview-pptx` / `check:file-preview-pptx` | 构建（或校验）打过补丁的 pptx 预览产物 |
| `generateThemeCssVariables.js` | `node scripts/generateThemeCssVariables.js` | 由主题 token 生成 CSS 变量 |

## 微应用（子模块）

细节与操作手册见 [docs/micro-apps-runbook.md](../docs/micro-apps-runbook.md)。

| 脚本 | 入口 | 作用 |
| --- | --- | --- |
| `sync-micro-apps.mjs` | `npm run sync:micro-apps`；`prebuild:*` 自动 | 按主仓 gitlink 隔离构建全部已登记微应用到 `public/micro-apps/`。不 fetch、不改子仓。输入不变时命中产物缓存（秒级），`MICRO_APP_CACHE=0` 强制重建；子模块未初始化时跳过（社区版），`MICRO_APP_REQUIRED=1` 禁止跳过 |
| `upgrade-micro-apps.mjs` | `npm run upgrade:micro-apps -- <message\|repo\|all> [--dry-run] [--ref SHA]` | **常规升级通道**：fetch 子仓 main → 快进校验 → patch/overlay 预检 → 更新 HEAD 与 pin 并暂存；失败自动回滚并留恢复记录。patch 贴不上时默认三方重算并暂存，`--no-rebase-patch` 关闭 |
| `pull-micro-app-pins.mjs` | `npm run pull:micro-app-pins [-- repo\|message] [--offline]` | **适配负责人用**：先 `submodule update --init`，快进到远端 main，patch 贴不上时尝试三方合并**重算 adapter.patch** 并暂存。失败时 pin/子仓 HEAD 可能已改动（无回滚），需按提示手工收尾。`--offline` 只校验不改动 |

## 构建与发布

| 脚本 | 入口 | 作用 |
| --- | --- | --- |
| `deploy-asset-retention.mjs` | `prebuild:prod` 的 snapshot / `build:prod:m` 的 merge | `DIST_RETENTION=1` 时把上一版 dist 的旧哈希资源保留 N 代（默认 3），防发版后旧页面懒加载 404；本地构建不设变量零影响 |
| `download-mobile-build.js` | `npm run build:m`；`build:prod:m` 尾段 | 下载 M 端产物到 `dist/m/`；来源优先本地 nuwax-mobile 检出的 origin，无检出回退 GitHub，`MOBILE_BUILD_REPO` 覆写 |
| `deploy_sync_test.sh` | `bash scripts/deploy_sync_test.sh` | 全链提测：个人分支 → 版本分支 → dev → test → 构建 → 推 gitlab/test。见 [runbook](../docs/deploy-sync-test-runbook.md) |
| `../deploy_test.sh` | `bash deploy_test.sh` | 快速提测：dev → test → 子模块自动升级到最新 main（适配预检）→ 质量门 → 构建 → 推双远端；起跑时仅子模块版本偏差不拦截 |
| `deploy/lib.sh` | 被上面两个脚本 source | 共用函数：重试、机器产物冲突消化、pin 撕裂修复、质量门、push/pull 自愈 |

## 质量门与检查

| 脚本 | 入口 | 作用 |
| --- | --- | --- |
| `check-types.mjs` | `npm run typecheck[:<domain>]`、`typecheck:prune` | 分域严格类型门（域定义 `typecheck-domains.json`，基线 `typecheck-baseline.json`），见 [docs/typecheck-domains.md](../docs/typecheck-domains.md) |
| `check-types.test.mjs` | `npm run test:typecheck` | 类型门自身测试 |
| `sdlc-evals.mjs` | CI `sdlc-evals.yml` | AI SDLC 规则层 hooks 的样本回归（托管件，勿手改） |
| `a11y-audit.js` | `node scripts/a11y-audit.js` | axe-core 无障碍快照 |

## i18n

规范见 [docs/ch/i18n-contributing.md](../docs/ch/i18n-contributing.md)。

| 脚本 | 作用 |
| --- | --- |
| `i18n-governance-report.js` | 各语言 key 覆盖率与缺口报告 |
| `check-hardcoded-i18n.js` | 扫描硬编码中文文案 |
| `sync-i18n-diff.js` | 平台导出 JSON 与本地 locale 对比，生成新增/修改差异（仅 `PC.*`） |
| `backfill-i18n-gaps.js` | 以 zh-CN 为基准补全 zh-TW/zh-HK/ja-JP 缺失 key |
| `fix-i18n-keys.js`、`replace-nuwaxpc.js` | 历史 key 前缀迁移的一次性脚本（`NuwaxPC.` → `PC.`），已完成使命，待清理 |

## E2E（`e2e/`，ego-browser 驱动）

| 脚本 | 入口 | 作用 |
| --- | --- | --- |
| `conversation-acceptance.mjs` | `npm run e2e:conversation` | 会话真实页面验收（需 dev server + 登录态） |
| `mock-chat-acceptance.mjs` | `npm run e2e:mock-chat` | `/mock-chat` 全场景回归，无登录态依赖 |
| `release0930-remaining-acceptance.mjs` | `npm run e2e:release0930` | 9.30 剩余业务验收（`dev:release0930-mock`） |
| `ego-run.mjs` | 被上面 npm 脚本调用 | 把 `E2E_*` 环境变量经临时 JSON 透传进 ego-browser 沙箱 |
| `direct-web-assets-update-fixture.cjs` | 手动 | 桌面端 web 资源直更 A/B 验收夹具 |
| `render-storm-diagnosis.mjs`、`think-render-probe.mjs` | 手动 | 一次性渲染诊断探针，不进回归矩阵 |

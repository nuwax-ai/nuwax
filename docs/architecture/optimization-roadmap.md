# 架构优化排查表（持续维护）

> 建立：2026-10-15。用法：每次挑一项做，做完在「状态」列填日期与提交，数字类目标在「基线 / 目标」里更新实测值。新发现的问题按同格式追加，不另起文档。现状描述见 [架构总览](./overview.md)。

## 0. 红线：不影响线上业务

项目已在线上运行，所有优化必须满足：

1. **行为等价可证明**。测试资产、纯注释与文档改动除外，涉及业务行为时给出适合风险的等价证据：
   - 优先复用已有行为测试；核心逻辑缺少保护时才补回归，不为简单拆分机械新增单测；
   - 或给出产物逐文件 diff（例如微应用缓存产物与强制重建产物完全一致）；
   - 或在 E2E / 真实页面走查同一场景。
2. **小步、可单独回滚**。一项一个（或几个）独立提交，禁止把重构和功能改动混在一个提交里。单个重构 PR 建议 ≤ 15 个文件。
3. **运行时路径变更要有开关或双轨期**。对齐会话 V1/V2 的做法：新旧并存 → 默认切新 → 观察期 → 再删旧，删旧要有使用数据支撑。
4. **按风险分级走门**：

| 级别 | 定义 | 必过的门 |
| --- | --- | --- |
| L0 | 文档、环境诊断、注释；不改变构建输入、产物或发布决策 | `test:scripts`（改了脚本时） |
| L1 | 进入产物但运行时零行为变化，或影响产物选择/生成的构建脚本、缓存与 CI | 构建通过 + 相关测试（脚本用 `test:scripts`）+ `lint:arch`；缓存还须验证命中与强制重建的产物一致 |
| L2 | 运行时内部重构（拆文件、合并重复实现） | L1 的门 + 复用或补充行为证据 + 域质量门（会话路径跑 `test:conversation` + E2E）+ 提测走查 |
| L3 | 下线旧线、改数据流或跨模块契约 | L2 的门 + 产品确认 + 灰度或观察期 + 回切预案 |

## 1. 目标（季度度量）

| 指标 | 基线（2026-10-15） | 本季目标 | 测量方式 |
| --- | --- | --- | --- |
| 微应用构建（输入不变） | 41.7s | ✅ 合入复验 0.73s（含完整性校验，初版 0.5s） | `time npm run sync:micro-apps` |
| adapter.patch 总行数 | repo 1755 → 877（已清 .rej）；message 2977 | message ≤ 800 | `wc -l micro-frontends/*/adapter.patch` |
| depcruise 存量违规 | 105（实际 97） | ≤ 60 | `.dependency-cruiser-known-violations.json` 条数 |
| > 1000 行的非测试/非词典文件 | 48 | ≤ 38 | 见 §5 统计命令 |
| 类型门覆盖域 | 4 | 7 | `typecheck-domains.json` |
| SSE 实现套数 | 3 | 1 个内核 + 薄适配 | 代码检索 |
| 脚本层 / 分层门进入 CI | 否 | 是 | `.github/workflows` |

## 2. 脚本与子模块（S）

| ID | 问题（证据） | 方案 | 风险 | 验证 | 状态 |
| --- | --- | --- | --- | --- | --- |
| S1 | 每次 `build:*` 都对两个微应用完整 install + build（冷启动约 42s），提测和本地构建都要付这笔时间 | `sync-micro-apps` 加内容寻址产物缓存，有效 `NODE_ENV`/`VITE_*`、工具链与适配输入共同决定缓存键；完整性记录覆盖全部产物与 manifest，损坏或旧缓存自动重建；`MICRO_APP_CACHE=0` 可关闭 | L1 | 环境切换、chunk 缺失/改写、额外文件、元数据损坏、旧缓存与恢复失败均有回归；真实冷构建 45.4s、命中 0.73s、强制重建 45.5s，338 个业务资产一致；删除真实缓存 chunk 后自动重建并恢复一致资产 | ✅ 2026-10-15 |
| S2 | repo-web 的 adapter.patch 40 段里有 19 段是 `.rej` 合并残留，补丁体积翻倍；这些残留会作为垃圾文件进入构建目录 | 删除这些段；`sync-micro-apps` 与 `doctor` 拒绝含 `*.rej` / `*.orig` 的 patch；`pull-micro-app-pins` 重算 patch 时排除它们 | L1 | 清理后的补丁贴到 pin 上，与旧补丁结果相比只少了这 19 个 .rej 文件；守卫有测试 | ✅ 2026-10-15 |
| S3 | 子模块、pin、产物状态不透明，环境问题要靠人肉排查（文档里记录过 worktree 缺 `src/.umi`、pin 撕裂、产物过期等实际故障） | 新增只读 `npm run doctor`；`predev` 跑 `--quick`，只提醒不拦截 | L0 | 4 个测试；执行约 0.6s | ✅ 2026-10-15 |
| S4 | 有两套升级工具：`upgrade-micro-apps`（严格，失败会回滚，但不会重算 patch）和 `pull-micro-app-pins`（会三方合并重算 patch，但不加锁、不回滚，失败时 pin 和子仓 HEAD 已经改了一半） | `upgrade:micro-apps` 默认在 patch 贴不上时三方重算并暂存，真冲突仍停止；`--no-rebase-patch` 关闭。`pull:micro-app-pins` 仍可单独用 | L1 | `upgrade-pipeline`：重算成功、pin 未变只重算、`--no-rebase-patch` 失败回滚 | ✅ 2026-10-26 |
| S5 | message 补丁中新增文件占 1740 行（ChatTasksPanel、conversationTasks\*、测试、dev mock），修改只有约 240 行；新增文件也走 patch，每次重制都要搬一遍 | 新增文件整体迁到 `overlay/`，patch 只保留对上游已有文件的修改；长期把宿主接入点（生命周期入口、host props）推回上游仓库，继续缩小 patch | L1 | 迁移前后构建产物逐文件 diff 必须一致（S1 的比对方法） | 待办 |
| S6 | 微应用注册信息在三处重复：`config/config.ts` 的 qiankun.apps、`src/utils/microAppRoutes.ts`、`adapter.json` | config 从 `micro-frontends/apps.json` 和 adapter 派生 name/entry；加一致性测试，防止三处漂移 | L1 | 构建后 `.umi` 生成的 masterOptions 与改前一致 | 待办 |
| S7 | 主站 dev 联调微应用时，每改一次子应用都要 `sync:micro-apps` 重新构建，没有 HMR | 加开发开关（如 `MICRO_APP_DEV=repo`），dev 下 entry 指向子应用 dev server（7100/7110） | L1（只影响 dev 配置） | 本地联调走查 | 待办 |
| S8 | `scripts/deploy/lib.sh` 的机器产物冲突规则仍处理 `src/constants/version.ts` 烤哈希，但 10-08 起已不再烤哈希 | 规则保留（无害），注释改为「历史兼容」；确认两个版本周期都不再出现此冲突后删除 | L0 | `test:deploy` | 待办 |
| S9 | `test:scripts`、`lint:arch` 没有 CI 守门，脚本回归只能靠提测时撞出来 | 新增 CI：`scripts/**`、`micro-frontends/**`、`deploy_test.sh` 变更时跑 `test:scripts`；`src/**` 变更时跑 `lint:arch` | L0 | 观察 CI 一周的误报率 | 待办 |
| S10 | `dist/` 通过 `git add -f` 提交进 test 分支来部署，导致合并冲突、仓库膨胀，所以需要「机器产物冲突消化」这类补救逻辑 | 长期改为 CI 构建 + 制品发布（镜像或对象存储），test 分支只放源码 | L3（需运维配合） | 新旧部署并行一个周期 | 规划 |
| S11 | 一次性脚本残留：`fix-i18n-keys.js`、`replace-nuwaxpc.js`；i18n 检查脚本没有 npm 入口 | 删除一次性脚本；为 `check-hardcoded-i18n`、`i18n-governance-report` 加 `npm run i18n:*` 入口 | L0 | — | 待办 |

## 3. 文档（D）

| ID | 问题 | 方案 | 状态 |
| --- | --- | --- | --- |
| D1 | 缺上手文档（环境、子模块、无权限时的行为） | [getting-started.md](../getting-started.md) | ✅ 2026-10-15 |
| D2 | 缺 scripts 索引，9 个以上脚本在任何文档里都没出现 | [scripts/README.md](../../scripts/README.md) | ✅ 2026-10-15 |
| D3 | 缺子模块升级和 patch 冲突重制的分步手册 | [micro-apps-runbook.md](../micro-apps-runbook.md) | ✅ 2026-10-15 |
| D4 | 缺 src 架构总览 | [overview.md](./overview.md) | ✅ 2026-10-15 |
| D5 | 缺测试策略总览 | [testing-strategy.md](../testing-strategy.md) | ✅ 2026-10-15 |
| D6 | `micro-frontend-qiankun.md` 中的 gitlink、`MOBILE_BUILD_SOURCE`、本机绝对路径链接已过时 | 已修正，并改为以 adapter.json 为准，不再抄写 SHA | ✅ 2026-10-15 |
| D7 | `CONTRIBUTING.md` / `CONTRIBUTING.zh-CN.md` 过时：zh-CN 版仍是英文；目录树里有不存在的 `sseManager`；没提子模块 | 已收敛为中英文入口，指向 getting-started 与现行规范 | ✅ 2026-10-16 |
| D8 | `docs/` 根目录混有 8 篇一次性报告（验证码修复、提测单、状态快照等） | 按完成状态删除失效快照与重复报告，修正引用；仍有未完成事项的材料保留，不新增归档 | 部分完成（2026-10-16） |
| D9 | `docs/conversation/README.md` 目录树漏收 15 篇 | 改为现行维护入口，历史过程查 Git；仍有待办的材料保留 | ✅ 2026-10-16 |
| D10 | `docs/ch/i18n-contributing.md` 缺 3 个脚本的说明，且用 `tsc --noEmit` 作验证，与「全库 tsc 不作门」矛盾 | 收敛检查入口，验证改为相关测试和分域 typecheck | ✅ 2026-10-16 |
| D11 | 缺正式发版文档（standard-version → 构建 → Docker/k8s/devspace） | 新增 `docs/release-process.md` | 待办 |
| D12 | `docs/refactor/layering-audit.md` 的违规数（121）已过期 | 随 C2 刷新基线时同步更新 | 待办 |
| D13 | AGENTS.md 第 13 行把十多条提测决策塞在一行 | 决策细节归 runbook，AGENTS 只留命令和链接 | ✅ 2026-10-16 |

## 4. 代码（C）——由低风险到高风险

| ID | 问题（证据） | 方案 | 风险 | 前置 / 验证 | 状态 |
| --- | --- | --- | --- | --- | --- |
| C1 | 死代码：`components/Skill/index copy.tsx`、`pages/SpaceKnowledge/KnowledgeAccuracyTest/index.tsx.bak`；无人使用的 model：`devCollectAgent`、`monaco`、`global`；`SystemManagement/LogQuery/OperationLog` 的路由已注释 | 逐个确认零引用（包括 `useModel('<name>')` 字符串）后删除 | L1 | 构建通过 + 全量 vitest | 待办 |
| C2 | depcruise 基线里约 8 条已修复但未剔除 | 运行 `npm run lint:arch:baseline` 刷新到 97 条 | L0 | `lint:arch` | 待办 |
| C3 | utils→services 有 32 条违规，其中 18 条指向 `services/i18nRuntime.ts`，`utils/applyGeneratedIcon.ts` 一个文件占 6 条 | 把 i18nRuntime 中不发请求的纯函数部分下沉到 `utils/i18n/`，请求部分留在 services | L2 | i18n 相关测试 + 多语言页面走查 | 待办 |
| C4 | 页面互引 51 条（主要源页面：SpaceResource 8、AppDevDesign 6、EditAgent 5；被引用最多的目标：AppDev、Antv-X6、SystemManagement 各 8 条） | 被跨页复用的组件或 hook 下沉到 `components/business-component` 或 `features/<域>`；纯移动 + 改 import，不改实现 | L1 | 每个 PR 只处理一个目标页面；构建 + 相关测试 | 待办 |
| C5 | 11 条循环依赖 | 逐条拆环（抽出类型、反转依赖） | L1–L2 | `lint:arch` | 待办 |
| C6 | 注释与实现不一致：`useConversationRuntimeSession.ts` 约第 68 行写「flag 关闭（默认）」，实际默认开启 | 已修正为默认 runtime 开启 | L0 | — | ✅ 2026-10-16 |
| C7 | 类型门只覆盖 4 个域 | 扩到 `features/client-shell`、`layouts/MicroAppHost`、`utils/hostBridge`：先登记域并运行类型门，修复诊断；确需保留的存量债务逐条评审后录入基线。`--prune-baseline` 只删除已消除的债务，不能生成或接纳新增债务 | L0 | `typecheck` | 待办 |
| C8 | 3 套 SSE 实现：`utils/fetchEventSource.ts`、`utils/fetchEventSourceConversationInfo.ts`、`pages/AppDevPro/utils/userAppTaskStream.ts`。签名大部分重复，但定时器和返回值语义不同 | ① 先给三处写合同测试，锁定超时、重连、中止、错误回调语义；② 抽出单一内核（连接 + 计时 + 中止），保留三个薄适配，对外 API 不变；③ 调用方逐个迁移 | L2（会话路径按会话门走） | `test:conversation` + E2E + AppDev / 工作流试运行走查 | 待办 |
| C9 | 16 处原生 `fetch` 绕过请求层（如 `services/skill.ts`、`services/filePreview.ts`、Login、ChatInputHome），鉴权和错误提示可能与其他接口不一致 | 逐个评估：确属流式或二进制的保留，并集中到 `services/` 的专用封装；其余改走 `request` | L2 | 对应功能走查，失败重试路径用真实页面验证 | 待办 |
| C10 | 两份 ChatInputHome：`components/ChatInputHome`（1381 行）与 `pages/AppDev/components/ChatArea/components/ChatInputHome`（1372 行） | 先 diff 两份差异，再抽出共用内核，差异部分用 props 注入 | L2 | 首页输入与 AppDev 输入两条路径走查 | 待办 |
| C11 | 巨型文件（>1000 行 48 个）。优先级按「行数 × 近 90 天改动次数」排：`AppDevPro/index.tsx` 4322、`useFileTreePreviewView.tsx` 2836、`Chat/index.tsx` 2610、`models/conversationInfo.ts` 2305、`MentionEditor` 2274、`ChatInputUnified` 2255、`ConversationAgent/index.tsx` 2178 | 只做等价重构：抽纯函数（先补单测）→ 抽子组件 / hook（props 不变）。每次只拆一个文件中的一块，不顺手改逻辑 | L2 | 拆分前后快照测试或交互测试一致 | 待办 |
| C12 | 生产路由注册了 12 个 `/examples/*` 演示页（12k 行代码） | 改成与 `/mock-chat` 一样只在开发环境注册；先确认线上无人访问（查访问日志） | L2 | 访问日志 + 构建体积对比 | 待办（需确认） |
| C13 | 会话 V1 旧线仍在：`models/conversationInfo` 2.3k、`conversationAgent` 1.3k、`conversationInfoMessageList` 0.7k，以及 `fetchEventSourceConversationInfo` 等，可以通过 `?conversationRuntime=0` / `?conversationRenderer=v1` 回切 | ① 给回切参数加使用埋点；② V2 全量稳定且回切使用为零持续 N 周后，产品确认下线；③ 先移除回切入口（保留代码一个版本）；④ 再删除 V1 代码与相关测试 | L3 | 埋点数据 + 产品确认 + 回切预案 | 规划 |
| C14 | 工作流编辑器 Antv-X6 v1（约 10k）与 v3（29k）并存；`workflow` 与 `workflowV3` 两套 model | 先确认 v1 的入口和流量（哪些路由、哪些存量数据还走 v1），再按 C13 的路径下线 | L3 | 同上 | 规划 |
| C15 | conversationInfo 同时有全局 `useModel` 与页面级 `usePageModel` 两种实例，状态归属不清 | 先补文档：哪些字段属于页面级、哪些属于全局；新代码一律走页面级；随 C13 一起收敛 | L3 | 多会话页面互不串状态的测试 | 规划 |

## 5. 统计命令（更新基线用）

```bash
# >1000 行文件（排除测试与 locales）
find src -name '*.ts*' -not -path '*/.umi*' -not -path '*/locales/*' -not -name '*.test.*' | xargs wc -l | awk '$1>1000 && $2!="total"' | wc -l
# 分层违规基线条数
node -e 'console.log(require("./.dependency-cruiser-known-violations.json").length)'
# patch 行数
wc -l micro-frontends/*/adapter.patch
# 近 90 天改动最多的文件（与行数一起排巨型文件拆分优先级）
git log --since=90.days --name-only --format= -- src | sort | uniq -c | sort -rn | head -30
```

## 6. 建议节奏

- **第 1 阶段（本周，L0–L1）**：S1–S3 ✅、D1–D6 ✅；然后做 C2、C6、S8、S9、S11。
- **第 2 阶段（两周内，L1）**：S5、S6、C1、C4 先做被引用最多的 AppDev 页面、C7、D7–D12。
- **第 3 阶段（月度，L2）**：S4、C3、C8、C10、C11（每周拆 1–2 个热点文件）。
- **第 4 阶段（季度，L3）**：C12–C15、S10，均需产品或运维确认后才开始。

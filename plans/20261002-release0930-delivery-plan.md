# 9.30 剩余前端交付与联调准备

日期：2026-10-02。本文件记录当前交付路径与检查结果；截至本次准备，尚未合入共享分支或部署测试环境。

## 范围与入口

- 源码工作区：`/Users/apple/workspace/nuwax/.claude/worktrees/remaining-0930`，个人交付分支 `feat-dong.0930-remaining`。本次核对起点为 `5d257752b`；License 与页面验收后的新提交应从同一分支进入流程。
- 主区 `/Users/apple/workspace/nuwax` 的 `src/constants/version.ts` 并行改动保留，不提交到源码个人分支。
- 标准链路为个人分支 → `origin/feat-2026.9.30` → 本地 `dev`（汇合 origin/dev、gitlab/dev）→ 双远端 `test` → 完整生产产物。`dev` 只作本地集成，不自动推 origin/dev 或 gitlab/dev。
- 当前已有 `/Users/apple/workspace/.nuwax-deploy-worktree`、`deploy-sync-work` 与烤哈希现场；它们属于已有流程，本次不清理、不接管。
- 历史 `docs/qa-submission-feat-dong.0930.md` 是 9 月 11 日提测单，哈希和质量门数字不得作为本批结果。完成部署后应追加本批验收记录。

## 已核实远端

通过 `git ls-remote` 核对，并仅 fetch origin 的版本/dev/test、gitlab 的 dev/test 引用。未 checkout、merge 或 push 共享分支。

| 远端分支                        | 2026-10-02 核对时提交                      |
| ------------------------------- | ------------------------------------------ |
| origin/feat-dong.0930-remaining | `5d257752b77139e74ea568340ec28f9db52d2ab2` |
| origin/feat-dong.0930           | `895f7725b677e6a700519f26b40ab8239ff0c379` |
| origin/feat-2026.9.30           | `cb472d9c55a06fa8723df6c1cd547f9141baeba7` |
| gitlab/feat-2026.9.30           | `cb472d9c55a06fa8723df6c1cd547f9141baeba7` |
| origin/dev                      | `fdf729ba29e067b8e02d6b9733c21e155ecdd00e` |
| gitlab/dev                      | `6594689e45a953bd2dd0626747027b59f6017183` |
| origin/test                     | `cbca0ebea9feae614ec42961b837023ccadb1996` |
| gitlab/test                     | `4b227703bd67618923935cec3856e50b5f7116f2` |

remaining 起点已包含 origin 版本尖，比版本分支多 15 个提交。origin/dev 是 gitlab/dev 的祖先，后者多 33 个提交；origin/test 是 gitlab/test 的祖先，后者多 60 个提交。脚本在 test 阶段先 pull gitlab 再 pull origin，可以保留当前双远端祖先关系。未来执行时仍需重新 fetch，不能假设本表永远有效。

gitlab/dev 的历史提交不能因 origin/dev 已合并就视作全部进入本次个人分支。核对起点的 `HEAD..gitlab/dev` 仍有两个非合并提交：`14897bfb8`（文件预览保存回调注释）、`3c6d6fe9f`（微应用 gitlink 更新）。旧脚本仅告警、未合入 GitLab dev；当这些开发还未同步到 GitLab test 时，会漏交付。现在步骤 6 拉取最新 GitLab dev 并合入本地 dev，保留两个 dev 远端原 SHA。脚本从不推送 dev，因此不会直接导致 gitlab/dev 非快进；本地汇合后的 dev 保留两侧历史。

步骤 7 还移除了通用 `-X ours`，防止 dev/test 同一源码行冲突时静默舍弃 dev 改动。源码冲突回滚并停止，不推 test；仍只自动处理 dist 和版本烤哈希冲突。实际合并后的源码与 gitlink/pin 配对须复核。

## 微应用与移动端构建

- IM main 仍为 `65779cc21fe5d394e532c7b5c05f5816bd31a792`；任务源码独立分支为 `172d23cf1d299d426351a52baf37119274bafc8a`。正式宿主从 main pin 加主仓 `micro-frontends/message/adapter.patch` 构建，不直接将子模块 gitlink 升到任务分支。
- Repo main 仍为 `ff0e6e6e4a322436bd0330a2ee48445429e22738`。当前两者远端 main 与登记 pin 相同。
- `npm run build:prod:m gitlab` 的实际顺序是 `upgrade:micro-apps -- all` → 生成 `src/constants/version.ts` → 构建并同步微应用 → 宿主生产构建 → 写 `dist/version.json` → 下载移动端 H5 到 `dist/m/`。
- `UPGRADE_MICRO_APPS=0` 只关闭提测脚本步骤 2.5，**不会**关闭 npm prebuild 内的升级。默认生产构建仍审查最新 main。若期间 main 更新，须按升级脚本的 patch/overlay 预检处理，不能绕过它或只改 pin。
- 移动端默认来源为 GitLab `agent-platform-front-weapp` 的 `feat/nuwa-zhuoda-2026.09.30`，核对时为 `a657f2e9ecee73fad04c3d1ea1713acfc689bd7e`。这里只确认分支存在，未下载或验证 H5 产物目录。缺少 `unpackage/dist/build/web/` 会在完整构建阶段拦截。

## 隔离脚本修复与验证

这次仅修交付必要的边界：演练在任何恢复/隔离动作之前退出；删除任意 worktree 的自动推断改为保留并报错；工作树复用需要本脚本登记的路径、仓库 common-dir 和个人分支相匹配；起跑时冻结个人分支完整 SHA，后续并行提交留待下一轮；烤哈希仅随 test 的 dist 产物提交；双 dev 先汇合，源码冲突不自动择侧。

新隔离目录按个人分支摘要区分。对 `feat-dong.0930-remaining`，默认目录为 `/Users/apple/workspace/.nuwax-deploy-83c55874fd4a`，临时分支为 `deploy-sync-83c55874fd4a`。登记位于仓库 Git 元数据 `nuwax-deploy/83c55874fd4a.record`，不进入源码提交。旧版目录和临时分支保留原样。

- `node --test tests/deploySyncTest.node.mjs`：19 项通过。所有真实 checkout/merge/push 均只发生于各场景的临时 fixture 仓库、本地 bare 远端；pnpm/npm 使用测试替身，不代表生产构建通过。
- 覆盖 dirty dry-run、冲突 index 保留、异任务 worktree 保留、已登记续跑、未 push 的本地源码进入隔离交付、再次交付补入新提交、角色占用拦截、未登记目录/分支冲突拦截、已有现场拒绝接管，以及 dist/烤哈希一起提交。
- 双远端回归覆盖：GitLab dev 尚未进入 test 的开发进入两侧 test；两 dev 与两 test 分叉仍保留全部历史与源码；dev 远端不被推送；dev/dev 或 dev/test 源码冲突不构建、不推 test；组合质量门失败后续跑不能绕过；成功结果只按精确 dev 提交复用；仅 dist/烤哈希冲突仍能正常重建。
- 最终产物输入回归覆盖：test 独有源码须过组合门，失败不构建/推送；成功源码跨多次仅产物变化不重付门；构建期暂存的新源码须在推送前过门；构建期未暂存源码保留并停止；源区在 fetch 后出现并行新提交不滑入本轮冻结交付。
- 在真实 remaining 工作区执行只读 dry-run 已退出 0，打印完整 8 步；主区及旧提测目录的版本 WIP、所有既有 worktree 保留。未执行 fetch、测试、生产构建、merge、push 或部署。

## 执行条件与命令

实际执行前，应完成 License 最小页面/状态/受控功能、登录与绑定、五个验证码入口的页面验收；将本批源码和脚本定向提交并 push 到 remaining。IM 子工作区的 HEAD 不作为 parent gitlink 暂存，本批功能仍通过 adapter patch 交付。

对本批源码执行合入前质量三问，补齐新增业务定向测试。会话质量门直接由提测脚本第 4 步执行，不提前重复整套质量门；已合入同批个人分支的断点续跑会按祖先关系跳过。步骤 6 汇合后的 dev 源码若不同于已测个人分支，会在进入 test 前补过组合质量门；步骤 7 汇合后的 test 源码若不同于已测 dev，则在构建前补过最终组合门。成功结果存入同一 Git 元数据目录的 `.dev-gate` / `.test-gate`，仅匹配完整提交 SHA；失败不记录，后续新源码恢复校验，不因分支已合并而绕过未过的门。

构建完成并提交后，脚本再次检查源码是否变化。仅 dist/烤哈希变化时，把已验证输入的成功记录延续到产物提交，避免下一轮重建时间戳引起重复测试；prebuild 若更新 gitlink/adapter 等源码，则在 push 前补过质量门。存在未提交源码或子模块改动时保留现场、停止推送。本轮冻结个人分支 SHA 在真正构建和推送前均须是 test 的祖先。

```bash
cd /Users/apple/workspace/nuwax/.claude/worktrees/remaining-0930

# 只读核对执行顺序；不读真实 deploy_sync_test.env。
DRY_RUN=1 USE_WORKTREE=1 CONFIG_FILE=/dev/null \
  FEATURE_BRANCH=feat-dong.0930-remaining VERSION_BRANCH=feat-2026.9.30 \
  DEV_BRANCH=dev TEST_BRANCH=test bash scripts/deploy_sync_test.sh

# 源码提交、页面验收和合入前复核就绪后，执行标准隔离交付。
USE_WORKTREE=1 CONFIG_FILE=/dev/null \
  FEATURE_BRANCH=feat-dong.0930-remaining VERSION_BRANCH=feat-2026.9.30 \
  DEV_BRANCH=dev TEST_BRANCH=test bash scripts/deploy_sync_test.sh
```

失败后按日志定位具体步骤，在已登记目录检查 status 和冲突；使用同一命令续跑。存在 tracked 改动、其它分支占用或登记不匹配时，脚本保留现场并停止，不删除 worktree 或自动清理 index。不要通过移除别人的 worktree 或重新跑整链来消除占用。

## 部署后的证据与联调

1. 核对 origin/version 包含本批源码、origin/test 与 gitlab/test 的最终 SHA 完全一致，且保留执行前 gitlab/test 历史。另核对主区 HEAD、version WIP、旧提测现场保持原状。
2. 检查 `dist/version.json` 的源码 hash、`dist/micro-apps/{message,repo}/version.json` 的 main SHA 与 adapter SHA256，并与 public 同批 manifest 一致。只存在源码提交不视为静态产物已生效。
3. 验证测试域 `/home`、两条业务深链刷新、`/micro-apps/*` 静态 entry/version.json，确保业务页加载主站布局、静态缺失不回退主站 HTML；Cookie HTTP 和 WebSocket 联调分开核对。
4. 正式生产产物不启用 release0930Mock、IM mock fixture 或假登录 token。License 若接口仍未 ready，按其独立 mock/未就绪合同记录，不能把 mock 验收写成真实后端联调通过。
5. 用测试环境真实账号走登录回跳、绑定与解绑、验证码当前租户开关；避免改动共享租户开关或向真实 IdP 写临时配置来替代 frontend mock 验收。
6. 在本批验收记录分别写源码提交、脚本质量门、完整生产构建、远端部署、实际页面与真实接口结果。未完成项保留为具体缺口。

# 实施计划：deploy_test.sh 快速通道修复（双远端 + 冲突安全 + M 端源显式化）

- 对应 spec：无（中等需求，按 AGENTS.md 只出 plan）
- 分支：`feat-2026.9.30`
- 状态：已完成（2026-10-14，按 D1-D3 建议值实施；待首次真实提测确认）

## 背景与证据（2026-10-14）

1. **M 端源已修好**：a6e644f8d 把 `download-mobile-build.js` 的默认源改成了内网 gitlab。
   - 核验方法：对比两个远端同名分支 `feat/nuwa-zhuoda-2026.09.30` 下 `index.html` 的文件哈希。
   - test@902b5c3（10:11，修复前）的 `dist/m/index.html` = 745a493…，与 GitHub `nuwax-mobile` 一致。
   - test@cdbb5e3（14:17，修复后）的 `dist/m/index.html` = f15e650…，与 gitlab `agent-platform-front-weapp` 一致。
   - 根因：`npm run build:prod:m gitlab` 的位置参数只会落到复合命令的最后一段（`deploy-asset-retention.mjs merge gitlab`）。这个参数现在仍然无效、而且会误导人。
2. **`deploy_test.sh` 的 git 操作仍然全部走 GitHub**：`pull origin dev`、`pull origin test`、`push origin test`。
   - 内网测试环境部署的是 `gitlab/test`。reflog 显示今天 14:20 只推了 origin，14:40 才有一次推 gitlab（人工补推）。
   - 同事直接推到 `gitlab/dev` 的提交也进不了这条链。
3. **`git merge dev -X ours` 会静默丢源码**：只要有冲突，一律取 test 侧，dev 的改动可能被吞掉，构建照样通过。
4. 注释说构建会走 `upgrade:micro-apps`，但实际 prebuild 跑的是 `sync:micro-apps`，它不升级子模块。注释过期。
5. 两个提测入口的规则不一致：`deploy_sync_test.sh` 已经有双远端、`*_with_heal`、机器产物冲突消化、pin 撕裂修复，`deploy_test.sh` 一样都没有。

## 目标与非目标

- 目标：`deploy_test.sh`（dev 到 test 的快速通道）的远端策略、冲突处理、产物核验与 `deploy_sync_test.sh` 第 6 到 7 步一致；两个脚本共用同一份辅助函数；M 端源改成用环境变量显式指定，不再依赖 npm 位置参数。
- 非目标（放到第二期，单独出计划）：
  - 依赖清单统一，以及 M 端锁定到具体提交；
  - 合并 `upgrade-micro-apps` 和 `pull-micro-app-pins` 两个升级工具；
  - 统一入口迁到 `.mjs`，输出 JSON 汇总，按失败类型区分退出码；
  - 质量门按源码树哈希缓存。

## 决策（已确认）

| # | 问题 | 建议 | 理由 |
| --- | --- | --- | --- |
| D1 | 快速通道是否跑 `test:conversation` 质量门 | **默认跑，带跳过**：合并 dev 后，若除机器产物外的源码与合并前的 test 没有差别就跳过；同一提交成功一次后记录下来，不重复跑。`GATE=0` 作为紧急绕过 | 2026-10-14 实测 19.7 秒（116 个测试文件），构建要 3 到 4 分钟，门的成本可以忽略；gitlab/dev 直推的提交从没过门，快速通道是它进入测试环境前的唯一一道门 |
| D2 | 快速通道是否顺带升级子模块到远端最新 | **不升级，只提示**：对每个子模块执行 fetch，远端 main 领先当前登记提交时打印提醒，构建仍按 gitlink | 提测时自动升级等于把没审查过的上游代码混进这次提测，适配 patch 一冲突还会卡住提测；与 20261007 冻结构建计划「构建只用登记版本，升级走显式入口」一致。sync 链第 2.5 步的自动升级放到第二期一起迁出 |
| D3 | 本地 dev 合入 gitlab/dev 后是否推回远端 dev | **不推，只提示**：两个远端的 dev 互不包含时打印各自独有的提交数 | 推共享分支属于对外动作，影响面超出提测；test 产物已经包含两边的代码，可追溯性不受影响。dev 以哪个远端为准，留到第二期定 |

## 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | `scripts/deploy/lib.sh` | 增 | 从 `deploy_sync_test.sh` 原样抽出辅助函数：`log/die/run/rgit/retry_git/conflict_files_die/resolve_machine_conflicts/verify_microapp_pins/push_with_heal/pull_with_heal/run_test_gate/run_combined_source_gate`。只搬家，不改行为 |
| 2 | `scripts/deploy_sync_test.sh` | 改 | `source` 新的 lib.sh 并删掉重复定义；第 7 步 `npm run build:prod:m gitlab` 去掉无效的 `gitlab` 参数，改为 `MOBILE_BUILD_SOURCE=gitlab` |
| 3 | `deploy_test.sh` | 改 | 重写为快速通道，流程见下方「快速通道流程」 |
| 4 | `scripts/download-mobile-build.js` | 改 | 源和分支按优先级解析：环境变量 `MOBILE_BUILD_SOURCE` / `MOBILE_BUILD_BRANCH` 优先，其次 argv（兼容旧用法），最后是默认值（gitlab + 当前版本分支）。把解析逻辑抽成纯函数并导出，只在 `require.main === module` 时执行下载；日志打印实际拉到的提交号 |
| 5 | `tests/deployTest.node.mjs` | 增 | 按 deploySyncTest 的夹具写法（本地 bare 远端 origin/gitlab + 假 npm/pnpm）覆盖快速通道场景，见下方测试章节 |
| 6 | `tests/deploySyncTest.node.mjs` | 改 | 夹具多复制一份 `scripts/deploy/lib.sh`，现有用例全部保持绿 |
| 7 | `tests/downloadMobileBuild.node.mjs` | 增 | 源和分支解析的纯函数测试 |
| 8 | `package.json` | 改 | 新增 `test:deploy`：`node --test tests/deploySyncTest.node.mjs tests/deployTest.node.mjs tests/downloadMobileBuild.node.mjs` |
| 9 | `docs/deploy-sync-test-runbook.md` | 改 | 补「快速通道」一节：什么时候用、和全链的区别、`GATE=0` 紧急绕过 |
| 10 | `AGENTS.md` | 改 | 常用命令里补一行快速通道、三条决策和 `npm run test:deploy` |
| 11 | `docs/micro-frontend-qiankun.md` | 改 | 去掉 `build:prod:m gitlab` 旧写法（偏离记录 8） |

## 快速通道流程（`deploy_test.sh` 新版）

1. **预检**：回到仓库根目录；工作区必须干净，否则报错退出（快速通道不做 worktree 隔离，需要隔离的请走 sync 链）；记录起跑分支，失败时由 trap 切回；分别执行 `retry_git 3 fetch origin --prune` 和 `retry_git 3 fetch gitlab --prune`（不用 `--all`，避免顺带拉 gitee 这类无关远端拖慢或失败）。
2. **dev**：`checkout dev`，然后依次 `pull_with_heal origin dev`、`pull_with_heal gitlab dev`（汇合双远端，只在本地，不推送）；`git submodule update --init --recursive`。
3. **test**：`checkout test`，然后依次 `pull_with_heal gitlab test`、`pull_with_heal origin test`；接着 `merge dev`，**去掉 `-X ours`**。冲突时走 `resolve_machine_conflicts`：机器产物自动消化，源码冲突就回滚，打印冲突清单后退出，不构建也不推送；之后 `verify_microapp_pins`，再执行 `submodule update`。
4. **质量门**：默认执行 `run_combined_source_gate`，以合并前的 test 作为参照，源码无差别或已有成功记录时跳过；`GATE=0` 时绕过（D1）。同时打印子模块远端领先提醒（D2）和两个远端 dev 的分叉提醒（D3）。
5. **构建**：`DIST_RETENTION=1 MOBILE_BUILD_SOURCE=gitlab npm run build:prod:m`；执行 `git add -f dist` 后提交（产物没变化就跳过）；工作区还有未提交的源码或子模块改动就报错退出，不推送。
6. **发布**：`push_with_heal origin test`，再 `push_with_heal gitlab test`。
7. **核验**：打印 `origin/test`、`gitlab/test` 的头提交和 M 端实际来源；切回起跑分支。
8. 保留 `DRY_RUN=1` 演练（复用 lib 里的 `run`）。

## 实施顺序

1. 先写测试：`tests/deployTest.node.mjs` 针对新版行为写用例，用旧脚本跑应当失败（验证双远端推送、源码冲突不推送这两条）。`downloadMobileBuild` 的解析测试同时写好。
2. 抽出 `scripts/deploy/lib.sh`，`deploy_sync_test.sh` 改为 source 它，跑 `node --test tests/deploySyncTest.node.mjs` 确认全绿（纯搬家，零行为变化）。
3. 改 `download-mobile-build.js`，解析测试转绿。
4. 重写 `deploy_test.sh`，`tests/deployTest.node.mjs` 转绿。
5. `deploy_sync_test.sh` 去掉 `gitlab` 位置参数；补 `package.json`、runbook、AGENTS.md。
6. 真实演练：`DRY_RUN=1 bash deploy_test.sh`，核对打印出的命令序列（真实提测由用户触发，不由我推远端）。

## 证明成立的测试

`tests/deployTest.node.mjs` 新增以下场景：

- 正常流程：产物提交同时出现在 `origin/test` 和 `gitlab/test`。
- `gitlab/dev` 有独有提交：最终 test 产物提交包含它。
- dev 和 test 有**源码**冲突：脚本非零退出；两个远端的 test 都没变；本地回到起跑分支，index 里没有 unmerged 残留。
- 只有 `dist/` 冲突：自动消化，构建后推送成功。
- 质量门：源码有变化时调用门（假 pnpm 记日志）；源码无变化或已有成功记录时跳过；门失败时不构建、不推送；`GATE=0` 时不调用门。
- gitlab/test 被同事直推、有分叉：`push_with_heal` 合拢后推送成功。
- `DRY_RUN=1`：refs、index、工作区全部不变。
- 构建后留有源码改动：报错退出，不推送。

`tests/downloadMobileBuild.node.mjs` 新增以下场景：

- 无参数时默认 gitlab；`MOBILE_BUILD_SOURCE=github` 切到镜像；argv 里写 `github` 兼容旧用法；`MOBILE_BUILD_BRANCH` 能覆盖分支。

回归范围：

- `npm run test:deploy`；
- `npm run test:micro-app-build`（lib 抽取不影响微应用管线）；
- 不涉及会话路径，不需要跑 `test:conversation`。

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 抽 lib 时改动了 sync 链的行为 | 纯搬家；先让现有 deploySyncTest 用例全绿再动别的 | revert 抽取那一个 commit |
| 去掉 `-X ours` 后，原来能「静默过」的提测现在会停下来 | 这是有意为之；机器产物冲突仍然自动消化，只有源码冲突才停；runbook 写明处理方式 | 临时可用旧版 `git show <旧提交>:deploy_test.sh` 应急 |
| 快速通道推 gitlab/test 被拒（同事直推） | `push_with_heal` 自动合拢后再推 | 按脚本打印的冲突清单人工处理 |
| `pull_with_heal gitlab dev` 引入未过门的源码 | 快速通道默认过门（D1） | `GATE=0` 绕过 |

## 偏离记录

1. **质量门参照改为 `gitlab/test`，不用合并前的本地 test。** 原因：门失败后本地 test 已经带着合并提交，重跑时以本地 HEAD 作参照会得出「源码无变化」而绕过门。以已部署的 gitlab/test 作参照，失败的源码重跑时一定重新过门。测试用例「quality gate runs for new source, fails closed…」锁定此行为。
2. **新增 `abort_merge_die`，修复全链脚本源码冲突清单为空的问题。** 原因：全链脚本 5 处冲突出口都是先 `git merge --abort` 再打印清单，回滚后清单永远是空的。现在先记下清单再回滚。新增回归用例「source conflict lists the conflicted files before rolling back」（旧脚本失败、新脚本通过）。
3. **抽出 `detect_microapp_upgrades`。** 原因：快速通道的「子模块领先提醒」和全链步骤 2.5 的升级检测是同一段逻辑，合成一份。全链行为不变。
4. **两个脚本开头加「sh 调用时切回 bash」。** 原因：用户习惯 `sh deploy_test.sh`，而 macOS 的 `/bin/sh` 是 POSIX 模式 bash 3.2，不支持公共库里的进程替换，会直接报语法错误。新增用例「invoking through sh…」。
5. **`deploy_test.sh` 整体包进 `main()` 函数。** 原以为脚本运行中 checkout 会让 bash 读到别的分支上的本文件；真实验证（全链用例「keeps running the startup copy…」在旧代码上也通过）证明不会：git checkout 是删除旧文件再新建，bash 持有的仍是启动时那份内容。`main()` 保留（无害、可读），但不是必要修复。
6. **`download-mobile-build.js` 被 require 时不再执行下载。** 原因：旧版在模块顶层直接调用下载，测试一 require 就真的拉了一次 M 端产物写进 `dist/m`（已清理）。同时改用 `execFileSync` 传参，分支名不再拼进 shell 命令。
7. **`DRY_RUN=1` 在任何 fetch 之前打印执行顺序后退出。** 与全链脚本一致，保证演练完全只读。
8. 额外更新 `docs/micro-frontend-qiankun.md` 里 `build:prod:m gitlab` 的旧写法。
9. **（真实运行发现）切分支后同步更新子模块。** 首次真实跑全链：从 dev 启动，自动切到个人分支后子模块仍停在 dev 登记的版本，被干净检查判为「未提交改动」而停下（远端无改动）。现在全链在自动切换、构建前、收尾切回时，快速通道在切回起跑分支时，都执行 `git submodule update --init --recursive`。新增两个带真实子模块的用例（旧脚本均失败）。

## 验证结果（2026-10-14）

- `npm run test:deploy`：39/39 通过（全链 22、快速通道 12、M 端来源 5）。
- `npm run test:micro-app-build`：60/60 通过。
- 测试先行：快速通道 10 个用例在旧脚本上 0/10（只推 origin、源码冲突被 `-X ours` 静默吞掉），新脚本全过；全链冲突清单用例旧失败新通过；M 端解析用例实现前 0/5。
- 真实下载：`node scripts/download-mobile-build.js` 拉到 gitlab `feat/nuwa-zhuoda-2026.09.30@c9974ee`，`index.html` 哈希 f15e650，与 test@cdbb5e3 一致；`MOBILE_BUILD_SOURCE=gitee` 报错退出。
- 真实仓库只读演练：`DRY_RUN=1 sh deploy_test.sh`、`DRY_RUN=1 sh scripts/deploy_sync_test.sh` 均正常走完。
- 真实快速通道（2026-10-14 15:46，用户授权）：`sh deploy_test.sh` 从 dev 执行成功，origin/test 与 gitlab/test 同为 7eb58bf38，M 端为 gitlab c9974ee，质量门通过。
- 真实全链：首跑在预检因子模块未对齐停下（见偏离 9），修复后重跑，结果记录在下方。

## 第二期（另出计划）

- 依赖清单统一（子模块 + M 端），M 端锁定到具体提交，构建时把所有依赖提交号写进 `dist/version.json`；M 端分支不再写死在脚本里。
- 合并 `upgrade-micro-apps.mjs` 与 `pull-micro-app-pins.mjs` 为单一升级入口；全链步骤 2.5 的自动升级迁出提测链（与快速通道 D2 对齐）。
- 统一入口迁到 `.mjs`：JSON 汇总输出、按失败类型区分退出码（网络可重试 / 冲突需人工 / 门失败 / 配置错误），便于 Agent 调用。
- 确定 dev 以哪个远端为准（D3 遗留）。

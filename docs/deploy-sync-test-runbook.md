# 提测部署 Runbook（面向人，无需 AI/agent）

> 一条命令 + 一张自助表。任何人在仓库根目录都能跑，不依赖 agent 陪跑。

## 临时 test 通道：从指定分支重建

新增入口与旧 `deploy_test.sh` 并存；需要本次测试只包含指定目标分支时使用：

```bash
bash deploy_test_clean.sh                    # 使用当前分支
bash deploy_test_clean.sh feat-2026.11
DRY_RUN=1 bash deploy_test_clean.sh          # 演练当前分支
```

目标分支可省略，默认使用运行脚本时当前检出的本地分支；显式指定时，可以是本地分支，或双远端至少一侧存在的同名分支。当前分支为 test 或处于 detached HEAD 时不能按当前分支部署，需先切换到目标本地分支。脚本只汇合同名目标分支，不级联合入版本分支、dev 或旧 test。当前在其他分支且有未提交代码、子模块内部有文件修改、Git 操作未完成或 test 被其他 worktree 占用时停止。目标分支本身已混入的功能不会被自动拆除。

1. fetch 双远端，固定本轮输入；目标分支的**全部非 dist 改动（包括已有业务改动、新文件与删除）会自动提交**，已暂存的 dist 也会排除。合并同名双远端目标分支，源码冲突回滚停止。
2. 在目标分支升级微应用、提交 gitlink/pin/适配和版本常量，运行会话质量门及 `build:prod:m`。不提供跳过质量门选项。构建若又修改非 dist 文件，先提交到目标分支，再过门、重建一次；再次变化则停止。目标分支不新增 dist 产物提交，也不会自动提交子项目内部源码。
3. 将最终目标提交普通推送到 GitHub、GitLab，回读确认同一 HEAD。构建后不使用合并自愈；远端出现并发更新即停止，重新汇合源码后必须重新构建。
4. 构建和目标分支双推成功后，将两端及本地旧 test 分别备份到 `backup/test/<运行编号>/{origin,gitlab,local}`，每份备份均推到两端；不存在的旧分支跳过。核对远端未变后，依次删除 GitLab、GitHub 旧 test。
5. 从最终目标提交新建 test，只增加完整 dist 的产物提交，普通双推并回读确认相同 HEAD。成功后切回目标分支；环境部署仍由现有扫描系统执行。

哈希资源仍保留默认 3 代；上一版 dist 取自删除前的 GitLab/test，CSS 历史回填通过 `DIST_RETENTION_HISTORY_REF` 指向该旧提交。每轮重建都从同一份旧产物快照开始，避免重建两次使资源提前过期。M 端沿用下文的来源选择及 `MOBILE_BUILD_REPO` / `MOBILE_BUILD_BRANCH` 覆写。

### 失败恢复

运行记录在 Git 公共目录的 `nuwax-deploy/clean-<时间>-<随机编号>/state`。失败时保留原 dist、本轮产物、当前分支和源码；脚本按本轮精确提交打印源码补推、产物补推及旧版本恢复命令。不要合并旧 test 来修复推送失败。

- 质量门、构建或目标分支推送失败：旧远端 test 不删除。
- 删除权限不足、单端成功或网络失败：不算完成；先核对两端现状。分支已缺失时可用打印出的旧 SHA 普通推送恢复；已有新提交则先协调，禁止强推。
- 新 test 只有一端发布成功：核对未发布端仍缺失后，按打印命令补推同一个产物 SHA。若决定重新构建，也须先核对并处理这轮部分发布状态。

两端仓库无法跨库原子替换，删除到重建之间 test 会短暂不存在；执行期间应暂停其他提测脚本和人工对 test 的更新。脚本使用本地运行锁并在远端操作前后核对 SHA，但不能阻止其他机器同时写入。异常终止留下 `nuwax-deploy/clean-test.lock` 时，确认没有本轮进程后再移除锁；不自动删除未知进程的锁。备份分支供回退使用，后续由维护者确认后清理。

## 两条提测通道：选哪个

|  | 快速通道 `bash deploy_test.sh` | 全链 `bash scripts/deploy_sync_test.sh` |
| --- | --- | --- |
| 什么时候用 | 代码已经在 dev（origin 或 gitlab 任一侧），只想尽快出一版测试环境 | 从个人分支出发，要一路合进版本分支、dev、test |
| 合并路径 | 本地 dev 汇合 origin/dev + gitlab/dev → test | 个人分支 → 版本分支（双远端）→ 本地 dev → test |
| 推送 | dev/test 均推 origin+gitlab | 个人/版本/dev/test 均推 origin+gitlab |
| 远端 dev | 汇合后双推送 | 组合质量门通过后双推送 |
| test:conversation 质量门 | **默认跑**；源码与已部署的 gitlab/test 相同则跳过；同一提交成功过不重跑；`GATE=0` 紧急绕过 | 默认跑（个人分支 + 组合 dev / test 各一道，同样有跳过与缓存） |
| 子模块（repo-web / im） | **自动升级到远端 main 最新**，适配预检通过后提交 gitlink/pin，再过门和构建；子模块缺失或升级失败即停止（内部链 `MICRO_APP_REQUIRED=1`） | 步骤 2.5 自动升级到远端 main（`UPGRADE_MICRO_APPS=0` 关闭） |
| M 端产物（dist/m） | 本地 nuwax-mobile 检出的 origin 远端（`MOBILE_BUILD_REPO` 可覆写） | 同左 |
| 源码冲突 | 微应用 pin/gitlink 不一致时对齐子模块远端最新并继续；其它源码冲突打印清单 → 回滚 → 退出，不构建不推送 | 同左 |
| 工作区不干净 | 仅子模块检出版本与登记不同自动对齐并继续；主仓/子仓文件改动或已暂存输入仍拒绝（需要隔离请走全链） | 自动转入独立 worktree |
| 演练 | `DRY_RUN=1` | `DRY_RUN=1` |

两条通道共用 `scripts/deploy/lib.sh` 里的合并、冲突消化、推送自愈和质量门函数，规则只维护一份。同事克隆的三类常见差异都会自愈：没配 `gitlab` 远端时自动补配（内网测试环境落点，`GITLAB_REMOTE_URL` 可覆写地址）；单分支检出缺本地 `dev`/`test`（全链含版本分支）时从远端自动补建，个人分支（提测输入）仍要求本地存在；M 端产物源见下节。2026-10-14 前缺 gitlab 远端会在第一步 fetch 被当网络错误空耗重试后中止。

### 快速通道的三条决策（2026-11-04 更新）

本节维护当前规则；初版方案中的未完成后续项见 [快速通道计划](../plans/20261014-deploy-test-fast-lane-plan.md)，已完成的调整过程通过 Git 查询。

1. **质量门默认开启。** 同事直接推到 gitlab/dev 的提交可能尚未验证，快速通道负责检查真正交付的组合源码。终端只打印测试汇总与耗时，详细输出保存在 Git 公共目录的 `nuwax-deploy/gate-last.log`；失败展示日志尾部并保留 `gate-failure.log`。输入未变或同一提交已成功时复用结果。紧急情况用 `GATE=0`，脚本会大字提示本次未经门禁。
2. **自动更新子模块到最新。** 2026-10-15 按用户要求替代原来的「只提醒不升级」规则。起跑时只要子仓没有文件改动，未暂存的提交指针偏差就自动对齐；汇合到 test 后执行 `npm run upgrade:micro-apps -- all`，通过快进及 patch/overlay 预检后提交 gitlink 与 adapter.pin，再过质量门和构建。实际文件改动、已暂存输入、网络失败或适配冲突仍停止并保留现场，不静默退回旧版本发布。
3. **所有提交和合并均双推送。** 2026-11-02 起，origin 固定为 GitHub、gitlab 为内网；个人、版本、dev、test 分支都同步到两端。第二端并发更新触发合并时，必须把合并结果回推第一端，并回读核对相同 HEAD；任一失败不算交付完成。

### M 端产物源：跟着本地 nuwax-mobile 的 origin 走

npm 会把附加参数接到复合命令的最后一段（`deploy-asset-retention.mjs merge`），传不到 M 端下载脚本。2026-10-14 起，下载脚本不再配置 GitLab/GitHub 地址，解析顺序为：**本地 nuwax-mobile 检出的 origin 远端 > GitHub 的 nuwax-mobile 仓库**。前者跟着各机器的本地 git 配置走（origin 指向 GitHub 还是内网 GitLab 都行，M 端后续会默认同步到 GitLab）；本地没有该检出（普通用户打本包的常态）时回退 GitHub 地址并打印警告。需要临时覆写用环境变量：

```bash
MOBILE_BUILD_REPO=<仓库地址> npm run build:prod:m
```

`MOBILE_BUILD_BRANCH` 可覆盖 M 端分支。构建日志会打印实际使用的来源与拉到的 M 端提交号。

## 怎么跑（全链）

```bash
bash scripts/deploy_sync_test.sh
```

- 首次运行交互生成配置（`scripts/deploy_sync_test.env`，之后免输入）
- 总耗时受构建缓存和网络影响，以本次输出为准
- `DRY_RUN=1` 演练不执行写操作；`INIT_ONLY=1` 只生成配置

## 脚本自动处理（不用管）

| 场景 | 脚本行为 |
| --- | --- |
| 主区有未提交代码（并行开发/构建现场） | 自动转入 `.nuwax-deploy-worktree` 隔离跑全链，主区零接触 |
| 子模块（nuwax-im / repo-web）远端 main 领先 | 两条通道均走 `upgrade:micro-apps` 正规通道，适配预检通过后升级并提交；快速通道在组合 test 过门前执行 |
| 快速通道起跑时子模块检出版本偏离登记 | 无文件改动时自动对齐后继续；子仓文件改动或已暂存输入仍保护并报错 |
| 网络抖动（SSL 瞬断 / fetch 断） | 自动退避重试（10s/20s × 3），不要手工重启 |
| dist 构建产物冲突 / version.ts 烤哈希冲突 | 机器产物自动消化（dist 清空重建 / version.ts 取本地侧） |
| test 远端分叉 pull 撞冲突 | 自动按机器产物自愈提交合并 |
| 微应用 gitlink/pin 配对撕裂（合并无感撕裂） | 自动以 gitlink 为准修齐 pin |
| 合并时两侧微应用 pin / gitlink 不一致 | 不取 ours/theirs，fetch 子模块 `origin/<branch>` 最新提交并同时改 gitlink 与 adapter.pin；adapter 还有 pin 以外的字段冲突则仍回滚 |
| test:conversation 失败全是「Test timed out」 | 等 15 秒重试一次（`GATE_JITTER_RETRIES`、`GATE_JITTER_BACKOFF` 可调）。断言失败不重试 |
| 上次异常退出残留（index 幽灵 unmerged / worktree 占用分支） | 前置自动清理 |
| 断点续跑 | 中途修完问题**直接重跑同一命令**，已过步骤自动跳过（质量门不重付） |
| test 组合源码与已测 dev 不同 | 步骤 7.1 自动补过质量门（只改机器产物时不重复跑） |

## 会停下来的三种情况（需要人）

### 1. 质量门挂（test:conversation 有失败套件）

质量门失败会阻断提测，终端展示最后 80 行并打印完整日志路径；不支持按失败套件名豁免。按日志中的 `FAIL` 文件路径隔离复跑：

```bash
pnpm exec vitest run <测试文件路径>
```

- **隔离复跑也挂** = 真回归。九成是「最近合入的接口契约变了没同步测试断言」（改端点/参数/鉴权方式）：对照失败输出里的期望值 vs 实际值，`git log -S '关键字'` 找到改契约的提交，把断言跟上新契约。
- **隔离复跑通过** = 机器负载抖动。失败原因若全是用例超时，脚本会自动再跑一轮；仍失败再重跑本脚本。

### 2. 源码 merge 冲突

脚本回滚并打印**需人工取舍的冲突文件清单**（机器产物已自动消化）。处理：

```bash
git merge origin/feat-2026.9.30   # 按清单提示的分支重演冲突
# 逐文件按双方语义取舍（🔴勿用 checkout --ours/--theirs 整文件取侧，会静默丢对方功能）
git commit && bash scripts/deploy_sync_test.sh   # 断点续跑
```

### 3. 微应用适配 patch 冲突（子模块 main 前进但适配没跟上）

报错自带**冲突文件清单 + 上游前进范围**。处置归属：微应用适配负责人基于新候选重制 `adapter.json` 指向的 `adapter.patch`，随构建提交；**其他同事拉最新分支重跑即可，无需本地处理**。

## 完成后（核对两个远端）

脚本末尾自动打印两个远端的分支落点；每个对应分支的 HEAD 必须一致：

```
origin/<版本分支> / gitlab/<版本分支> → 相同 SHA
origin/dev / gitlab/dev → 相同 SHA
origin/test / gitlab/test → 相同产物 SHA
```

## 约定（写进 AGENTS.md 的三条）

1. 主区不干净自动进 worktree，不要手工清场
2. `src/constants/version.ts` 只存 APP_VERSION / APP_NAME；提交哈希运行时读取 `dist/version.json`，不烤入源码
3. 网络抖动等脚本自愈，勿手工重启整链

## 遗留告警（知悉即可，不阻塞）

- `gitlab/dev 存在 N 个独有提交`：先汇合双方历史，之后将组合 dev 同步到两个远端。
- `构建产物无变更，跳过提交`：本轮无代码变化，推送为 no-op，正常

社区打包遇到未初始化的私有子模块会警告并跳过相应微应用；内部提测链设置 `MICRO_APP_REQUIRED=1`，缺失时停止。

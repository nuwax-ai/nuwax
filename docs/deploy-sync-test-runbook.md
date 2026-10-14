# 提测部署 Runbook（面向人，无需 AI/agent）

> 一条命令 + 一张自助表。任何人在仓库根目录都能跑，不依赖 agent 陪跑。

## 两条提测通道：选哪个

|  | 快速通道 `bash deploy_test.sh` | 全链 `bash scripts/deploy_sync_test.sh` |
| --- | --- | --- |
| 什么时候用 | 代码已经在 dev（origin 或 gitlab 任一侧），只想尽快出一版测试环境 | 从个人分支出发，要一路合进版本分支、dev、test |
| 合并路径 | 本地 dev 汇合 origin/dev + gitlab/dev → test | 个人分支 → 版本分支（推 origin）→ 本地 dev → test |
| 推送 | origin/test + gitlab/test | 个人分支、版本分支（origin）+ origin/test + gitlab/test |
| 远端 dev | **不推**，两个远端 dev 互不包含时打印提醒 | 不推 |
| test:conversation 质量门 | **默认跑**；源码与已部署的 gitlab/test 相同则跳过；同一提交成功过不重跑；`GATE=0` 紧急绕过 | 默认跑（个人分支 + 组合 dev / test 各一道，同样有跳过与缓存） |
| 子模块（repo-web / im） | **不自动升级**，按登记版本构建；远端 main 领先时打印提醒；子模块缺失直接失败（内部链 `MICRO_APP_REQUIRED=1`，只有社区版本地构建才会跳过微应用） | 步骤 2.5 自动升级到远端 main（`UPGRADE_MICRO_APPS=0` 关闭） |
| M 端产物（dist/m） | 本地 nuwax-mobile 检出的 origin 远端（`MOBILE_BUILD_REPO` 可覆写） | 同左 |
| 源码冲突 | 打印冲突清单 → 回滚 → 退出，不构建不推送 | 同左 |
| 工作区不干净 | 直接拒绝（需要隔离请走全链） | 自动转入独立 worktree |
| 演练 | `DRY_RUN=1` | `DRY_RUN=1` |

两条通道共用 `scripts/deploy/lib.sh` 里的合并、冲突消化、推送自愈和质量门函数，规则只维护一份。克隆里没配 `gitlab` 远端时脚本会自动补配（内网测试环境落点，`GITLAB_REMOTE_URL` 可覆写地址；2026-10-14 前缺远端会在第一步 fetch 被当网络错误空耗重试后中止）。

### 快速通道的三条决策（2026-10-14）

详细背景与证据见 [plans/20261014-deploy-test-fast-lane-plan.md](../plans/20261014-deploy-test-fast-lane-plan.md)。

1. **质量门默认开启。** 实测 `test:conversation` 约 20 秒，构建要 3 到 4 分钟，门的成本可以忽略。同事直接推到 gitlab/dev 的提交从没过门，快速通道是它们进测试环境前的最后一道检查。紧急情况用 `GATE=0`，脚本会大字提示本次未经门禁。
2. **不自动升级子模块。** 提测时自动升级，相当于把没审查过的上游代码混进这次提测；适配 patch 一冲突还会卡住提测。升级请单独执行 `npm run upgrade:micro-apps -- all`，提交后再提测。
3. **不推远端 dev。** 推共享分支属于对外动作，超出提测范围；test 产物已经包含两边 dev 的代码，追溯不受影响。dev 以哪个远端为准留待后续统一。

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
- 常规一轮 **6-8 分钟**（构建 3-4 分钟 + 推送 1-2 分钟是物理地板）
- `DRY_RUN=1` 演练不执行写操作；`INIT_ONLY=1` 只生成配置

## 脚本自动处理（不用管）

| 场景 | 脚本行为 |
| --- | --- |
| 主区有未提交代码（并行开发/构建现场） | 自动转入 `.nuwax-deploy-worktree` 隔离跑全链，主区零接触 |
| 子模块（nuwax-im / repo-web）远端 main 领先 | 全链：步骤 2.5 自动走 `upgrade:micro-apps` 正规通道升级并随链提交；快速通道：只提醒不升级 |
| 网络抖动（SSL 瞬断 / fetch 断） | 自动退避重试（10s/20s × 3），不要手工重启 |
| dist 构建产物冲突 / version.ts 烤哈希冲突 | 机器产物自动消化（dist 清空重建 / version.ts 取本地侧） |
| test 远端分叉 pull 撞冲突 | 自动按机器产物自愈提交合并 |
| 微应用 gitlink/pin 配对撕裂（合并无感撕裂） | 自动以 gitlink 为准修齐 pin |
| 上次异常退出残留（index 幽灵 unmerged / worktree 占用分支） | 前置自动清理 |
| 断点续跑 | 中途修完问题**直接重跑同一命令**，已过步骤自动跳过（质量门不重付） |
| test 组合源码与已测 dev 不同 | 步骤 7.1 自动补过质量门（只改机器产物时不重复跑） |

## 会停下来的三种情况（需要人）

### 1. 质量门挂（test:conversation 有失败套件）

脚本会直接打印**每个失败套件的隔离复跑命令**。自助判定：

```bash
npx vitest run tests/xxx.test.ts   # 用脚本打印的命令
```

- **隔离复跑也挂** = 真回归。九成是「最近合入的接口契约变了没同步测试断言」（改端点/参数/鉴权方式）：对照失败输出里的期望值 vs 实际值，`git log -S '关键字'` 找到改契约的提交，把断言跟上新契约。
- **隔离复跑通过** = 机器负载抖动，直接重跑脚本。

### 2. 源码 merge 冲突

脚本回滚并打印**需人工取舍的冲突文件清单**（机器产物已自动消化）。处理：

```bash
git merge origin/feat-2026.9.30   # 按清单提示的分支重演冲突
# 逐文件按双方语义取舍（🔴勿用 checkout --ours/--theirs 整文件取侧，会静默丢对方功能）
git commit && bash scripts/deploy_sync_test.sh   # 断点续跑
```

### 3. 微应用适配 patch 冲突（子模块 main 前进但适配没跟上）

报错自带**冲突文件清单 + 上游前进范围**。处置归属：微应用适配负责人基于新候选重制 `adapter.json` 指向的 `adapter.patch`，随构建提交；**其他同事拉最新分支重跑即可，无需本地处理**。

## 完成后（贴提测单三行）

脚本末尾自动打印三处远端落点，直接复制：

```
origin/<版本分支> → xxx
origin/test → xxx update xxxxxxxx
gitlab/test → xxx
```

## 约定（写进 AGENTS.md 的三条）

1. 主区不干净自动进 worktree，不要手工清场
2. `src/constants/version.ts` 烤哈希只随 dist 前置提交，feat 线源码提交不携带
3. 网络抖动等脚本自愈，勿手工重启整链

## 遗留告警（知悉即可，不阻塞）

- `gitlab/dev 存在 N 个独有提交`：gitlab 侧集成分支有本链路外的提交（信息性告警，设计内）
- `构建产物无变更，跳过提交`：本轮无代码变化，推送为 no-op，正常

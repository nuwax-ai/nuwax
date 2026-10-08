# 提测部署 Runbook（面向人，无需 AI/agent）

> 一条命令 + 一张自助表。任何人在仓库根目录都能跑，不依赖 agent 陪跑。

## 怎么跑

```bash
bash scripts/deploy_sync_test.sh
```

- 首次运行交互生成配置（`scripts/deploy_sync_test.env`，之后免输入）
- 常规一轮 **6-8 分钟**（构建 3-4 分钟 + 推送 1-2 分钟是物理地板）
- `DRY_RUN=1` 演练不执行写操作；`INIT_ONLY=1` 只生成配置

## 脚本自动处理（不用管）

| 场景 | 脚本行为 |
|---|---|
| 主区有未提交代码（并行开发/构建现场） | 自动转入 `.nuwax-deploy-worktree` 隔离跑全链，主区零接触 |
| 子模块（nuwax-im / repo-web）远端 main 领先 | 步骤 2.5 自动走 `upgrade:micro-apps` 正规通道升级并随链提交 |
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

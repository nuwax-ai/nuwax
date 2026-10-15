# 微应用子模块操作手册

资料库（repo）与消息（message）两个微应用以 git 子模块引入、由主仓「适配层」改造后作为 qiankun 子应用发布。本文只讲**日常怎么操作**；契约与设计细节见 [消息与资料库微应用接入](./micro-frontend-qiankun.md)。

## 1. 心智模型（先读这一段）

```
submodules/<repo>          上游原仓（只读消费，branch=main）
   │  主仓 index 里的 gitlink = 本次构建用的固定提交（唯一事实源）
   ▼
micro-frontends/<id>/
   ├─ adapter.json         登记：sourceDir / pin（必须 == gitlink）/ 资源与业务路由契约
   ├─ adapter.patch        对上游文件的「修改」（git apply）
   └─ overlay/             整文件覆盖/新增（复制，零冲突）
   ▼  scripts/sync-micro-apps.mjs（隔离目录：git archive → apply patch → 复制 overlay → install → build）
public/micro-apps/<id>/    产物 + version.json（来源提交、适配指纹、工具链、cache 命中情况）
   ▼  umi 构建复制
dist/micro-apps/<id>/
```

三条铁律：

1. **构建只认主仓 gitlink**，不认子仓工作区 HEAD、不 fetch。子仓里随便切分支/有脏文件都不影响构建结果。
2. **gitlink 与 `adapter.pin` 必须一致**，否则构建在 install 前失败。合并分支时用 `-X ours/theirs` 最容易把二者撕裂；提测脚本会以 gitlink 为准自动修 pin。
3. **升级只走脚本**（`upgrade:micro-apps` / `pull:micro-app-pins`），只接受 main 历史上的快进，不回退、不接收分叉提交；脚本只暂存，不提交不推送。

## 2. 初始化与日常开发

```bash
git submodule update --init --recursive   # 需内网 git.yichamao.com 权限
npm run doctor                            # 体检：子模块 / pin / 产物是否过期
npm run sync:micro-apps                   # 生成 public/micro-apps（首次约 40s，之后输入不变秒级命中缓存）
npm run dev
```

- `npm run dev` 不会自动构建微应用（避免每次启动多等 40 秒），但 `predev` 会跑 `doctor --quick`：产物缺失或与登记版本不一致时打印提醒和修复命令，不拦截启动。
- 切分支后若 gitlink 变了：`git submodule update --init` 对齐子仓 → `npm run sync:micro-apps`。
- 只调试子应用本身：适配 dev server 独立运行在 `http://localhost:7100/repo/`（资料库）/ `7110`（消息），见各 `micro-frontends/<id>/README.md`。

### 没有子模块权限（开源社区版 / 新同事未开权限）

`submodules/` 只剩空目录。`sync:micro-apps` 警告并**跳过**对应微应用，主包照常构建，资料库/消息菜单页面不可用。内部部署链（两条提测脚本）`export MICRO_APP_REQUIRED=1`，此时缺子模块直接失败，防止测试环境无声缺功能。

## 3. 产物缓存

`sync:micro-apps` 以「固定提交 + 适配指纹（adapter.json/patch/overlay）+ Node/pnpm 版本 + 宿主 qiankun 插件实装版本 + shell 中 `VITE_*` 变量 + 构建脚本自身内容」为键，把成功产物缓存在 `.cache/micro-apps/artifacts/<id>/<key>/`。

- 任一输入变化即未命中，重新完整构建（含资料库类型基线门）；命中时仍重新校验入口契约。
- 实测：冷构建 41.7s → 命中 0.5s；缓存产物与强制重建产物逐文件一致（341 个文件）。
- `MICRO_APP_CACHE=0 npm run sync:micro-apps` 强制重建；`MICRO_APP_CACHE_KEEP=<n>` 调整每应用保留份数（默认 3）；删 `.cache/micro-apps/artifacts` 即全清。
- 产物 `version.json` 的 `cache.hit` / `cache.key` 可追溯本次是否复用。

## 4. 升级子模块

### 4.1 常规升级（任何人）

```bash
npm run upgrade:micro-apps -- all --dry-run   # 预检：fetch + 快进 + patch/overlay 检查，不改任何东西
npm run upgrade:micro-apps -- all             # 或 message / repo；--ref <SHA> 指定 main 上的某个提交
npm run sync:micro-apps                       # 验证构建（资料库类型基线新增必须为 0）
git commit -m "chore(micro-apps): <id> 子模块升级 <旧>-><新>——<上游变更摘要>"
```

成功只暂存 `submodules/<repo>` 的 gitlink 与 `adapter.json`。失败会恢复 HEAD/pin/index，并在 `.cache/micro-apps/upgrades/` 留恢复记录。全链提测脚本步骤 2.5 会自动调用本工具（`UPGRADE_MICRO_APPS=0` 关闭）；快速通道只提醒不升级。

### 4.2 预检报「adapter patch 与候选 main 冲突」（适配负责人）

说明上游改到了 patch 修改过的位置，需要重制 patch。**其他同事无需处理**，等负责人提交重制版后拉分支重跑即可。

先试自动三方合并：

```bash
npm run pull:micro-app-pins -- repo     # 快进 + 三方合并重算 adapter.patch，成功则 gitlink/pin/patch 一并暂存
```

自动合并失败（两边改了同一处）时，脚本列出冲突文件后停止。此时 `adapter.json` 的 pin 与子仓 HEAD **已经前进但未暂存**，按下面步骤手工重制：

```bash
APP=repo-web                                   # 或 message
SUB=submodules/nuwax-repo-web                  # 或 submodules/nuwax-im
NEW=$(git -C $SUB rev-parse HEAD)              # pull 脚本已切到的新提交
git -C $SUB worktree add --detach /tmp/patch-rebase $NEW
cd /tmp/patch-rebase
git apply --3way "$OLDPWD/micro-frontends/$APP/adapter.patch"   # 冲突文件带冲突标记
# …按语义解决冲突（保留上游新逻辑 + 宿主适配意图）…
git add -A -- . ':(exclude)*.rej' ':(exclude)*.orig'
git diff --cached --binary --find-renames > "$OLDPWD/micro-frontends/$APP/adapter.patch"
cd - && git -C $SUB worktree remove --force /tmp/patch-rebase
npm run sync:micro-apps                         # 必须通过：patch 可应用、类型基线新增 0、入口校验
git add $SUB micro-frontends/$APP/adapter.json micro-frontends/$APP/adapter.patch
```

注意：

- **不要用 `git apply --reject`** 重制：它生成的 `*.rej` 会被 `git add -A` 带进 patch（2026-10-09 曾混入 19 个 `.rej`，patch 体积翻倍）。现在 `sync:micro-apps` 与 `doctor` 都会拒绝含 `*.rej`/`*.orig` 的 patch。
- 上游改了 overlay 覆盖的同名文件时，`upgrade:micro-apps` 默认中止；审查 overlay 并同步上游改动后再加 `--allow-overlay-changes`。
- 新增文件优先放 `overlay/`（整文件复制，永不冲突），patch 只承载对上游已有文件的修改。

## 5. 合并分支时的子模块冲突

| 现象 | 处理 |
| --- | --- |
| `adapter.patch` 冲突 | 提测脚本自动取**传入侧**（部署数据源的重制版）；手工合并同理，取较新重制版，然后 `npm run sync:micro-apps` 验证 |
| gitlink 冲突 | 取较新的那一侧（必须是 main 历史上的快进），同步把 `adapter.json` pin 改成同一值 |
| 合并后构建报「gitlink 与 adapter.pin 不一致」 | 以 gitlink 为准改 pin（`npm run doctor` 会指出具体值），或重跑提测脚本自动修复 |
| 切分支后 `git status` 显示 `submodules/... (new commits)` | 子仓 HEAD 没对齐，`git submodule update --init`；不要 `git add` 它 |

## 6. 排障速查

| 报错 / 现象 | 原因 | 修复 |
| --- | --- | --- |
| `子模块未初始化：…跳过微应用构建` | 未 init 或无权限 | `git submodule update --init --recursive`；无权限找管理员开 |
| `缺少 stage 0 gitlink` | 合并冲突未解决 / 未 init | 解决冲突后 `git submodule update --init` |
| `固定提交不可用或不在本地 origin/main 历史` | 子仓对象缺失（浅克隆/没 fetch） | `git -C submodules/<repo> fetch origin main` |
| `另一微应用构建或升级正在运行` | 并行构建持锁 | 等待结束；进程已死时锁会自动回收 |
| `适配新增 N 条类型诊断` | 适配改动引入新 TS 错误（资料库） | 修 patch/overlay；日志在 `MICRO_APP_KEEP_BUILD=1` 保留的隔离目录 |
| dev 下资料库/消息页面空白或 404 | 本地无产物或已过期 | `npm run doctor` → `npm run sync:micro-apps` |

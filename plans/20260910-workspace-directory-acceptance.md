# 工作目录需求接手验收（2026-09-10）

基线：nuwax c4bd9cf63；商业壳前端 pin 仍为 c23224f71。本次不发布或推送。

## 已修复（前端，未提交）

- 首页、创建项目 PromptBox、常规项目弹窗：切换个人电脑后清空旧电脑目录。
- 真实创建弹窗提交回归先失败（B 电脑携带 A 路径），修复后通过。
- 目录 roots/children 请求携带所选 sandboxId；弹窗从调用入口接收电脑 ID。
- OPEN_DESKTOP 测试断言对齐 apiEnsurePod 的可选 appStage 参数，不改业务调用。

## 验证

- npm run test:conversation：53 文件、479 测试通过（退出码 0）。
- git diff --check 通过。
- ego-browser 打开 localhost:3000/home，真实登录态，个人电脑 NuwaCLI-MPB128（sandboxId=339）。
- 修复前目录请求 HTTP 200 / code 4000：Required request parameter 'sandboxId' for method parameter type Long is not present。
- 修复后请求 /api/computer/fs/roots?sandboxId=339，HTTP 200 / code 0001：Path not found: /api/computer/fs/roots。

## Path not found 根因与处置（第二轮，ZCode 接手）

**根因链（已实锤）：**

1. 网关转发正常——`Path not found` 报文与本机 file-server 1.4.2 直连返回逐字一致（`{"success":false,"code":"UNKNOWN_ERROR","error":{"type":"RESOURCE_ERROR","message":"Path not found: /api/computer/fs/roots"}}`），错误源是本机 file-server，不是网关。
2. 本机 nuwa-cli（@nuwax-ai/nuwa-cli@0.2.9）依赖的 **nuwax-file-server@1.4.2** 无 fs/roots 路由——这是唯一旧版本。
3. 源码仓 `/Users/apple/workspace/nuwax-file-server` 已有端点（f979df7「支持目录选择」，挂载 `/api/computer` + `/fs/roots`、`/fs/children`，见 src/routes/computerRoutes.js:340）。
4. **修正**（初版记录有误）：npm 1.4.3 与基座 resources 打包的 1.4.3 **均包含** fs/roots（tarball 与 `resources/nuwax-file-server/dist/routes/computerRoutes.js` 均验证含路由；初版只 grep 了入口 dist/server.js 导致误判"旧构建占版本号"）。基座无需任何改动。

**处置（已全部还原，nuwa-cli 不在验收范围）：**

- 曾为联调把源码仓新构建 dist 手工覆盖到 `~/.nvm/.../nuwa-cli/node_modules/nuwax-file-server/`（备份 `dist.bak-1.4.2`）。
- **2026-09-10 用户明确 nuwa-cli 渠道不进验收范围**，已还原原厂 1.4.2 并重启（60015）：fs/roots 恢复 Path not found 原状、既有路由健康。本机不再保留任何 nuwa-cli 侧改动。

## 全链路复测结果（第二轮）

真实浏览器（ego-browser，登录态）实测，请求经 云网关 testagent.xspaceagi.com → 隧道 → 目标电脑：

**A. nuwa-cli 电脑（NuwaCLI-MPB128，sandboxId=339，曾以手工换 dist 验证通过；当日已还原原厂 1.4.2 并移出验收范围）：**

- `GET /api/computer/fs/roots?sandboxId=339` → 200，`code 0000`，`data.roots=[{name:"/",path:"/",isDir:true}]`、`data.home="/Users/apple"`。
- `GET /api/computer/fs/children?path=/Users/apple&sandboxId=339` → 200，`code 0000`，`data.entries` 返回真实目录项。

**B. 基座电脑（我的电脑 286，sandboxId=286，用户指定主链路）——零改动即通：**

- 基座 nuwa-electron-shell 的 resources/nuwax-file-server@1.4.3 自带 fs/roots（file-server 60005、ComputerServer 60006、lanproxy 隧道均为运行态）。
- `GET /api/computer/fs/roots?sandboxId=286` → 200，`code 0000`，`data.roots` + `data.home="/Users/apple"`。
- `GET /api/computer/fs/children?path=/Users/apple&sandboxId=286` → 200，`code 0000`，`data.entries` 返回真实目录项。
- 弹窗面包屑（/ > Users > apple）与目录列表渲染正常，"主目录"快捷入口生效。

- **响应包装问题收口**：网关把 file-server 顶层 `{success, roots, home}` 包进 `{code, message, data}` 信封，前端读 `data.roots/data.entries` 完全正确。A、B 两条链路均验证一致。

## 待继续

1. ~~file-server 正式发布~~（已修正）：npm 1.4.3 本身就含 fs/roots，无版本号冲突。**验收范围（用户 2026-09-10 拍板）：仅基座链路（我的电脑 286），nuwa-cli 渠道不进验收**——nuwa-cli 依赖升至 ≥1.4.3 与本功能验收解耦，随其版本节奏另行处理。
2. 隐式建项目、占用互斥、用户 × 项目隔离仍需后端契约与真实验收；不以 TODO 或 mock 判定完成。
3. 真正完成后再决定商业壳 pin 与 dist 更新；本次未更新 pin、未构建安装包（商业壳 pin c23224f71 仍不含 nuwax c4bd9cf63）。
4. 前端改动仍未提交（7 改 + 3 新增测试，含本记录）；提交时机待定。

开发服务器由第一轮启动，日志 /tmp/nuwax-directory-dev.log，端口 3000；file-server 重启日志 /tmp/nuwax-file-server-restart.log。

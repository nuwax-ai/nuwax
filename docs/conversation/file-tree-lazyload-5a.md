# #5a 文件树懒加载 + 可选本地目录 —— 收尾交付文档

- 任务卡：8 月需求 · 开发任务梳理（2026-08-31）#5a「会话中可选本地目录 + 文件树懒加载改造」
- 分支：`feat-dong.0930`
- 前置背景：主体已于 2026-09-02~09-04 落地（v2 方案，c29ba3ce8 数据面切 file-server + 566b32297 fileDataSource/TaskResult 路由 + nuwaclaw 桥收敛 pickDirectory）。规格见 nuwaclaw `specs/local-directory-file-preview.md`（v2 章节）。
- 本文记录本次收尾改动、网关透传实测结论与遗留清单。

## 一、现状架构（v2，本次未变更）

- **数据面**：Chat 页可见树全部走 `apiGetStaticFileList(cId, { relativePath, recursive:false, customTargetDir? })` 单层查询，形态为「面包屑目录浏览器」（点文件夹=进入目录，非原地展开）。
  - `useWorkspaceDirectoryFiles`：项目工作区源（`src/pages/Chat/hooks/useWorkspaceDirectoryFiles.ts`）
  - `useLocalDirectoryFiles`：本地目录源（customTargetDir=会话所在电脑上的绝对路径；选目录经桥 `localFiles.pickDirectory`，浏览器无桥时手输路径，根记录按会话存 localStorage）
- **预览**：选中文件即 `fetch(fileProxyUrl, cache:'no-store')`（`services/skill.ts` fetchContentFromUrl），dotfile 不过滤（静态预览路由 `dotfiles:"allow"`）。
- **模型层（本次改造对象）**：`models/conversationInfo.ts` 的 `refreshFileListImmediately` 原为全量递归拉整树（无 options），被 5 处触发：legacy SSE ToolCall（2s 节流）、FINAL_RESULT（TaskAgent）、openPreviewView forceRefresh、runtime 线 `preview.file.refresh` / `taskResult.settle`。

## 二、本次改动

### 1. 模型层门控（会话内自管，单点收口）

- `conversationInfo.ts` 新增 `fileTreeSelfManaged`（默认 false）+ ref 镜像 + setter。
- **`refreshFileListImmediately` 内部单点门控**：自管时跳过全量拉取，改发 `setFileTreeRefreshTrigger(Date.now())`。单点覆盖上述全部 5 处触发（含 runtime 线），未自管页面（ConversationAgent / EditAgent 预览调试）行为零变化。
- `ChatCore` 新增 prop `fileTreeSelfManaged`（默认 true），挂载设置/卸载复位；**SkillDetailsConversation 内嵌 ChatCore 且把模型树当「文件变更信号」用（触发技能详情重拉），显式传 false 保持原行为**。
- ChatCore 新增订阅：`fileTreeRefreshTrigger` 变化（非 0、去重）→ 节流 2s → active 源 `refresh()`——顺带补齐了**流式期间单层视图不自动刷新**的缺口（此前仅在 navigate/写操作/手动刷新时拉取）。

### 2. Chat 页去模型树依赖

- `handleAddToGitignore`：`.gitignore` 现内容从「模型全量树里查」改为操作时按需 `fetchContentFromUrl('/api/computer/static/{id}/.gitignore')`（404→create 分支），负载直构单条（与原 updateFilesListContent 输出等价）。
- `useAutoPreviewFile`：任务结果文件存在性检查从全量拉树改为**父目录单层查询**（`relativePath=父目录, recursive:false`）；单层条目 name 为工作区根起算相对路径，匹配谓词不变。EditAgent 预览调试复用同 hook，一并受益。
- `apiGetStaticFileDetail` 标记 `@deprecated`（`/**` 字面量占位死代码）。

### 3. 与后端接口支持对齐（降级保护）

- `StaticFileListResponse` 补 `recursive?: boolean`（file-server 模式回显）。
- `fileDataSource.ts` 新增 `filterDirectoryLevel`（全量递归扁平列表裁出某目录一层：直接子文件直取；非空子目录从更深路径前缀合成——递归列表不含非空目录自身条目）与 `resolveDirectoryLevelFiles`（回显检测+裁剪+一次性 console.warn）。
- 两个 hook 接入：请求 `recursive:false` 但响应 `recursive !== false`（网关未透传/旧后端）→ 前端裁出当前层兜底。**透传正常时零开销**（本次实测 test 环境透传正常，见下）。

## 三、网关透传实测结论（2026-09-05，test 环境 testagent.xspaceagi.com）

实测方式：dev server（BASE_URL=testagent）登录 test 账号，打开云电脑 TaskAgent 会话 1560881（满江红 PPT），点 TaskResult 文件触发文件面板，抓 performance 资源时序 + 带 Bearer 直发请求验响应。

| 参数/端点 | 结论 |
| --- | --- |
| `relativePath` + `recursive=false` | ✅ **透传生效**。根级请求返回单层（仅 `mjh_ppt` 目录）；`relativePath=mjh_ppt` 返回其直接子项（assets/src/workspace/package.json/pptx）；响应 `recursive:false` 回显正确；条目 `name`=工作区根起算相对路径、文件带 `fileProxyUrl`、无 contents 内嵌 |
| TaskResult 选文件路由 | ✅ 逐级导航真实发生（请求序列 root→mjh_ppt） |
| `search-files` | ✅ **已透传**（code 0000、返回命中列表）——`useLocalDirectoryFiles.tsx` 内「网关未透传 search-files」的本地过滤兜底注释已过时（兜底保留无害，可在后续清理） |
| `customTargetDir`（云电脑会话） | ❌ 网关**显式拒绝**：`4000 customTargetDir is not supported for cloud computer`——设计约束而非透传故障。**个人电脑链路（nuwaclaw+lanproxy）的 customTargetDir 透传需实机验证**（遗留） |

## 四、性能评估结论（任务卡自查项回填）

原审计（2026-09-01）结论：现状「全量递归 + 无缓存 + 整树重拉」不可持续——SSE 流式 2s 节流、FINAL_RESULT、每次写操作、打开预览均触发整树重拉 →`transformFlatListToTree` 全量重建 → 全树 setState 重渲染（树组件无虚拟滚动）；本地电脑数千文件项目撑不住。

本次改造后（Chat 页路径）：

- 流式/FINAL_RESULT/打开预览/任务结算的全量递归拉取被门控消除，改为「时间戳信号 + 节流 2s 刷新当前层（单层查询）」——单次请求量从 O(整树) 降为 O(当前目录条目数)。
- `.gitignore` 检查、自动预览存在性检查均改为按需点查，不再依赖全量树。
- 遗留消耗面：ConversationAgent / EditAgent 预览调试 / SkillDetailsConversation 仍走模型全量拉取（有意保留，后续如需再收敛）；树组件无虚拟滚动（单层模式下树深仅一级，优先级下降）。

## 五、安全决策记录（维持 2026-09-02 v2 拍板）

- **服务端零改动**：file-server 无鉴权 / 0.0.0.0 监听 / 静态路由无出根检查维持既有现状，边界靠 loopback/lanproxy 与网关；原计划三项加固（safeStaticPath/监听 env/rename 保护）已撤销。
- **产品方向 = 放开而非收紧**：个人电脑访问工作目录之外的文件经 nuwax-file-server 支持（customTargetDir 通道）。后续场景需求（用户 2026-09-05 确认）：**提前拿到全硬盘（文件访问）权限，Windows/macOS 都要考虑**——macOS 侧即 Full Disk Access（TCC 引导与状态检测）、Windows 侧需考虑受保护目录与 UAC 策略。此项为 nuwaclaw 壳侧新需求，另行立项，不在本仓范围。
- nuwaclaw 内嵌 file-server 仓（sources/nuwax-file-server）存在一份**已撤销方案的未提交加固残留**（src/server.js 127.0.0.1 + safeStaticPath，2026-09-02）：不碰不删，prepare 脚本（reset --hard + clean）会自行重置；如需恢复加固须重新走方案评审。

## 六、测试与验证

- 单测：`tests/conversationInfoModel.test.ts` +1 门控用例（自管跳全量/发信号/复位恢复）；新增 `src/pages/Chat/utils/fileDataSource.test.ts`（裁层/前缀边界/回显检测告警一次，7 用例）、`src/pages/Chat/hooks/useAutoPreviewFile.test.ts`（父目录单层参数/根目录空父/未命中不打开，3 用例）；`src/pages/Chat/index.test.tsx` 9 用例回归。
- 门禁：`npm run test:conversation` **463/463 全绿**（基线 462 + 新增 1）；tsc 全库 517 = 基线 517，零新增。
- 已知基线现象：`useWorkspaceDirectoryFiles.test.ts`（566b32297 引入）本机因 import 链拖入 umi/esbuild 在 vitest 下套件级失败（HEAD 版本同挂，非本次引入）。

## 七、遗留清单

1. 个人电脑（nuwaclaw 实机）customTargetDir 透传验证 + 本地目录全链路走查。
2. `useLocalDirectoryFiles` search-files「未透传」兜底注释过时，可择机清理。
3. 隐藏文件「按地址打开」前端入口未做（后端预览链路已支持，apiGetStaticFileDetail 已标 deprecated；本次用户未选）。
4. dev mock 未覆盖 `/api/computer/*` 路由（懒加载交互本地 mock 走查需先补路由；本次用户未选）。
5. ConversationAgent / EditAgent / SkillDetailsConversation 三页面仍走模型全量树（有意保留）。
6. 云电脑会话 customTargetDir 被网关拒绝为设计约束——若未来云沙箱也要「打开任意目录」，需网关侧放开。

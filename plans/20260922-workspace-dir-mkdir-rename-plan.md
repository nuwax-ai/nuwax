# 实施计划：工作空间目录选择——新建目录 / 重命名

- 对应 spec：无（用户直提需求，接口契约取自 knife4j「沙箱文件接口」分组）
- 状态：待接受

## 背景

工作目录选择弹窗（`WorkspaceDirPickerModal`，三个入口共用：ChatInputHome / ChatInputUnified / CreateNormalProjectModal）目前只能浏览与选择目录，无法整理目录。后端新增两个写接口（knife4j 文档站已发布），本计划在弹窗内补「新建目录」与「重命名」能力。

## 接口契约（OpenAPI 实测抽取，2026-09-22）

| 接口 | 方法与路径 | 请求 | 响应 data |
| ---- | ---- | ---- | ---- |
| fsMkdir | POST `/api/computer/static/fs/mkdir` | JSON `{sandboxId: number, parentPath: string, dirName: string}` | `FsEntryItem`（新目录条目） |
| fsRename | POST `/api/computer/static/fs/rename` | JSON `{sandboxId: number, path: string, newName: string}` | `FsEntryItem`（改后条目） |

- 响应统一信封 `RequestResponse<T>`（`code:'0000'`/`success`），与现有 `apiBrowseFsRoots` 同族；网关把 file-server 结果包进 `data`（见 `plans/20260910-workspace-directory-acceptance.md`）。
- 契约要点：仅用户个人沙箱可用；`dirName`/`newName` 仅名字、不含路径分隔符、支持中文；rename 仅同目录改名（不支持跨目录移动）；`parentPath`/`path` 取自 fsChildren 回传的绝对路径（分隔符统一 `/`）。
- 响应类型直接复用现有 `FsEntryItem`（`name/path/isDir/isSymlink`，`src/types/interfaces/vncDesktop.ts:53-59`），无需新响应类型。

## 改动文件清单

| #   | 文件 | 动作 | 说明 |
| --- | ---- | ---- | ---- |
| 1 | `src/types/interfaces/vncDesktop.ts` | 改 | 新增 `FsMkdirParams`（`{sandboxId, parentPath, dirName}`）、`FsRenameParams`（`{sandboxId, path, newName}`）；顺手修正 L35-38 注释漂移（`/api/computer/fs/*` → `/api/computer/static/fs/*`） |
| 2 | `src/services/vncDesktop.ts` | 改 | 紧挨 `apiBrowseFsChildren` 之后新增 `apiFsMkdir` / `apiFsRename`：`request(url, { method: 'POST', data })`，返回 `Promise<RequestResponse<FsEntryItem>>`；body 里 `sandboxId` 转 `Number`（契约 integer；入参签名保持 string 与 `apiBrowseFs*` 一致）；同处修正 L329 注释漂移 |
| 3 | `src/components/ChatInputHome/WorkspaceDirPickerModal/index.tsx` | 改 | UI 主体，见「交互设计」 |
| 4 | `src/components/ChatInputHome/WorkspaceDirPickerModal/index.less` | 改 | 工具栏按钮、行 hover 操作、行内输入框样式 |
| 5 | `src/locales/i18n/{zh-CN,en-US,zh-TW,zh-HK,ja-JP}.ts` | 改 | `PC.Components.WorkspaceDir.*` 新增 key（见「i18n」） |
| 6 | `tests/conversation/workspaceDirRouting.test.ts` | 改 | 补 mkdir/rename 的 URL + JSON body 路由断言（沿用现有 `vi.mock('umi')` 写法） |
| 7 | `tests/conversation/workspaceDirPickerOps.test.tsx` | 增 | 弹窗新建/重命名交互测试（注入 ops，无网络） |
| 8 | `mock/fsBrowseAPI.ts` | 改（可选） | mock 路径对齐 `/api/computer/static/fs/*` 并补 mkdir/rename 假端点（mock 默认 exclude，纯浏览器走查时启用） |

## 交互设计

沿用文件树既有先例（`FileTreeGitSourcePanel` 的工具栏新建 + 行内重命名，Enter 确认 / Esc 取消 / blur 确认 / 自动聚焦全选）：

1. **新建目录**：工具栏（「上一级」旁）加「新建文件夹」按钮（`FolderAddOutlined`）。仅**子目录视图**可点（`currentPath !== ''`，根视图无合法 `parentPath`）；点击后列表顶部出现临时行内 Input，确认后调 `apiFsMkdir({sandboxId, parentPath: currentPath, dirName})`，成功后 `load(currentPath)` 刷新（保服务端排序），Esc/空名撤行。
2. **重命名**：目录行 hover 显示 `EditOutlined` 小图标（不引入右键菜单，改动面小），点击后行内 Input 原地改名，确认调 `apiFsRename`，成功后刷新列表。**仅目录行、仅子目录视图**：文件行维持置灰不可操作（接口语义为「重命名目录」）、根视图条目（盘符/home 快捷项/最近选择）不提供改名。
3. **名校验（前端先行，后端兜底）**：trim 后非空、不含 `/` 与 `\`、非 `.`/`..`；非法时 `message.warning` 提示并不发请求。重名冲突等业务失败走全局 errorHandler 的 warning toast（现有 `services/common.ts` 约定），行内输入保留可改后重试。
4. **最近选择同步**：rename 成功后，`workspaceDirRecent` 中以旧路径为前缀的项（含自身）同步替换为新路径（`src/utils/workspaceDirRecent.ts` 存绝对路径字符串，不更新会失效）。
5. **可注入测试口**：对齐现有 `browse` prop 模式，新增可选 `ops?: { mkdir(parentPath, dirName), rename(path, newName) }` prop，默认走 service，单测注入假实现。
6. 操作按钮在 loading 期间禁用；`sandboxId` 不变（由三入口传入，契约「仅个人沙箱」前置条件已由调用方保证）。

## i18n 新增 key（`PC.Components.WorkspaceDir.*`，5 语种同步）

- `newFolder`（新建文件夹 / New folder / 新建資料夾 / 新建資料夾 / 新しいフォルダー）
- `rename`（重命名 / Rename / 重新命名 / 重新命名 / 名前の変更）
- `newFolderPlaceholder`、`renamePlaceholder`（请输入文件夹名称 / 请输入新名称 …）
- `nameInvalid`（名称不能为空且不能包含 / 或 \ …）

繁体两档按既有用词习惯（資料夾/重新命名，与同文件族既有 key 一致），落库后用 OpenCC s2tw/s2hk 抽查简繁残留。

## 实施顺序

1. 类型 + service + 路由测试（`1/2/6`，无 UI 依赖）
2. 弹窗 UI + 样式 + i18n（`3/4/5`）
3. 交互测试（`7`）；可选 mock（`8`）

## 证明成立的测试

- **路由测试**（改 `workspaceDirRouting.test.ts`）：`apiFsMkdir` 打 `POST /api/computer/static/fs/mkdir` 且 body 为 `{sandboxId, parentPath, dirName}`；`apiFsRename` 打 `POST /api/computer/static/fs/rename` 且 body 为 `{sandboxId, path, newName}`。
- **交互测试**（新 `workspaceDirPickerOps.test.tsx`）：根视图「新建文件夹」禁用；子目录视图确认后调 `ops.mkdir(currentPath, name)` 并触发列表刷新；非法名不调 ops；目录行 hover 出重命名入口而文件行没有；rename 确认调 `ops.rename(path, newName)`；rename 后最近目录前缀同步。
- **回归**：`npm run test:conversation` 全绿（该套件含 workspaceDirRouting）；`npx vitest run` 全绿。
- **手工走查**：`npm run dev` + ego-browser，真实个人电脑三入口各验一次：新建→列表刷新、重命名→列表与最近目录同步、非法名提示、失败 toast。

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| ---- | ---- | -------- |
| body `sandboxId` integer 与前端字符串链路（bug2443）不一致 | body 内 `Number(sandboxId)` 对齐 OpenAPI integer；联调验证 | 改回字符串透传再试 |
| rename 使最近目录/路径失效 | recents 前缀同步更新；rename 目标仅 currentPath 的子项，不动 currentPath 本身 | 清 `workspace_dir_recent_list` 即可恢复 |
| 重名/非法名业务失败 | 前端预检 + 后端报错全局 toast，输入保留可重试 | — |
| 三入口共用组件回归面 | 交互全在弹窗内部、props 只增可选项；既有输入卡测试对弹窗整体 mock 不受影响 | 单 commit git revert |

## 偏离记录

（实现中偏离原计划的逐条补记：原因 + 同步的 commit）

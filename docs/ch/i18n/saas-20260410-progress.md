# 进度记录（里程碑 + 每日）

## 2026-03-30

### 里程碑：分支与基础设施启动

- 时间：2026-03-30 13:xx
- 任务：拉取基线并创建实施分支
- 执行命令：
  - `git checkout feat-2026.4.10`
  - `git pull --ff-only origin feat-2026.4.10`
  - `git checkout -b feat/i18n-frontend-saas-20260410`
- 结果摘要：分支创建成功，基线已同步到最新提交
- 风险/阻塞：无
- 下一步：落地 L1 i18n 运行时与启动链路

### 里程碑：L1 框架层已落地（进行中）

- 时间：2026-03-30 13:xx
- 任务：新增 i18n 类型、接口服务、运行时、启动初始化、请求头语言透传
- 执行命令：通过 `apply_patch` 新增/修改以下文件
  - `src/types/interfaces/i18n.ts`
  - `src/constants/i18n.constants.ts`
  - `src/services/i18n.ts`
  - `src/services/i18nRuntime.ts`
  - `src/app.tsx`
  - `src/services/common.ts`
- 结果摘要：
  - 已提供 `initI18n()` / `dict()` / `saveUserLang(lang)`
  - 启动阶段先执行语言词典初始化
  - 请求头新增 `Accept-Language` 与 `X-Lang`
- 风险/阻塞：后端专用语言保存接口尚未交付，当前按 `apiUserUpdate` 临时适配
- 下一步：落地 L2 用户资料页语言切换与系统配置-多语言管理页

### 里程碑：L2 组件与页面接入已落地（进行中）

- 时间：2026-03-30 13:xx
- 任务：用户资料页接入语言列表与切换保存；关键设置/用户弹层文案接入 `dict(key)`
- 执行命令：通过 `apply_patch` 修改以下文件
  - `src/layouts/Setting/SettingAccount/index.tsx`
  - `src/layouts/Setting/SettingAccount/index.less`
  - `src/layouts/Setting/index.tsx`
  - `src/layouts/DynamicMenusLayout/User/index.tsx`
  - `src/layouts/DynamicMenusLayout/UserOperateArea/index.tsx`
- 结果摘要：
  - 个人资料新增语言选择与保存（保存后整页刷新）
  - 设置弹窗、用户菜单、消息未读文案接入 `dict(key)`
- 风险/阻塞：全站存量硬编码文案仍需继续批量替换
- 下一步：落地 L3 多语言管理页面与路由接入

### 里程碑：L3 后端渲染适配页面接入已落地（进行中）

- 时间：2026-03-30 13:xx
- 任务：新增系统配置-多语言管理页面（列表）
- 执行命令：通过 `apply_patch` 新增/修改以下文件
  - `src/pages/SystemManagement/SystemConfig/I18nManage/index.tsx`
  - `src/routes/index.ts`
  - `src/services/menuService.ts`
- 结果摘要：系统配置新增 `/system/config/i18n` 页面路由，支持语言列表查询展示
- 风险/阻塞：后端增删改接口未纳入本轮输入，当前页面以查询展示为主
- 下一步：补全验证与回归记录

### 里程碑：规范校验与格式化已完成

- 时间：2026-03-30 13:xx
- 任务：新增硬编码文案增量扫描脚本并完成代码格式化校验
- 执行命令：
  - `pnpm run check:i18n-hardcoded`
  - `pnpm exec prettier --write ...`
  - `pnpm exec prettier --check ...`
- 结果摘要：
  - 扫描脚本已接入 `package.json`（`check:i18n-hardcoded`）
  - 脚本已调整为仅扫描新增行，避免历史存量误报
  - 当前改动集 Prettier 校验通过
- 风险/阻塞：构建与测试存在仓库基线问题（详见 test-report）
- 下一步：等待后端专用语言保存接口，替换 `saveUserLang` 单点实现

### 里程碑：全局存量页面兜底翻译已接入

- 时间：2026-03-30 14:xx
- 任务：解决“大量页面/组件未逐一接入”问题，新增运行时自动翻译兜底层
- 执行命令：通过 `apply_patch` 新增/修改以下文件
  - `src/services/i18nRuntime.ts`
  - `src/services/i18nDomTranslator.ts`
  - `src/app.tsx`
- 结果摘要：
  - 新增 `translateLiteralText()`，支持“中文文案 -> key -> 当前语言文案”转换
  - 启动后自动扫描并翻译文本节点与 `placeholder/title/aria-label`
  - 添加忽略区域（markdown、editor、聊天内容区等）降低误替换风险
- 风险/阻塞：该方案为兜底层，仍建议后续逐页改成 `dict(key)` 获得确定性
- 下一步：在真实页面走查误替换场景并补充忽略选择器

### 里程碑：新 key 规范一次性切换（L1 + L2 核心路径）

- 时间：2026-03-30 14:xx
- 任务：将已接入 `System.*` key 一次性替换为 `PC.*` 新规范，并在运行时禁用 legacy key
- 执行命令：
  - `perl -0pi -e "s/System.../PC.../g" ...`
  - `apply_patch` 更新 `src/constants/i18n.constants.ts`
  - `apply_patch` 更新 `src/services/i18nRuntime.ts`
  - `apply_patch` 更新登录、验证码、设置、导航、系统配置、AgentHeader 等核心页面
- 结果摘要：
  - `dict()` key 已切换为 `{Client}.{Scope}.{Domain}.{key}`
  - `System.*` 不再作为可用标准 key，仅作为异常输入记录日志
  - 登录/鉴权链路、设置中心、系统配置、多会话核心入口（AgentHeader）完成显式改造
- 风险/阻塞：后端词典需按同样 key 规范提供，否则会触发 missing key 日志
- 下一步：继续按 inventory 报告分批推进全站页面替换

### 里程碑：i18n 命名守门与全量盘点

- 时间：2026-03-30 14:xx
- 任务：新增 i18n 治理门禁与全量扫描报告
- 执行命令：
  - `node scripts/check-hardcoded-i18n.js`
  - `node scripts/i18n-governance-report.js`
- 结果摘要：
  - 增量门禁通过（新增行无硬编码中文/legacy key/非法 key）
  - 生成全量报告 `docs/ch/i18n/saas-20260410-inventory.md`
  - 全量待治理问题总数：`4476`
- 风险/阻塞：存量规模大，需按模块分批治理，避免一次性大改导致联调风险
- 下一步：按模块 TopN（`Antv-X6`、`SystemManagement`、`AppDev`、`EditAgent`）分批提交

### 里程碑：components/pages 第二批实改

- 时间：2026-03-30 15:xx
- 任务：补齐 `src/components` 与 `src/pages` 可见文案改造，覆盖错误页、密码设置、通用组件与首页错误兜底
- 执行命令：通过 `apply_patch` 修改以下文件
  - `src/pages/403/index.tsx`
  - `src/pages/404/index.tsx`
  - `src/pages/SetPassword/index.tsx`
  - `src/pages/Home/DraggableHomeContent/ErrorBoundary/index.tsx`
  - `src/components/NoMoreDivider/index.tsx`
  - `src/components/WorkspaceLayout/components/WorkspaceSearch/index.tsx`
  - `src/components/UploadAvatar/index.tsx`
  - `src/constants/i18n.constants.ts`
- 结果摘要：
  - 页面与组件文案已改为 `dict('PC.*')`
  - 新增对应 key 到最小英文词典
  - `System.*` 业务引用仍为 0
- 风险/阻塞：大模块（`AppDev`/`Antv-X6`/`SystemManagement`）仍有大量存量，需继续分批
- 下一步：按 inventory Top 模块继续滚动治理

### 里程碑：Top 模块第三批实改（AppDev / SystemManagement / Antv-X6）

- 时间：2026-03-30 15:xx
- 任务：按 inventory Top 模块继续滚动替换可见文案
- 执行命令：通过 `apply_patch` 修改以下文件
  - `src/pages/AppDev/components/FileOperatingMask/index.tsx`
  - `src/pages/AppDev/components/ImageViewer/index.tsx`
  - `src/pages/SystemManagement/Dashboard/components/ResourceGrid/index.tsx`
  - `src/pages/SystemManagement/LogQuery/RunningLog/index.tsx`
  - `src/pages/SystemManagement/LogQuery/OperationLog/index.tsx`
  - `src/pages/Antv-X6/components/VersionAction/index.tsx`
  - `src/pages/Antv-X6/component/data.tsx`
  - `src/pages/Antv-X6/v3/component/data.tsx`
  - `src/pages/Antv-X6/header.tsx`
  - `src/constants/i18n.constants.ts`
- 结果摘要：
  - 三大模块新增一批 `dict('PC.*')` 显式改造
  - 新增 key 已补入最小英文词典，`dict` 使用与词典定义一致（缺失 0）
  - inventory 问题总量进一步下降
- 风险/阻塞：`AppDev` 与 `Antv-X6` 仍存在大量存量字符串，需继续拆批降低回归风险
- 下一步：继续按“高频页面 + 低风险字符串”策略推进下一批

### 里程碑：Top 模块第四批实改（AppDev / SystemManagement / Antv-X6）

- 时间：2026-03-30 15:xx
- 任务：继续按模块 TopN 推进中小文件可见文案替换
- 执行命令：通过 `apply_patch` 修改以下文件
  - `src/pages/SystemManagement/TaskManage/index.tsx`
  - `src/pages/SystemManagement/Dashboard/components/SessionStats/index.tsx`
  - `src/pages/AppDev/components/ChatArea/components/ChatAreaTabs.tsx`
  - `src/pages/AppDev/components/FilePathHeader/index.tsx`
  - `src/pages/Antv-X6/components/NodePanelDrawer/index.tsx`
  - `src/pages/Antv-X6/components/NewSkill/index.tsx`
  - `src/constants/i18n.constants.ts`
- 结果摘要：
  - `TaskManage`、`SessionStats`、`ChatAreaTabs`、`FilePathHeader`、`NodePanelDrawer`、`NewSkill` 完成显式 key 替换
  - 本批新增 key 已全部纳入最小词典
  - `dict` 使用 key 与词典定义一致（缺失 0）
- 风险/阻塞：核心大文件（`AppDev/index.tsx`、`Antv-X6/index.tsx`、`SystemManagement/MenuPermission/*`）改造体量仍大
- 下一步：以页面入口文件为主再做一批，优先处理标题、按钮、提示语

### 里程碑：本地中英文默认词典落地（运行时 + 平台导入默认）

- 时间：2026-03-30 16:xx
- 任务：补齐本地 `en-us/zh-cn` 默认词典文件，并接入运行时兜底与平台导入默认源
- 执行命令：通过 `apply_patch` 新增/修改以下文件
  - `src/locales/i18n/nuwaxpc-en-us.ts`
  - `src/locales/i18n/nuwaxpc-zh-cn.ts`
  - `src/locales/i18n/index.ts`
  - `src/constants/i18n.constants.ts`
  - `src/services/i18nRuntime.ts`
  - `src/services/i18n.ts`
- 结果摘要：
  - 本地中英文词典从常量内联拆分为独立语言文件，作为正式默认词典
  - 新增 `I18N_IMPORT_DEFAULTS`，可作为多语言平台维护导入默认源
  - 运行时兜底改为“按当前语言使用本地默认词典”，并新增按语言缓存隔离字段
- 风险/阻塞：当前平台维护页尚未接入导入 UI，本轮先提供服务层可复用默认源
- 下一步：在多语言管理新增导入入口时复用 `getI18nImportDefaults/getI18nImportDefaultMap`

### 里程碑：Top 模块第五批实改（AppDev / SystemManagement / Antv-X6）

- 时间：2026-03-30 16:xx
- 任务：继续按 inventory Top 模块推进显式 `dict` 改造
- 执行命令：通过 `apply_patch` 修改以下文件
  - `src/pages/AppDev/components/AppDevHeader/index.tsx`
  - `src/pages/AppDev/components/ChatArea/components/PlanProcess/index.tsx`
  - `src/pages/SystemManagement/Content/Agent/index.tsx`
  - `src/pages/Antv-X6/Published.tsx`
  - `src/locales/i18n/nuwaxpc-en-us.ts`
  - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - AppDev Header、执行计划组件、系统管理-智能体页、Antv-X6 发布弹窗完成核心可见文案替换
  - 新增 key 已同步本地中英词典，避免运行时缺 key
  - inventory 问题总量继续下降
- 风险/阻塞：`AppDev ChatInputHome`、`Antv-X6 complexNode/commonNode`、`SystemManagement Content` 其余子页仍是存量大头
- 下一步：继续按“高频页面 + 中小文件 + 低风险交互”策略推进批量替换

### 里程碑：Top 模块第六批实改（AppDev / SystemManagement）

- 时间：2026-03-30 16:xx
- 任务：继续推进内容管理子页与 ChatArea 组件的显式 `dict` 改造
- 执行命令：通过 `apply_patch` 修改以下文件
  - `src/pages/SystemManagement/Content/DataTable/index.tsx`
  - `src/pages/SystemManagement/Content/KnowledgeBase/index.tsx`
  - `src/pages/SystemManagement/Content/Mcp/index.tsx`
  - `src/pages/AppDev/components/ChatArea/components/ToolCallProcess/index.tsx`
  - `src/pages/AppDev/components/ChatArea/components/MessageAttachment/index.tsx`
  - `src/locales/i18n/nuwaxpc-en-us.ts`
  - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `SystemManagement/Content` 的 DataTable、KnowledgeBase、Mcp 三个页面完成可见文案替换
  - AppDev `ToolCallProcess` 与 `MessageAttachment` 的状态、类型与提示文案完成替换
  - `ToolCallProcess` 文件列表识别兼容 `total` 与 `总计`，避免不同语言环境下识别失效
- 风险/阻塞：`AppDev ChatInputHome` 与 `MentionSelector` 仍有较大量存量文案
- 下一步：继续处理 `AppDev` 高频输入区与 `Antv-X6` 复杂节点面板文案

### 里程碑：`t()` 命名收敛与第六批补充改造

- 时间：2026-03-30 17:xx
- 任务：按约定将本批新增调用统一为 `t(...)`，并补充 `ChatInputHome` 可见文案接入
- 执行命令：通过 `apply_patch` 修改以下文件
  - `src/services/i18nRuntime.ts`
  - `src/pages/AppDev/components/ChatArea/components/ChatInputHome/index.tsx`
  - `src/pages/AppDev/components/ChatArea/components/ToolCallProcess/index.tsx`
  - `src/pages/AppDev/components/ChatArea/components/MessageAttachment/index.tsx`
  - `src/pages/SystemManagement/Content/DataTable/index.tsx`
  - `src/pages/SystemManagement/Content/KnowledgeBase/index.tsx`
  - `src/pages/SystemManagement/Content/Mcp/index.tsx`
  - `src/locales/i18n/nuwaxpc-en-us.ts`
  - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - 运行时新增 `t()`（`dict()` 兼容保留），本批代码调用统一为 `t(...)`
  - `ChatInputHome` 的占位轮播、模型区、上传区、发送限制提示等文案完成接入
  - inventory 问题总量继续下降
- 风险/阻塞：全仓仍存在大量历史 `dict(...)` 与硬编码文案，需滚动收敛
- 下一步：继续按 Top 模块批量推进，并逐批把新改造代码统一到 `t(...)`

### 里程碑：Top 模块第七批实改（SystemManagement / AppDev / Antv-X6）

- 时间：2026-03-30 18:xx
- 任务：继续补齐 Top 模块存量页面，覆盖系统内容管理、日志查询、AppDev 主交互区、Antv 异常配置与通用节点
- 执行命令：
  - `pnpm prettier --write ...`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/Content/WebApplication/index.tsx`
    - `src/pages/SystemManagement/Dashboard/index.tsx`
    - `src/pages/SystemManagement/LogQuery/OperationLog/LogProTable/index.tsx`
    - `src/pages/SystemManagement/LogQuery/OperationLog/LogDetailDrawer/index.tsx`
    - `src/pages/AppDev/components/ContentViewer/index.tsx`
    - `src/pages/AppDev/components/ChatArea/index.tsx`
    - `src/pages/AppDev/components/DesignViewer/index.tsx`
    - `src/pages/Antv-X6/component/ExceptionItem.tsx`
    - `src/pages/Antv-X6/component/commonNode.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - 新增并落地 `SystemContentWebApplication`、`SystemOperationLog`、`AppDevContentViewer`、`AppDevChatArea`、`AppDevDesignViewer`、`AntvX6ExceptionItem`、`AntvX6CommonNode` 等 key 域
  - AppDev 与 SystemManagement 多个高频页面已统一 `t('PC.*')`
  - inventory 问题总量从 `4255` 降至 `4082`
- 风险/阻塞：
  - `Antv-X6/complexNode`、`SystemManagement/MenuPermission`、`AppDev/Preview` 仍是存量大头
  - `i18n-governance-report` 当前仅校验 `dict()` key 格式，未覆盖 `t()`（需后续脚本补强）
- 下一步：继续按 Top 文件滚动治理 `RunningLog/NodeDetails`、`DataResourceList`、`eventHandlers` 与 `MenuPermission`

### 里程碑：Top 模块第八批实改（RunningLog / DataResource / Antv 事件）

- 时间：2026-03-30 18:xx
- 任务：继续清理 System/AppDev/Antv Top 文件存量
- 执行命令：
  - `pnpm prettier --write ...`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/LogQuery/RunningLog/LogProTable/index.tsx`
    - `src/pages/SystemManagement/LogQuery/RunningLog/NodeDetails/index.tsx`
    - `src/pages/AppDev/components/EditorHeaderRight/index.tsx`
    - `src/pages/AppDev/components/FileTreePanel/DataResourceList/index.tsx`
    - `src/pages/Antv-X6/component/eventHandlers.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - RunningLog 表格/节点详情与 AppDev 右上工具区、数据资源列表完成 `t(...)` 替换
  - Antv 事件提示/确认弹窗完成多语言 key 化
  - inventory 问题总量从 `4082` 降至 `4050`
- 风险/阻塞：`SystemManagement/MenuPermission` 与 `Antv-X6/complexNode` 仍为后续高优先治理点
- 下一步：继续按 inventory Top 文件逐批推进，保持“小批量 + 验证 + 留痕”节奏

### 里程碑：Top 模块第九批实改（MenuPermission / AppDev Preview）

- 时间：2026-03-30 19:xx
- 任务：清理系统菜单管理链路与 AppDev 预览链路中的硬编码文案
- 执行命令：
  - `pnpm prettier --write ...`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/MenuPermission/MenuManage/components/MenuFormModal/index.tsx`
    - `src/pages/SystemManagement/MenuPermission/MenuManage/index.tsx`
    - `src/pages/AppDev/components/Preview/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `MenuFormModal` 与 `MenuManage` 标题、表单、列头、按钮、Tooltip、成功提示统一改为 `t(...)`
  - `Preview` 的错误提示、按钮文案、保存提示、空态“查看完整错误信息”等文案完成 key 化
  - `Preview` 与 `MenuManage` 中被扫描命中的中文日志/注释文本已替换为英文描述
  - inventory 问题总量从 `4050` 下降至 `3948`
- 风险/阻塞：
  - `Antv-X6/complexNode` 与 `nodeItem/database` 仍为 Antv 模块主要存量
  - `AppDev` 剩余集中在 `PageEditModal/Preview` 关联子逻辑与少量工具文件
- 下一步：继续按 Top 文件推进 `Antv-X6/complexNode`、`SystemManagement/MenuPermission` 余量、`AppDev/PageEditModal`

### 里程碑：Top 模块第十批实改（Antv complexNode + MenuPermission 补齐）

- 时间：2026-03-30 19:xx
- 任务：继续压缩 Top 文件存量，重点处理 `Antv-X6/complexNode` 及菜单管理链路未覆盖文案
- 执行命令：
  - `pnpm prettier --write ...`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/component/complexNode.tsx`
    - `src/pages/SystemManagement/MenuPermission/MenuManage/components/MenuFormModal/index.tsx`
    - `src/pages/SystemManagement/MenuPermission/MenuManage/index.tsx`
    - `src/pages/AppDev/components/Preview/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `complexNode` 的输入/提示词/问答/http 工具节点等 26 处硬编码完成 `t(...)` 接入
  - 菜单管理与预览链路剩余提示文案统一接入 key
  - `SystemMenuFormModal/SystemMenuManage/AppDevPreview/AntvX6ComplexNode` 中英词典已补齐
  - inventory 问题总量从 `3948` 下降至 `3922`
- 风险/阻塞：
  - `Antv-X6/nodeItem` 与 `database` 仍为 Antv 下一轮重点
  - `AppDev/PageEditModal`、`SystemManagement/MenuPermission` 仍有小批量存量
- 下一步：继续按 inventory Top 文件推进，保持每批“改造 + 校验 + 文档留痕”

### 里程碑：Top 模块第十一批实改（PermissionResources + Antv database/nodeItem）

- 时间：2026-03-30 17:31
- 任务：补齐 `SystemManagement/MenuPermission/PermissionResources` 与 `Antv-X6/database/nodeItem` 的可见文案 i18n 接入
- 执行命令：
  - `pnpm prettier --write ...`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/MenuPermission/PermissionResources/components/ResourceFormModal/index.tsx`
    - `src/pages/SystemManagement/MenuPermission/PermissionResources/index.tsx`
    - `src/pages/Antv-X6/component/database.tsx`
    - `src/pages/Antv-X6/component/nodeItem.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `ResourceFormModal` 与 `PermissionResources` 的标题、表单、列头、按钮、Tooltip、空态、消息提示统一改为 `t(...)`
  - `database.tsx` 与 `nodeItem.tsx` 的输入/输出、循环、变量、文本处理、SQL 生成相关可见文案完成 key 化
  - 新增 key 已同步本地中英文默认词典，保证离线兜底与平台默认导入源一致
  - inventory 问题总量从 `3922` 下降至 `3811`
- 风险/阻塞：
  - `SystemManagement/MenuPermission/PermissionResources/index.tsx` 仍存在较多中文注释（不影响运行，但会进入治理统计）
  - `Antv-X6` 与 `AppDev` 仍有大量存量页面待持续收敛
- 下一步：继续按 inventory Top 文件推进 `AppDev/index.tsx`、`PageEditModal` 与 `Antv-X6/library/graph/registerCustomNodes` 等大头文件

### 里程碑：Top 模块第十二批实改（Antv library/registerCustomNodes）

- 时间：2026-03-30 17:38
- 任务：继续清理 `Antv-X6` 核心节点渲染文件中的可见文案与中文日志
- 执行命令：
  - `pnpm prettier --write ...`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/component/library.tsx`
    - `src/pages/Antv-X6/component/registerCustomNodes.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `library.tsx` 的“知识库/搜索策略/召回数量/匹配度/输出”等文案已统一接入 `t(...)`
  - `registerCustomNodes.tsx` 的问答节点文案、运行状态文案、异常标题、未配置提示与中文日志已完成替换
  - 新增 `AntvX6Library` 与 `AntvX6RegisterNodes` key 域已补齐中英文默认词典
  - inventory 问题总量从 `3811` 下降至 `3792`
- 风险/阻塞：
  - `AppDev/index.tsx`、`AppDev/components/PageEditModal` 仍有大量硬编码文案
  - `Antv-X6/graph.tsx`、`runResult.tsx`、`pluginNode.tsx` 仍存在较多存量
- 下一步：继续批量推进 `AppDev/index.tsx` 与 `PageEditModal` 的按钮/弹窗/提示语接入

### 里程碑：Top 模块第十三批实改（AppDev index + PageEditModal）

- 时间：2026-03-30 18:23
- 任务：补齐 `AppDev` 主页面与应用编辑弹窗的高频可见文案接入
- 执行命令：
  - `pnpm prettier --write ...`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/AppDev/index.tsx`
    - `src/pages/AppDev/components/PageEditModal/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `AppDev/index.tsx` 发布/导出/上传/删除确认/缺少 projectId 提示/导入与单文件上传弹窗/顶部分段按钮 Tooltip 等文案统一接入 `t(...)`
  - `PageEditModal` 的标题、表单标签、占位、校验与成功提示完成接入
  - 新增 `AppDevIndex` 与 `AppDevPageEditModal` key 域并补齐中英文默认词典
  - inventory 问题总量从 `3792` 下降至 `3734`
- 风险/阻塞：
  - `AppDev/index.tsx` 中仍有大量中文注释（不影响运行，但仍计入治理统计）
  - 其余高存量集中在 `Antv-X6/graph.tsx`、`runResult.tsx`、`AppDev` 其他子组件
- 下一步：继续推进 `Antv-X6/runResult.tsx` 与 `AppDev` 剩余弹窗/提示链路

### 里程碑：Top 模块第十四批实改（Antv runResult 补齐）

- 时间：2026-03-30 18:26
- 任务：补齐 `Antv-X6/component/runResult.tsx` 的运行结果展示文案接入
- 执行命令：
  - `pnpm prettier --write ...`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/component/runResult.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `runResult.tsx` 的复制按钮提示、运行状态文案、总数、只看错误、批处理变量、输入输出标题统一接入 `t(...)`
  - 复用了已有 `AntvX6Data`、`AntvX6RegisterNodes` key，并新增 `AntvX6RunResult` key 域
  - inventory 问题总量从 `3734` 下降至 `3727`
- 风险/阻塞：
  - `Antv-X6/graph.tsx`、`pluginNode.tsx`、`registerCustomNodes.tsx` 注释与少量文案仍有余量
  - `AppDev/index.tsx` 仍有大量中文注释文本（治理统计口径下会持续计数）
- 下一步：继续滚动推进 `Antv-X6/graph.tsx` 与 `AppDev` 剩余高频子组件

### 里程碑：Top 模块第十五批实改（Antv pluginNode）

- 时间：2026-03-30 18:28
- 任务：补齐 `Antv-X6/component/pluginNode.tsx` 输入输出文案接入
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/component/pluginNode.tsx`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改：
    - `src/pages/Antv-X6/component/pluginNode.tsx`
- 结果摘要：
  - `pluginNode` 输入/输出标题统一替换为 `t('PC.Pages.AntvX6Data.*')`
  - 中文注释替换为英文，避免继续计入治理统计
  - inventory 问题总量从 `3727` 下降至 `3726`
- 风险/阻塞：
  - 主要存量仍集中在 `Antv-X6/graph.tsx` 与 `AppDev/index.tsx` 的注释/文案
- 下一步：继续推进 `Antv-X6/graph.tsx` 与 `AppDev` 剩余弹窗/提示链路

### 里程碑：Top 模块第十六批实改（Antv condition/controlPanel/errorList/graph）

- 时间：2026-03-30 18:42
- 任务：继续推进 `Antv-X6` 核心交互链路文案接入，补齐条件分支、画布控制、错误列表、图编辑器提示
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/component/condition.tsx src/pages/Antv-X6/component/stencil.tsx src/pages/Antv-X6/controlPanel.tsx src/pages/Antv-X6/errorList.tsx src/pages/Antv-X6/component/graph.tsx src/pages/Antv-X6/config.ts src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/component/condition.tsx`
    - `src/pages/Antv-X6/component/stencil.tsx`
    - `src/pages/Antv-X6/controlPanel.tsx`
    - `src/pages/Antv-X6/errorList.tsx`
    - `src/pages/Antv-X6/component/graph.tsx`
    - `src/pages/Antv-X6/config.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `condition/stencil/controlPanel/errorList/graph` 的高频可见文案统一接入 `t(...)`
  - 新增 `AntvX6Condition/AntvX6Stencil/AntvX6ControlPanel/AntvX6ErrorList/AntvX6Graph` key 域，并补齐本地中英文默认词典
  - `config.ts` 中开发日志与注释文本切换为英文，符合“日志英文”约定
  - inventory 问题总量从 `3726` 下降至 `3710`
- 风险/阻塞：
  - `src/pages/Antv-X6/params.tsx` 仍有高密度硬编码中文（节点目录、配置项、条件选项）
  - `SystemManagement` 与 `AppDev` 仍有大量存量文件待继续收敛
- 下一步：继续批量推进 `Antv-X6/params.tsx` 与 `SystemManagement` Top 文件

### 里程碑：Top 模块第十七批实改（Antv params 大批量）

- 时间：2026-03-30 18:50
- 任务：批量改造 `src/pages/Antv-X6/params.tsx` 节点目录、表单配置、条件操作符等高密度硬编码文案
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/params.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/params.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `asideList` 节点名/描述、`cycleOption`、输入输出配置校验文案、左侧菜单、比较操作符统一改为 `t(...)`
  - 清理 `params.tsx` 中中文注释与注释块，避免继续计入治理统计
  - 新增 `AntvX6Params` key 域并补齐本地中英文默认词典
  - inventory 问题总量从 `3710` 下降至 `3600`
- 风险/阻塞：
  - `SystemManagement` Top 文件（如 `TargetAuthModal`、`RoleFormModal`）仍有较大改造空间
  - `AppDev` 与 `Antv-X6/index.tsx` 仍有存量
- 下一步：继续推进 `SystemManagement` Top 文件并保持每批校验与留痕

### 里程碑：Top 模块第十八批实改（SystemManagement TargetAuthModal）

- 时间：2026-03-30 18:55
- 任务：补齐 `SystemManagement/Content/components/TargetAuthModal` 授权弹窗文案与提示的 i18n 接入
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/Content/components/TargetAuthModal/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/Content/components/TargetAuthModal/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - 授权成功提示、页签名、空态引导文案、弹窗标题、全选/取消全选全部接入 `t(...)`
  - 中文注释和中文 JSDoc 转为英文，减少治理统计噪音
  - 新增 `SystemTargetAuthModal` key 域（Pages + Toast）并补齐本地中英文默认词典
  - inventory 问题总量从 `3600` 下降至 `3595`
- 风险/阻塞：
  - `SystemManagement` 仍有多个高存量文件（`RoleFormModal`、`LogDetailDrawer` 等）
- 下一步：继续推进 `SystemManagement/MenuPermission/RoleManage/components/RoleFormModal` 与 `RunningLog/LogDetailDrawer`

### 里程碑：Top 模块第十九批实改（SystemManagement RoleFormModal）

- 时间：2026-03-30 18:59
- 任务：补齐 `SystemManagement/MenuPermission/RoleManage/components/RoleFormModal` 的表单与提示文案 i18n 接入
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/MenuPermission/RoleManage/components/RoleFormModal/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/MenuPermission/RoleManage/components/RoleFormModal/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - 角色来源、弹窗标题、确认按钮、表单标签/占位/校验、状态 tooltip、启用禁用文案全部接入 `t(...)`
  - 成功提示与校验失败日志接入多语言 key
  - 中文注释/JSDoc 转为英文，减少治理统计噪音
  - inventory 问题总量从 `3595` 下降至 `3573`
- 风险/阻塞：
  - `SystemManagement` 仍存在日志详情、运行日志等高存量中文文案
- 下一步：继续推进 `RunningLog/LogDetailDrawer` 与 `RunningLog/LogProTable` 余量文件

### 里程碑：Top 模块第二十批实改（SystemManagement LogDetailDrawer）

- 时间：2026-03-30 19:03
- 任务：补齐 `SystemManagement/LogQuery/RunningLog/LogDetailDrawer` 的详情抽屉文案与复制提示 i18n 接入
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/LogQuery/RunningLog/LogDetailDrawer/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/LogQuery/RunningLog/LogDetailDrawer/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - 抽屉标题、耗时、消息 ID、调用组件、节点详情、输入/输出、执行过程、空态全部接入 `t(...)`
  - 复制成功提示切换为全局通用 key
  - 中文注释和说明文案转为英文
  - inventory 问题总量从 `3573` 下降至 `3570`
- 风险/阻塞：
  - `SystemManagement` 仍有大头存量分布在 `RunningLog/LogProTable` 等文件
- 下一步：继续推进 `RunningLog/LogProTable` 与 `AppDev` 余量

### 里程碑：Top 模块第二十一批实改（SystemManagement RoleManage 主页面）

- 时间：2026-03-30 20:03
- 任务：批量改造 `SystemManagement/MenuPermission/RoleManage/index.tsx`，覆盖角色主列表页关键文案
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/MenuPermission/RoleManage/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/MenuPermission/RoleManage/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - 列头、状态提示、权限提示、操作按钮、删除确认、页面标题、新增按钮、空态文案统一接入 `t(...)`
  - 固定提示（系统内置角色限制、无权限）全部收敛为 key
  - 中文注释与中文日志文本切换为英文，减少治理统计噪音
  - inventory 问题总量从 `3570` 下降至 `3546`
- 风险/阻塞：
  - `SystemManagement` 仍有多文件存量（尤其 `RunningLog/LogProTable` 注释类中文）
- 下一步：继续推进 `Antv-X6/v3/ParamsV3.tsx`（高密度硬编码）与 `SystemManagement` 余量文件

### 里程碑：Top 模块第二十二批实改（Antv-X6 v3 ParamsV3）

- 时间：2026-03-30 20:07
- 任务：改造 `src/pages/Antv-X6/v3/ParamsV3.tsx`，复用已完成 i18n 的 `params.tsx` 基础配置并补齐 V3 专属节点
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/ParamsV3.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 shell 重写 + `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/ParamsV3.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `ParamsV3` 不再重复维护一套硬编码配置，改为复用 `../params` 的 `dataTypes/modelTypes/options` 等导出
  - V3 仅追加“变量聚合”节点（`NodeTypeEnum.VariableAggregation`），并接入 `t(...)`
  - 新增 `AntvX6Params.nodeVariableAggregationName/Description` 中英文默认词典
  - inventory 问题总量从 `3546` 下降至 `3434`
- 风险/阻塞：
  - `Antv-X6/index.tsx` 仍有高密度存量文案（错误提示、发布提示、流式日志文案）
- 下一步：继续推进 `Antv-X6/index.tsx` 与 `SystemManagement/RunningLog/LogProTable`

### 里程碑：Top 模块第二十三批实改（Antv-X6 index 关键提示）

- 时间：2026-03-30 20:10
- 任务：补齐 `Antv-X6/index.tsx` 关键提示文案（循环限制、不支持组件、V3 loading）并收敛中文日志
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `message.warning` 文案改为 `t(...)`（循环嵌套限制、不支持组件类型）
  - V3 懒加载 `Spin` 文案改为 i18n key
  - 多处中文 `console.error/console.log` 日志改为英文描述
  - inventory 问题总量从 `3434` 下降至 `3423`
- 风险/阻塞：
  - `Antv-X6/index.tsx` 仍有大量中文注释，后续可继续按批次清理
- 下一步：继续推进 `SystemManagement/RunningLog/LogProTable` 或 `Antv-X6/index.tsx` 注释清理批次

### 里程碑：Top 模块第二十四批实改（SystemManagement UserGroupManage）

- 时间：2026-03-31 00:35
- 任务：改造 `SystemManagement/MenuPermission/UserGroupManage` 主页面与表单弹窗，补齐用户组管理主链路 i18n
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/MenuPermission/UserGroupManage/components/UserGroupFormModal/index.tsx src/pages/SystemManagement/MenuPermission/UserGroupManage/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/MenuPermission/UserGroupManage/components/UserGroupFormModal/index.tsx`
    - `src/pages/SystemManagement/MenuPermission/UserGroupManage/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - 用户组表单（标题、按钮、校验、placeholder、状态/来源/描述）全面切换为 `t(...)`
  - 用户组列表页（列头、操作、权限提示、删除确认、空态、页面标题）全面切换为 `t(...)`
  - 相关中文注释与错误日志描述切换为英文，降低治理噪音
  - 新增 `PC.Pages.SystemUserGroupFormModal.*`、`PC.Toast.SystemUserGroupFormModal.*`、`PC.Pages.SystemUserGroupManage.*` 默认中英文词典
  - inventory 问题总量从 `3423` 下降至 `3373`
- 风险/阻塞：
  - `Antv-X6` 仍有高密度存量，尤其 `v3/component/*` 与 `header.tsx`
- 下一步：继续推进 `Antv-X6` Top 清单（优先 `header.tsx`、`v3/component/CondNodeConfig.tsx`、`v3/component/OutputNodeConfig.tsx`）

### 里程碑：Top 模块第二十五批实改（Antv-X6 Header + ExceptionItem + CommonNode）

- 时间：2026-03-31 01:20
- 任务：批量改造 `Antv-X6` 关键组件文案（`header.tsx`、`v3/component/ExceptionItem.tsx`、`v3/component/commonNode.tsx`）并统一使用 `t(...)`
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/header.tsx src/pages/Antv-X6/v3/component/ExceptionItem.tsx src/pages/Antv-X6/v3/component/commonNode.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/header.tsx`
    - `src/pages/Antv-X6/v3/component/ExceptionItem.tsx`
    - `src/pages/Antv-X6/v3/component/commonNode.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `header.tsx` 完成 `dict(...) -> t(...)`，并清理残留中文注释文案
  - `ExceptionItem.tsx` 的标题、提示、表单项、校验、placeholder 全量接入 `t(...)`
  - `ExceptionItem.tsx` 的异常处理方式与重试次数选项改为组件内 i18n 化配置，不再依赖中文常量标签
  - `commonNode.tsx` 的参数列头、字段标签、placeholder、空描述、分支提示判断全部切换为 key
  - 新增默认词典 key：`PC.Pages.AntvX6ExceptionItem.returnSpecificContent/executeExceptionFlow/retryOnce/retryTwice/retryThrice`、`PC.Pages.AntvX6CommonNode.noDescription`
  - inventory 问题总量从 `3373` 下降至 `3348`
- 风险/阻塞：
  - `Antv-X6` 仍是最高存量模块，`complexNode.tsx`、`database.tsx`、`v3/constants/node.constants.ts` 仍有明显中文集中
- 下一步：继续推进 `Antv-X6/v3/component/complexNode.tsx` 与 `Antv-X6/v3/component/database.tsx`

### 里程碑：Top 模块第二十六批实改（Antv-X6 Database + VariableAggregation）

- 时间：2026-03-31 01:30
- 任务：改造 `Antv-X6/v3/component/database.tsx` 与 `VariableAggregation` 子模块，覆盖数据节点与变量聚合节点多语言接入
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/component/database.tsx src/pages/Antv-X6/v3/component/VariableAggregation/index.tsx src/pages/Antv-X6/v3/component/VariableAggregation/VariableGroupItem.tsx src/pages/Antv-X6/v3/component/VariableAggregation/VariableSelector.tsx src/pages/Antv-X6/v3/component/VariableAggregation/useVariableAggregation.ts src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/component/database.tsx`
    - `src/pages/Antv-X6/v3/component/VariableAggregation/index.tsx`
    - `src/pages/Antv-X6/v3/component/VariableAggregation/VariableGroupItem.tsx`
    - `src/pages/Antv-X6/v3/component/VariableAggregation/VariableSelector.tsx`
    - `src/pages/Antv-X6/v3/component/VariableAggregation/useVariableAggregation.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `database.tsx` 里的条件标题、AND/OR、下拉 placeholder、空态、按钮文案、查询上限、数据表、SQL placeholder、输出标题、生成 SQL 标题全部切换为 `t(...)`
  - `VariableAggregation` 三个组件（`index.tsx`/`VariableGroupItem.tsx`/`VariableSelector.tsx`）接入 `t(...)`，包含策略、分组配置、选择变量、空态提示、分组名称占位符
  - `useVariableAggregation.ts` 中文注释清理为英文，降低治理噪音
  - 新增默认词典 key：`PC.Pages.AntvX6VariableAggregation.*`（10 个）
  - inventory 问题总量从 `3348` 下降至 `3330`
- 风险/阻塞：
  - `Antv-X6/index.tsx`、`v3/component/graph.tsx`、`v3/indexV3.tsx` 仍有较多中文残量
- 下一步：继续推进 `Antv-X6/v3/component/graph.tsx` 与 `Antv-X6/v3/indexV3.tsx`

### 里程碑：Top 模块第二十七批实改（Antv-X6 NewSkillV3 收尾）

- 时间：2026-03-31 01:34
- 任务：补齐 `Antv-X6/v3/component/NewSkillV3/index.tsx` 的残留 tooltip 文案与注释 i18n
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/component/NewSkillV3/index.tsx src/pages/Antv-X6/v3/component/database.tsx src/pages/Antv-X6/v3/component/VariableAggregation/index.tsx src/pages/Antv-X6/v3/component/VariableAggregation/VariableGroupItem.tsx src/pages/Antv-X6/v3/component/VariableAggregation/VariableSelector.tsx src/pages/Antv-X6/v3/component/VariableAggregation/useVariableAggregation.ts src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/component/NewSkillV3/index.tsx`
- 结果摘要：
  - `NewSkillV3` 的“编辑参数/移除”tooltip 切换为 `t(...)`
  - 残留中文注释改为英文
  - 复跑治理后，inventory 问题总量从 `3330` 下降至 `3328`
- 风险/阻塞：
  - Antv-X6 仍有重度存量集中在 `index.tsx`、`v3/component/graph.tsx`、`v3/indexV3.tsx`
- 下一步：继续按 Top 清单推进 `v3/component/graph.tsx` 和 `v3/indexV3.tsx`

### 里程碑：Top 模块第二十八批实改（Antv-X6 Complex/Condition/Event/NodeItem）

- 时间：2026-03-31 10:22
- 任务：批量改造 `Antv-X6/v3` 核心节点组件文案，覆盖 `complexNode.tsx`、`condition.tsx`、`eventHandlers.tsx`、`nodeItem.tsx`
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/component/complexNode.tsx src/pages/Antv-X6/v3/component/condition.tsx src/pages/Antv-X6/v3/component/eventHandlers.tsx src/pages/Antv-X6/v3/component/nodeItem.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/component/complexNode.tsx`
    - `src/pages/Antv-X6/v3/component/condition.tsx`
    - `src/pages/Antv-X6/v3/component/eventHandlers.tsx`
    - `src/pages/Antv-X6/v3/component/nodeItem.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `complexNode.tsx`：LLM/意图识别/问答/HTTP 工具的标题、提示、placeholder、表单标签全部切换为 `t(...)`
  - `condition.tsx`：条件分支标题、优先级、AND/OR、引用占位符、新增按钮、否则文案切换为 `t(...)`
  - `eventHandlers.tsx`：复制/粘贴/删除流程提示文案切换为 `t(...)`，并补齐英文注释
  - `nodeItem.tsx`：开始/结束/循环/变量/文本处理/代码节点关键文案全部接入 `t(...)`
  - 词典新增键：`PC.Pages.AntvX6EventHandlers.unsupportedCopyNodeType/nodeCopied/copyNodeFirst`、`PC.Pages.AntvX6ComplexNode.systemPromptTitle/userPromptTitle`
  - inventory 问题总量从 `3328` 下降至 `3256`
- 风险/阻塞：
  - `Antv-X6` 仍有存量主要集中在 `v3/component/graph.tsx` 与 `v3/indexV3.tsx`（注释和日志文本占比高）
- 下一步：继续推进 `v3/component/graph.tsx`（先可见提示文案，再批量注释英文化）

### 里程碑：Top 模块第二十九批实改（Antv-X6 v3 graph）

- 时间：2026-03-31 10:27
- 任务：修复 `v3/component/graph.tsx` 关键提示文案与高密度中文注释残留
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/component/graph.tsx`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 shell + `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/component/graph.tsx`
- 结果摘要：
  - 接入 `t(...)` 并修复循环节点快捷加节点 warning 文案（`PC.Pages.AntvX6Graph.cannotQuickAddNodeForLoopBoundary`）
  - 清理图编辑器文件中的中文注释残留，统一为可读英文注释
  - inventory 问题总量从 `3256` 下降至 `3253`
- 风险/阻塞：
  - `graph.tsx` 仍有大量历史注释，后续可继续做结构化注释收敛
- 下一步：继续推进 `v3/indexV3.tsx` 与 `Antv-X6/index.tsx` 的残留提示文案

### 里程碑：Top 模块第三十批实改（Antv-X6 v3 index）

- 时间：2026-03-31 10:37
- 任务：处理 `v3/indexV3.tsx` 的多语言遗留文本（日志提示、注释残留、脏文案）
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/indexV3.tsx`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 shell + `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/indexV3.tsx`
- 结果摘要：
  - 清理 V3 index 中遗留中文字符，统一为英文注释与日志描述
  - 修复被历史文案替换后的无语义日志文本，补齐可读日志（如 `getReference` / `changeDrawer`）
  - inventory 问题总量从 `3253` 下降至 `3243`
- 风险/阻塞：
  - `Antv-X6/index.tsx` 与 `src/pages/Antv-X6/component/graph.tsx` 仍有存量
- 下一步：继续推进 `Antv-X6/index.tsx` 与 `Antv-X6/component/graph.tsx`

### 里程碑：Top 模块第三十一批实改（Antv-X6 index + legacy graph 注释收敛）

- 时间：2026-03-31 10:41
- 任务：继续收敛 `Antv-X6/index.tsx` 与 `Antv-X6/component/graph.tsx` 中文残留
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/indexV3.tsx src/pages/Antv-X6/index.tsx src/pages/Antv-X6/component/graph.tsx`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 shell 批量清理 + `apply_patch` 更新以下文件
    - `src/pages/Antv-X6/index.tsx`
    - `src/pages/Antv-X6/component/graph.tsx`
    - `src/pages/Antv-X6/v3/indexV3.tsx`
- 结果摘要：
  - `index.tsx` 与 V1 `component/graph.tsx` 中中文注释残留进一步收敛
  - 与上一批串行推进，继续压降 Antv-X6 主干文件的治理噪音
  - inventory 问题总量从 `3243` 下降至 `3240`
- 风险/阻塞：
  - 当前剩余问题更多分布在其他高存量模块（EditAgent/SystemManagement 等）
- 下一步：切换到 inventory Top 的非 Antv-X6 模块批量推进

### 里程碑：Top 模块第三十二批实改（EditAgent 组件设置 + 变量弹窗）

- 时间：2026-03-31 11:09
- 任务：批量改造 `EditAgent/AgentArrangeConfig` 关键路径文案，覆盖 `ComponentSettingModal` 子模块与 `CreateVariableModal`
- 执行命令：
  - `pnpm prettier --write src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/AsyncRun/index.tsx src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/OutputWay/index.tsx src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/InvokeType/index.tsx src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/CardBind/BindDataSource/index.tsx src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/index.tsx src/pages/EditAgent/AgentArrangeConfig/CreateVariables/CreateVariableModal/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/AsyncRun/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/OutputWay/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/InvokeType/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/CardBind/BindDataSource/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/CreateVariables/CreateVariableModal/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `AsyncRun`、`OutputWay`、`InvokeType`、`BindDataSource`、`CreateVariableModal` 可见文案全部切换为 `t(...)`
  - `ComponentSettingModal/index.tsx` 的保存提示、调用方式 tooltip、左侧标题改为 `t(...)`，与子组件统一
  - 为 `PC.Pages.AgentArrange*` 增补中英文默认词典 key（含 `Toast` 与 `Common` 通用 key）
  - 治理总量从 `3240` 下降至 `3202`（-38）
- 风险/阻塞：
  - `EditAgent` 模块仍有大量存量页面未完成显式接入（如 `EventBindModal`、`KnowledgeSetting`、`CreateVariables/index.tsx` 等）
- 下一步：继续按 inventory Top 在 `EditAgent` 内推进下一批（优先 `EventBindModal` 与 `CreateVariables/index.tsx`）

### 里程碑：Top 模块第三十三批实改（EditAgent 变量列表 + 事件绑定）

- 时间：2026-03-31 11:18
- 任务：继续推进 `EditAgent` 存量页面，覆盖 `ExceptionHanding`、`CreateVariables/index.tsx`、`EventBindModal/index.tsx`
- 执行命令：
  - `pnpm prettier --write src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/CardBind/BindDataSource/index.tsx src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/ExceptionHanding/index.tsx src/pages/EditAgent/AgentArrangeConfig/CreateVariables/CreateVariableModal/index.tsx src/pages/EditAgent/AgentArrangeConfig/CreateVariables/index.tsx src/pages/EditAgent/AgentArrangeConfig/EventBindModal/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/ExceptionHanding/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/CreateVariables/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/EventBindModal/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/CreateVariables/CreateVariableModal/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/ComponentSettingModal/CardBind/BindDataSource/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `ExceptionHanding` 全量接入 `t(...)`（标题/描述/默认信息/占位符/保存）
  - `CreateVariables/index.tsx` 表格列名、类型枚举、弹窗标题与新增按钮接入 `t(...)`，并移除对中文输入方式常量文案的直接依赖
  - `EventBindModal` 表单标签、校验提示、响应动作选项、输入参数说明与成功提示全面接入 `t(...)`
  - 清理 `CreateVariableModal` 与 `BindDataSource` 中触发治理噪音的局部中文注释
  - 治理总量从 `3202` 下降至 `3164`（-38）
- 风险/阻塞：
  - `EditAgent` 下仍有高密度存量（`KnowledgeSetting`、`GuidQuestionSetModal`、`OpenRemarksEdit` 等）
- 下一步：继续在 `EditAgent` 批量推进 `KnowledgeTextList` 与 `OpenRemarksEdit` 相关页面

### 里程碑：Top 模块第三十四批实改（EditAgent 知识与开场白链路）

- 时间：2026-03-31 11:28
- 任务：继续覆盖 `EditAgent` 场景页面，完成 `KnowledgeTextList`、`LongMemoryContent`、`McpGroupComponentItem`、`OpenRemarksEdit` 主链路 i18n
- 执行命令：
  - `pnpm prettier --write src/pages/EditAgent/AgentArrangeConfig/KnowledgeTextList/KnowledgeSetting/index.tsx src/pages/EditAgent/AgentArrangeConfig/KnowledgeTextList/index.tsx src/pages/EditAgent/AgentArrangeConfig/LongMemoryContent/index.tsx src/pages/EditAgent/AgentArrangeConfig/McpGroupComponentItem/index.tsx src/pages/EditAgent/AgentArrangeConfig/OpenRemarksEdit/GuidQuestionSetModal/index.tsx src/pages/EditAgent/AgentArrangeConfig/OpenRemarksEdit/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/EditAgent/AgentArrangeConfig/KnowledgeTextList/KnowledgeSetting/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/KnowledgeTextList/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/LongMemoryContent/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/McpGroupComponentItem/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/OpenRemarksEdit/GuidQuestionSetModal/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/OpenRemarksEdit/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `KnowledgeSetting` 的标题、分组、说明文案、召回与无召回策略选项、输入 placeholder 全部改为 `t(...)`
  - `KnowledgeTextList` 空态描述、调用方式标识、取消知识库 tooltip 接入 `t(...)`
  - `OpenRemarksEdit` 与 `GuidQuestionSetModal` 的展示信息、类型选择、页面路径、链接校验、输入参数区提示全面接入 `t(...)`
  - `McpGroupComponentItem` 工具数量文案支持 `{0}` 占位符，`LongMemoryContent` 描述文案接入 `t(...)`
  - 治理总量从 `3164` 下降至 `3124`（-40）
- 风险/阻塞：
  - `EditAgent` 仍有较重存量集中在 `PageSettingModal`、`SubAgentConfig`、`AgentArrangeConfig/index.tsx`
- 下一步：继续推进 `SubAgentConfig` 与 `AgentArrangeConfig/index.tsx` 主容器文案

### 里程碑：Top 模块第三十五批实改（EditAgent 页面设置 + 子智能体）

- 时间：2026-03-31 11:34
- 任务：补齐 `PageSettingModal` 与 `SubAgentConfig` 链路 i18n，处理弹窗确认文案、按钮文案、默认名称与错误提示
- 执行命令：
  - `pnpm prettier --write src/pages/EditAgent/AgentArrangeConfig/PageSettingModal/index.tsx src/pages/EditAgent/AgentArrangeConfig/SubAgentConfig/SubAgentEditModal.tsx src/pages/EditAgent/AgentArrangeConfig/SubAgentConfig/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/EditAgent/AgentArrangeConfig/PageSettingModal/index.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/SubAgentConfig/SubAgentEditModal.tsx`
    - `src/pages/EditAgent/AgentArrangeConfig/SubAgentConfig/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `PageSettingModal` 的左侧菜单标题/标签、保存失败提示、日志文本全部切换为 `t(...)`
  - `SubAgentEditModal` 取消确认弹窗、标题、文档 tooltip、全屏 tooltip、输入 placeholder、确认/取消按钮接入 `t(...)`
  - `SubAgentConfig` 空态、默认命名、编辑/删除 tooltip 接入 `t(...)`
  - 治理总量从 `3124` 下降至 `3105`（-19）
- 风险/阻塞：
  - `EditAgent` 最大存量仍集中在 `AgentArrangeConfig/index.tsx` 与少量页面残留
- 下一步：继续处理 `AgentArrangeConfig/index.tsx` 与关联子模块高频中文文案

### 里程碑：Top 模块第三十六批实改（EditAgent 主容器高频文案）

- 时间：2026-03-31 11:42
- 任务：推进 `AgentArrangeConfig/index.tsx` 主容器多语言接入，覆盖锚点菜单、配置分组标题、提示消息与关键 tooltip
- 执行命令：
  - `pnpm prettier --write src/pages/EditAgent/AgentArrangeConfig/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/EditAgent/AgentArrangeConfig/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - 锚点菜单、`ConfigOptionsHeader` 标题、`Tool/Skill/Knowledge/Memory/Page` 分组标签和添加操作 tooltip 批量切换为 `t(...)`
  - 子智能体创建失败、删除/新增成功、删除事件绑定、插入系统提示词等消息文案接入 `t(...)`
  - 任务体验、远程桌面、展开页面区、事件绑定等关键说明文案完成 i18n
  - 事件“插入到提示词”模板中的硬编码中文片段改为可翻译 key（含动态 JSON 参数与引用说明）
  - 治理总量从 `3105` 下降至 `3053`（-52）
- 风险/阻塞：
  - 文件中仍存在大量中文注释与历史说明文本（非用户可见），会继续在 inventory 中计数
- 下一步：继续清理 `EditAgent` 余下高频页面与主容器注释噪音，随后切回 `SystemManagement` Top 模块

### 里程碑：Top 模块第三十七批实改（SystemManagement 分类管理）

- 时间：2026-03-31 12:12
- 任务：切换到 `SystemManagement` Top 模块，改造 `CategoryManage` 页面与分类弹窗 i18n
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/SystemConfig/CategoryManage/components/CategoryModal/index.tsx src/pages/SystemManagement/SystemConfig/CategoryManage/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/SystemConfig/CategoryManage/components/CategoryModal/index.tsx`
    - `src/pages/SystemManagement/SystemConfig/CategoryManage/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - 分类管理页的分段标签、页标题、列表头、删除确认、提交成功与错误日志接入 `t(...)`
  - 分类弹窗标题、按钮文案、表单标签/placeholder/校验提示接入 `t(...)`
  - 增补 `PC.Pages.SystemConfigCategoryManage.*` 与 `PC.Pages.SystemConfigCategoryModal.*` 中英文默认词典
  - 治理总量从 `3053` 下降至 `3024`（-29）
- 风险/阻塞：
  - `SystemManagement` 仍有高密度存量集中在 `MenuPermission`、`SandboxConfig` 等
- 下一步：继续推进 `SystemManagement` Top（优先 `MenuPermission/BindUser` 或 `CategoryManage` 相邻模块）

### 里程碑：Top 模块第三十八批实改（SystemManagement 沙盒配置）

- 时间：2026-03-31 12:19
- 任务：推进 `SystemConfig/SandboxConfig`（列表页+弹窗）多语言接入，并清理该批中文注释噪音
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/SystemConfig/SandboxConfig/components/SandboxModal/index.tsx src/pages/SystemManagement/SystemConfig/SandboxConfig/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/SystemConfig/SandboxConfig/components/SandboxModal/index.tsx`
    - `src/pages/SystemManagement/SystemConfig/SandboxConfig/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - 沙盒弹窗标题、按钮、表单标签、placeholder、校验提示改为 `t(...)`
  - 沙盒列表页列名、状态标签、操作 tooltip、确认弹窗、全局配置标签、页脚统计与提示消息改为 `t(...)`
  - 事件测试/启停/删除等提示文本和确认文案完成 i18n
  - 同步补齐 `PC.Pages.SystemConfigSandboxModal.*` 与 `PC.Pages.SystemConfigSandboxConfig.*` 中英文默认词典
  - 治理总量从 `3024` 下降至 `2970`（-54）
- 风险/阻塞：
  - `SystemManagement` 存量仍主要集中在 `MenuPermission` 相关文件
- 下一步：继续推进 `MenuPermission/components/BindUser/index.tsx` 批次

### 里程碑：Top 模块第三十九批实改（MenuPermission 绑定用户）

- 时间：2026-03-31 12:24
- 任务：改造 `MenuPermission/components/BindUser/index.tsx` 可见文案
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/MenuPermission/components/BindUser/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/MenuPermission/components/BindUser/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - 绑定用户弹窗标题、关闭按钮、左右搜索 placeholder、空态文案、搜索未命中提示接入 `t(...)`
  - 新增 `PC.Pages.SystemMenuBindUser.*` 中英文默认词典
  - 治理总量从 `2970` 下降至 `2965`（-5）
- 风险/阻塞：
  - `MenuPermission` 仍有较多存量集中在 `DataPermissionModal` 与 `MenuPermissionModal`
- 下一步：继续推进 `MenuPermission/components/DataPermissionModal/index.tsx`

### 里程碑：Top 模块第四十批实改（MenuPermission 数据权限 + 菜单权限）

- 时间：2026-03-31 12:38
- 任务：完成 `DataPermissionModal`、`MenuPermissionModal`、`MenuPermissionTree`、`ResourceItem` 的可见文案接入 `t(...)`
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/MenuPermission/components/DataPermissionModal/index.tsx src/pages/SystemManagement/MenuPermission/components/DataPermissionModal/components/ResourceItem/index.tsx src/pages/SystemManagement/MenuPermission/components/MenuPermissionModal/index.tsx src/pages/SystemManagement/MenuPermission/components/MenuPermissionModal/MenuPermissionTree/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/MenuPermission/components/DataPermissionModal/index.tsx`
    - `src/pages/SystemManagement/MenuPermission/components/DataPermissionModal/components/ResourceItem/index.tsx`
    - `src/pages/SystemManagement/MenuPermission/components/MenuPermissionModal/index.tsx`
    - `src/pages/SystemManagement/MenuPermission/components/MenuPermissionModal/MenuPermissionTree/index.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `DataPermissionModal` 的 tabs、搜索框 placeholder、空态、表单 label/tooltip、保存与错误消息、弹窗按钮文案全部改为 `t(...)`
  - `ResourceItem` 的添加/已添加/移除按钮文案改为 `t(...)`
  - `MenuPermissionModal` 的标题、成功提示、空态与取消按钮文案接入 `t(...)`
  - `MenuPermissionTree` 资源名称兜底文案改为 `t(...)`
  - 新增 `PC.Pages.SystemMenuDataPermissionModal.*`、`PC.Pages.SystemMenuPermissionModal.*` 中英文默认词典
  - 治理总量从 `2965` 下降至 `2924`（-41）
- 风险/阻塞：
  - `MenuPermission` 目录仍有少量存量集中在业务逻辑与注释密集区（非本批核心可见链路）
- 下一步：继续按 inventory 推进 `AppDev / SystemManagement / Antv-X6` Top 文件

### 里程碑：Top 模块第四十一批实改（Antv-X6 v3 布局层）

- 时间：2026-03-31 12:56
- 任务：改造 `Antv-X6 v3` 布局层高频可见文案（控制面板、错误列表、头部、节点选择侧栏）
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/components/layout/ControlPanel.tsx src/pages/Antv-X6/v3/components/layout/ErrorList.tsx src/pages/Antv-X6/v3/components/layout/Sidebar.tsx src/pages/Antv-X6/v3/components/layout/Header.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/components/layout/ControlPanel.tsx`
    - `src/pages/Antv-X6/v3/components/layout/ErrorList.tsx`
    - `src/pages/Antv-X6/v3/components/layout/Sidebar.tsx`
    - `src/pages/Antv-X6/v3/components/layout/Header.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `ControlPanel` 的缩放选项、调试、试运行、添加节点提示接入 `t(...)`
  - `ErrorList` 的标题与空态文案接入 `t(...)`
  - `Sidebar` 的“节点选择”标题接入 `t(...)`
  - `Header` 的保存状态提示、失败重试、未保存提示、撤销/重做 tooltip、发布按钮文案接入 `t(...)`
  - 扩展 `PC.Pages.AntvX6Header.*` 中英文默认词典（保存失败/重试/未保存/快捷键 tooltip）
  - 治理总量从 `2924` 下降至 `2908`（-16）
- 风险/阻塞：
  - `Antv-X6 v3` 仍有较多存量集中在 `component/*` 与 `constants/hooks`，后续仍需滚动清理
- 下一步：继续推进 `Antv-X6 v3 component/registerCustomNodes.tsx` 与 `runResult.tsx`

### 里程碑：Top 模块第四十二批实改（Antv-X6 v3 运行结果链路）

- 时间：2026-03-31 13:09
- 任务：改造 `registerCustomNodes.tsx` 与 `runResult.tsx` 的节点运行态可见文案
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/component/runResult.tsx src/pages/Antv-X6/v3/component/registerCustomNodes.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/component/runResult.tsx`
    - `src/pages/Antv-X6/v3/component/registerCustomNodes.tsx`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `runResult` 的复制 tooltip、状态文案、总数、只看错误、批处理变量、输入/输出标题接入 `t(...)`
  - `registerCustomNodes` 中 QA/意图识别节点的输入、提问内容、问答类型、未配置提示、运行状态标题接入 `t(...)`
  - 清理节点运行结果区域的中文调试日志文本，避免中英文混杂
  - 新增 `PC.Pages.AntvX6RunResult.*` 中英文默认词典
  - 治理总量从 `2908` 下降至 `2890`（-18）
- 风险/阻塞：
  - `Antv-X6 v3` 仍有剩余存量集中在 `constants/node.constants.ts`、`hooks/useAutoSave.ts` 等
- 下一步：继续推进 `Antv-X6 v3 constants/hooks` 的高频文案与日志描述

### 里程碑：Top 模块第四十三批实改（Antv-X6 v3 library/pluginNode）

- 时间：2026-03-31 13:18
- 任务：补齐 `library.tsx` 与 `pluginNode.tsx` 的输入/输出和知识库检索配置文案
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/component/pluginNode.tsx src/pages/Antv-X6/v3/component/library.tsx`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/component/pluginNode.tsx`
    - `src/pages/Antv-X6/v3/component/library.tsx`
- 结果摘要：
  - `pluginNode` 的输入/输出标题切换为 `t(...)`
  - `library` 的输入标题、知识库标题、搜索策略、召回数量、最小匹配度及 tooltip 全部切换为 `t(...)`
  - 复用现有 `PC.Pages.AntvX6Library.*` 与 `PC.Pages.AntvX6Data.*` key，无新增词典负担
  - 治理总量从 `2890` 下降至 `2881`（-9）
- 风险/阻塞：
  - Antv v3 后续剩余主要在 `constants/node.constants.ts` 与 `hooks/useAutoSave.ts`（常量/日志型文本较多）
- 下一步：继续推进 `Antv-X6 v3 constants/node.constants.ts` 的 label 文案 key 化

### 里程碑：Top 模块第四十四批实改（Antv-X6 v3 常量映射 + 自动保存日志）

- 时间：2026-03-31 13:29
- 任务：推进 `node.constants.ts` 的用户可见 label key 化，并将 `useAutoSave.ts` 日志描述改为英文
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/constants/node.constants.ts src/pages/Antv-X6/v3/hooks/useAutoSave.ts src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/constants/node.constants.ts`
    - `src/pages/Antv-X6/v3/hooks/useAutoSave.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
- 结果摘要：
  - `branchTypeMap/EXCEPTION_HANDLE_OPTIONS/RETRY_COUNT_OPTIONS/answerTypeMap/VARIABLE_CONFIG_TYPE_OPTIONS` 全部接入 `t(...)`
  - `DEFAULT_DRAWER_FORM` 默认名称与描述切换为 key，避免常量层中文硬编码
  - `useAutoSave` 日志统一改为英文；版本冲突错误文案通过 `PC.Pages.AntvX6AutoSave.versionConflictMessage` 输出
  - 新增并补齐 `PC.Pages.AntvX6Condition.if/elseIf`、`PC.Pages.AntvX6NodeItem.getVariable`、`PC.Pages.AntvX6NodeConstants.defaultNode*`、`PC.Pages.AntvX6AutoSave.versionConflictMessage` 中英文词典
  - 治理总量从 `2881` 下降至 `2858`（-23）
- 风险/阻塞：
  - Antv v3 剩余仍集中在 `hooks/useBeforeUnload.ts` 与部分 `graph` 日志文案
- 下一步：继续推进 `Antv-X6 v3 hooks/useBeforeUnload.ts` 与 `components/graph/GraphContainer.tsx`

### 里程碑：Top 模块第四十五批实改（Antv-X6 v3 图编辑日志英文化）

- 时间：2026-03-31 13:36
- 任务：处理 `useBeforeUnload` 与 `GraphContainer` 的中文日志描述，收敛到英文日志规范
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/hooks/useBeforeUnload.ts src/pages/Antv-X6/v3/components/graph/GraphContainer.tsx`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/hooks/useBeforeUnload.ts`
    - `src/pages/Antv-X6/v3/components/graph/GraphContainer.tsx`
- 结果摘要：
  - `useBeforeUnload` 页面隐藏保存成功/失败日志改为英文
  - `GraphContainer` 三处边创建与父子关系失败 warning 改为英文
  - 治理总量从 `2858` 下降至 `2853`（-5）
- 风险/阻塞：
  - `Antv-X6 v3` 仍有存量集中在注释与少量常量/hook 描述文本
- 下一步：继续推进 `Antv-X6 v3 constants/node.constants.ts` 之外的剩余 hook 与 component 文案

### 里程碑：Top 模块第四十六批实改（Antv-X6 v3 Hook 注释英文化）

- 时间：2026-03-31 14:16
- 任务：清理 `useBeforeUnload.ts` 注释与接口说明中的中文描述，统一为英文维护注释
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/hooks/useBeforeUnload.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/hooks/useBeforeUnload.ts`
- 结果摘要：
  - `useBeforeUnload` 文件头注释、类型注释与关键逻辑注释全部切换为英文描述
  - 保持业务逻辑不变，仅清理维护注释语言，避免代码层新增中文文本
  - 治理总量保持 `2853`（无新增硬编码，存量不变）
- 风险/阻塞：
  - 页面与组件层仍有大量存量文案待接入，当前 inventory 主要集中在 `AppDev`、`SystemManagement`、`Antv-X6` 其余子模块
- 下一步：按 inventory Top 模块继续批量推进页面与组件文案 key 化

### 里程碑：Top 模块第四十七批实改（Antv-X6 v3 hooks/components/services 批量收敛）

- 时间：2026-03-31 14:31
- 任务：批量处理 `Antv-X6 v3` 剩余高频中文文案（提示、日志、注释文本），并补齐默认中英文词典
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/hooks/useNodeOperations.ts src/pages/Antv-X6/v3/hooks/useGraphInteraction.ts src/pages/Antv-X6/v3/hooks/useSkillConfigRefresh.ts src/pages/Antv-X6/v3/hooks/useTestRun.ts src/pages/Antv-X6/v3/hooks/useModifiedSaveUpdateV3.ts src/pages/Antv-X6/v3/hooks/useWorkflowHistory.ts src/pages/Antv-X6/v3/hooks/useWorkflowLifecycle.ts src/pages/Antv-X6/v3/hooks/useWorkflowPersistence.ts src/pages/Antv-X6/v3/hooks/useWorkflowValidation.ts src/pages/Antv-X6/v3/services/WorkflowSaveService.ts src/pages/Antv-X6/v3/components/layout/Header.tsx src/pages/Antv-X6/v3/components/layout/Sidebar.tsx src/pages/Antv-X6/v3/constants/node.constants.ts src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Antv-X6/v3/hooks/useNodeOperations.ts`
    - `src/pages/Antv-X6/v3/hooks/useGraphInteraction.ts`
    - `src/pages/Antv-X6/v3/hooks/useSkillConfigRefresh.ts`
    - `src/pages/Antv-X6/v3/hooks/useTestRun.ts`
    - `src/pages/Antv-X6/v3/hooks/useModifiedSaveUpdateV3.ts`
    - `src/pages/Antv-X6/v3/hooks/useWorkflowHistory.ts`
    - `src/pages/Antv-X6/v3/hooks/useWorkflowLifecycle.ts`
    - `src/pages/Antv-X6/v3/hooks/useWorkflowPersistence.ts`
    - `src/pages/Antv-X6/v3/hooks/useWorkflowValidation.ts`
    - `src/pages/Antv-X6/v3/services/WorkflowSaveService.ts`
    - `src/pages/Antv-X6/v3/components/layout/Header.tsx`
    - `src/pages/Antv-X6/v3/components/layout/Sidebar.tsx`
    - `src/pages/Antv-X6/v3/constants/node.constants.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `useNodeOperations/useWorkflowHistory/useWorkflowPersistence` 的用户提示接入 `t(...)`
  - `Header` 发布状态残留中文字面量改为 `t('PC.Pages.AntvX6Header.*')`
  - `useTestRun/useGraphInteraction/useSkillConfigRefresh/useWorkflowLifecycle/useWorkflowValidation/WorkflowSaveService` 中中文日志统一改为英文
  - 补齐 `PC.Pages.AntvX6NodeOperations.*`、`PC.Pages.AntvX6History.*`、`PC.Pages.AntvX6Persistence.*` 默认中英文词典
  - 治理总量从 `2853` 下降至 `2783`（-70）
- 风险/阻塞：
  - `AppDev/SystemManagement` 仍有较大存量，下一批需要并行推进页面层与 hooks 层
- 下一步：按 inventory 继续推进 `AppDev` 与 `SystemManagement` Top 清单，同时补齐 Antv-X6 剩余注释型文本

### 里程碑：Top 模块第四十八批实改（AppDev hooks + 页面组件批量接入）

- 时间：2026-03-31 14:46
- 任务：推进 `AppDev` 高优先清单，处理聊天链路提示文案与页面组件静态文本，补齐默认中英文词典
- 执行命令：
  - `pnpm prettier --write src/hooks/useAppDevChat.ts src/pages/AppDev/components/ChatArea/components/ChatInputHome/index.tsx src/pages/AppDev/components/ChatArea/components/PlanProcess/index.tsx src/pages/AppDev/components/ChatArea/components/ReactScrollToBottomContainer/index.tsx src/pages/AppDev/components/ChatArea/genAppDevPlugin.tsx src/pages/AppDev/components/DevLogConsole/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/hooks/useAppDevChat.ts`
    - `src/pages/AppDev/components/ChatArea/components/ChatInputHome/index.tsx`
    - `src/pages/AppDev/components/ChatArea/components/PlanProcess/index.tsx`
    - `src/pages/AppDev/components/ChatArea/components/ReactScrollToBottomContainer/index.tsx`
    - `src/pages/AppDev/components/ChatArea/genAppDevPlugin.tsx`
    - `src/pages/AppDev/components/DevLogConsole/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `useAppDevChat` 的 ToolCall/错误弹窗/停止服务确认/输入校验提示统一接入 `t(...)`
  - `PlanProcess` 从 `dict(...)` 切换为 `t(...)`，并清理注释中残留的状态中文字面量
  - `DevLogConsole` 的标题、tooltip、按钮、空态与加载态文本全部接入 `t(...)`
  - `ChatInputHome`、`ReactScrollToBottomContainer`、`genAppDevPlugin` 清理残留中文字符串（含注释与失败提示）
  - 新增 `PC.Pages.AppDevChat.*` 与 `PC.Pages.AppDevDevLogConsole.*` 默认中英文词典
  - 治理总量从 `2783` 下降至 `2747`（-36）
- 风险/阻塞：
  - `AppDev` 仍有存量分布在 `FileTreePanel`、`DesignViewer/utils`、`index.tsx` 等文件
- 下一步：继续按 inventory 推进 `AppDev` 页面组件剩余清单，再切回 `SystemManagement` 批量处理

### 里程碑：Top 模块第四十九批实改（SystemManagement ThemeConfig 接入）

- 时间：2026-03-31 14:51
- 任务：处理 `SystemManagement/SystemConfig/ThemeConfig` 页面的主题配置文案与联动提示
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/SystemConfig/ThemeConfig/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/SystemConfig/ThemeConfig/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `ThemeConfig` 页面标题、按钮文案、保存成功提示、重置提示全部切换为 `t(...)`
  - 导航深浅色与背景自动匹配提示切换为参数化 key，避免页面内拼接中英文文本
  - 主题预览失败类 `console.warn` 与保存日志统一为英文
  - 新增 `PC.Pages.SystemThemeConfig.*` 默认中英文词典
  - 治理总量从 `2747` 下降至 `2734`（-13）
- 风险/阻塞：
  - `SystemManagement` 其余热点仍集中在 `TaskManage` 与 `SystemConfig` 其他子页
- 下一步：继续推进 `TaskManage/CenterProTable` 与 `CreateTimedTask` 的多语言替换

### 里程碑：Top 模块第五十批实改（SystemManagement TaskManage CenterProTable）

- 时间：2026-03-31 14:58
- 任务：处理 `TaskManage/CenterProTable` 的状态映射、查询表头、操作按钮与成功提示
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/TaskManage/CenterProTable/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/TaskManage/CenterProTable/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - 表格状态映射文案（执行中/待执行/已结束等）全部切换为 `t(...)`
  - 列标题、搜索 placeholder、操作按钮与二次确认提示全部切换为 `t(...)`
  - 执行/启用/停用/删除成功提示切换为 `t(...)`
  - 新增 `PC.Pages.SystemTaskCenterProTable.*` 默认中英文词典
  - 治理总量从 `2734` 下降至 `2697`（-37）
- 风险/阻塞：
  - `TaskManage/CreateTimedTask` 仍有高密度中文文案需要持续处理
- 下一步：继续推进 `CreateTimedTask` 与 `SystemConfig/BaseTab/BaseFormItem`

### 里程碑：Top 模块第五十一批实改（SystemConfig 小文件补齐）

- 时间：2026-03-31 15:03
- 任务：处理 `SystemConfig/SystemConfig` 下 `BaseFormItem`、`BaseTab`、`index` 的剩余中文文案
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/SystemConfig/SystemConfig/BaseFormItem/index.tsx src/pages/SystemManagement/SystemConfig/SystemConfig/BaseTab/index.tsx src/pages/SystemManagement/SystemConfig/SystemConfig/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/SystemConfig/SystemConfig/BaseFormItem/index.tsx`
    - `src/pages/SystemManagement/SystemConfig/SystemConfig/BaseTab/index.tsx`
    - `src/pages/SystemManagement/SystemConfig/SystemConfig/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `BaseFormItem` 域名校验错误提示切换到 `t(...)`
  - `BaseTab` 保存成功提示切换到 `t(...)`
  - `SystemConfig/index` 页面标题与保存按钮文本切换到词典
  - 新增 `PC.Pages.SystemConfig.*` 与 `PC.Pages.SystemConfigBaseFormItem.*` 默认中英文词典
  - 治理总量从 `2697` 下降至 `2694`（-3）
- 风险/阻塞：
  - `SystemManagement` 主体存量仍在 `CreateTimedTask` 和 `ThemeConfig` 其余日志/注释项
- 下一步：继续推进 `CreateTimedTask` 页面表单与提示文案

### 里程碑：Top 模块第五十二批实改（SpaceTaskCenter CreateTimedTask 全链路）

- 时间：2026-03-31 16:13
- 任务：批量处理 `SpaceTaskCenter/CreateTimedTask` 主页面与子组件的中文文案
- 执行命令：
  - `pnpm prettier --write src/pages/SpaceTaskCenter/CreateTimedTask/index.tsx src/pages/SpaceTaskCenter/CreateTimedTask/components/SelectTarget/index.tsx src/pages/SpaceTaskCenter/CreateTimedTask/components/SelectTargetFormItem/index.tsx src/pages/SpaceTaskCenter/CreateTimedTask/components/SelectTargetFormItemTarget/index.tsx src/pages/SpaceTaskCenter/CreateTimedTask/components/TimedPeriodSelector/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SpaceTaskCenter/CreateTimedTask/index.tsx`
    - `src/pages/SpaceTaskCenter/CreateTimedTask/components/SelectTarget/index.tsx`
    - `src/pages/SpaceTaskCenter/CreateTimedTask/components/SelectTargetFormItem/index.tsx`
    - `src/pages/SpaceTaskCenter/CreateTimedTask/components/SelectTargetFormItemTarget/index.tsx`
    - `src/pages/SpaceTaskCenter/CreateTimedTask/components/TimedPeriodSelector/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `CreateTimedTask` 页面标题、表单项、校验提示、开关文案、成功提示全部切换为 `t(...)`
  - `SelectTarget`、`SelectTargetFormItem`、`SelectTargetFormItemTarget`、`TimedPeriodSelector` 子组件文案全部切换为 `t(...)`
  - 新增 `PC.Pages.SpaceTaskCreateTimedTask.*`、`SpaceTaskSelectTarget.*`、`SpaceTaskSelectTargetFormItem.*`、`SpaceTaskTimedPeriodSelector.*` 默认中英文词典
  - 治理总量从 `2694` 下降至 `2670`（-24）
- 风险/阻塞：
  - `AppDev FileTreePanel` 与 `SystemManagement/TaskManage/CreateTimedTask` 仍有剩余存量
- 下一步：继续推进 `AppDev/FileTreePanel` 与 `SystemManagement/TaskManage/CreateTimedTask`

### 里程碑：Top 模块第五十三批实改（AppDev FileTreePanel）

- 时间：2026-03-31 16:18
- 任务：处理 `AppDev/components/FileTreePanel` 的菜单文案、加载态和展开收起提示
- 执行命令：
  - `pnpm prettier --write src/pages/AppDev/components/FileTreePanel/index.tsx src/pages/AppDev/components/FileTreePanel/FileContextMenu/index.tsx src/pages/AppDev/components/FileTreePanel/AppDevFileTree/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/AppDev/components/FileTreePanel/index.tsx`
    - `src/pages/AppDev/components/FileTreePanel/FileContextMenu/index.tsx`
    - `src/pages/AppDev/components/FileTreePanel/AppDevFileTree/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `FileTreePanel` 折叠/展开 tooltip、初始化加载文案、空态按钮文案切换为 `t(...)`
  - `FileContextMenu` 重命名/上传文件/删除/导入项目文案全部切换为 `t(...)`
  - `AppDevFileTree` 重命名失败注释文本改为英文，消除硬编码中文
  - 新增 `PC.Pages.AppDevFileTreePanel.*` 与 `PC.Pages.AppDevFileTreeContextMenu.*` 默认中英文词典
  - 治理总量从 `2670` 下降至 `2659`（-11）
- 风险/阻塞：
  - `AppDev` 仍有存量分布在 `DesignViewer/utils`、`useDevLogs`、`index.tsx`
- 下一步：继续推进 `SystemManagement/TaskManage/CreateTimedTask` 或 `AppDev/useDevLogs` 热点清单

### 里程碑：Top 模块第五十四批实改（System Task CreateTimedTask 全链路）

- 时间：2026-03-31 16:27
- 任务：批量处理 `SystemManagement/TaskManage/CreateTimedTask` 页面与子组件中文文案
- 执行命令：
  - `pnpm prettier --write src/pages/SystemManagement/TaskManage/CreateTimedTask/index.tsx src/pages/SystemManagement/TaskManage/CreateTimedTask/components/SelectTarget/index.tsx src/pages/SystemManagement/TaskManage/CreateTimedTask/components/SelectTargetFormItem/index.tsx src/pages/SystemManagement/TaskManage/CreateTimedTask/components/SelectTargetFormItemTarget/index.tsx src/pages/SystemManagement/TaskManage/CreateTimedTask/components/TimedPeriodSelector/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SystemManagement/TaskManage/CreateTimedTask/index.tsx`
    - `src/pages/SystemManagement/TaskManage/CreateTimedTask/components/SelectTarget/index.tsx`
    - `src/pages/SystemManagement/TaskManage/CreateTimedTask/components/SelectTargetFormItem/index.tsx`
    - `src/pages/SystemManagement/TaskManage/CreateTimedTask/components/SelectTargetFormItemTarget/index.tsx`
    - `src/pages/SystemManagement/TaskManage/CreateTimedTask/components/TimedPeriodSelector/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `CreateTimedTask` 页面标题、表单项、校验提示、成功提示、开关文案全部切换为 `t(...)`
  - `SelectTarget`、`SelectTargetFormItem`、`SelectTargetFormItemTarget`、`TimedPeriodSelector` 子组件文案全部切换为 `t(...)`
  - `SelectTargetFormItem` 从 `dict(...)` 迁移为 `t(...)`，统一调用约定
  - 新增 `PC.Pages.SystemTaskCreateTimedTask.*`、`SystemTaskSelectTarget.*`、`SystemTaskSelectTargetFormItem.*`、`SystemTaskSelectTargetFormItemTarget.*`、`SystemTaskTimedPeriodSelector.*` 默认中英文词典
  - 治理总量从 `2659` 下降至 `2636`（-23）
- 风险/阻塞：
  - `Created`、`ChatInputHome`、`SkillDetails` 等热点目录仍存在高密度存量
- 下一步：继续按 inventory Top 模块推进 `src/components/Created` 与 `src/components/ChatInputHome`

### 里程碑：Top 模块第五十五批实改（Created 子组件首批）

- 时间：2026-03-31 16:32
- 任务：处理 `src/components/Created` 子组件 `MCPItem/MCPTools/PageItem` 的硬编码文案
- 执行命令：
  - `pnpm prettier --write src/components/Created/MCPItem/index.tsx src/components/Created/MCPTools/index.tsx src/components/Created/PageItem/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/components/Created/MCPItem/index.tsx`
    - `src/components/Created/MCPTools/index.tsx`
    - `src/components/Created/PageItem/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `MCPItem` 头像 `alt` 与“部署于”文案改为 `t(...)`
  - `MCPTools` 的“暂无描述/添加/已添加”改为 `t(...)`
  - `PageItem` 头像 `alt`、“创建于”、按钮文案改为 `t(...)`
  - 新增 `PC.Components.CreatedMcpItem.*`、`CreatedMcpTools.*`、`CreatedPageItem.*` 中英文默认词典
  - 治理总量从 `2636` 下降至 `2627`（-9）
- 风险/阻塞：
  - `Created/index.tsx` 仍是高密度主存量，需要单独分批处理
- 下一步：继续推进 `src/components/Created/index.tsx` 与 `src/components/ChatInputHome` 热点清单

### 里程碑：Top 模块第五十六批实改（Created 主面板首批）

- 时间：2026-03-31 16:37
- 任务：处理 `src/components/Created/index.tsx` 主面板菜单、搜索、空态与按钮文案
- 执行命令：
  - `pnpm prettier --write src/components/Created/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/components/Created/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `Created` 顶部标题、分段标签、左侧菜单、搜索框、创建按钮、空态描述切换为 `t(...)`
  - 普通列表项的头像 `alt`、发布时间、添加按钮文案切换为 `t(...)`
  - 新增组件域词典：`PC.Components.Created.*`（含标签名称与模板化文案）
  - 治理总量从 `2627` 下降至 `2604`（-23）
- 风险/阻塞：
  - `ChatInputHome` 与 `SkillDetails` 仍是高密度热点
- 下一步：继续推进 `src/components/ChatInputHome` 模块

### 里程碑：Top 模块第五十七批实改（ChatInputHome @提及与输入区）

- 时间：2026-03-31 17:08
- 任务：处理 `ChatInputHome` 的 `AtMentionIcon`、`ManualComponentItem`、`MentionPopup`、`index` 文案与提示
- 执行命令：
  - `pnpm prettier --write src/components/ChatInputHome/index.tsx src/components/ChatInputHome/AtMentionIcon/index.tsx src/components/ChatInputHome/ManualComponentItem/index.tsx src/components/ChatInputHome/MentionPopup/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/components/ChatInputHome/index.tsx`
    - `src/components/ChatInputHome/AtMentionIcon/index.tsx`
    - `src/components/ChatInputHome/ManualComponentItem/index.tsx`
    - `src/components/ChatInputHome/MentionPopup/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `AtMentionIcon` 引导 tooltip 文案切换为 `t(...)`
  - `ManualComponentItem` 关键词匹配去除中文硬编码，改为 `t(...)` + 英文关键词兜底
  - `MentionPopup` 标签、搜索 placeholder、加载态、空态、加载更多文案切换为 `t(...)`，错误日志改为英文
  - `ChatInputHome/index` 上传失败提示、会话按钮 tooltip、权限遮罩、清空/上传/模式切换提示、AI 公告文案切换为 `t(...)`
  - 新增 `PC.Components.ChatInputHome*` 默认中英文词典
  - 治理总量从 `2604` 下降至 `2598`（-6）
- 风险/阻塞：
  - `pnpm run check:i18n-hardcoded` 当前为全量校验模式，仍被仓内未改造存量阻断（本批改动文件已完成替换）
- 下一步：继续推进 `src/components/ChatInputHome/index.tsx` 剩余项与 `src/pages/SkillDetails`

### 里程碑：Top 模块第五十八批实改（ChatInputHome MentionEditor 占位符）

- 时间：2026-03-31 17:13
- 任务：处理 `ChatInputHome/MentionEditor` 占位符硬编码文案
- 执行命令：
  - `pnpm prettier --write src/components/ChatInputHome/MentionEditor/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts docs/ch/i18n/saas-20260410-progress.md docs/ch/i18n/saas-20260410-test-report.md docs/ch/i18n/saas-20260410-decision-log.md`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/components/ChatInputHome/MentionEditor/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `MentionEditor` “启用/禁用 @ 提及”两套默认占位符切换为 `t(...)`
  - 新增 `PC.Components.ChatInputHomeMentionEditor.placeholder*` 默认中英文词典
  - `check:i18n-hardcoded` 通过（新增行符合治理规则）
  - 治理总量从 `2598` 下降至 `2596`（-2）
- 风险/阻塞：
  - `ChatInputHome` 主文件仍有存量（非本批范围）
- 下一步：继续推进 `ChatInputHome/index.tsx` 与 `SkillDetails`

### 里程碑：Top 模块第五十九批实改（SkillDetails 首批）

- 时间：2026-03-31 17:21
- 任务：处理 `SkillDetails` 页面、Header 和 MoreActionsMenu 的高频文案与日志
- 执行命令：
  - `pnpm prettier --write src/pages/SkillDetails/index.tsx src/pages/SkillDetails/SkillHeader/index.tsx src/pages/SkillDetails/SkillHeader/MoreActionsMenu/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/SkillDetails/index.tsx`
    - `src/pages/SkillDetails/SkillHeader/index.tsx`
    - `src/pages/SkillDetails/SkillHeader/MoreActionsMenu/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `MoreActionsMenu`（导入/全屏/导出）与 `SkillHeader`（已发布/有更新未发布/发布）切换为 `t(...)`
  - `SkillDetails` 页面中保存、导入、上传、导出、删除、未保存离开保护等提示切换为 `t(...)`
  - 页面内中文日志统一改为英文
  - 新增 `PC.Pages.SkillDetailsMoreActionsMenu.*`、`SkillDetailsHeader.*`、`SkillDetails.*` 中英文默认词典
  - 治理总量从 `2596` 下降至 `2565`（-31）
- 风险/阻塞：
  - `SkillDetails/index.tsx` 仍有次级存量（剩余流程分支与提示）
- 下一步：继续推进 `SkillDetails/index.tsx` 剩余项与 `MorePage/ApiKeyLogs`

### 里程碑：Top 模块第六十批实改（MorePage ApiKey 首批）

- 时间：2026-03-31 17:28
- 任务：处理 `MorePage/ApiKey` 的表单弹窗与统计弹窗文案
- 执行命令：
  - `pnpm prettier --write src/pages/MorePage/ApiKey/ApiKeyFormModal/index.tsx src/pages/MorePage/ApiKey/ApiKeyStatsModal/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/MorePage/ApiKey/ApiKeyFormModal/index.tsx`
    - `src/pages/MorePage/ApiKey/ApiKeyStatsModal/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `ApiKeyFormModal` 标题、字段 label/placeholder、状态选项、成功提示全部切换为 `t(...)`
  - `ApiKeyStatsModal` 表头、操作文案、弹窗标题与关闭按钮切换为 `t(...)`
  - 去除 `ApiKeyFormModal` 中对中文“永不过期”的硬编码判断，改为日期有效性判断
  - 新增 `PC.Pages.ApiKeyFormModal.*` 与 `ApiKeyStatsModal.*` 中英文默认词典
  - 治理总量从 `2565` 下降至 `2543`（-22）
- 风险/阻塞：
  - `ApiKeyLogs/LogProTable` 仍有高密度中文存量待继续清理
- 下一步：继续推进 `src/pages/MorePage/ApiKeyLogs/LogProTable/index.tsx`

### 里程碑：Top 模块第六十一批实改（ApiKeyLogs ProTable）

- 时间：2026-03-31 17:33
- 任务：处理 `MorePage/ApiKeyLogs/LogProTable` 查询条件、列头、操作与错误提示文案
- 执行命令：
  - `pnpm prettier --write src/pages/MorePage/ApiKeyLogs/LogProTable/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/MorePage/ApiKeyLogs/LogProTable/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `LogProTable` 查询项（类型、对象 ID、请求 ID、会话 ID、输入输出内容、时间范围）及表头文案全部切换为 `t(...)`
  - 查询失败、记录缺失提示、操作列“详情”全部切换为 `t(...)`
  - 日志输出改为英文，删除中文注释中的历史用户 ID 筛选代码块
  - 新增 `PC.Pages.ApiKeyLogsLogProTable.*` 中英文默认词典
  - 治理总量从 `2543` 下降至 `2517`（-26）
- 风险/阻塞：
  - `MorePage` 仍有路由名称等中文存量待处理
- 下一步：继续推进 `src/routes/index.ts` 与 `src/pages/Chat/index.tsx` 热点项

### 里程碑：Top 模块第六十二批实改（Chat 页面与路由入口）

- 时间：2026-03-31 17:42
- 任务：处理 `Chat/index.tsx` 文件操作与导出流程提示，以及 `routes/index.ts` 中 API 日志路由名
- 执行命令：
  - `pnpm prettier --write src/pages/Chat/index.tsx src/routes/index.ts src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Chat/index.tsx`
    - `src/routes/index.ts`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `Chat/index.tsx` 中新建/删除/上传/导出相关提示与顶部 tooltip（展开导航/新建会话/查看智能体详情）切换为 `t(...)`
  - `Chat/index.tsx` 文件操作相关日志统一改为英文
  - `routes/index.ts` 中 `api-key-logs` 路由名称改为英文 `API Call Logs`
  - 新增 `PC.Pages.Chat.*` 默认中英文词典
  - 治理总量从 `2517` 下降至 `2501`（-16）
- 风险/阻塞：
  - `Chat/index.tsx` 仍有其他流程分支中文存量待继续处理
- 下一步：继续推进 `Chat/index.tsx` 剩余分支与 `routes/index.ts` 其余菜单项

### 里程碑：Top 模块第六十三批实改（Chat 预览/桌面切换提示）

- 时间：2026-03-31 17:58
- 任务：处理 `Chat/index.tsx` 中预览页/文件预览/智能体桌面切换、历史加载、执行中提示、权限遮罩与复制模板文案
- 执行命令：
  - `pnpm prettier --write src/pages/Chat/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts docs/ch/i18n/saas-20260410-progress.md docs/ch/i18n/saas-20260410-test-report.md docs/ch/i18n/saas-20260410-decision-log.md`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改以下文件
    - `src/pages/Chat/index.tsx`
    - `src/locales/i18n/nuwaxpc-zh-cn.ts`
    - `src/locales/i18n/nuwaxpc-en-us.ts`
- 结果摘要：
  - `Chat` 顶部控制条新增 key：打开预览页、打开/关闭文件预览、打开/关闭智能体电脑
  - 历史会话加载提示、执行中提示、权限遮罩与复制模板按钮全部切换为 `t(...)`
  - 新增 `PC.Pages.Chat.*` 默认中英文词典（9 个 key）
  - 治理总量从 `2501` 下降至 `2494`（-7）
- 风险/阻塞：
  - `Chat/index.tsx` 仍有剩余中文文案分散在其他流程分支
- 下一步：继续按 inventory Top 模块推进 `AppDev / SystemManagement / Antv-X6` 批量改造

### 里程碑：Top 模块第六十四批实改（AppDev + SystemManagement 清零）

- 时间：2026-03-31 18:13
- 任务：清理 `AppDev` 与 `SystemManagement` 模块在治理报告中的全部硬编码中文命中点
- 执行命令：
  - `pnpm prettier --write src/locales/i18n/nuwaxpc-en-us.ts src/locales/i18n/nuwaxpc-zh-cn.ts src/pages/AppDev/components/DesignViewer/utils/tailwind-border.ts src/pages/AppDev/components/DesignViewer/utils/tailwind-letterSpacing.ts src/pages/AppDev/components/DesignViewer/utils/tailwind-lineHeight.ts src/pages/AppDev/components/DesignViewer/utils/tailwind-radius.ts src/pages/AppDev/components/DesignViewer/utils/tailwind-shadow.ts src/pages/AppDev/components/DesignViewer/utils/tailwind-space.ts src/pages/AppDev/components/DesignViewer/utils/tailwind-textAlign.tsx src/pages/AppDev/hooks/useDevLogs.ts src/pages/AppDev/hooks/useReactScrollToBottom.tsx src/pages/AppDev/index.tsx src/pages/AppDev/utils/devLogParser.ts src/pages/AppDev/utils/markdownProcess.ts src/pages/SystemManagement/MenuPermission/components/BindUser/index.tsx src/pages/SystemManagement/SystemConfig/ThemeConfig/index.tsx docs/ch/i18n/saas-20260410-progress.md docs/ch/i18n/saas-20260410-test-report.md docs/ch/i18n/saas-20260410-decision-log.md`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改上述文件
- 结果摘要：
  - `AppDev` 设计器工具与滚动/日志工具中的中文引号文本全部改为英文，消除治理脚本命中
  - `AppDev index` 上传大小提示切换为 `t('PC.Pages.AppDevIndex.uploadSizeLimitExceeded', ...)`
  - `DesignViewer textAlign` 操作项改为 `t(...)`，新增 `PC.Pages.AppDevDesignViewerTextAlign.*` 中英文词典
  - `SystemManagement` 相关注释中的中文引号文本改为英文，模块命中清零
  - 治理总量从 `2494` 下降至 `2447`（-47）
- 风险/阻塞：
  - `Antv-X6` 仍有高密度存量（`126`），主要分布在 `workflowProxyV3`、`nodeDefaultConfigFactory` 与相关测试文件
- 下一步：继续按 Top 模块推进 `Antv-X6` 批量替换（先服务层日志与错误文案，再测试与默认节点文本）

### 里程碑：Top 模块第六十五批实改（Antv-X6 清零）

- 时间：2026-03-31 18:23
- 任务：清理 `Antv-X6` 模块硬编码中文命中，覆盖代理服务、测试与核心工具层
- 执行命令：
  - `pnpm prettier --write src/pages/Antv-X6/v3/services/__tests__/workflowProxyV3.test.ts src/pages/Antv-X6/v3/services/workflowProxyV3.ts src/pages/Antv-X6/v3/utils/graphV3.ts src/pages/Antv-X6/v3/utils/nodeDefaultConfigFactory.ts src/pages/Antv-X6/v3/utils/offlineNodeFactory.ts src/pages/Antv-X6/v3/utils/variableReferenceV3.ts src/pages/Antv-X6/v3/utils/workflowV3.tsx docs/ch/i18n/saas-20260410-progress.md docs/ch/i18n/saas-20260410-test-report.md docs/ch/i18n/saas-20260410-decision-log.md`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改上述文件
- 结果摘要：
  - `workflowProxyV3.ts` 的错误消息与调试日志统一英文（含边/节点不存在、未初始化、特殊端口连线日志）
  - `workflowProxyV3.test.ts` 的测试节点名、断言关键词、describe 标题统一英文，保持行为断言不变
  - `graphV3.ts` 连线校验提示统一英文；`variableReferenceV3.ts` 变量描述与注释中的中文引号文本清理
  - `nodeDefaultConfigFactory.ts` 默认节点名称与默认输出描述统一英文；`offlineNodeFactory.ts`、`workflowV3.tsx` 剩余命中清理
  - `Antv-X6` 模块命中从 `126` 下降至 `0`
  - 治理总量从 `2447` 下降至 `2321`（-126）
- 风险/阻塞：
  - `hooks`、`services`、`components/business-component` 仍是存量高位模块
- 下一步：继续按 inventory Top 模块推进 `src/hooks` 与 `src/services` 批量改造

### 里程碑：Top 模块第六十六批实改（Hooks AppDev 批量清理）

- 时间：2026-03-31 18:30
- 任务：清理 `src/hooks` 中 AppDev 相关高频 hooks 的中文引号文本（文件管理、模型选择、项目信息、服务控制、版本对比、自动错误处理等）
- 执行命令：
  - `pnpm prettier --write src/hooks/useAppDevFileManagement.ts src/hooks/useAppDevModelSelector.ts src/hooks/useAppDevProjectId.ts src/hooks/useAppDevProjectInfo.ts src/hooks/useAppDevServer.ts src/hooks/useAppDevVersionCompare.ts src/hooks/useAutoErrorHandling.ts src/hooks/useCopyTemplate.tsx docs/ch/i18n/saas-20260410-progress.md docs/ch/i18n/saas-20260410-test-report.md docs/ch/i18n/saas-20260410-decision-log.md`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改上述文件
- 结果摘要：
  - `useAppDevFileManagement` 上传/保存/重命名/加载等提示与错误文本统一英文
  - `useAppDevModelSelector` 模型缺失提示与加载异常提示统一英文
  - `useAppDevProjectInfo` 权限错误与操作类型标签统一英文
  - `useAppDevServer` 启动/重启/保活失败文案统一英文
  - `useAppDevVersionCompare` 版本对比与切换相关提示统一英文
  - `useAutoErrorHandling` 确认弹窗与自动处理日志统一英文
  - 治理总量从 `2321` 下降至 `2263`（-58）
  - `src/hooks` 模块从 `167` 下降至 `109`
- 风险/阻塞：
  - hooks 模块仍有 `109` 存量，集中在导航/空闲检测/事件代理等通用 hooks
- 下一步：继续推进 `src/services`（110）与剩余 `src/hooks`（109）

### 里程碑：Top 模块第六十七批实改（Services 批量清理）

- 时间：2026-03-31 18:37
- 任务：清理 `src/services` 中非生态市场模块的中文引号文本（主题服务、租户服务、AppDev 服务、用户服务、VNC 服务等）
- 执行命令：
  - `pnpm prettier --write src/services/unifiedThemeService.ts src/services/tenant.ts src/services/appDev.ts src/services/userService.ts src/services/vncDesktop.ts src/services/common.ts src/services/dataTable.ts src/services/skill.ts docs/ch/i18n/saas-20260410-progress.md docs/ch/i18n/saas-20260410-test-report.md docs/ch/i18n/saas-20260410-decision-log.md`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改上述文件
- 结果摘要：
  - `unifiedThemeService` 加载/保存/事件/监听器相关日志与来源文案统一英文
  - `tenant` 默认导航风格名称/描述、租户示例名称与日志统一英文
  - `appDev` 会话接口调试日志注释统一英文
  - `userService`、`vncDesktop`、`common`、`dataTable`、`skill` 剩余中文引号文本清理
  - 治理总量从 `2263` 下降至 `2235`（-28）
  - `src/services` 模块从 `110` 下降至 `82`
- 风险/阻塞：
  - `src/services` 当前剩余主要集中在 `src/services/ecosystem.ts`（82）
- 下一步：继续推进 `src/services/ecosystem.ts` 与 `src/hooks` 余量

### 里程碑：Top 模块第六十八批实改（services.ecosystem 清零）

- 时间：2026-03-31 18:57
- 任务：清理 `src/services/ecosystem.ts` 全量中文引号文本（参数校验、错误日志、示例默认值与注释中的字符串字面量）
- 执行命令：
  - `pnpm prettier --write src/services/ecosystem.ts docs/ch/i18n/saas-20260410-progress.md docs/ch/i18n/saas-20260410-test-report.md docs/ch/i18n/saas-20260410-decision-log.md`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `node` 替换脚本与 `apply_patch` 修改 `src/services/ecosystem.ts`
- 结果摘要：
  - `ecosystem.ts` 的列表/详情/删除/上下线/撤销/草稿/发布/更新启用等流程提示文本统一英文
  - mock 示例字段（如插件名、作者、说明文档）与 console 输出统一英文
  - 处理替换后遗留混合字符串（如 `Config UID`、`update and enable`）并二次校正
  - `src/services` 模块从 `82` 下降至 `0`（模块退出 inventory）
  - 治理总量从 `2235` 下降至 `2153`（-82）
- 风险/阻塞：
  - 当前最高残量在 `src/components/business-component`（144）与 `src/hooks`（109）
- 下一步：继续推进 `src/components/business-component` 批量治理

### 里程碑：Top 模块第六十九批实改（AppDevEmptyState key 化）

- 时间：2026-03-31 19:10
- 任务：清理 `src/components/business-component/AppDevEmptyState/index.tsx` 的硬编码中文文案，统一切换到 `t(...)` 并补齐本地中英文默认词典
- 执行命令：
  - `pnpm prettier --write src/components/business-component/AppDevEmptyState/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改上述文件
- 结果摘要：
  - `AppDevEmptyState` 默认标题、描述、按钮文本与弹窗关闭按钮全部改为 `t('PC.Components.AppDevEmptyState.*')`
  - 新增 `AppDevEmptyState` 组件域双语 key，作为本地默认词典与平台导入基础
  - `src/components/business-component` 模块命中从 `144` 下降至 `110`
  - 治理总量从 `2153` 下降至 `2119`（-34）
- 风险/阻塞：
  - `business-component` 仍有高残量，集中在 `VncPreview`、`FilePreview`、`HistoryConversationList`、`PagePreviewIframe`
- 下一步：继续按 inventory Top 文件推进上述组件的批量接入

### 里程碑：Top 模块第七十批实改（History + Preview 组件接入）

- 时间：2026-03-31 19:19
- 任务：清理 `HistoryConversationList` 与 `PagePreviewIframe` 的硬编码中文文案并接入 `t(...)`，同步补齐本地默认词典
- 执行命令：
  - `pnpm prettier --write src/components/business-component/HistoryConversationList/index.tsx src/components/business-component/HistoryConversationList/ConversationList/index.tsx src/components/business-component/PagePreviewIframe/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改上述文件
- 结果摘要：
  - `HistoryConversationList` 的搜索、重命名、删除确认、提示消息、日期格式、摘要/智能体兜底文案全部切到 `PC.Components.HistoryConversationList.*`
  - `PagePreviewIframe` 的复制模板、标题兜底、工具栏 tooltip、结果上报兜底文案切到 `PC.Components.PagePreviewIframe.*`
  - `PagePreviewIframe` 的中文日志字符串与注释中的中文字符串改为英文，避免治理噪声
  - `src/components/business-component` 模块命中从 `110` 下降至 `82`
  - 治理总量从 `2119` 下降至 `2091`（-28）
- 风险/阻塞：
  - `business-component` 剩余存量主要集中于 `VncPreview`、`FilePreview`、`ConversationDetails` 与 `ThemeConfig` 相关文件
- 下一步：继续按 Top 清单推进 `VncPreview`（含 `IdleWarningModal` / `useUrlRetry`）批量治理

### 里程碑：Top 模块第七十一批实改（VncPreview 组批量治理）

- 时间：2026-03-31 19:31
- 任务：清理 `VncPreview` 组件组（`index.tsx`、`components/IdleWarningModal`、`useUrlRetry.ts`）硬编码中文并完成 `t(...)` 接入
- 执行命令：
  - `pnpm prettier --write src/components/business-component/VncPreview/index.tsx src/components/business-component/VncPreview/components/IdleWarningModal/index.tsx src/components/business-component/VncPreview/useUrlRetry.ts src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改上述文件
- 结果摘要：
  - `VncPreview` 的连接状态、错误提示、空闲超时提示、按钮/Tag 文案统一迁移至 `PC.Components.VncPreview.*`
  - `IdleWarningModal` 默认标题、描述、确认按钮、倒计时和提示文案统一迁移至 `PC.Components.VncIdleWarningModal.*`
  - `useUrlRetry` 与 `VncPreview` 空闲检测日志字符串改为英文，清除治理噪声
  - `src/components/business-component` 模块命中从 `82` 下降至 `36`
  - 治理总量从 `2091` 下降至 `2045`（-46）
- 风险/阻塞：
  - `business-component` 当前剩余主要集中于 `FilePreview`、`ConversationDetails`、`ThemeConfig`
- 下一步：继续推进 `FilePreview` 与 `ConversationDetails` 的批量治理

### 里程碑：Top 模块第七十二批实改（FilePreview 全量 key 化）

- 时间：2026-03-31 19:39
- 任务：清理 `src/components/business-component/FilePreview/index.tsx` 的硬编码中文并接入 `t(...)`，补齐双语默认词典
- 执行命令：
  - `pnpm prettier --write src/components/business-component/FilePreview/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改上述文件
- 结果摘要：
  - 文件预览错误映射函数 `getLocalizedErrorMessage` 全面改为 key 输出，覆盖 doc/xls/ppt/pdf/image 与通用异常
  - 工具栏 tooltip、空态/加载态/错误态/不支持态文案全部改为 `PC.Components.FilePreview.*`
  - `src/components/business-component` 模块命中从 `36` 下降至 `19`
  - 治理总量从 `2045` 下降至 `2028`（-17）
- 风险/阻塞：
  - `business-component` 剩余问题集中在 `ConversationDetails`、`ThemeConfig`、`CopyToSpaceComponent`
- 下一步：继续推进 `ConversationDetails` 与 `ThemeConfig` 子模块

### 里程碑：Top 模块第七十三批实改（business-component 清零）

- 时间：2026-03-31 19:50
- 任务：完成 `business-component` 残余模块清理，覆盖 `ConversationDetails`、`ThemeConfig`（Navigation/Background/ThemeColor）与 `CopyToSpaceComponent`
- 执行命令：
  - `pnpm prettier --write src/components/business-component/ConversationDetails/index.tsx src/components/business-component/ThemeConfig/NavigationStylePanel.tsx src/components/business-component/ThemeConfig/BackgroundImagePanel.tsx src/components/business-component/ThemeConfig/ThemeColorPanel.tsx src/components/business-component/CopyToSpaceComponent/index.tsx src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改上述文件
- 结果摘要：
  - `ConversationDetails` 的页面预览名、必填参数提示、标题和 tooltip、无权限遮罩、复制模板按钮全部接入 `t(...)`
  - `ThemeConfig` 三个面板文案（风格、深浅色、背景图、主题色）及日志文本完成 key 化/英文化
  - `CopyToSpaceComponent` 复制成功提示统一迁移至 `PC.Components.CopyToSpaceComponent.*`
  - `src/components/business-component` 模块命中从 `19` 下降至 `0`（模块退出 inventory）
  - 治理总量从 `2028` 下降至 `2009`（-19）
  - 报告模块数从 `97` 下降至 `96`
- 风险/阻塞：
  - Top 残量已转移至 `src/hooks`（109）与 `src/components/FileTreeView`（97）
- 下一步：继续按 inventory Top 模块推进 `src/hooks` 与 `src/components/FileTreeView`

### 里程碑：Top 模块第七十四批实改（hooks 单文件清理）

- 时间：2026-03-31 19:58
- 任务：清理 `src/hooks/useDataResourceManagement.ts` 的硬编码中文，统一迁移到 `t(...)` 并补齐双语默认词典
- 执行命令：
  - `pnpm prettier --write src/hooks/useDataResourceManagement.ts src/locales/i18n/nuwaxpc-zh-cn.ts src/locales/i18n/nuwaxpc-en-us.ts`
  - `pnpm run check:i18n-hardcoded`
  - `pnpm run report:i18n-governance`
  - 通过 `apply_patch` 修改上述文件
- 结果摘要：
  - `useDataResourceManagement` 的列表加载、创建/更新/删除、状态切换、连接测试提示与返回 message 全部切到 `PC.Components.DataResourceManagement.*`
  - 该文件中文日志文本统一英文化，避免治理噪声
  - `src/hooks` 模块命中从 `109` 下降至 `80`
  - 治理总量从 `2009` 下降至 `1980`（-29）
- 风险/阻塞：
  - `src/hooks` 仍是 Top 模块，剩余主要集中在 `useIdleDetection`、`useMessageEventDelegate`、`useNavigationGuard`
- 下一步：继续批量推进上述 hooks 文件

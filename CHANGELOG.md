# 更新日志

## [1.1.0] - 2026-03-06

### ✨ 新功能

- 广场（Square）：增强滚动加载与自动填充逻辑，支持更多内容流畅加载。
- 空间板块（SpaceSection）：增强滚动加载与自动填充逻辑，优化长列表浏览体验。
- 生态 MCP（EcosystemMcp）：增强滚动加载与自动填充逻辑，提升生态市场内容加载能力。
- 知识库原始片段（RawSegmentInfo）：增强自动加载与编辑功能，便于文档片段管理。
- 更多操作菜单（MoreActionsMenu）：新增重启功能图标并更新相关常量，便于开发环境快捷操作。

### 🐛 Bug 修复

- 空间知识库（SpaceKnowledge）：修复页码更新逻辑并优化文档加载体验。
- 知识库原始片段（RawSegmentInfo）：修复页码更新逻辑以正确加载数据。
- 数据权限弹窗（DataPermissionModal）：修复页码更新逻辑以提升数据加载体验。
- 空间板块（SpaceSection）：修复滚动加载逻辑以正确更新页码。
- 生态 MCP（EcosystemMcp）：修复滚动加载逻辑以正确更新页码。

### ♻️ 重构

- 广场（Square）：优化滚动加载逻辑，提升代码可维护性。
- 菜单列表项、页面预览 iframe、菜单布局（MenuListItem, PagePreviewIframe, MenusLayout）：优化组件逻辑与样式。
- 布局与动态菜单（Layout, DynamicMenusLayout）：移除已注释的动态菜单相关代码以简化布局。
- 动态菜单、空间板块、空间开发、应用项（DynamicMenusLayout, SpaceSection, SpaceDevelop, ApplicationItem）：注释掉开发收藏相关逻辑以简化代码。

### 🎨 样式优化

- 空间开发（SpaceDevelop）：更新主容器样式以优化响应式布局。

## [1.0.8] - 2026-02-02

### ✨ 新功能

- feat(Chat, PreviewAndDebug): add setIsMoreMessage to manage message loading state
- feat(CreateModel): 新增或编辑模型时，新增最大上下文长度字段
- feat(historyConversation): 添加历史会话页面关闭按钮

### 🐛 Bug 修复

- 修复 SSE 连接关闭逻辑，确保连接关闭时正确标记中止状态
- 修复会话停止逻辑，确保 requestId 为空时也能停止会话
- 修复清空会话后对话设置未重置问题
- 修复页面切换时 SSE 连接未中断问题
- 修复代码规范问题（ESLint）

### ♻️ 重构

- 恢复 v1.0.8-alpha 代码版本
- 移除 ChatArea 组件中冗余的 handleAddToChat 函数，简化代码结构
- 重构 SSE 连接逻辑，分离工作流与会话的 SSE 连接

### 🎨 样式优化

- style(EditAgent): Comment out mask property in PreviewAndDebug for improved visibility in WeChat
- style: update AgentModelSetting layout and logic
- style: update SystemTipsWord layout
- 将"远程桌面"统一更名为"智能体电脑"

### 🔧 构建/工具

- 更新 .gitignore 文件，添加 .agent 以排除相关文件
- 清理测试文件和示例文件

### 📚 文档

- 更新项目文档

## [1.0.7] - 2026-01-14

### ✨ 新功能

- 新增远程桌面分享功能，支持生成分享链接和设置过期时间
- 新增文件树面板展开/折叠和固定功能，提升用户交互体验
- 新增 VNC 远程桌面预览连接状态显示和自动重连机制
- 新增空闲检测功能和警告弹窗，支持用户长时间无操作时自动断开连接
- 新增加载更多历史消息功能，支持会话消息分页查询
- 新增任务智能体模式切换功能
- 新增文件操作提示框（上传、下载、导出、导入），增强用户反馈
- 新增文件预览支持更多格式（SVG、JSON、Office 文档等）
- 新增子智能体配置功能（SubAgentConfig）
- 新增技能变量支持和工具分类功能
- 新增会话状态更新事件监听，任务状态变化时 UI 及时更新
- 新增未保存更改检查功能，防止用户在未保存的情况下进行重要操作

### 🐛 Bug 修复

- 修复 SSE 连接关闭逻辑，确保连接关闭时正确标记中止状态
- 修复会话停止逻辑，确保 requestId 为空时也能停止会话
- 修复清空会话后对话设置未重置问题
- 修复页面切换时 SSE 连接未中断问题
- 修复导出文件名解码问题，支持特殊字符
- 修复文件预览组件类型切换时的闪动问题
- 修复会话结束后文件树刷新逻辑
- 修复任务记录跳转使用错误的空间 ID
- 修复空消息渲染问题，过滤掉空消息
- 修复 Select 组件选项匹配不上时的显示问题

### ♻️ 重构

- 重构 AppDev 文件树面板和聊天区域组件结构
- 重构 FileTreeView 组件，优化文件选择逻辑和视图模式切换
- 重构 SSE 连接逻辑，分离工作流与会话的 SSE 连接
- 重构 VncPreview 组件，优化连接检查和重试机制
- 优化工作流 v3 版本的表单值合并逻辑和节点数据获取逻辑
- 优化最近使用和会话记录查询逻辑
- 统一提示信息中的称谓为"你"以提升用户亲和力

### 🎨 样式优化

- 新增滚动条自动隐藏样式，仅在悬停时显示
- 优化文件树顶部样式和搜索视图高度
- 优化聊天页面布局，支持动态调整左侧宽度
- 优化空状态组件图标和加载动画样式
- 将"远程桌面"统一更名为"智能体电脑"

### 📚 文档

- 新增 TiptapVariableInput 组件文档
- 新增变量引用规则文档
- 新增试运行逻辑分析文档

## [1.0.6] - 2026-01-05

### ✨ 新功能

- 新增 VNC 远程桌面预览功能，长任务智能体支持远程桌面操作
- 重构工作流 v3 版本，新增变量聚合节点（VariableAggregation）组件
- 新增是否支持 Design 设计模式配置开关
- 增强日志处理逻辑，支持检测最新日志块中的错误
- 为文件树视图添加加载遮罩层，优化加载状态指示
- 添加自定义滚动条样式，仅在悬停时显示滚动条

### 🐛 Bug 修复

- 修复智能体编排页同步开场白内容及预置问题列表逻辑
- 修复插件参数对 Object 和 Array 类型子级删除逻辑
- 修复 Design 模式下内容编辑删除 bug
- 修复 VariableAggregation 目录命名规范（统一大写 V）
- 修复 nodeItem 组件导入路径问题
- 修复页面预览 iframe 不必要的页面重载问题

### ♻️ 重构

- 移除不必要的 onConfirmUpdateEventQuestions 属性
- 优化 nodeItem 样式，简化输入框样式设置
- 增强 DesignViewer 组件的内容更新和聊天功能
- 统一跳转 URL 子包处理逻辑

### 📚 文档

- 添加 DesignViewer 设计模式开发指南
- 添加查找替换规则文档
- 更新开发指南，添加 Vite 插件预注入说明和常见问题

## [1.0.5] - 2025-12-08

### ✨ 新功能

- 新增 DesignViewer 设计模式组件，支持 Tailwind CSS 样式编辑和实时预览
- 增强 TiptapVariableInput：支持变量输入、Markdown 语法、可编辑变量节点、自定义标签保护
- 添加项目导出、聊天任务取消、变量建议外部关闭、多行智能样式替换

### 🐛 Bug 修复

- 修复文件上传/导入加载状态管理、useAppDevServer 支持 devServerUrl 为 null
- 修复 PagePreviewIframe 文档处理、智能体引导问题、聊天滚动检测逻辑
- 修复设计模式状态管理，迁移到 appDevDesign 模型

### ♻️ 重构

- 重构 TiptapVariableInput 实现自包含变量树，移除 VariableInferenceInput
- 统一变量转换方法到工具库，提取滚动检测到独立 Hook
- 优化 DesignViewer 模块化，升级 TiptapVariableInput 到 React 18 API
- 清理调试日志和未使用代码

### ⚡️ 性能优化

- 优化 TiptapVariableInput 光标位置和滚动保持，使用 useCallback 优化 EditAgent

## [1.0.3] - 2025-11-24

### ✨ 新功能

- 同步老仓库最新代码，添加微信小程序支持、封面图片上传、MCP 智能体支持
- 新增 TiptapVariableInput 组件，支持 @ 提及和变量自动补全
- 添加项目 ID 支持、版本更新检查、回到首页悬浮图标
- 重构 useAppDevServer 和 useDevLogs 钩子，使用 umi 的 useRequest 进行轮询

### 🐛 Bug 修复

- 修复封面图片源类型导入、图片加载错误处理、AttachFile 组件 mimeType 容错
- 修复 useAppDevServer keepAlive 多项目并发问题
- 修复 PagePreviewIframe 页面刷新逻辑、小程序跳转路径、AppDev 取消任务错误

### ♻️ 重构

- 使用枚举替代字符串常量，优化微信小程序消息发送逻辑
- 优化 TiptapVariableInput 和 ExpandTextArea 组件
- 清理 AppDev 调试日志（移除 80+ 条）

### 🧪 测试

- 新增 TiptapVariableInputTest 测试页面

## [1.0.2] - 2025-11-17

### 🔧 构建/工具

- 添加 esbuild 依赖并在配置中实现 dev-monitor.js 的复制与压缩功能
- 更新 dev-monitor.js 版本号至 1.0.2、1.0.3、1.0.4

### ✨ 新功能

- 同步老仓库最新代码
- 添加微信小程序支持功能，注入 JS-SDK 并监听 DOM 变化以发送消息
- 添加封面图片上传功能，更新相关样式和逻辑，增强页面编辑和创建功能
- 更新预览组件逻辑，添加封面图片源类型判断，优化截图处理
- 更新 PageCard 组件，替换 icon 属性为 coverImg，优化样式过渡效果，移除不再使用的 PageDevelopCardItem 组件
- MCP 添加智能体支持，更新相关组件和常量，优化图标处理逻辑
- 添加创建智能体功能，更新 Created 组件和服务接口以支持智能体类型
- 添加 streamableHttp 类型支持，更新样式以增强组件可视化效果
- 添加项目 ID 支持以区分不同项目的最近使用记录，在 ChatArea、ChatInputHome 和 MentionSelector 组件中引入 projectId 属性

### 🐛 Bug 修复

- 修复封面图片源类型导入路径，确保正确引用
- 添加图片加载错误处理逻辑，确保组件在图片加载失败时使用默认图片
- 修复 useAppDevServer 中 keepAlive 可能同时运行多个不同 projectId 的问题，引入 useParams 从 URL 获取最新的 projectId，确保同一时间只有当前 URL projectId 的 keepAlive 在运行
- 优化封面图片来源设置逻辑，确保用户未上传图片时不设置来源
- 更新 Created 组件的 checkTag 属性，从 Plugin 修改为 Workflow，以确保正确的组件类型匹配
- 修复 AttachFile 组件中对 mimeType 的容错处理，确保在后端返回空值时不导致错误
- 延迟发送微信小程序消息，确保 DOM 变化监听稳定性
- 添加错误发送防抖逻辑，优化错误消息发送至父窗口的稳定性
- 更新 Created 组件中的 agentItem 标签，将 label 从 '当前空间智能体' 修改为 '全部'，新增 '当前空间智能体' 选项

### ⚡️ 性能优化

- 优化微信小程序消息发送逻辑，简化代码结构并增强 DOM 变化监听功能

### ♻️ 重构

- 使用枚举替代字符串常量，增强代码可读性和可维护性，添加错误处理逻辑
- 移除同步登录状态功能的实现，简化代码结构
- 将最近使用的文件和数据源存储从 localStorage 更改为 sessionStorage，提高数据的即时性
- 注释掉 setupMutationObserver 函数以简化错误监控逻辑，保留相关逻辑以便未来可能的恢复
- 注释掉资源加载错误处理逻辑，简化错误监控代码
- 重构 useAppDevServer 和 useDevLogs 钩子以使用 umi 的 useRequest 进行轮询，简化定时器管理，优化状态管理，提升代码可读性和维护性

## [1.0.1] - 2025-11-10

### 📝 文档

- 更新 README 文档内容和结构
- 更新 nuwax-cli 版本信息

### 🔧 构建/工具

- 新增项目开发规则文档
- 优化构建配置和依赖管理
- 更新依赖版本（prompt-kit-editor、simple-edit-markdown、ds-markdown 等）
- 优化 Husky 和 Git 钩子配置
- 清理未使用的文件和依赖

### ✨ 新功能

- 为 MCP 管理添加官方服务与自定义服务分类
- 为生态市场添加 MCP 模块和分类筛选功能
- 为智能体添加设置展开扩展页面区域与隐藏聊天区域切换
- 为页面开发中的聊天会话框新增复制粘贴图片功能
- 为输入框添加复制粘贴功能
- 为预置引导问题添加图标和字数限制
- 为创建分享添加组件弹窗优化样式以及添加 loading 和空状态
- 临时会话手机端添加 clear 刷子功能
- 优化 AppDev 页面逻辑和 UI 状态处理

### 🐛 Bug 修复

- 修复 MCP 搜索以及滚动加载问题
- 修复会话框向下滑动时无法鼠标滚动的问题
- 修复事件绑定与预置问题设置必填参数校验
- 优化会话主题闪现问题
- 移除调试日志输出

### ⚡️ 性能优化

- 优化代码逻辑和组件性能
- 优化 loading 效果
- 优化 iframe 内部导出添加新的 sandbox 值
- 为智能体组件设置卡片添加 placeholder
- 优化会话处理卡片和智能体编排交互

### ♻️ 重构

- 重构 AppDev 页面开发日志查看器，从悬浮式改为内嵌式
- 重构页面开发聊天框关于数据源切换
- 重构页面开发输入框组件
- 重构广场组件和生态市场模板逻辑
- 重构智能体开发卡片和数据表

## [1.0.0] - 2025-11-01

### ✨ 新功能

- 智能体平台前端项目初始版本发布
- 基于 React 18 + UmiJS Max + Ant Design 的智能体平台前端项目
- 提供智能体开发、管理和使用的完整解决方案
- 集成先进的 AI Agent 系统，支持文件管理、代码编辑、实时预览和 AI 助手聊天功能
- AppDev Web IDE：集成开发环境，支持文件管理、代码编辑和实时预览
- AI 助手聊天：基于新的 OpenAPI 规范的实时 AI 对话功能，支持流式响应和工具调用
- 工作空间管理：项目文件树管理、文件上传和版本控制
- 知识库管理：智能体知识库的创建和维护
- 组件库管理：可复用组件的管理和发布
- MCP 服务管理：Model Context Protocol 服务集成
- 生态系统管理：插件、模板和服务的生态系统
- 动态主题背景切换：支持 8 种预设背景图片，实时切换，状态持久化

### 🎨 技术栈

- **前端框架**: React 18 + TypeScript 5.0
- **UI 组件库**: Ant Design 5.4 + ProComponents
- **代码编辑器**: Monaco Editor 0.53.0
- **图形引擎**: AntV X6 2.18.1
- **框架工具**: UmiJS Max 4.x
- **状态管理**: UmiJS 内置 model
- **样式方案**: CSS Modules + Less
- **包管理**: pnpm 10.17.1
- **SSE 通信**: @microsoft/fetch-event-source 2.0.1

[1.0.0]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.0
[1.0.1]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.1
[1.0.2]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.2
[1.0.3]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.3
[1.0.5]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.5
[1.0.6]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.6
[1.0.7]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.7
[1.0.8]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.8
[1.1.0]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.1.0

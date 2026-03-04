# 更新日志

本项目的所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

## [1.0.8] - 2026-01-21

### ✨ 新功能

- 全局状态管理重构：实现了 `getInitialState`，统一了应用初始化逻辑，支持用户信息和菜单权限的预加载
- 权限管理升级：在 `access.ts` 中集成了基于后端数据的动态权限控制，支持细粒度的功能权限检查
- 菜单逻辑更新：对接了 `/api/system/user/list-menu/{userId}` 接口，支持基于用户的动态菜单加载
- 类型定义更新：新增 `SysMenuDto` 接口以匹配后端最新的菜单数据结构

### ♻️ 重构

- 优化 `menuModel`：优先从全局状态读取菜单和权限数据，避免重复 API 请求，提升应用性能
- 代码解耦：提取权限提取逻辑（`extractAllPermissions`、`extractAllMenuCodes`）到 `src/utils/permission.ts`，实现逻辑复用
- 移除 Mock 数据：清理了 `menuService` 中的 Mock 数据逻辑，完全切换到真实接口

## [1.0.7]

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

## [1.0.6]

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

## [1.0.5]

### ✨ 新功能

- 新增 DesignViewer 设计模式组件，支持 Tailwind CSS 样式编辑和实时预览
- 增强 TiptapVariableInput：支持变量输入、Markdown 语法、可编辑变量节点、自定义标签保护
- 添加项目导出、聊天任务取消、变量建议外部关闭、多行智能样式替换

### 🐛 Bug 修复

- 修复文件上传/导入加载状态管理、useAppDevServer 支持 devServerTimeout、PagePreviewIframe 样式与挂载逻辑
- 修复 VariableAggregation 变量渲染、Design 模式渲染、会话列表排序 bug

### ♻️ 重构

- 优化 AppHeader 导航项权限过滤、CollapseMenu 控制逻辑
- 重构 AppChat 消息列表、InputToolbar 布局、ResizeableContainer 同步机制

### ⚡ 性能优化

- 减少 TiptapVariableInput 和 DesignViewer 的不必要渲染，提升长列表滚动性能

## [1.0.3]

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
[1.0.4]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.4
[1.0.5]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.5
[1.0.6]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.6
[1.0.7]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.7
[1.0.8]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.8

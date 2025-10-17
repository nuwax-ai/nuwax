# ChatArea 组件更新日志

## v1.6.4 - 2025-01-17

### 样式优化：AppDev Markdown 字号和行高调整

- ✅ **字号和行高优化**
- ✅ 调整字体大小，从过小的字号调整为更合适的尺寸
- ✅ 增加行高，提升阅读体验
- ✅ 保持紧凑布局的同时确保可读性

### 技术改进

- 🔧 段落字体从 13px 调整到 14px，行高从 1.4 调整到 1.5
- 🔧 标题字体大小整体提升：H1(20px), H2(18px), H3(16px), H4(15px), H5(14px), H6(13px)
- 🔧 标题行高统一调整到 1.4，提升视觉层次
- 🔧 列表项字体从 13px 调整到 14px，行高调整到 1.5
- 🔧 代码块字体从 11px 调整到 12px，行高调整到 1.4
- 🔧 内联代码字体从 11px 调整到 12px，增加内边距
- 🔧 表格字体从 12px 调整到 13px，增加单元格内边距
- 🔧 引用块字体从 12px 调整到 13px，行高调整到 1.5

### 样式细节

- 📝 **段落文本**: 14px，行高 1.5，间距 0.6em
- 📝 **标题层级**: H1-H6 递增字体大小，行高 1.4
- 📝 **列表项**: 14px，行高 1.5，间距 0.3em
- 📝 **代码块**: 12px，行高 1.4，内边距 0.8em
- 📝 **内联代码**: 12px，内边距 0.15em 0.4em，圆角 3px
- 📝 **表格**: 13px，行高 1.4，单元格内边距 0.4em 0.6em
- 📝 **引用**: 13px，行高 1.5，内边距 0.4em 0.8em

### 用户体验提升

- 📊 **可读性**: 更大的字体和合适的行高，提升阅读舒适度
- 📊 **视觉层次**: 清晰的标题层级，便于快速浏览
- 📊 **代码阅读**: 代码块和内联代码的字体大小更适合阅读
- 📊 **平衡性**: 在紧凑布局和可读性之间找到最佳平衡

## v1.6.3 - 2025-01-17

### 样式优化：AppDev Markdown 渲染紧凑化

- ✅ **AppDev 专用 Markdown 样式优化**
- ✅ 创建 `AppDevMarkdownCMD` 专用样式文件，仅影响 AppDev 页面
- ✅ 调整字体大小和间距，使 Markdown 渲染更紧凑
- ✅ 保持其他页面的 Markdown 渲染样式不变

### 技术改进

- 🔧 新增 `AppDevMarkdownCMD/index.less` 样式文件
- 🔧 调整段落字体从默认大小到 13px
- 🔧 优化标题层级字体大小（H1: 18px, H2: 16px, H3: 15px 等）
- 🔧 减少段落间距和列表间距
- 🔧 优化代码块和引用块的字体大小和间距
- 🔧 调整表格字体大小到 12px

### 样式细节

- 📝 **段落文本**: 13px，行高 1.4，间距 0.5em
- 📝 **标题层级**: H1-H6 递减字体大小，紧凑间距
- 📝 **列表项**: 13px，间距 0.2em
- 📝 **代码块**: 11px，紧凑内边距
- 📝 **内联代码**: 11px，浅灰背景
- 📝 **表格**: 12px，紧凑单元格间距
- 📝 **引用**: 12px，紧凑内边距

### 用户体验提升

- 📊 **空间利用**: 更紧凑的布局，显示更多内容
- 📊 **阅读体验**: 保持可读性的同时减少视觉噪音
- 📊 **页面一致性**: 仅影响 AppDev 页面，其他页面保持原样

## v1.6.2 - 2025-01-17

### 内容显示优化：Tool Call 无内容时的信息展示

- ✅ **解决 Tool Call Update 无内容显示问题**
- ✅ 当 `tool_call_update` 没有 `content` 时，现在会显示基本信息
- ✅ 显示状态、时间戳和类型信息，提供有用的上下文
- ✅ 保持与有内容时相同的展开/收起交互体验

### 技术改进

- 🔧 修改展开条件从 `isExpanded && content` 改为 `isExpanded`
- 🔧 新增 `noContent` 样式，专门处理无内容时的信息展示
- 🔧 添加状态信息、时间信息和类型信息的结构化显示
- 🔧 为 `tool_call_update` 类型添加特殊的标识显示

### 用户体验提升

- 📊 **信息完整性**：即使没有具体内容，用户也能看到工具调用的基本状态
- 📊 **一致性**：所有 Tool Call 组件都有展开/收起功能，无论是否有内容
- 📊 **可读性**：通过结构化的信息展示，用户可以快速了解工具调用的状态

## v1.6.1 - 2025-01-17

### 用户体验优化：Tool Call Update 展开收起功能

- ✅ **统一 Tool Call 交互体验**
- ✅ `tool_call_update` 组件现在也支持展开/收起功能
- ✅ 与 `tool_call` 组件保持一致的交互体验
- ✅ 简化了展开按钮的显示逻辑，无论是否有内容都显示展开按钮

### 技术改进

- 🔧 移除了 `content` 条件判断，所有 Tool Call 组件都显示展开/收起按钮
- 🔧 保持了组件的简洁性和一致性
- 🔧 提升了用户操作的便利性

## v1.6.0 - 2025-01-17

### 重大架构简化：独立 Tool Call 渲染

- 🔄 **简化 Tool Call 渲染架构**
- 🔄 将 `tool_call` 和 `tool_call_update` 改为独立渲染，不再使用关联更新逻辑
- 🔄 通过 `type` 字段区分两种不同的工具调用类型
- 🔄 简化数据流，每个工具调用都有独立的生命周期

### 技术改进

- 🔧 新增 `insertToolCallUpdateBlock` 函数，支持独立的 tool_call_update 渲染
- 🔧 移除 `updateToolCallBlock` 函数，不再需要复杂的更新逻辑
- 🔧 `ToolCallProcess` 组件新增 `type` 字段支持
- 🔧 `genAppDevPlugin.tsx` 支持解析 `type` 属性
- 🔧 SSE 处理逻辑简化，直接插入新的组件而不是更新现有组件

### 组件优化

- ✅ `tool_call` 类型：显示原始工具调用信息
- ✅ `tool_call_update` 类型：显示 `[更新]` 前缀，表示这是更新结果
- ✅ 保持相同的数据结构和样式，仅通过 `type` 字段区分
- ✅ 简化了组件状态管理，每个工具调用独立渲染

### 性能提升

- ⚡ 减少了复杂的正则表达式匹配和更新逻辑
- ⚡ 简化了 SSE 消息处理流程
- ⚡ 提高了组件的可维护性和可读性
- ⚡ 降低了出错概率，每个组件都有独立的状态

## v1.5.0 - 2025-01-17

### 重大架构升级：MarkdownCMD 流式渲染

- 🚀 **升级到 MarkdownCMD 流式渲染方案**
- 🚀 使用 `ds-markdown` 的 `MarkdownCMD` 组件替代 `DsMarkdown`
- 🚀 实现真正的增量渲染，支持流式内容更新
- 🚀 优化 SSE 消息处理性能，减少重复渲染

### 新增组件

- ✅ 新增 `AppDevMarkdownCMD` 组件：基于 MarkdownCMD 的专用渲染器
- ✅ 新增 `useAppDevMarkdownRender` Hook：处理流式内容更新逻辑
- ✅ 新增 `AppDevMarkdownCMDWrapper` 组件：包装 MarkdownCMD 的流式渲染

### 技术改进

- 🔧 使用 `markdownRef.current?.push()` 方法实现增量内容推送
- 🔧 优化 `requestId` 管理，确保每次新会话都重新初始化
- 🔧 改进内容更新机制，支持 Plan/ToolCall 组件的实时渲染
- 🔧 清理旧的 `AppDevMarkdownRenderer` 组件和相关代码

### 性能优化

- ⚡ 减少 DOM 重新渲染次数
- ⚡ 优化流式文本处理，避免重复解析
- ⚡ 改进内存使用，及时清理组件状态
- ⚡ 提升 SSE 消息处理效率

## v1.4.0 - 2025-01-17

### 重大架构重构

- 🔄 **完全重构 Plan 和 Tool Call 渲染机制**
- 🔄 采用 HTML 标记 + 自定义插件的方式，替代原有的独立消息块方案
- 🔄 数据序列化到 Markdown 文本中的 HTML 属性，简化状态管理
- 🔄 创建 AppDev 专用的 Markdown 渲染器和自定义插件

### 新增功能

- ✅ 支持 Plan 消息在 Markdown 中渲染（支持多个 Plan 并存）
- ✅ 支持 Tool Call 消息在 Markdown 中渲染和实时更新
- ✅ 新增 `PlanProcess` 组件，展示执行计划任务列表
- ✅ 新增 `ToolCallProcess` 组件，展示工具调用详情
- ✅ 支持 Plan 任务的折叠/展开功能
- ✅ 实时显示任务状态（待执行/执行中/已完成/失败）
- ✅ 实时显示工具调用状态和结果

### 技术改进

- 🔧 创建 `markdownProcess.ts` 工具函数，管理 HTML 标记的插入和更新
- 🔧 创建 `genAppDevPlugin.tsx` 自定义插件，解析 HTML 标记为 React 组件
- 🔧 创建 `AppDevMarkdownRenderer` 专用渲染器，集成自定义插件
- 🔧 Plan 消息：每次插入新标记，支持多个实例并存
- 🔧 Tool Call 消息：通过 toolCallId 绑定，支持创建和更新
- 🔧 移除 AppDevChatMessage 中的 planEntries 和 toolCalls 字段
- 🔧 清理旧的 PlanDisplay 和 ToolCallDisplay 组件

### 组件结构

- 📦 新增 `PlanProcess` 组件：在 Markdown 中渲染执行计划
- 📦 新增 `ToolCallProcess` 组件：在 Markdown 中渲染工具调用
- 📦 新增 `AppDevMarkdownRenderer` 组件：集成自定义插件的 Markdown 渲染器
- 📦 新增 `genAppDevPlugin.tsx`：AppDev 专用自定义插件
- 📦 独立的样式文件和响应式设计

### 数据流

- 📊 SSE 消息 → useAppDevChat Hook → 插入/更新 HTML 标记 → AppDevMarkdownRenderer 解析渲染
- 📊 Plan 数据：序列化到 `<appdev-plan>` 标记中
- 📊 Tool Call 数据：序列化到 `<appdev-toolcall>` 标记中，通过 toolCallId 更新
- 📊 完全隔离：AppDev 专用代码不影响其他模块

## v1.3.0 - 2025-01-17

### 新增功能

- ✅ 支持 Plan 消息渲染和展示
- ✅ 支持 Tool Call 消息渲染和展示
- ✅ 支持 Tool Call Update 消息实时更新
- ✅ 新增 PlanDisplay 组件，展示执行计划任务列表
- ✅ 新增 ToolCallDisplay 组件，展示工具调用详情
- ✅ 支持 Plan 任务的折叠/展开功能
- ✅ 实时显示任务状态（待执行/执行中/已完成/失败）
- ✅ 实时显示工具调用状态和结果

### 技术改进

- 🔧 扩展 AppDevChatMessage 类型，添加 planEntries 和 toolCalls 字段
- 🔧 新增 PlanEntry 和 ToolCallInfo 类型定义
- 🔧 新增消息更新工具函数：updateMessagePlanEntries、addMessageToolCall、updateToolCallStatus
- 🔧 更新 SSE 消息处理逻辑，支持 plan、tool_call、tool_call_update 消息类型
- 🔧 通过 toolCallId 绑定和更新 tool_call 消息
- 🔧 优化消息渲染性能，使用 memo 和 useMemo

### 组件结构

- 📦 新增 `PlanDisplay` 组件：展示执行计划
- 📦 新增 `ToolCallDisplay` 组件：展示工具调用
- 📦 集成到 ChatArea 主组件中
- 📦 独立的样式文件和响应式设计

### 数据流

- 📊 SSE 消息 → useAppDevChat Hook → 更新 chatMessages → ChatArea 渲染
- 📊 Plan entries 完整替换更新
- 📊 Tool Call 追加并实时更新状态
- 📊 通过 toolCallId 精确匹配和更新

## v1.2.0 - 2025-01-17

### 新增功能

- ✅ 修复 Agent 回复消息的 loading 状态显示
- ✅ 正确显示正在输出中的流式传输指示器
- ✅ 优化消息状态判断逻辑，区分历史消息和实时消息

### 技术改进

- 🔧 修复 `isStreaming` 状态判断逻辑
- 🔧 只有非历史消息才显示流式传输状态
- 🔧 保持历史消息的静态显示效果
- 🔧 改进用户体验，实时显示 AI 输出状态

## v1.1.0 - 2025-01-17

### 功能更新

- ✅ 集成 cancelAgentTask API 到取消按钮
- ✅ 增强取消功能：同时调用后端 API 和前端取消逻辑
- ✅ 添加项目 ID 参数支持
- ✅ 改进错误处理和用户反馈

### 技术优化

- 🔧 取消按钮现在调用 `/api/custom-page/ai-session-cancel` API
- 🔧 自动获取当前会话 ID 进行任务取消
- 🔧 双重保障：API 调用失败时仍执行前端取消逻辑
- 🔧 完善的错误提示和成功反馈

## v1.0.0 - 2025-10-13

### 初始版本功能

- ✅ 从 AppDev 主页面完全抽离聊天会话区域功能
- ✅ 创建独立的 ChatArea 组件，包含完整的聊天功能
- ✅ 集成 `renderChatMessage` 函数到组件内部
- ✅ 独立的样式文件，包含所有聊天相关样式
- ✅ 组件内部管理消息展开状态

### 功能模块

- 聊天模式切换（Chat/Design）
- 版本选择器
- 聊天消息渲染和显示
- 消息输入和发送
- 加载状态显示
- 取消 AI 任务
- 消息详情展开/折叠
- 工具调用消息显示
- 思考状态显示

### 技术特性

- 🔧 组件完全独立，减少主页面复杂度
- 🔧 TypeScript 类型安全
- 🔧 性能优化的 memo 化
- 🔧 响应式设计支持

### 样式设计

- 🎨 所有聊天相关样式已抽离到组件
- 🎨 保持原有视觉效果
- 🎨 添加动画和交互效果
- 🎨 支持主题定制

### 接口定义

```typescript
interface ChatAreaProps {
  chatMode: 'chat' | 'design';
  setChatMode: (mode: 'chat' | 'design') => void;
  chat: ReturnType<typeof useAppDevChat>;
  projectInfo: ReturnType<typeof useAppDevProjectInfo>;
}
```

### 代码优化

- 🧹 移除主页面的聊天相关逻辑
- 🧹 清理未使用的导入和变量
- 🧹 修复构建错误
- 🧹 优化代码结构

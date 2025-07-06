# MarkdownRenderer 组件更新日志

## [1.0.0] - 2024-01-XX

### 🎉 初始发布

#### ✨ 新特性

- **可配置插件系统** - 支持灵活的插件配置，可按需启用/禁用功能
- **预设配置** - 提供 4 种预设配置（basic、standard、full、chat）
- **自定义渲染规则** - 支持覆盖或扩展默认的渲染规则
- **全局函数管理** - 统一管理代码复制、图片放大、代码折叠等交互功能
- **TypeScript 支持** - 完整的类型定义和类型安全
- **样式隔离** - 使用 CSS Modules 避免样式冲突

#### 🔧 核心功能

- **Markdown 基础渲染** - 基于 markdown-it 的高性能渲染
- **代码语法高亮** - 集成 Prism.js，支持多种编程语言
- **数学公式渲染** - 支持 KaTeX，渲染 LaTeX 数学公式
- **增强表格支持** - 支持多行、合并单元格等高级表格功能
- **Mermaid 图表** - 支持流程图、时序图等多种图表类型
- **图片交互** - 点击图片放大查看，支持滚轮缩放
- **代码交互** - 代码块复制、长代码折叠功能

#### 📦 组件结构

```
MarkdownRenderer/
├── index.tsx           # 主组件入口
├── types.ts           # 类型定义
├── presets.ts         # 预设配置
├── renderRules.ts     # 渲染规则
├── globalFunctions.ts # 全局函数管理
├── index.less         # 样式文件
├── examples.tsx       # 使用示例
├── README.md          # 使用文档
└── CHANGELOG.md       # 更新日志
```

#### 🎯 预设配置详情

**Basic（基础配置）**

- 仅包含基本 markdown-it 功能
- 启用全局交互函数
- 适用于简单文档渲染

**Standard（标准配置）**

- 包含 KaTeX 数学公式插件
- 包含增强表格插件
- 启用所有全局函数
- 适用于大多数场景

**Full（完整配置）**

- 包含所有可用插件
- 启用所有功能
- 适用于功能需求完整的场景

**Chat（聊天配置）**

- 针对聊天场景优化
- 包含所有插件
- 特殊的样式和交互优化

#### 🔌 支持的插件

1. **KaTeX** - 数学公式渲染

   - 支持行内和块级公式
   - 多种分隔符配置
   - 高性能渲染

2. **MultiMD Table** - 增强表格

   - 多行单元格支持
   - 单元格合并
   - 无表头表格支持

3. **Mermaid** - 图表渲染
   - 流程图、时序图、甘特图等
   - 交互式工具栏
   - 支持导出和全屏查看

#### 💡 使用方式

**基础使用**

```tsx
import MarkdownRenderer from '@/components/MarkdownRenderer';

<MarkdownRenderer content={markdownText} />;
```

**使用预设配置**

```tsx
import { ChatMarkdownRenderer } from '@/components/MarkdownRenderer';

<ChatMarkdownRenderer content={markdownText} />;
```

**自定义配置**

```tsx
import MarkdownRenderer, { allPlugins } from '@/components/MarkdownRenderer';

const config = {
  plugins: [allPlugins.katex, allPlugins.multimdTable],
  globalFunctions: { handleClipboard: true },
};

<MarkdownRenderer content={markdownText} config={config} />;
```

#### 🔄 迁移指南

**从 ChatView 迁移**

原来的代码：

```tsx
<div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
```

新的代码：

```tsx
<ChatMarkdownRenderer content={content} />
```

#### ⚡ 性能优化

- 组件使用 `React.memo` 进行渲染优化
- markdown-it 实例缓存避免重复创建
- 全局函数单例模式避免重复注册
- 支持按需加载插件

#### 🛡️ 安全性

- 自动 HTML 转义防止 XSS 攻击
- 安全的图片处理
- 受控的全局函数注册

#### 📊 兼容性

- React 16.8+
- TypeScript 4.0+
- 现代浏览器（支持 ES6+）

#### 🐛 已知问题

- 暂无

#### 📋 待办事项

- [ ] 添加更多代码语言支持
- [ ] 支持自定义主题
- [ ] 添加更多 Mermaid 图表类型
- [ ] 性能监控和优化
- [ ] 单元测试覆盖

---

## 技术细节

### 架构设计

- **插件系统**：采用可配置的插件架构，支持动态加载和配置
- **渲染规则**：支持自定义渲染规则，可以覆盖或扩展默认行为
- **全局函数管理**：使用单例模式管理全局函数，避免内存泄漏
- **样式隔离**：使用 CSS Modules 确保样式不冲突

### 性能考虑

- **实例缓存**：markdown-it 实例被缓存，避免重复创建
- **延迟初始化**：全局函数和插件按需初始化
- **内存管理**：组件卸载时自动清理全局函数

### 扩展性

- **插件接口**：标准化的插件配置接口
- **渲染规则**：灵活的渲染规则覆盖机制
- **预设系统**：易于添加新的预设配置

---

_本组件基于 markdown-it 构建，感谢开源社区的贡献。_

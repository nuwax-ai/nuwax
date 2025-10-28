# Examples 示例页面

这个目录包含了各种功能演示和组件展示页面，帮助开发者了解项目的功能特性和使用方法。

## 页面列表

### 1. SvgIcon 图标展示 (`/examples/svg-icon-showcase`)

**功能描述：**

- 展示项目中所有可用的 SVG 图标
- 支持按分类查看（导航图标、聊天图标、通用图标）
- 提供搜索功能，快速找到需要的图标
- 支持一键复制图标代码
- 支持导出图标列表为 JSON 文件

**主要特性：**

- 🔍 **智能搜索**：支持按图标名称搜索
- 📋 **代码复制**：点击即可复制图标使用代码
- 📊 **分类展示**：按功能分类展示图标
- 🎨 **主题适配**：支持亮色/暗色主题切换
- 🌐 **多语言**：支持中英文界面
- 📱 **响应式**：适配各种屏幕尺寸

**使用方法：**

```tsx
// 基本用法
<SvgIcon name="icons-nav-home" />

// 自定义样式
<SvgIcon
  name="icons-nav-home"
  style={{
    fontSize: 24,
    color: '#1890ff'
  }}
/>
```

**图标分类：**

- **导航图标** (icons-nav-\*): 20 个图标，用于页面导航和布局
- **聊天图标** (icons-chat-\*): 18 个图标，用于聊天界面和交互
- **通用图标** (icons-common-\*): 11 个图标，用于通用操作和状态

### 2. Ant Design 组件展示 (`/examples/antd-showcase`)

**功能描述：**

- 全面展示 Ant Design 所有组件
- 支持不同主题和语言下的样式效果
- 包括按钮、表格、表单、导航等各类组件

### 3. 主题功能演示 (`/examples/theme-demo`)

**功能描述：**

- 演示主题切换和多语言功能
- 展示如何在组件中集成全局设置

## 开发指南

### 添加新的示例页面

1. 在 `src/examples/` 目录下创建新的组件文件
2. 在 `src/routes/index.ts` 中添加路由配置
3. 在 `src/examples/index.tsx` 中添加页面入口

### 示例页面结构

```tsx
// 示例页面组件结构
import React from 'react';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import './ExamplePage.less';

const ExamplePage: React.FC = () => {
  const { data } = useUnifiedTheme();
  const isChineseLanguage = data.language === 'zh-CN';

  return <div className="example-page">{/* 页面内容 */}</div>;
};

export default ExamplePage;
```

### 样式规范

- 使用 CSS Modules 或 Less 文件
- 遵循项目的设计规范
- 支持主题切换和响应式设计
- 使用 CSS 变量进行主题适配

## 访问方式

1. 直接访问：`http://localhost:8000/examples`
2. 从示例索引页面选择具体示例
3. 支持直接访问具体示例页面

## 注意事项

- 所有示例页面都设置为无布局模式 (`layout: false`)
- 示例页面应该独立完整，不依赖外部布局
- 建议添加详细的中英文注释和说明
- 保持代码的简洁性和可读性

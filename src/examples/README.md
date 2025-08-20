# Examples 示例展示

这个目录包含了项目的各种功能演示和组件展示页面，用于展示 Ant Design 组件在不同主题和多语言环境下的效果。

## 📁 文件结构

```
examples/
├── index.tsx                    # 示例页面索引
├── index.less                   # 索引页面样式
├── AntdComponentsShowcase.tsx   # Ant Design 组件全面展示
├── AntdComponentsShowcase.less  # 组件展示页面样式
├── ThemeDemo.tsx                # 主题和多语言功能演示
├── ThemeDemo.less               # 主题演示页面样式
└── README.md                    # 使用说明
```

## 🎯 示例页面列表

### 1. **Ant Design 组件展示** (`AntdComponentsShowcase.tsx`)

**路径**: `/examples/antd-showcase`

**功能特性**:

- 🎨 **基础组件**: Button、Input、Select、DatePicker 等
- 📊 **数据展示**: Table、Tag、Badge、Statistic 等
- ⚡ **交互组件**: Progress、Rate、Slider、Switch 等
- 🔔 **反馈组件**: Alert、Message、Modal、Drawer 等
- 🧭 **导航组件**: Breadcrumb、Steps、Pagination 等
- 🔧 **其他组件**: Tabs、Collapse、TreeSelect、Empty 等

**展示内容**:

- 所有组件在亮色/暗色主题下的样式
- 中英文多语言文本展示
- 交互功能演示（消息提示、通知、模态框等）
- 响应式布局效果

### 2. **主题功能演示** (`ThemeDemo.tsx`)

**路径**: `/examples/theme-demo`

**功能特性**:

- 🌗 **主题切换**: 实时切换亮色/暗色主题
- 🌍 **多语言**: 中英文动态切换
- 🎛️ **设置面板**: 快速切换控制
- 📊 **状态展示**: 显示当前配置信息
- 🎨 **组件预览**: 基础组件在不同主题下的效果

**展示内容**:

- 主题切换开关和语言切换开关
- 当前设置的可视化展示
- 消息和通知功能演示
- 配置信息的实时显示

### 3. **示例页面索引** (`index.tsx`)

**路径**: `/examples`

**功能特性**:

- 📋 示例页面导航
- 🌟 特色示例推荐
- 📖 使用指南说明
- 🎨 美观的卡片式布局

## 🚀 使用方法

### 访问示例页面

1. **通过浏览器直接访问**:

   ```
   http://localhost:8000/examples                # 示例索引页
   http://localhost:8000/examples/antd-showcase  # 组件展示页
   http://localhost:8000/examples/theme-demo     # 主题演示页
   ```

2. **通过导航访问**:
   - 先访问示例索引页 `/examples`
   - 在页面中点击相应的示例链接

### 在项目中使用示例组件

```tsx
import AntdComponentsShowcase from '@/examples/AntdComponentsShowcase';
import ThemeDemo from '@/examples/ThemeDemo';

// 在页面中使用组件展示
export default function ShowcasePage() {
  return <AntdComponentsShowcase />;
}

// 在页面中使用主题演示
export default function ThemePage() {
  return <ThemeDemo />;
}
```

## 🎨 主题和多语言测试

示例页面是测试主题切换和多语言功能的最佳场所：

### 1. **主题切换测试**

- 点击右下角设置按钮 ⚙️
- 切换亮色/暗色主题
- 观察所有组件的颜色变化
- 检查 CSS 变量是否正确应用

### 2. **多语言测试**

- 在设置中切换中文/英文
- 检查所有文本是否正确翻译
- 验证 Ant Design 组件语言包
- 测试日期、数字格式化

### 3. **响应式测试**

- 调整浏览器窗口大小
- 测试不同屏幕尺寸下的布局
- 检查移动端适配效果

## 🔧 自定义和扩展

### 添加新的示例页面

1. **创建新的示例组件**:

   ```tsx
   // examples/MyNewExample.tsx
   import React from 'react';
   import useGlobalSettings from '@/hooks/useGlobalSettings';
   import useTexts from '@/hooks/useTexts';

   const MyNewExample: React.FC = () => {
     const { isDarkMode, isChineseLanguage } = useGlobalSettings();
     const texts = useTexts();

     return <div>{/* 你的示例内容 */}</div>;
   };

   export default MyNewExample;
   ```

2. **在索引页面中注册**:
   ```tsx
   // examples/index.tsx
   const examples = [
     // 现有示例...
     {
       id: 'my-new-example',
       title: '我的新示例',
       description: '新示例的描述',
       tags: [{ text: '标签', color: 'blue' }],
       icon: <YourIcon />,
       path: '/examples/my-new-example',
       featured: false,
     },
   ];
   ```

### 修改示例内容

1. **添加新的组件展示**: 在 `AntdComponentsShowcase.tsx` 中找到对应的卡片区域，添加新的组件演示。

2. **更新多语言文本**: 在 `src/utils/locales.ts` 中添加新的文本内容。

3. **调整样式**: 修改对应的 `.less` 文件来自定义样式。

## 📱 响应式支持

所有示例页面都包含完整的响应式设计：

- **桌面端** (>1200px): 完整布局
- **平板端** (768px-1200px): 适配布局
- **手机端** (<768px): 移动端优化

## 🎯 最佳实践

### 1. **组件展示规范**

- 每个组件区域包含标题和描述
- 提供多种状态和尺寸的示例
- 展示组件的主要功能和交互

### 2. **样式命名规范**

- 使用 BEM 命名方式
- 所有 CSS 变量使用 `--xagi-` 前缀
- 保持样式的一致性和可维护性

### 3. **多语言支持**

- 所有显示文本都要支持多语言
- 使用 `useTexts` Hook 获取当前语言文本
- 根据语言调整数据展示格式

## 🔍 调试和测试

### 1. **样式调试**

```less
// 在 .less 文件中添加调试样式
.debug-mode {
  border: 1px solid red;
  background: rgba(255, 0, 0, 0.1);
}
```

### 2. **主题变量检查**

```tsx
// 在组件中打印当前主题变量
const { token } = theme.useToken();
console.log('Current theme tokens:', token);
```

### 3. **多语言测试**

```tsx
// 检查当前语言设置
const { language, isChineseLanguage } = useGlobalSettings();
console.log('Current language:', language, 'Is Chinese:', isChineseLanguage);
```

## 🚀 部署说明

示例页面会随项目一起部署，确保：

1. 所有静态资源路径正确
2. 路由配置包含示例页面
3. 生产环境下的样式正确加载

## 📝 更新日志

- **v1.0.0**: 初始版本，包含 Ant Design 组件展示
- **v1.1.0**: 添加示例索引页面和导航功能
- **v1.2.0**: 增强响应式支持和暗色主题适配
- **v1.3.0**: 将 ThemeDemo 组件移动到 examples 目录，统一管理所有演示组件

## 🤝 贡献指南

欢迎为示例页面贡献新的内容：

1. Fork 项目仓库
2. 创建新的示例组件
3. 添加相应的样式和文档
4. 提交 Pull Request

---

💡 **提示**: 示例页面是了解项目功能的最佳入口，建议新用户从这里开始探索！

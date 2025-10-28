# 示例组件结构说明

## 概述

为了更好地组织示例相关的组件，我们将 `ExampleNavigation` 和 `NavigationExample` 组件移动到了 `src/examples/components/` 目录下。

## 新的目录结构

```
src/examples/
├── components/                    # 示例专用组件
│   ├── ExampleNavigation/        # 示例页面导航组件
│   │   ├── index.tsx
│   │   └── index.less
│   └── NavigationExample/        # 导航组件示例
│       ├── index.tsx
│       └── index.less
├── BackgroundStyleExample.tsx    # 背景风格切换示例
├── BackgroundStyleExample.less
├── NavigationTokenExample.tsx    # 导航Token使用指南
├── NavigationTokenExample.less
└── index.tsx                     # 示例中心首页
```

## 组件说明

### ExampleNavigation

- **位置**: `src/examples/components/ExampleNavigation/`
- **用途**: 提供示例页面之间的快速导航
- **功能**:
  - 面包屑导航
  - 返回按钮
  - 页面间快速切换
  - 响应式设计

### NavigationExample

- **位置**: `src/examples/components/NavigationExample/`
- **用途**: 展示导航 Token 的使用方法
- **功能**:
  - 一级导航菜单
  - 二级导航菜单
  - 深浅色风格切换
  - 响应式设计

## 导入路径更新

### 在示例页面中的导入

```typescript
// 之前的导入路径
import ExampleNavigation from '../components/ExampleNavigation';
import NavigationExample from '../components/NavigationExample';

// 现在的导入路径
import ExampleNavigation from './components/ExampleNavigation';
import NavigationExample from './components/NavigationExample';
```

### 组件内部的导入

```typescript
// NavigationExample 组件中的导入路径已更新
import { useBackgroundStyle } from '../../../utils/backgroundStyle';
```

## 路由配置

路由配置保持不变，仍然可以通过以下路径访问：

- `/examples` - 示例中心
- `/examples/background-style` - 背景风格切换
- `/examples/navigation-token` - 导航 Token 指南
- `/examples/antd-showcase` - Ant Design 展示

## 优势

1. **更好的组织结构**: 示例相关组件集中在 `examples` 目录下
2. **清晰的职责分离**: 示例组件与业务组件分离
3. **便于维护**: 示例相关的代码集中管理
4. **减少全局污染**: 避免在全局 `components` 目录中混入示例组件

## 注意事项

1. 这些组件仅用于示例展示，不建议在生产环境中直接使用
2. 如果需要复用这些组件的功能，建议提取到 `src/components/` 目录下
3. 示例组件的样式和功能可能会根据展示需求进行调整

## 相关文件

- `src/examples/components/ExampleNavigation/` - 示例导航组件
- `src/examples/components/NavigationExample/` - 导航示例组件
- `src/examples/BackgroundStyleExample.tsx` - 背景风格示例
- `src/examples/NavigationTokenExample.tsx` - 导航 Token 示例
- `src/routes/index.ts` - 路由配置

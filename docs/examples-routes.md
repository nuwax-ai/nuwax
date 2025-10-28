# 示例页面路由配置

## 概述

项目已为导航 Token 示例添加了完整的路由配置，现在可以通过浏览器直接访问各个示例页面。

## 路由列表

### 1. 示例中心

- **路径**: `/examples`
- **组件**: `@/examples/index`
- **描述**: 示例页面的索引，展示所有可用的示例和演示页面

### 2. 背景风格切换

- **路径**: `/examples/background-style`
- **组件**: `@/examples/BackgroundStyleExample`
- **描述**: 基于背景图的深浅色风格切换系统演示

### 3. 导航 Token 使用指南

- **路径**: `/examples/navigation-token`
- **组件**: `@/examples/NavigationTokenExample`
- **描述**: 详细的导航 Token 使用指南和代码示例

### 4. Ant Design 组件展示

- **路径**: `/examples/antd-showcase`
- **组件**: `@/examples/AntdComponentsShowcase`
- **描述**: Ant Design 组件的全面展示

## 访问方式

### 开发环境

启动开发服务器后，可以通过以下 URL 访问：

```bash
# 启动开发服务器
npm run dev

# 访问示例页面
http://localhost:3001/examples                    # 示例中心
http://localhost:3001/examples/background-style   # 背景风格切换
http://localhost:3001/examples/navigation-token   # 导航Token指南
http://localhost:3001/examples/antd-showcase      # Ant Design展示
```

### 生产环境

构建后的应用可以通过相同的路径访问示例页面。

## 新增功能

### 1. 页面导航组件

新增了 `ExampleNavigation` 组件，提供：

- 面包屑导航
- 返回按钮
- 页面间快速切换
- 响应式设计

### 2. 路由配置

在 `src/routes/index.ts` 中添加了新的路由配置：

```typescript
{
  path: '/examples/background-style',
  component: '@/examples/BackgroundStyleExample',
  layout: false,
},
{
  path: '/examples/navigation-token',
  component: '@/examples/NavigationTokenExample',
  layout: false,
},
```

### 3. 示例索引更新

在 `src/examples/index.tsx` 中添加了新的示例项目：

```typescript
{
  id: 'navigation-token',
  title: '导航Token使用指南',
  description: '详细介绍新增的导航相关CSS变量token...',
  tags: ['导航', 'Token', 'CSS变量', '使用指南'],
  icon: <SettingOutlined />,
  path: '/examples/navigation-token',
  featured: true,
}
```

## 使用示例

### 在组件中使用导航组件

```tsx
import ExampleNavigation from '@/components/ExampleNavigation';

const MyExamplePage = () => {
  return (
    <div>
      <ExampleNavigation
        currentTitle="我的示例页面"
        showBreadcrumb={true}
        showBackButton={true}
        showQuickNav={true}
      />
      {/* 页面内容 */}
    </div>
  );
};
```

### 添加新的示例页面

1. 在 `src/examples/` 目录下创建新的示例组件
2. 在 `src/routes/index.ts` 中添加路由配置
3. 在 `src/examples/index.tsx` 中添加示例项目
4. 在示例组件中使用 `ExampleNavigation` 组件

## 特性

- ✅ **完整路由支持**: 所有示例页面都有独立的路由
- ✅ **导航组件**: 提供统一的页面导航体验
- ✅ **响应式设计**: 适配不同屏幕尺寸
- ✅ **深浅色支持**: 自动适配当前主题风格
- ✅ **快速切换**: 支持页面间的快速导航
- ✅ **面包屑导航**: 清晰的页面层级关系

## 注意事项

1. 所有示例页面都设置了 `layout: false`，使用独立的布局
2. 导航组件会自动检测当前页面并显示相应的导航选项
3. 示例页面支持深浅色风格切换
4. 所有路由都支持直接访问，无需登录验证

## 相关文件

- `src/routes/index.ts` - 路由配置
- `src/examples/index.tsx` - 示例索引页面
- `src/components/ExampleNavigation/` - 页面导航组件
- `src/examples/BackgroundStyleExample.tsx` - 背景风格示例
- `src/examples/NavigationTokenExample.tsx` - 导航 Token 示例

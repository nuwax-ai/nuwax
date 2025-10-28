# AppDevEmptyState 组件

一个高度可配置的空状态组件，用于 AppDev 页面的各种空状态场景展示。

## 特性

- 🎨 **多种状态类型**: 支持 loading、error、empty、no-data 等多种状态
- 🔧 **高度可配置**: 支持自定义图标、标题、描述和按钮
- 🎯 **类型安全**: 完整的 TypeScript 类型定义
- ✨ **动画效果**: 内置淡入和脉冲动画效果

## 基本用法

```tsx
import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';

// 基本用法
<AppDevEmptyState type="empty" />

// 带按钮的空状态
<AppDevEmptyState
  type="error"
  title="加载失败"
  description="网络连接异常，请重试"
  buttons={[
    {
      text: '重试',
      type: 'primary',
      onClick: () => console.log('重试'),
    },
  ]}
/>
```

## API

### Props

| 属性            | 类型                  | 默认值    | 描述           |
| --------------- | --------------------- | --------- | -------------- |
| type            | `EmptyStateType`      | `'empty'` | 状态类型       |
| icon            | `React.ReactNode`     | -         | 自定义图标     |
| title           | `string`              | -         | 自定义标题     |
| description     | `string`              | -         | 自定义描述     |
| buttons         | `ButtonConfig[]`      | -         | 按钮配置数组   |
| className       | `string`              | -         | 自定义样式类名 |
| style           | `React.CSSProperties` | -         | 自定义样式     |
| showIcon        | `boolean`             | `true`    | 是否显示图标   |
| showTitle       | `boolean`             | `true`    | 是否显示标题   |
| showDescription | `boolean`             | `true`    | 是否显示描述   |
| showButtons     | `boolean`             | `true`    | 是否显示按钮   |

### EmptyStateType

```typescript
type EmptyStateType =
  | 'loading' // 加载中
  | 'error' // 一般错误
  | 'empty' // 空内容
  | 'no-data' // 无数据
  | 'network-error' // 网络错误
  | 'permission-denied'; // 权限不足
```

### ButtonConfig

```typescript
interface ButtonConfig {
  text: string; // 按钮文本
  icon?: React.ReactNode; // 按钮图标
  onClick?: () => void; // 点击回调
  loading?: boolean; // 是否加载中
  disabled?: boolean; // 是否禁用
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'; // 按钮类型
  size?: 'small' | 'middle' | 'large'; // 按钮大小
}
```

## 使用场景

### 1. 预览组件空状态

```tsx
<AppDevEmptyState
  type={isRestarting ? 'loading' : 'no-data'}
  title={isRestarting ? '服务器重启中' : '暂无预览地址'}
  description={serverMessage || '当前没有可用的预览地址，请先启动开发服务器'}
  buttons={[
    {
      text: retrying ? '重启中...' : '重启服务',
      icon: <ReloadOutlined />,
      onClick: retryPreview,
      loading: retrying,
      disabled: retrying,
    },
  ]}
/>
```

### 2. 文件树空状态

```tsx
<AppDevEmptyState
  type="empty"
  title="暂无文件"
  description="当前项目中没有文件，请上传文件或创建新文件"
  buttons={[
    {
      text: '上传文件',
      type: 'primary',
      icon: <UploadOutlined />,
      onClick: handleUpload,
    },
    {
      text: '创建文件',
      onClick: handleCreate,
    },
  ]}
/>
```

### 3. 网络错误状态

```tsx
<AppDevEmptyState
  type="network-error"
  title="网络连接失败"
  description="无法连接到服务器，请检查网络设置"
  buttons={[
    {
      text: '重新连接',
      type: 'primary',
      onClick: handleReconnect,
    },
  ]}
/>
```

### 4. 权限不足状态

```tsx
<AppDevEmptyState
  type="permission-denied"
  title="权限不足"
  description="您没有访问此资源的权限，请联系管理员"
  buttons={[
    {
      text: '联系管理员',
      type: 'primary',
      onClick: handleContactAdmin,
    },
  ]}
/>
```

## 样式定制

组件支持通过 `className` 和 `style` 属性进行样式定制：

```tsx
<AppDevEmptyState
  type="empty"
  className="custom-empty-state"
  style={{ backgroundColor: '#f5f5f5' }}
/>
```

# useNavigationGuard Hook

导航拦截 Hook，用于在用户尝试离开当前页面时进行拦截并弹出确认弹窗。

## 功能特性

- ✅ 拦截应用内路由跳转（点击链接、编程式导航）
- ✅ 拦截浏览器刷新/关闭/前进后退
- ✅ 支持"确认"、"放弃"、"取消"三种操作
- ✅ 支持异步确认操作（如保存文件）
- ✅ 支持自定义按钮文案
- ✅ 支持条件式拦截

## 安装

该 Hook 已内置于项目中，无需额外安装。

```tsx
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
```

## API

### Options

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `condition` | `() => boolean` | _必填_ | 判断是否需要拦截的函数，返回 `true` 时拦截 |
| `onConfirm` | `() => Promise<boolean>` | - | 确认操作的回调，返回 `true` 表示成功可继续导航 |
| `title` | `string` | `'确认离开'` | 弹窗标题 |
| `message` | `string` | `'您确定要离开当前页面吗？'` | 弹窗内容 |
| `enabled` | `boolean` | `true` | 是否启用拦截 |
| `confirmText` | `string` | `'确认'` | 确认按钮文案 |
| `discardText` | `string` | `'放弃'` | 放弃按钮文案 |
| `cancelText` | `string` | `'取消'` | 取消按钮文案 |
| `showCancelButton` | `boolean` | `false` | 是否显示取消按钮 |

### Returns

| 返回值         | 类型                             | 说明                 |
| -------------- | -------------------------------- | -------------------- |
| `confirmLeave` | `(callback: () => void) => void` | 手动触发确认离开弹窗 |

## 使用示例

### 基础用法

最简单的使用方式，监控是否有未保存的更改：

```tsx
import { useState } from 'react';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';

function EditPage() {
  const [isDirty, setIsDirty] = useState(false);

  useNavigationGuard({
    condition: () => isDirty,
    message: '您有未保存的更改，确定要离开吗？',
  });

  return <input onChange={() => setIsDirty(true)} />;
}
```

### 带保存功能

在离开前执行保存操作：

```tsx
import { useNavigationGuard } from '@/hooks/useNavigationGuard';

function EditPage() {
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = async () => {
    try {
      await saveToServer(content);
      setIsDirty(false);
      return true; // 保存成功，允许导航
    } catch (error) {
      message.error('保存失败');
      return false; // 保存失败，阻止导航
    }
  };

  useNavigationGuard({
    condition: () => isDirty,
    onConfirm: handleSave,
    title: '未保存的更改',
    message: '您有未保存的更改，是否保存后离开？',
    confirmText: '保存并离开',
    discardText: '不保存离开',
  });

  return (
    <textarea
      value={content}
      onChange={(e) => {
        setContent(e.target.value);
        setIsDirty(true);
      }}
    />
  );
}
```

### 动态启用/禁用

根据条件动态启用或禁用拦截：

```tsx
useNavigationGuard({
  condition: () => hasChanges,
  enabled: isEditMode, // 仅在编辑模式下启用
  message: '您有未保存的更改',
});
```

### 显示取消按钮

如果需要让用户可以取消操作并留在当前页面：

```tsx
useNavigationGuard({
  condition: () => isDirty,
  onConfirm: handleSave,
  showCancelButton: true,
  confirmText: '保存',
  discardText: '不保存',
  cancelText: '返回编辑',
});
```

### 手动触发确认

使用 `confirmLeave` 在自定义场景下触发确认：

```tsx
const { confirmLeave } = useNavigationGuard({
  condition: () => isDirty,
  onConfirm: handleSave,
});

const handleCustomNavigation = () => {
  confirmLeave(() => {
    // 确认后执行的自定义导航逻辑
    customNavigate('/other-page');
  });
};
```

## 注意事项

1. **condition 函数应该是纯函数**：避免在 `condition` 函数中产生副作用。

2. **onConfirm 必须返回 boolean**：返回 `true` 表示操作成功可以继续导航，返回 `false` 会阻止导航。

3. **浏览器刷新/关闭限制**：由于浏览器安全限制，刷新/关闭时只能显示系统默认的确认弹窗，无法显示自定义弹窗或执行 `onConfirm`。

4. **与 React Router 的兼容性**：该 Hook 基于 umi 的 `history.block` API，与 umi@3/4 兼容。

## 源码位置

- Hook 源码: [`src/hooks/useNavigationGuard.tsx`](../../src/hooks/useNavigationGuard.tsx)

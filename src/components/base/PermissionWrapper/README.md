# 动态功能权限使用指南

本文档介绍如何在业务页面中使用动态下发的功能权限（Permissions）来控制按钮、操作和内容的显示。

## 1. 原理简述

动态菜单接口返回的菜单树中，每个菜单项（Menu Item）可以包含一个 `permissions` 数组，定义了该菜单下的具体功能权限。例如，“用户管理”菜单下可能包含：`[{ code: 'user:add', name: '新增用户' }, { code: 'user:edit', name: '编辑用户' }]`。

**自动扁平化**：尽管权限是分散在各个菜单项下的，但在前端初始化时，`menuModel` 会自动遍历整个菜单树，将所有功能权限收集到一个全局的 `permissionSet` 中。因此，开发者在业务代码中使用时，**不需要关心该权限属于哪个菜单**，直接使用权限编码（Code）进行判断即可。

## 2. 使用 Hook 检查权限 (`usePermission`)

最常用的方式是使用 `usePermission` Hook。

```tsx
import usePermission from '@/hooks/usePermission';

const UserPage = () => {
  // 获取权限检查函数
  const { can, canAny, canAll } = usePermission();

  const handleAdd = () => {
    // 在逻辑中检查权限
    if (!can('user:add')) {
      message.error('您没有新增用户的权限');
      return;
    }
    // ...
  };

  return (
    <div>
      {/* 在渲染中检查权限 */}
      {can('user:add') && <Button onClick={handleAdd}>新增用户</Button>}

      {/* 检查拥有任意一个权限 */}
      {canAny(['user:edit', 'user:delete']) && <span>操作区域</span>}
    </div>
  );
};
```

### API 说明

- **`can(code: string)`**: 检查是否拥有单个权限。
- **`canAny(codes: string[])`**: 检查是否拥有数组中的**任意一个**权限。
- **`canAll(codes: string[])`**: 检查是否拥有数组中的**所有**权限。

## 3. 使用组件包裹 (`PermissionWrapper`)

如果你希望以声明式的方式控制元素的显示，可以使用 `PermissionWrapper` 组件。

```tsx
import PermissionWrapper from '@/components/base/PermissionWrapper';

const UserTable = () => {
  return (
    <>
      <PermissionWrapper
        requiredPermission="user:delete"
        fallback={<Tooltip title="无权操作">删除(禁用)</Tooltip>}
      >
        <Button danger>删除用户</Button>
      </PermissionWrapper>

      {/* 仅在有权限时渲染，无权限则不渲染任何内容 */}
      <PermissionWrapper requiredPermission="user:export">
        <Button>导出数据</Button>
      </PermissionWrapper>
    </>
  );
};
```

### Props 说明

- **`requiredPermission`**: `string | string[]`。需要的权限编码。
- **`requireAll`**: `boolean`。默认为 `false`。如果传入数组，是否需要包含所有权限。
- **`fallback`**: `ReactNode`。无权限时显示的内容（默认为 null）。

## 4. 获取当前页面权限

虽然通常我们直接检查特定权限码，但有时你可能需要知道当前页面拥有哪些权限（例如用于调试或展示）。

可以使用 `menuModel` 提供的 `getPagePermissions` 方法：

```tsx
import { useModel, useLocation } from 'umi';

const UserPage = () => {
  const { pathname } = useLocation();
  const { getPagePermissions } = useModel('menuModel');

  // 获取当前页面（根据 URL 匹配菜单）下的所有权限码
  const pagePermissions = getPagePermissions(pathname);

  return <div>当前页面权限：{pagePermissions.join(', ')}</div>;
};
```

## 5. 权限数据结构示例

Mock 数据 (`src/services/menuService.ts`) 中的结构如下：

```typescript
{
  name: '用户管理',
  path: '/system/user/manage',
  // ...
  permissions: [
    { code: 'user:add', name: '新增用户' },
    { code: 'user:edit', name: '编辑用户' }
  ]
}
```

## 6. 最佳实践：低侵入集成

为了保持现有代码的整洁，建议遵循“低侵入”原则进行集成。

### 6.1 页面级权限（零侵入）

对于整个页面的访问控制，**不要在页面组件内部写逻辑**，而是通过路由配置与 Wrapper 实现。这样，你的页面组件完全不需要知道“权限”的存在。

1.  **创建/使用 Wrapper** (`src/wrappers/PermissionRoute.tsx`)
2.  **配置路由**：

```typescript
// routes/index.ts
{
  path: '/system/user',
  component: '@/pages/UserManage',
  // 指定 Wrapper
  wrappers: ['@/wrappers/PermissionRoute'],
  // 指定需要的权限码（自定义属性）
  code: 'user:view',
}
```

### 6.2 按钮级权限（最小侵入）

对于现有组件中的按钮，使用 `PermissionWrapper` 包裹是修改成本最低的方式。

**修改前：**

```tsx
<Button onClick={handleDelete}>删除</Button>
```

**修改后：**

```tsx
// 仅需导入组件并包裹，无需修改原有 Handler 或逻辑
<PermissionWrapper requiredPermission="user:delete">
  <Button onClick={handleDelete}>删除</Button>
</PermissionWrapper>
```

这种方式使得业务逻辑（`handleDelete`）与权限逻辑解耦，日后如果要移除权限控制，只需去掉 Wrapper 即可。

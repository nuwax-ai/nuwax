# ActionMenu 通用操作菜单组件

## 功能特性

- 🎯 **灵活配置**: 支持配置图标、标题、点击回调等
- 📱 **响应式设计**: 自适应不同屏幕尺寸
- ♿ **无障碍支持**: 完整的键盘导航和屏幕阅读器支持
- 🎨 **样式定制**: 支持自定义样式类和主题
- 📋 **更多菜单**: 超出显示数量的操作项自动放入下拉菜单

## 基本用法

```tsx
import ActionMenu, { ActionItem } from '@/components/base/ActionMenu';

const MyComponent = () => {
  const actions: ActionItem[] = [
    {
      key: 'edit',
      icon: 'icons-edit',
      title: '编辑',
      onClick: () => console.log('编辑'),
    },
    {
      key: 'delete',
      icon: 'icons-delete',
      title: '删除',
      onClick: () => console.log('删除'),
      disabled: true,
    },
    {
      key: 'share',
      icon: 'icons-share',
      title: '分享',
      onClick: () => console.log('分享'),
    },
    {
      key: 'export',
      icon: 'icons-export',
      title: '导出',
      onClick: () => console.log('导出'),
      divider: true, // 在菜单项前显示分割线
    },
  ];

  return (
    <ActionMenu
      actions={actions}
      visibleCount={2} // 只显示前2项，其他放入更多菜单
      moreText="更多操作"
      moreIcon="icons-more"
    />
  );
};
```

## API 参数

### ActionItem

| 参数      | 类型       | 必填 | 说明           |
| --------- | ---------- | ---- | -------------- |
| key       | string     | ✅   | 唯一标识       |
| icon      | string     | ✅   | 图标名称       |
| title     | string     | ✅   | 显示文本       |
| onClick   | () => void | ✅   | 点击回调函数   |
| disabled  | boolean    | ❌   | 是否禁用       |
| className | string     | ❌   | 自定义样式类名 |
| divider   | boolean    | ❌   | 是否显示分割线 |

### ActionMenuProps

| 参数         | 类型         | 默认值       | 说明             |
| ------------ | ------------ | ------------ | ---------------- |
| actions      | ActionItem[] | -            | 操作项列表       |
| visibleCount | number       | 3            | 显示的操作项数量 |
| moreText     | string       | '更多'       | 更多菜单的文本   |
| moreIcon     | string       | 'icons-more' | 更多菜单的图标   |
| className    | string       | -            | 自定义样式类名   |
| gap          | number       | 16           | 操作项之间的间距 |
| disabled     | boolean      | false        | 是否禁用所有操作 |

## 高级用法

### 自定义样式

```tsx
const actions: ActionItem[] = [
  {
    key: 'primary',
    icon: 'icons-star',
    title: '主要操作',
    onClick: handlePrimary,
    className: 'custom-primary-style',
  },
  {
    key: 'danger',
    icon: 'icons-warning',
    title: '危险操作',
    onClick: handleDanger,
    className: 'custom-danger-style',
  },
];
```

### 条件渲染

```tsx
const actions: ActionItem[] = [
  // 基础操作
  {
    key: 'view',
    icon: 'icons-eye',
    title: '查看',
    onClick: handleView,
  },
  // 条件显示的操作
  ...(canEdit
    ? [
        {
          key: 'edit',
          icon: 'icons-edit',
          title: '编辑',
          onClick: handleEdit,
        },
      ]
    : []),
  // 权限控制
  ...(hasPermission('delete')
    ? [
        {
          key: 'delete',
          icon: 'icons-delete',
          title: '删除',
          onClick: handleDelete,
          disabled: !canDelete,
        },
      ]
    : []),
];
```

### 响应式配置

```tsx
const [visibleCount, setVisibleCount] = useState(3);

useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth < 768) {
      setVisibleCount(2); // 移动端显示更少
    } else {
      setVisibleCount(3); // 桌面端显示更多
    }
  };

  handleResize();
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

return (
  <ActionMenu actions={actions} visibleCount={visibleCount} moreText="更多" />
);
```

## 样式定制

组件使用 CSS Modules，可以通过以下方式定制样式：

```less
// 自定义样式文件
.custom-action-menu {
  .action-item {
    // 覆盖默认样式
    background-color: #f0f0f0;

    &:hover {
      background-color: #e0e0e0;
    }
  }
}
```

## 注意事项

1. **图标名称**: 确保传入的 `icon` 名称在 `SvgIcon` 组件中存在
2. **性能优化**: 如果操作项较多，建议使用 `useMemo` 缓存 `actions` 数组
3. **无障碍**: 组件已内置完整的无障碍支持，无需额外配置
4. **响应式**: 组件会自动适配不同屏幕尺寸，但建议根据业务需求调整 `visibleCount`

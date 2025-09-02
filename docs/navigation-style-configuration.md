# 导航栏风格配置功能

## 🎯 功能概述

在主题切换面板中新增了导航栏风格配置功能，支持：

1. **导航栏风格样式选择**：风格 1、风格 2 等不同的导航栏样式
2. **导航栏深浅色选择**：浅色模式、深色模式（独立于 Ant Design 主题）

## 🔧 技术实现

### 1. 类型定义更新

**新增导航栏风格类型：**

```typescript
export interface NavigationStyle {
  id: string; // 风格ID
  name: string; // 风格名称
  description?: string; // 风格描述
  isDefault?: boolean; // 是否为默认风格
}
```

**更新租户主题配置：**

```typescript
export interface TenantThemeConfig {
  // ... 其他配置
  navigationStyles: NavigationStyle[]; // 可用的导航栏风格列表
  defaultNavigationStyleId: string; // 默认导航栏风格ID
  supportDarkMode: boolean; // 是否支持深色模式
  defaultIsDarkMode: boolean; // 默认是否为深色模式
}
```

### 2. 数据结构

**导航栏风格配置示例：**

```typescript
navigationStyles: [
  {
    id: 'nav-style-1',
    name: '风格1',
    description: '当前默认风格',
    isDefault: true,
  },
  {
    id: 'nav-style-2',
    name: '风格2',
    description: '简洁风格',
  },
];
```

### 3. 组件实现

**ThemeSwitchPanel 组件更新：**

- 添加了导航栏风格状态管理
- 分离了风格样式选择和深浅色选择
- 支持从租户配置动态加载风格选项

**关键功能：**

```typescript
// 导航栏风格状态管理
const [currentNavigationStyle, setCurrentNavigationStyle] = useState<string>(
  tenantThemeConfig.defaultNavigationStyleId,
);

// 处理导航栏风格切换
const handleNavigationStyleChange = (styleId: string) => {
  setCurrentNavigationStyle(styleId);
  // 这里可以添加导航栏风格切换的逻辑
  console.log('切换导航栏风格:', styleId);
};
```

## 🎨 UI 设计

### 1. 布局结构

```
导航栏
├── 风格样式
│   ├── 风格1 (当前默认风格)
│   └── 风格2 (简洁风格)
└── 深浅色
    ├── 浅色
    └── 深色
```

### 2. 样式特点

- **分组显示**：风格样式和深浅色分别显示
- **预览效果**：每个选项都有导航栏预览
- **状态指示**：当前选中的选项有高亮显示
- **工具提示**：hover 时显示风格描述

### 3. 交互逻辑

- **风格样式**：点击切换不同的导航栏样式
- **深浅色**：点击切换导航栏的深浅色模式
- **独立控制**：风格样式和深浅色可以独立选择

## 📋 配置说明

### 1. 租户配置

租户管理员可以通过后台配置：

- 可用的导航栏风格列表
- 默认导航栏风格
- 是否启用深浅色切换
- 默认深浅色模式

### 2. 数据格式

```json
{
  "navigationStyles": [
    {
      "id": "nav-style-1",
      "name": "风格1",
      "description": "当前默认风格",
      "isDefault": true
    },
    {
      "id": "nav-style-2",
      "name": "风格2",
      "description": "简洁风格"
    }
  ],
  "defaultNavigationStyleId": "nav-style-1",
  "supportDarkMode": true,
  "defaultIsDarkMode": false
}
```

## 🔄 与现有功能的区别

### 1. 导航栏深浅色 vs Ant Design 主题

- **导航栏深浅色**：只影响导航栏组件的样式
- **Ant Design 主题**：影响整个应用的 UI 主题

### 2. 风格样式 vs 深浅色

- **风格样式**：导航栏的布局、结构、组件样式
- **深浅色**：导航栏的颜色主题（浅色/深色）

## 🚀 扩展功能

### 1. 未来可扩展的功能

- **更多风格样式**：支持更多导航栏风格
- **自定义风格**：允许用户自定义导航栏样式
- **风格预览**：提供更详细的风格预览效果
- **风格联动**：风格样式与深浅色的联动效果

### 2. 技术扩展

- **CSS 变量管理**：通过 CSS 变量动态切换风格
- **主题系统集成**：与现有主题系统深度集成
- **性能优化**：风格切换的性能优化
- **缓存机制**：风格配置的缓存和预加载

## 📝 使用方式

### 1. 在组件中使用

```typescript
import { useGlobalSettings } from '@/hooks/useGlobalSettings';

const MyComponent = () => {
  const { isDarkMode, toggleTheme } = useGlobalSettings();

  // 切换导航栏深浅色
  const handleToggleTheme = () => {
    toggleTheme();
  };

  return (
    <div>
      <button onClick={handleToggleTheme}>
        当前模式: {isDarkMode ? '深色' : '浅色'}
      </button>
    </div>
  );
};
```

### 2. 监听风格变化

```typescript
useEffect(() => {
  const handleNavigationStyleChange = (styleId: string) => {
    console.log('导航栏风格已切换:', styleId);
    // 处理风格切换逻辑
  };

  // 监听风格变化事件
  window.addEventListener(
    'navigation-style-changed',
    handleNavigationStyleChange,
  );

  return () => {
    window.removeEventListener(
      'navigation-style-changed',
      handleNavigationStyleChange,
    );
  };
}, []);
```

## ⚠️ 注意事项

1. **数据来源**：导航栏风格配置必须来自租户信息 API
2. **权限控制**：根据租户配置决定显示哪些风格选项
3. **状态同步**：确保风格切换后状态正确同步
4. **性能考虑**：避免频繁的风格切换影响性能
5. **兼容性**：确保新功能不影响现有导航栏功能

# 导航栏深浅色与 Ant Design 主题分离

## 🎯 功能概述

将导航栏的深浅色切换从 Ant Design UI 框架的主题切换中分离出来，实现独立的导航栏主题管理。

## 🔧 技术实现

### 1. 概念分离

**Ant Design 主题** vs **导航栏深浅色**：

- **Ant Design 主题**：影响整个应用的 UI 组件样式（按钮、输入框、卡片等）
- **导航栏深浅色**：只影响导航栏组件的样式，独立于 Ant Design 主题

### 2. 状态管理分离

**ThemeConfig 页面：**

```typescript
// Ant Design主题状态（来自useGlobalSettings）
const { isDarkMode, toggleTheme } = useGlobalSettings();

// 导航栏深浅色状态（独立管理）
const [isNavigationDarkMode, setIsNavigationDarkMode] =
  useState<boolean>(false);

// 切换导航栏深浅色
const handleNavigationThemeToggle = () => {
  setIsNavigationDarkMode(!isNavigationDarkMode);
};
```

**ThemeSwitchPanel 页面：**

```typescript
// Ant Design主题状态（来自useGlobalSettings）
const { isDarkMode, toggleTheme } = useGlobalSettings();

// 导航栏深浅色状态（独立管理）
const [isNavigationDarkMode, setIsNavigationDarkMode] = useState<boolean>(
  tenantThemeConfig.defaultIsDarkMode,
);

// 切换导航栏深浅色
const handleNavigationThemeToggle = () => {
  setIsNavigationDarkMode(!isNavigationDarkMode);
};
```

### 3. 组件接口更新

**NavigationStylePanel 组件：**

```typescript
interface NavigationStylePanelProps {
  isNavigationDarkMode: boolean; // 导航栏深浅色状态
  onNavigationThemeToggle: () => void; // 导航栏深浅色切换函数
}
```

**使用方式：**

```typescript
<NavigationStylePanel
  isNavigationDarkMode={isNavigationDarkMode}
  onNavigationThemeToggle={handleNavigationThemeToggle}
/>
```

### 4. 配置保存分离

**ThemeConfig 保存配置：**

```typescript
const themeConfig = {
  selectedThemeColor: primaryColor,
  selectedBackgroundId: backgroundImageId,
  antdTheme: isDarkMode ? 'dark' : 'light', // Ant Design主题
  navigationStyle: isNavigationDarkMode ? 'dark' : 'light', // 导航栏深浅色（独立）
  navigationStyleId: 'nav-style-1',
  timestamp: Date.now(),
};
```

## 🎨 UI 设计

### 1. 功能分组

```
主题配置
├── 主题色（影响Ant Design组件）
├── 导航栏
│   ├── 风格样式（风格1、风格2等）
│   └── 深浅色（独立于Ant Design主题）
└── 背景图片
```

### 2. 交互逻辑

- **Ant Design 主题切换**：影响整个应用的 UI 组件样式
- **导航栏深浅色切换**：只影响导航栏组件的样式
- **两者独立**：可以组合使用，互不影响

### 3. 视觉反馈

- 导航栏深浅色选项显示导航栏预览效果
- 当前选中的深浅色有高亮显示
- 与 Ant Design 主题切换完全独立

## 📋 配置对比

### 分离前 vs 分离后

| 配置项          | 分离前               | 分离后                         |
| --------------- | -------------------- | ------------------------------ |
| Ant Design 主题 | `isDarkMode`         | `isDarkMode`                   |
| 导航栏深浅色    | `isDarkMode`（共用） | `isNavigationDarkMode`（独立） |
| 状态管理        | 全局统一             | 分别管理                       |
| 切换逻辑        | 统一切换             | 独立切换                       |

### 配置数据结构

**分离后的配置：**

```json
{
  "selectedThemeColor": "#5147ff",
  "selectedBackgroundId": "bg-variant-1",
  "antdTheme": "light", // Ant Design主题
  "navigationStyle": "dark", // 导航栏深浅色（独立）
  "navigationStyleId": "nav-style-1",
  "timestamp": 1703123456789
}
```

## 🔄 使用场景

### 1. 组合使用

- **浅色 Ant Design + 深色导航栏**：适合需要突出导航栏的场景
- **深色 Ant Design + 浅色导航栏**：适合需要导航栏更醒目的场景
- **浅色 Ant Design + 浅色导航栏**：经典浅色主题
- **深色 Ant Design + 深色导航栏**：经典深色主题

### 2. 独立控制

- 用户可以根据需要独立调整导航栏样式
- 不影响整个应用的 UI 主题
- 提供更灵活的主题配置选项

## 🚀 扩展功能

### 1. 未来可扩展的功能

- **更多导航栏主题**：支持更多导航栏深浅色选项
- **导航栏主题预览**：实时预览导航栏主题效果
- **主题联动**：可选的导航栏与 Ant Design 主题联动
- **自定义导航栏主题**：允许用户自定义导航栏主题

### 2. 技术扩展

- **全局状态管理**：将导航栏主题状态提升到全局状态
- **主题持久化**：将导航栏主题配置保存到用户设置
- **主题同步**：实现导航栏主题的实时同步
- **主题验证**：添加主题配置验证和错误处理

## 📝 实现细节

### 1. 状态初始化

**ThemeConfig 页面：**

```typescript
// 从本地存储恢复导航栏主题配置
useEffect(() => {
  const savedConfig = localStorage.getItem('user-theme-config');
  if (savedConfig) {
    const config = JSON.parse(savedConfig);
    setIsNavigationDarkMode(config.navigationStyle === 'dark');
  }
}, []);
```

**ThemeSwitchPanel 页面：**

```typescript
// 从租户配置获取默认导航栏主题
const [isNavigationDarkMode, setIsNavigationDarkMode] = useState<boolean>(
  tenantThemeConfig.defaultIsDarkMode,
);
```

### 2. 事件处理

```typescript
// 导航栏深浅色切换
const handleNavigationThemeToggle = () => {
  setIsNavigationDarkMode(!isNavigationDarkMode);
  // 可以添加导航栏主题切换的逻辑
  console.log('导航栏主题切换:', !isNavigationDarkMode ? '深色' : '浅色');
};
```

### 3. 样式应用

```typescript
// 根据导航栏主题应用不同样式
<div className={cx(styles.navbarPreview, {
  [styles.lightNavbar]: !isNavigationDarkMode,
  [styles.darkNavbar]: isNavigationDarkMode,
})}>
```

## ⚠️ 注意事项

1. **状态同步**：确保导航栏主题状态在组件间正确同步
2. **配置持久化**：需要将导航栏主题配置保存到用户设置
3. **默认值处理**：确保有合理的默认导航栏主题配置
4. **兼容性**：确保新功能不影响现有的导航栏功能
5. **性能考虑**：避免频繁的主题切换影响性能

## 🔧 后续优化

1. **全局状态管理**：将导航栏主题状态提升到全局状态管理
2. **配置同步**：实现导航栏主题配置的实时同步
3. **主题预览**：在配置时实时预览导航栏主题效果
4. **配置验证**：添加导航栏主题配置验证和错误处理
5. **性能优化**：优化导航栏主题切换的性能和用户体验

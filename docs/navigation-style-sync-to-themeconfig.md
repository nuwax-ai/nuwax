# 导航栏风格配置同步到 ThemeConfig

## 🎯 功能概述

将 ThemeSwitchPanel 中的导航栏风格配置功能同步到 ThemeConfig 页面，使两个页面的导航栏配置保持一致。

## 🔧 技术实现

### 1. NavigationStylePanel 组件更新

**新增功能：**

- 导航栏风格样式选择（风格 1、风格 2 等）
- 导航栏深浅色选择（浅色、深色）
- 分组显示，层次清晰

**组件结构：**

```typescript
interface NavigationStyle {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

interface NavigationStylePanelProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
}
```

**状态管理：**

```typescript
// 导航栏风格配置
const navigationStyles: NavigationStyle[] = [
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

// 导航栏风格状态管理
const [currentNavigationStyle, setCurrentNavigationStyle] =
  useState<string>('nav-style-1');
```

### 2. 样式更新

**新增样式类：**

- `.navigationStyleOptions` - 风格样式选择区域
- `.navigationColorOptions` - 深浅色选择区域
- 统一的`h4`标题样式

**布局结构：**

```less
.navigationStyleOptions {
  margin-bottom: @paddingMd;

  h4 {
    margin: 0 0 @paddingSm 0;
    font-size: @fontSize;
    color: @colorText;
    font-weight: 600;
  }
}

.navigationColorOptions {
  h4 {
    margin: 0 0 @paddingSm 0;
    font-size: @fontSize;
    color: @colorText;
    font-weight: 600;
  }
}
```

### 3. 保存逻辑更新

**ThemeConfig 保存配置：**

```typescript
const themeConfig = {
  selectedThemeColor: primaryColor,
  selectedBackgroundId: backgroundImageId,
  navigationStyle: isDarkMode ? 'dark' : 'light',
  navigationStyleId: 'nav-style-1', // 新增导航栏风格ID
  timestamp: Date.now(),
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

### 2. 交互特点

- **分组显示**：风格样式和深浅色分别显示
- **预览效果**：每个选项都有导航栏预览
- **状态指示**：当前选中的选项有高亮显示
- **工具提示**：hover 时显示风格描述

### 3. 样式一致性

- 与 ThemeSwitchPanel 保持完全一致的 UI 设计
- 使用相同的样式类和布局结构
- 保持相同的交互效果和视觉反馈

## 📋 功能对比

### ThemeConfig vs ThemeSwitchPanel

| 功能           | ThemeConfig       | ThemeSwitchPanel |
| -------------- | ----------------- | ---------------- |
| 主题色选择     | ✅ 支持自定义     | ✅ 仅预设选项    |
| 导航栏风格样式 | ✅ 支持选择       | ✅ 支持选择      |
| 导航栏深浅色   | ✅ 支持切换       | ✅ 支持切换      |
| 背景图片       | ✅ 支持自定义上传 | ✅ 仅预设选项    |
| 保存配置       | ✅ 本地存储       | ❌ 实时应用      |

### 配置数据

**ThemeConfig 保存的配置：**

```json
{
  "selectedThemeColor": "#5147ff",
  "selectedBackgroundId": "bg-variant-1",
  "navigationStyle": "light",
  "navigationStyleId": "nav-style-1",
  "timestamp": 1703123456789
}
```

## 🔄 同步机制

### 1. 组件结构同步

- 两个组件使用相同的 UI 结构和样式
- 保持相同的交互逻辑和状态管理
- 使用相同的类型定义和接口

### 2. 样式同步

- 共享相同的样式类名和结构
- 保持一致的视觉效果和交互反馈
- 使用相同的设计令牌和变量

### 3. 功能同步

- 相同的导航栏风格选项
- 相同的深浅色切换逻辑
- 相同的预览效果和状态指示

## 🚀 扩展功能

### 1. 未来可扩展的功能

- **更多风格样式**：支持更多导航栏风格
- **自定义风格**：允许用户自定义导航栏样式
- **风格预览**：提供更详细的风格预览效果
- **风格联动**：风格样式与深浅色的联动效果

### 2. 技术扩展

- **状态管理优化**：使用全局状态管理导航栏风格
- **配置持久化**：将导航栏风格配置保存到用户设置
- **实时预览**：在配置时实时预览导航栏效果
- **配置同步**：与 ThemeSwitchPanel 实时同步配置

## 📝 使用方式

### 1. 在 ThemeConfig 中使用

```typescript
<NavigationStylePanel isDarkMode={isDarkMode} onThemeToggle={toggleTheme} />
```

### 2. 配置保存

```typescript
const handleSave = async () => {
  const themeConfig = {
    selectedThemeColor: primaryColor,
    selectedBackgroundId: backgroundImageId,
    navigationStyle: isDarkMode ? 'dark' : 'light',
    navigationStyleId: currentNavigationStyle, // 从组件状态获取
    timestamp: Date.now(),
  };

  localStorage.setItem('user-theme-config', JSON.stringify(themeConfig));
};
```

### 3. 配置恢复

```typescript
// 从本地存储恢复配置
const savedConfig = localStorage.getItem('user-theme-config');
if (savedConfig) {
  const config = JSON.parse(savedConfig);
  setCurrentNavigationStyle(config.navigationStyleId || 'nav-style-1');
}
```

## ⚠️ 注意事项

1. **状态管理**：导航栏风格状态目前是组件内部状态，需要与全局状态同步
2. **配置持久化**：需要将导航栏风格配置保存到用户设置中
3. **实时同步**：ThemeConfig 和 ThemeSwitchPanel 的配置需要实时同步
4. **默认值处理**：确保有合理的默认导航栏风格配置
5. **兼容性**：确保新功能不影响现有的导航栏功能

## 🔧 后续优化

1. **全局状态管理**：将导航栏风格状态提升到全局状态
2. **配置同步**：实现 ThemeConfig 和 ThemeSwitchPanel 的配置同步
3. **实时预览**：在配置时实时预览导航栏效果
4. **配置验证**：添加配置验证和错误处理
5. **性能优化**：优化配置切换的性能和用户体验

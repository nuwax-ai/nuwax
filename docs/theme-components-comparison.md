# 主题配置组件对比

## 概述

项目中有两个主要的主题配置组件，它们有不同的用途和行为模式：

## 1. ThemeConfig 页面 (`src/pages/ThemeConfig/index.tsx`)

### 用途

- **正式配置页面**：用于系统管理中的主题配置
- **临时预览模式**：所有切换都是临时预览，需要用户主动保存才能生效

### 特点

- ✅ 支持自定义颜色选择器
- ✅ 支持自定义背景图片上传
- ✅ 所有切换都是临时预览效果，不会立即保存到本地缓存
- ✅ 需要点击"保存配置"按钮才保存到后端和本地缓存
- ✅ 有完整的错误处理和用户反馈

### 工作流程

```
用户修改配置 → 临时预览效果 → 点击保存按钮 → 调用后端API → 保存到本地缓存 → 显示成功提示
```

### 使用场景

- 系统管理员进行正式的主题配置
- 需要持久化保存的配置更改
- 需要审核和确认的配置修改

## 2. ThemeSwitchPanel 组件 (`src/layouts/Setting/ThemeSwitchPanel.tsx`)

### 用途

- **快速切换面板**：用于设置面板中的主题切换
- **立即生效**：所有操作立即生效并直接写入本地缓存

### 特点

- ❌ 不支持自定义颜色选择器 (`enableCustomColor={false}`)
- ❌ 不支持自定义背景图片上传 (`enableCustomUpload={false}`)
- ✅ 所有切换立即生效并直接写入本地缓存
- ✅ 无需保存按钮，立即保存效果
- ✅ 仅更新本地缓存，不调用后端 API

### 工作流程

```
用户修改配置 → 立即生效 → 直接写入本地缓存 → 实时预览效果
```

### 使用场景

- 用户个人设置中的主题切换
- 快速切换和体验不同配置
- 立即生效的主题调整

## 配置优先级

两个组件都遵循相同的配置优先级：

1. **用户本地配置** (最高优先级)

   - 存储位置：`localStorage['xagi-user-theme-config']`
   - 特点：如果存在，完全忽略租户配置

2. **租户配置** (兜底方案)

   - 存储位置：`localStorage['TENANT_CONFIG_INFO'].templateConfig`
   - 特点：仅在本地无配置时生效

3. **系统默认配置** (兜底的兜底)
   - 来源：代码中定义的硬编码默认值

## 技术实现差异

### ThemeConfig 页面

```typescript
// 临时预览，需要用户主动保存
const handleBackgroundChange = (backgroundId: string) => {
  setBackgroundImage(backgroundId); // 临时预览
  // 注意：这里不保存到本地缓存，只是临时预览
  // 用户需要点击"保存配置"按钮才会真正保存
};

const handleSave = async () => {
  // 1. 调用后端API
  await apiSystemConfigUpdate({
    templateConfig: JSON.stringify(themeConfig),
  });

  // 2. 保存到本地缓存
  localStorage.setItem(
    STORAGE_KEYS.USER_THEME_CONFIG,
    JSON.stringify(themeConfig),
  );

  // 3. 显示成功提示
  message.success('主题配置保存成功');
};
```

### ThemeSwitchPanel 组件

```typescript
// 立即生效并直接写入本地缓存
const handleColorChange = (color: string) => {
  setPrimaryColor(color); // 立即应用
  updateLocalThemeCache(); // 立即保存到本地缓存
};

const updateLocalThemeCache = () => {
  // 立即保存到本地存储，实现实时预览效果
  localStorage.setItem(
    STORAGE_KEYS.USER_THEME_CONFIG,
    JSON.stringify(themeConfig),
  );
};
```

## 用户界面差异

### ThemeConfig 页面

- 有"保存配置"按钮
- 有"重置默认"按钮（已注释）
- 显示详细的配置来源信息
- 支持完整的自定义功能

### ThemeSwitchPanel 组件

- 无保存按钮
- 显示简化的配置来源信息
- 限制自定义功能
- 专注于快速切换和预览

## 总结

- **ThemeConfig**：正式的配置管理工具，所有切换都是临时预览，需要用户确认后保存
- **ThemeSwitchPanel**：快速切换工具，所有操作立即生效并直接写入本地缓存

两个组件都遵循相同的配置优先级逻辑，确保本地配置始终优先于租户配置。

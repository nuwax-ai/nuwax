# 主题切换功能文档

## 功能概述

在设置页面中新增了主题切换功能，允许用户根据租户配置的主题选项进行个性化设置。

## 功能特点

### 1. 主题色切换

- 支持多种预设主题色选择
- 主题色数据来自租户配置
- 支持 hover 时边框颜色与背景色一致的效果
- 显示主题色名称标签

### 2. 导航栏风格切换

- 支持浅色/深色模式切换
- 根据租户配置决定是否显示此功能
- 提供直观的预览效果

### 3. 背景图片切换

- 支持多种背景图片选择
- 背景图片数据来自租户配置
- 不支持自定义上传功能

## 技术实现

### 文件结构

```
src/
├── layouts/Setting/
│   ├── ThemeSwitchPanel.tsx      # 主题切换面板组件
│   ├── ThemeSwitchPanel.less     # 主题切换面板样式
│   └── index.tsx                 # 设置页面主组件
├── types/
│   └── tenant.ts                 # 租户相关类型定义
├── services/
│   └── tenant.ts                 # 租户API服务
├── constants/
│   └── menus.constants.tsx       # 菜单常量配置
└── types/enums/
    └── menus.ts                  # 菜单枚举定义
```

### 核心组件

#### ThemeSwitchPanel

- **功能**: 主题切换面板组件
- **特点**: UI 与 ThemeConfig 页面一致，但不支持自定义功能
- **数据源**: 租户主题配置数据

#### 租户主题配置类型

```typescript
interface TenantThemeConfig {
  themeColors: TenantThemeColor[]; // 可用主题色
  backgroundImages: TenantBackgroundImage[]; // 可用背景图片
  defaultThemeColor: string; // 默认主题色
  defaultBackgroundId: string; // 默认背景图片
  supportDarkMode: boolean; // 是否支持深色模式
  defaultIsDarkMode: boolean; // 默认是否为深色模式
}
```

### API 服务

#### getTenantThemeConfig()

- **功能**: 获取租户主题配置
- **返回**: Promise<TenantThemeConfig>
- **实现**: 目前使用模拟数据，实际项目中应调用真实 API

## 使用方法

### 1. 访问主题切换

1. 点击用户头像
2. 选择"设置"
3. 在左侧菜单中点击"主题切换"

### 2. 切换主题色

1. 在主题色区域选择喜欢的颜色
2. 点击颜色块即可应用
3. hover 时显示颜色名称

### 3. 切换导航栏风格

1. 在导航栏区域选择浅色或深色
2. 点击对应的预览块即可切换

### 4. 切换背景图片

1. 在背景图片区域选择喜欢的背景
2. 点击背景预览图即可应用

## 配置说明

### 租户主题配置

租户管理员可以通过后台配置以下内容：

- 可用的主题色列表
- 可用的背景图片列表
- 默认主题色和背景图片
- 是否启用深色模式

### 数据格式示例

```json
{
  "themeColors": [
    { "color": "#5147ff", "name": "蓝色", "isDefault": true },
    { "color": "#ff4d4f", "name": "红色" }
  ],
  "backgroundImages": [
    {
      "id": "bg-variant-1",
      "name": "背景1",
      "preview": "/bg/bg-variant-1.png",
      "url": "/bg/bg-variant-1.png",
      "isDefault": true
    }
  ],
  "defaultThemeColor": "#5147ff",
  "defaultBackgroundId": "bg-variant-1",
  "supportDarkMode": true,
  "defaultIsDarkMode": false
}
```

## 注意事项

1. **数据来源**: 主题和背景图片数据必须来自租户信息 API
2. **权限控制**: 根据租户配置决定显示哪些功能
3. **性能优化**: 只在用户点击主题切换 tab 时才加载数据
4. **错误处理**: 提供加载状态和错误状态的用户反馈
5. **样式一致性**: 与 ThemeConfig 页面保持 UI 风格一致

## 扩展功能

未来可以考虑添加以下功能：

- 主题预览功能
- 主题收藏功能
- 主题分享功能
- 更多自定义选项

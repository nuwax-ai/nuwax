# Layout Navigation CSS 变量初始化实现

## 概述

本实现确保了在页面加载完成、租户信息初始化后，立即设置 layout navigation 相关的 CSS 变量，并在接口失败时提供完善的兜底机制。

## 实现架构

### 1. 核心组件

- **StyleInitializer**: 样式初始化工具类，统一管理 CSS 变量初始化逻辑
- **tenantConfigInfo**: 租户信息模型，在租户信息加载完成后触发样式初始化
- **app.tsx**: 应用启动时的全局样式初始化

### 2. 初始化时机

1. **应用启动时**: 在 `app.tsx` 的 `AppContainer` 组件中立即初始化
2. **租户信息成功加载后**: 在 `tenantConfigInfo.ts` 的 `onSuccess` 回调中初始化
3. **租户信息接口失败时**: 在 `tenantConfigInfo.ts` 的 `onError` 回调中使用兜底方案

## 兜底机制

### 三级兜底策略

1. **第一级**: 使用 `LayoutStyleManager` 的默认配置 (`light-style1`)
2. **第二级**: 如果 `LayoutStyleManager` 失败，直接设置 CSS 变量
3. **第三级**: 如果所有方法都失败，记录错误但不影响应用运行

### 兜底配置内容

兜底配置包含了完整的样式系统，确保在接口失败时也能提供完整的用户体验：

```typescript
// 1. 导航相关 CSS 变量
const defaultNavVars = {
  '--xagi-nav-first-menu-width': '60px', // 导航栏宽度（紧凑模式）
  '--xagi-page-container-margin': '16px', // 页面容器外边距
  '--xagi-page-container-border-radius': '12px', // 页面容器圆角
};

// 2. 布局相关 CSS 变量（深浅色风格）
const defaultLayoutVars = {
  '--xagi-layout-text-primary': '#000000',
  '--xagi-layout-text-secondary': 'rgba(0, 0, 0, 0.85)',
  '--xagi-layout-text-tertiary': 'rgba(0, 0, 0, 0.65)',
  '--xagi-layout-text-disabled': 'rgba(0, 0, 0, 0.25)',
  '--xagi-layout-second-menu-text-color': 'rgba(0, 0, 0, 0.85)',
  '--xagi-layout-bg-primary': 'rgba(255, 255, 255, 0.95)',
  '--xagi-layout-bg-secondary': 'rgba(255, 255, 255, 0.85)',
  '--xagi-layout-bg-card': 'rgba(255, 255, 255, 0.65)',
  '--xagi-layout-bg-input': 'rgba(255, 255, 255, 0.45)',
  '--xagi-layout-border-primary': 'rgba(0, 0, 0, 0.15)',
  '--xagi-layout-border-secondary': 'rgba(0, 0, 0, 0.1)',
  '--xagi-layout-shadow': 'rgba(0, 0, 0, 0.1)',
  '--xagi-layout-overlay': 'rgba(255, 255, 255, 0.7)',
  '--xagi-layout-bg-container': 'rgba(255, 255, 255, 0.95)',
};

// 3. 主题色相关 CSS 变量
const defaultThemeVars = {
  '--xagi-color-primary': '#5147ff', // 默认主题色（蓝色）
  '--xagi-color-success': '#3bb346', // 成功色
  '--xagi-color-warning': '#fc8800', // 警告色
  '--xagi-color-error': '#f93920', // 错误色
  '--xagi-color-info': '#0077fa', // 信息色
  '--xagi-color-link': '#5147ff', // 链接色
};

// 4. 背景图相关 CSS 变量
const defaultBackgroundVars = {
  '--xagi-background-image': 'url(/bg/bg-variant-1.png)', // 默认背景图
};

// 5. Body 类名设置
// 设置 body 类名：xagi-layout-light xagi-nav-style1
// 表示：浅色布局风格 + 紧凑导航模式
```

### 兜底配置特点

1. **默认主题色**: `#5147ff`（蓝色），与项目主色调一致
2. **默认导航栏风格**: `style1`（紧凑模式，60px 宽度）
3. **默认深浅色**: `light`（浅色布局风格）
4. **默认背景图**: `bg-variant-1.png`（星空夜景）
5. **完整的功能色**: 包含成功、警告、错误、信息等所有功能色

## 使用方式

### 正常初始化

```typescript
import { initializeLayoutStyle } from '@/utils/styleInitializer';

// 在租户信息加载成功后调用
initializeLayoutStyle('租户信息初始化完成');
```

### 兜底初始化

```typescript
import { initializeWithFallback } from '@/utils/styleInitializer';

// 在接口失败时调用
initializeWithFallback('租户信息接口失败');
```

## 日志记录

所有初始化过程都有详细的日志记录，便于调试和监控：

- 初始化开始和完成
- 使用的配置类型（默认配置或已保存配置）
- 错误信息和兜底方案执行情况

## 错误处理

- 所有异常都被捕获并记录
- 提供多级兜底机制确保应用正常运行
- 不会因为样式初始化失败而影响应用功能

## 测试场景

1. **正常场景**: 租户信息加载成功，样式正常初始化
2. **接口失败场景**: 租户信息接口失败，使用兜底配置
3. **本地存储异常场景**: localStorage 访问失败，使用默认配置
4. **样式管理器异常场景**: LayoutStyleManager 异常，直接设置 CSS 变量

## 兼容性

- 与现有的 `LayoutStyleManager` 完全兼容
- 不影响现有的主题切换功能
- 支持所有现有的样式配置（light-style1, light-style2, dark-style1, dark-style2）

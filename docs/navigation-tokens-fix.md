# 导航 Token 编译错误修复

## 问题描述

用户删除了背景风格相关的变量定义（如 `@currentStyleBgPrimary` 等），但导航 token 还在引用这些变量，导致编译错误：

```
Variable @currentStyleBgPrimary is undefined
```

## 修复方案

### 1. 修复 token.less 中的变量引用

将导航 token 中的变量引用改为具体的颜色值：

```less
// 修复前
@navFirstMenuBg: var(--xagi-nav-first-menu-color-bg, @currentStyleBgPrimary);
@navSecondMenuBg: var(
  --xagi-nav-second-menu-color-bg,
  @currentStyleBgSecondary
);

// 修复后
@navFirstMenuBg: var(--xagi-nav-first-menu-color-bg, rgba(255, 255, 255, 0.95));
@navSecondMenuBg: var(
  --xagi-nav-second-menu-color-bg,
  rgba(255, 255, 255, 0.85)
);
```

### 2. 修复边框和阴影变量

```less
// 修复前
@navBorderColor: var(--xagi-nav-border-color, @currentStyleBorderPrimary);
@navDividerColor: var(--xagi-nav-divider-color, @currentStyleBorderSecondary);
@navShadow: var(--xagi-nav-shadow, @currentStyleShadow);

// 修复后
@navBorderColor: var(--xagi-nav-border-color, rgba(0, 0, 0, 0.15));
@navDividerColor: var(--xagi-nav-divider-color, rgba(0, 0, 0, 0.1));
@navShadow: var(--xagi-nav-shadow, rgba(0, 0, 0, 0.1));
```

### 3. 修复组件样式文件

更新所有组件样式文件中对已删除变量的引用：

- `src/components/NavigationExample/index.less`
- `src/examples/BackgroundStyleExample.less`
- `src/examples/NavigationTokenExample.less`

### 4. 保持深浅色风格支持

通过 CSS 类名 `.xagi-dark-style` 和 `.xagi-light-style` 来支持深浅色风格切换，而不是依赖已删除的变量。

## 修复后的特性

✅ **编译成功**：所有 Less 文件都能正常编译  
✅ **导航 Token 完整**：所有导航相关的 CSS 变量都可用  
✅ **深浅色支持**：通过 CSS 类名实现风格切换  
✅ **向后兼容**：不影响现有功能  
✅ **独立运行**：导航 token 系统可以独立于背景风格系统工作

## 使用方式

### 在 Less 中使用

```less
.my-navigation {
  width: @navFirstMenuWidth;
  background: @navFirstMenuBg;
  color: @navFirstMenuText;
  border: 1px solid @navBorderColor;
}
```

### 在 CSS 中使用

```css
.my-navigation {
  width: var(--xagi-nav-first-menu-width);
  background: var(--xagi-nav-first-menu-color-bg);
  color: var(--xagi-nav-first-menu-color-text);
  border: 1px solid var(--xagi-nav-border-color);
}
```

### 深浅色风格切换

```less
// 浅色风格（默认）
.my-component {
  color: #000000;
  background: rgba(255, 255, 255, 0.95);
}

// 深色风格
.xagi-dark-style .my-component {
  color: #ffffff;
  background: rgba(0, 0, 0, 0.85);
}
```

## 相关文件

- `src/styles/token.less` - 导航 token 定义
- `src/components/NavigationExample/` - 导航组件示例
- `src/examples/BackgroundStyleExample.tsx` - 背景风格示例
- `src/examples/NavigationTokenExample.tsx` - 导航 token 使用指南

## 总结

通过将变量引用改为具体的颜色值，我们成功修复了编译错误，同时保持了导航 token 系统的完整功能。现在系统可以：

1. 正常编译和运行
2. 支持所有导航相关的 CSS 变量
3. 通过 CSS 类名实现深浅色风格切换
4. 独立于背景风格系统工作

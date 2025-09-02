# 导航 Token 使用指南

## 概述

我们为项目新增了一套完整的导航相关 CSS 变量 token 系统，支持深浅色风格自动切换，与现有的背景图风格系统完美集成。

## 新增的导航 Token

### 布局相关

- `--xagi-nav-background-image`: 导航背景图
- `--xagi-nav-first-menu-width`: 一级菜单宽度 (默认: 60px)
- `--xagi-nav-first-menu-width-expanded`: 一级菜单展开宽度 (默认: 88px)

### 字体相关

- `--xagi-nav-first-menu-font-size`: 一级菜单字体大小 (默认: 14px)
- `--xagi-nav-second-menu-font-size`: 二级菜单字体大小 (默认: 14px)

### 背景色相关

- `--xagi-nav-first-menu-color-bg`: 一级菜单背景色
- `--xagi-nav-second-menu-color-bg`: 二级菜单背景色

### 文字颜色相关（深色风格）

- `--xagi-nav-first-menu-color-text`: 一级菜单主要文字色 (rgba(255, 255, 255, 1))
- `--xagi-nav-first-menu-color-text-secondary`: 一级菜单次要文字色 (rgba(255, 255, 255, 0.8))
- `--xagi-nav-second-menu-color-text`: 二级菜单主要文字色 (rgba(255, 255, 255, 1))
- `--xagi-nav-second-menu-color-text-secondary`: 二级菜单次要文字色 (rgba(255, 255, 255, 0.8))
- `--xagi-nav-second-menu-color-text-tertiary`: 二级菜单三级文字色 (rgba(255, 255, 255, 0.55))

### 文字颜色相关（浅色风格）

当背景风格为浅色时，所有文字颜色自动切换为对应的黑色系：

- rgba(0, 0, 0, 1) - 主要文字
- rgba(0, 0, 0, 0.8) - 次要文字
- rgba(0, 0, 0, 0.55) - 三级文字

### 交互状态相关

- `--xagi-nav-item-hover-bg`: 菜单项悬停背景色
- `--xagi-nav-item-active-bg`: 菜单项激活背景色
- `--xagi-nav-item-selected-bg`: 菜单项选中背景色

### 边框和阴影

- `--xagi-nav-border-color`: 导航边框色
- `--xagi-nav-divider-color`: 导航分割线色
- `--xagi-nav-shadow`: 导航阴影
- `--xagi-nav-first-menu-shadow`: 一级菜单阴影
- `--xagi-nav-second-menu-shadow`: 二级菜单阴影

## 使用方法

### 1. 在 Less 文件中使用

```less
.my-navigation {
  width: @navFirstMenuWidth;
  background: @navFirstMenuBg;
  color: @navFirstMenuText;
  font-size: @navFirstMenuFontSize;

  .menu-item {
    color: @navFirstMenuTextSecondary;

    &:hover {
      background: @navItemHoverBg;
      color: @navFirstMenuText;
    }

    &.active {
      background: @navItemSelectedBg;
      color: @colorPrimary;
    }
  }

  .submenu {
    background: @navSecondMenuBg;
    color: @navSecondMenuText;

    .submenu-item {
      color: @navSecondMenuTextSecondary;

      &.tertiary {
        color: @navSecondMenuTextTertiary;
      }
    }
  }
}
```

### 2. 在 TypeScript 中动态修改

```typescript
import { backgroundStyleManager } from '@/utils/backgroundStyle';

// 设置导航宽度
const setNavWidth = (width: number) => {
  document.documentElement.style.setProperty(
    '--xagi-nav-first-menu-width-expanded',
    `${width}px`,
  );
};

// 设置导航字体大小
const setNavFontSize = (size: number) => {
  document.documentElement.style.setProperty(
    '--xagi-nav-first-menu-font-size',
    `${size}px`,
  );
};

// 获取当前风格下的导航文字颜色
const getNavTextColor = () => {
  const style = backgroundStyleManager.getCurrentStyle();
  return style === 'dark' ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
};
```

### 3. 在 CSS 中直接使用

```css
.custom-navigation {
  width: var(--xagi-nav-first-menu-width-expanded);
  background: var(--xagi-nav-first-menu-color-bg);
  color: var(--xagi-nav-first-menu-color-text);
  font-size: var(--xagi-nav-first-menu-font-size);
  box-shadow: var(--xagi-nav-first-menu-shadow);
}

.nav-submenu {
  background: var(--xagi-nav-second-menu-color-bg);
  color: var(--xagi-nav-second-menu-color-text);
}

.nav-submenu-secondary {
  color: var(--xagi-nav-second-menu-color-text-secondary);
}

.nav-submenu-tertiary {
  color: var(--xagi-nav-second-menu-color-text-tertiary);
}
```

## 自动风格切换

导航 token 与背景风格系统完全集成：

1. **深色背景图** → 自动应用深色导航风格（白色文字）
2. **浅色背景图** → 自动应用浅色导航风格（黑色文字）
3. **手动切换** → 用户可以覆盖系统推荐，手动选择风格

### 透明度层级

所有文字颜色都遵循统一的透明度层级：

- **主要文字**: 100% 不透明度
- **次要文字**: 80% 透明度
- **三级文字**: 55% 透明度

## 示例组件

项目中提供了完整的示例：

1. **NavigationExample** (`src/components/NavigationExample/`) - 完整的导航组件示例
2. **NavigationTokenExample** (`src/examples/NavigationTokenExample.tsx`) - 详细的 token 使用指南
3. **BackgroundStyleExample** (`src/examples/BackgroundStyleExample.tsx`) - 集成了导航预览的背景风格示例

## 最佳实践

### ✅ 推荐做法

1. **使用 Less 变量**：优先使用 `@navFirstMenuText` 而不是直接使用 CSS 变量
2. **配合风格系统**：让 token 根据背景风格自动切换，避免手动设置固定颜色
3. **响应式设计**：考虑移动端的显示效果和交互体验
4. **无障碍访问**：确保颜色对比度符合标准
5. **流畅动画**：使用 CSS transition 实现平滑的状态转换

### ❌ 避免做法

1. 不要硬编码颜色值，这会破坏自动风格切换
2. 不要忽略移动端适配
3. 不要使用过于复杂的嵌套结构
4. 不要忘记处理悬停和激活状态

## 兼容性

- ✅ 与现有 Ant Design 主题系统完全兼容
- ✅ 支持所有现代浏览器的 CSS 变量特性
- ✅ 向后兼容，不会影响现有代码
- ✅ 支持 SSR（服务端渲染）

## 更新日志

### v1.0.0 (2024-01-01)

- 🎉 新增完整的导航 token 系统
- 🎨 支持深浅色风格自动切换
- 📱 添加响应式设计支持
- 🧭 提供完整的导航组件示例
- 📚 创建详细的使用文档

## 相关文件

- `src/styles/token.less` - token 定义
- `src/utils/backgroundStyle.ts` - 风格管理器
- `src/components/NavigationExample/` - 导航组件示例
- `src/examples/NavigationTokenExample.tsx` - token 使用示例
- `docs/navigation-tokens-guide.md` - 本文档

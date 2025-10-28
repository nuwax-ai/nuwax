# 导航栏深浅色与背景图片联动切换功能

## 🎯 功能概述

实现了导航栏深浅色与系统内置背景图片的双向联动切换逻辑：

### 背景 → 导航栏联动

- **暗色背景** → 自动切换为 **深色导航栏**
- **亮色背景** → 自动切换为 **浅色导航栏**

### 导航栏 → 背景联动

- **深色导航栏** → 如果当前背景不匹配，自动切换到 **暗色背景**
- **浅色导航栏** → 如果当前背景不匹配，自动切换到 **亮色背景**

## 🔧 技术实现

### 1. 背景配置映射关系

在 `src/utils/backgroundStyle.ts` 中定义了背景图片与导航栏深浅色的映射关系：

```typescript
export const backgroundConfigs: BackgroundConfig[] = [
  {
    id: 'variant-1',
    name: '星空夜景',
    url: '/bg/bg-variant-1.png',
    layoutStyle: 'dark', // 暗色背景 → 深色导航栏
    description: '深色背景，适合深色布局风格',
  },
  {
    id: 'variant-2',
    name: '云朵白天',
    url: '/bg/bg-variant-2.png',
    layoutStyle: 'light', // 亮色背景 → 浅色导航栏
    description: '浅色背景，适合浅色布局风格',
  },
  // ... 其他背景配置
];
```

### 2. 背景服务联动功能

在 `src/services/backgroundService.ts` 中添加了双向联动功能：

#### 背景 → 导航栏联动

```typescript
/**
 * 设置背景图片
 * @param backgroundId 背景图片ID
 * @param enableAutoLayoutStyle 是否自动联动切换导航栏深浅色，默认为true
 */
setBackground(backgroundId: string, enableAutoLayoutStyle: boolean = true): void {
  // ... 设置背景图片逻辑

  // 自动联动切换导航栏深浅色
  if (enableAutoLayoutStyle) {
    this.syncLayoutStyleWithBackground(backgroundId);
  }
}

/**
 * 根据背景图片自动同步布局风格（导航栏深浅色）
 */
private syncLayoutStyleWithBackground(backgroundId: string): void {
  // 将背景ID转换为布局风格管理器中的ID格式
  const layoutBackgroundId = backgroundId.replace('bg-', '');

  // 使用布局风格管理器设置背景，这会自动应用对应的布局风格
  layoutStyleManager.setBackground(layoutBackgroundId);
}
```

#### 导航栏 → 背景联动

```typescript
/**
 * 根据布局风格查找匹配的背景图片
 * @param layoutStyle 布局风格 ('light' | 'dark')
 * @returns 匹配的背景图片ID，如果没有找到则返回null
 */
findMatchingBackgroundByLayoutStyle(layoutStyle: 'light' | 'dark'): string | null {
  // 获取所有背景配置
  const allBackgrounds = layoutStyleManager.getAllBackgrounds();

  // 查找匹配布局风格的第一个背景
  const matchingBackground = allBackgrounds.find(
    (bg) => bg.layoutStyle === layoutStyle
  );

  if (matchingBackground) {
    // 将布局风格管理器ID格式转换为背景服务ID格式
    return `bg-${matchingBackground.id}`;
  }

  return null;
}

/**
 * 根据布局风格自动切换匹配的背景图片
 * @param layoutStyle 布局风格 ('light' | 'dark')
 * @returns 是否成功切换了背景
 */
autoSwitchBackgroundByLayoutStyle(layoutStyle: 'light' | 'dark'): boolean {
  // 检查当前背景是否已经匹配
  if (this.isCurrentBackgroundMatchingLayoutStyle(layoutStyle)) {
    return false;
  }

  // 查找匹配的背景
  const matchingBackgroundId = this.findMatchingBackgroundByLayoutStyle(layoutStyle);

  if (matchingBackgroundId) {
    // 切换背景但不触发布局风格联动（避免循环）
    this.setBackground(matchingBackgroundId, false);
    return true;
  }

  return false;
}
```

### 3. 页面组件集成

#### ThemeConfig 页面

在 `src/pages/ThemeConfig/index.tsx` 中实现了双向联动逻辑：

**背景 → 导航栏联动：**

```typescript
// 背景图片切换处理（带联动逻辑）
const handleBackgroundChange = (backgroundId: string) => {
  // 设置背景图片
  setBackgroundImage(backgroundId);

  // 根据背景图片自动切换导航栏深浅色
  const newLayoutStyle = getLayoutStyleByBackgroundId(backgroundId);
  setLayoutStyle(newLayoutStyle);
  setIsNavigationDarkMode(newLayoutStyle === 'dark');

  // 显示联动提示
  const backgroundConfig = backgroundConfigs.find(
    (config) => config.id === backgroundId.replace('bg-', ''),
  );
  if (backgroundConfig) {
    message.info(
      `已自动切换为${newLayoutStyle === 'dark' ? '深色' : '浅色'}导航栏`,
    );
  }
};
```

**导航栏 → 背景联动：**

```typescript
// 切换导航栏深浅色（集成到布局风格管理，带背景自动匹配）
const handleNavigationThemeToggle = () => {
  const newLayoutStyle = layoutStyle === 'light' ? 'dark' : 'light';
  setLayoutStyle(newLayoutStyle);
  setIsNavigationDarkMode(newLayoutStyle === 'dark');

  // 检查当前背景是否与新的导航栏深浅色匹配
  const currentBackgroundLayoutStyle =
    getLayoutStyleByBackgroundId(backgroundImageId);

  if (currentBackgroundLayoutStyle !== newLayoutStyle) {
    // 当前背景不匹配，自动切换到匹配的背景
    const matchingBackgroundId = backgroundConfigs.find(
      (config) => config.layoutStyle === newLayoutStyle,
    );

    if (matchingBackgroundId) {
      // 切换背景但不触发布局风格联动（避免循环）
      setBackgroundImage(`bg-${matchingBackgroundId.id}`);

      // 显示背景自动匹配提示
      message.info(
        `已自动切换为${matchingBackgroundId.name}以匹配${
          newLayoutStyle === 'dark' ? '深色' : '浅色'
        }导航栏`,
      );
    }
  }
};
```

#### ThemeSwitchPanel 组件

在 `src/layouts/Setting/ThemeSwitchPanel.tsx` 中实现了相同的双向联动逻辑。

## 🎨 背景与导航栏映射表

| 背景图片 | 背景类型 | 导航栏深浅色 | 说明 |
| --- | --- | --- | --- |
| 星空夜景 (variant-1) | 暗色 | 深色 | 深色背景，适合深色布局风格 |
| 云朵白天 (variant-2) | 亮色 | 浅色 | 浅色背景，适合浅色布局风格 |
| 森林晨光 (variant-3) | 亮色 | 浅色 | 明亮背景，适合浅色布局风格 |
| 深海夜色 (variant-4) | 暗色 | 深色 | 深色背景，适合深色布局风格 |
| 梦幻紫色 (variant-5) | 暗色 | 深色 | 深色调背景，适合深色布局风格 |
| 温暖阳光 (variant-6) | 亮色 | 浅色 | 温暖色调，适合浅色布局风格 |
| 夜晚都市 (variant-7) | 暗色 | 深色 | 都市夜景，适合深色布局风格 |
| 清新蓝天 (variant-8) | 亮色 | 浅色 | 清新明亮，适合浅色布局风格 |

## 🚀 使用方法

### 1. 在主题配置页面

1. 访问主题配置页面
2. 在背景图片选择区域选择任意背景
3. 系统会自动根据背景的明暗程度切换导航栏深浅色
4. 页面会显示联动提示信息

### 2. 在主题切换面板

1. 在设置面板的主题切换区域
2. 选择不同的背景图片
3. 导航栏深浅色会自动联动切换

### 3. 编程方式

```typescript
import backgroundService from '@/services/backgroundService';

// 设置背景图片（会自动联动切换导航栏深浅色）
backgroundService.setBackground('bg-variant-1');

// 设置背景图片但不联动切换导航栏深浅色
backgroundService.setBackground('bg-variant-1', false);
```

## 🔄 联动逻辑

### 背景 → 导航栏联动

1. **背景切换触发**：用户选择新的背景图片
2. **ID 格式转换**：将 `bg-variant-1` 转换为 `variant-1`
3. **查找配置**：在 `backgroundConfigs` 中查找对应的布局风格配置
4. **应用风格**：使用 `layoutStyleManager` 应用对应的布局风格
5. **更新状态**：更新导航栏深浅色状态
6. **用户提示**：显示联动切换的提示信息

### 导航栏 → 背景联动

1. **导航栏切换触发**：用户手动切换导航栏深浅色
2. **检查匹配性**：检查当前背景是否与新的导航栏深浅色匹配
3. **查找匹配背景**：如果不匹配，查找能匹配的第一个背景图片
4. **自动切换背景**：切换到匹配的背景图片（不触发布局风格联动，避免循环）
5. **用户提示**：显示背景自动匹配的提示信息

## 🎯 优势

- **双向智能联动**：背景和导航栏可以相互自动匹配，提供完整的联动体验
- **用户体验**：自动匹配背景与导航栏风格，提供一致的视觉体验
- **智能匹配**：无需用户手动调整，系统自动选择最佳搭配
- **防循环机制**：避免背景和导航栏之间的无限循环切换
- **可配置性**：支持禁用自动联动，允许用户手动控制
- **一致性**：确保暗色背景配深色导航栏，亮色背景配浅色导航栏
- **用户提示**：每次联动切换都会显示友好的提示信息

## 🔧 扩展性

如需添加新的背景图片，只需在 `backgroundConfigs` 中添加配置：

```typescript
{
  id: 'variant-9',
  name: '新背景',
  url: '/bg/bg-variant-9.png',
  layoutStyle: 'dark', // 或 'light'
  description: '新背景描述',
}
```

系统会自动支持新背景的联动切换功能。

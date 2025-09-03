# 样式配置重构文档

## 🎯 重构目标

将 `navStyle` 与 `layoutStyle` 对应的 CSS 变量直接维护为四个配置，使逻辑更清晰，切换处理更统一。

## 🔧 重构架构

### 1. 样式配置常量文件

样式配置已抽取到独立的常量文件 `src/constants/theme.constants.ts`，包含：

- `StyleConfig` 接口定义
- `STYLE_CONFIGS` 配置对象
- `STYLE_CONFIG_KEYS` 键名常量
- `ALL_STYLE_CONFIG_KEYS` 所有键名数组
- `StyleConfigKey` 类型定义

### 2. 四个样式配置

重构后，系统维护四个完整的样式配置：

| 配置键名       | 布局风格 | 导航风格 | 说明                          |
| -------------- | -------- | -------- | ----------------------------- |
| `light-style1` | 浅色     | 紧凑模式 | 浅色背景 + 60px 导航栏 + 圆角 |
| `light-style2` | 浅色     | 展开模式 | 浅色背景 + 88px 导航栏 + 直角 |
| `dark-style1`  | 深色     | 紧凑模式 | 深色背景 + 60px 导航栏 + 圆角 |
| `dark-style2`  | 深色     | 展开模式 | 深色背景 + 88px 导航栏 + 直角 |

### 2. 样式配置结构

```typescript
interface StyleConfig {
  /** 布局相关的CSS变量 */
  layout: {
    '--xagi-layout-text-primary': string;
    '--xagi-layout-text-secondary': string;
    '--xagi-layout-text-tertiary': string;
    '--xagi-layout-text-disabled': string;
    '--xagi-layout-second-menu-text-color': string;
    '--xagi-layout-bg-primary': string;
    '--xagi-layout-bg-secondary': string;
    '--xagi-layout-bg-card': string;
    '--xagi-layout-bg-input': string;
    '--xagi-layout-border-primary': string;
    '--xagi-layout-border-secondary': string;
    '--xagi-layout-shadow': string;
    '--xagi-layout-overlay': string;
    '--xagi-layout-bg-container': string;
  };
  /** 导航相关的CSS变量 */
  navigation: {
    '--xagi-nav-first-menu-width': string;
    '--xagi-page-container-margin': string;
    '--xagi-page-container-border-radius': string;
  };
}
```

### 3. 统一的样式应用逻辑

重构前的问题：

- `applyLayoutStyle()` 和 `applyNavigationStyle()` 方法逻辑复杂
- 需要根据当前状态动态计算 CSS 变量
- 代码重复，难以维护

重构后的优势：

- 统一的 `applyStyleConfig()` 方法
- 直接使用预定义的配置，无需动态计算
- 逻辑清晰，易于维护和扩展

## 🚀 新的 API

### 样式配置常量

```typescript
import {
  STYLE_CONFIGS,
  STYLE_CONFIG_KEYS,
  ALL_STYLE_CONFIG_KEYS,
  StyleConfig,
  StyleConfigKey,
} from '@/constants/styleConfig';

// 使用样式配置
const lightStyle1Config = STYLE_CONFIGS[STYLE_CONFIG_KEYS.LIGHT_STYLE1];

// 获取所有配置键名
const allKeys = ALL_STYLE_CONFIG_KEYS;
console.log(allKeys); // ['light-style1', 'light-style2', 'dark-style1', 'dark-style2']
```

### LayoutStyleManager 类新增方法

```typescript
/**
 * 获取当前样式配置键名
 */
getCurrentStyleConfigKey(): string

/**
 * 获取所有可用的样式配置键名
 */
getAllStyleConfigKeys(): string[]

/**
 * 根据样式配置键名直接设置样式
 * @param configKey 样式配置键名，格式为 'layoutStyle-navStyle'
 */
setStyleByConfigKey(configKey: string): void
```

### useLayoutStyle Hook 新增方法

```typescript
const {
  // ... 原有方法
  getCurrentStyleConfigKey,
  getAllStyleConfigKeys,
  setStyleByConfigKey,
} = useLayoutStyle();
```

## 🔄 使用示例

### 1. 直接设置样式配置

```typescript
// 设置为深色 + 展开模式
layoutStyleManager.setStyleByConfigKey('dark-style2');

// 设置为浅色 + 紧凑模式
layoutStyleManager.setStyleByConfigKey('light-style1');
```

### 2. 获取当前配置信息

```typescript
// 获取当前样式配置键名
const currentConfig = layoutStyleManager.getCurrentStyleConfigKey();
console.log(currentConfig); // 输出: 'dark-style1'

// 获取所有可用配置
const allConfigs = layoutStyleManager.getAllStyleConfigKeys();
console.log(allConfigs); // 输出: ['light-style1', 'light-style2', 'dark-style1', 'dark-style2']
```

### 3. 在 React 组件中使用

```typescript
const MyComponent = () => {
  const {
    getCurrentStyleConfigKey,
    setStyleByConfigKey,
    getAllStyleConfigKeys,
  } = useLayoutStyle();

  const handleStyleChange = (configKey: string) => {
    setStyleByConfigKey(configKey);
  };

  return (
    <div>
      <p>当前配置: {getCurrentStyleConfigKey()}</p>
      {getAllStyleConfigKeys().map((configKey) => (
        <button key={configKey} onClick={() => handleStyleChange(configKey)}>
          {configKey}
        </button>
      ))}
    </div>
  );
};
```

## 🎯 重构优势

### 1. 逻辑清晰

- 每个样式配置都是完整的、预定义的
- 不需要动态计算 CSS 变量
- 代码结构更加清晰

### 2. 统一处理

- 不管切换 `layoutStyle` 还是 `navStyle`，都使用同一个方法
- 避免了复杂的条件判断和状态依赖

### 3. 易于维护

- 新增样式配置只需要在 `styleConfigs` 中添加
- 修改样式只需要更新对应的配置对象
- 不需要修改应用逻辑

### 4. 性能优化

- 减少了运行时的计算
- 预定义的配置提高了应用效率

### 5. 扩展性强

- 可以轻松添加新的样式配置
- 支持更复杂的样式组合

## 🔧 迁移指南

### 对于现有代码

现有的 API 保持不变，向后兼容：

```typescript
// 这些方法仍然可以正常使用
layoutStyleManager.setLayoutStyle('dark');
layoutStyleManager.setNavigationStyle('style2');
layoutStyleManager.toggleLayoutStyle();
layoutStyleManager.toggleNavigationStyle();
```

### 推荐使用新 API

```typescript
// 推荐使用新的统一方法
layoutStyleManager.setStyleByConfigKey('dark-style2');
```

## 📝 注意事项

1. **向后兼容**：所有现有的 API 都保持兼容，不会破坏现有代码
2. **配置完整性**：每个样式配置都包含完整的 CSS 变量定义
3. **事件系统**：样式变更仍然会触发相应的事件，保持现有的事件监听机制
4. **本地存储**：配置仍然会保存到本地存储，支持页面刷新后恢复

## 🎉 总结

通过这次重构，我们实现了：

- ✅ 四个完整的样式配置，逻辑清晰
- ✅ 统一的样式应用方法，处理一致
- ✅ 向后兼容的 API，平滑迁移
- ✅ 更好的可维护性和扩展性
- ✅ 性能优化，减少运行时计算

重构后的代码更加清晰、统一，为后续的功能扩展奠定了良好的基础。

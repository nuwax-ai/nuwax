# 背景切换无重新加载实现方案

## 🎯 问题描述

之前的背景切换功能在`useGlobalSettings.ts`中使用了`window.location.reload()`来重新加载页面，这会导致用户体验不佳，页面状态丢失。

## ✅ 解决方案

### 1. 移除页面重新加载逻辑

**修改前:**

```typescript
const setBackgroundImage = (backgroundImageId: string) => {
  backgroundService.setBackground(backgroundImageId);
  saveSettings({ ...settings, backgroundImageId });
  setTimeout(() => {
    window.location.reload(); // ❌ 导致页面重新加载
  }, 300);
};
```

**修改后:**

```typescript
const setBackgroundImage = (backgroundImageId: string) => {
  backgroundService.setBackground(backgroundImageId);
  saveSettings({ ...settings, backgroundImageId });
  // ✅ 移除页面重新加载，使用事件系统通知组件更新
};
```

### 2. 增强背景服务的事件系统

在`backgroundService.ts`中添加了 CSS 变量更新功能：

```typescript
/**
 * 更新CSS变量
 * @param background 背景图片对象
 */
private updateCSSVariable(background: BackgroundImage): void {
  try {
    // 更新CSS变量
    document.documentElement.style.setProperty(
      '--xagi-background-image',
      `url(${background.path})`,
    );

    // 触发自定义事件，通知其他组件背景已更新
    window.dispatchEvent(
      new CustomEvent('xagi-background-updated', {
        detail: {
          backgroundId: background.id,
          backgroundPath: background.path,
          backgroundName: background.name,
        },
      }),
    );
  } catch (error) {
    console.error('Failed to update CSS variable:', error);
  }
}
```

### 3. 完善 Hook 的事件监听

在`useGlobalSettings.ts`中添加了背景变化监听：

```typescript
// 监听背景服务的变化，同步更新状态
useEffect(() => {
  const handleBackgroundChanged = (background: BackgroundImage) => {
    setSettings((prev) => ({
      ...prev,
      backgroundImageId: background.id,
    }));
  };

  // 添加事件监听器
  backgroundService.addEventListener(
    'backgroundChanged',
    handleBackgroundChanged,
  );

  // 清理函数
  return () => {
    backgroundService.removeEventListener(
      'backgroundChanged',
      handleBackgroundChanged,
    );
  };
}, []);
```

## 🔧 技术实现细节

### 1. CSS 变量更新机制

- **变量名**: `--xagi-background-image`
- **更新方式**: 直接操作`document.documentElement.style`
- **触发时机**: 背景切换时立即更新

### 2. 事件系统

**背景服务事件:**

- `backgroundChanged`: 背景图片变化时触发
- `backgroundsUpdated`: 背景列表更新时触发

**全局事件:**

- `xagi-background-updated`: CSS 变量更新后触发
- `xagi-global-settings-changed`: 全局设置变化时触发

### 3. 状态同步

- **本地存储**: 自动保存背景设置到 localStorage
- **状态管理**: 通过事件系统同步所有组件的状态
- **CSS 应用**: 立即更新 CSS 变量，无需等待

## 🧪 测试验证

创建了测试页面 `/test/background` 来验证功能：

### 测试内容

1. **时间显示**: 每秒更新时间，验证页面未重新加载
2. **背景切换**: 点击不同背景按钮
3. **状态同步**: 验证当前背景状态正确显示
4. **事件监听**: 监听背景更新事件

### 测试方法

```typescript
// 访问测试页面
// http://localhost:8000/test/background

// 观察要点：
// 1. 时间是否持续更新（每秒变化）
// 2. 点击背景按钮后时间是否继续更新
// 3. 背景是否立即切换
// 4. 控制台是否输出背景更新事件
```

## 📋 使用方式

### 1. 在组件中使用

```typescript
import { useGlobalSettings } from '@/hooks/useGlobalSettings';

const MyComponent = () => {
  const { backgroundImageId, setBackgroundImage, backgroundImages } =
    useGlobalSettings();

  return (
    <div>
      <p>当前背景: {backgroundImageId}</p>
      {backgroundImages.map((bg) => (
        <button key={bg.id} onClick={() => setBackgroundImage(bg.id)}>
          {bg.name}
        </button>
      ))}
    </div>
  );
};
```

### 2. 监听背景更新事件

```typescript
useEffect(() => {
  const handleBackgroundUpdate = (event: CustomEvent) => {
    console.log('背景已更新:', event.detail);
    // 处理背景更新逻辑
  };

  window.addEventListener(
    'xagi-background-updated',
    handleBackgroundUpdate as EventListener,
  );

  return () => {
    window.removeEventListener(
      'xagi-background-updated',
      handleBackgroundUpdate as EventListener,
    );
  };
}, []);
```

## 🎨 CSS 变量使用

在 CSS 中使用背景变量：

```css
.my-background {
  background-image: var(--xagi-background-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
```

## ⚡ 性能优化

1. **事件防抖**: 避免频繁的背景切换
2. **状态缓存**: 使用 useMemo 缓存计算结果
3. **事件清理**: 正确清理事件监听器
4. **错误处理**: 完善的错误捕获和日志记录

## 🔄 兼容性

- **向后兼容**: 保持原有的 API 接口不变
- **渐进增强**: 新功能不影响现有功能
- **降级处理**: 如果 CSS 变量更新失败，不影响其他功能

## 📝 注意事项

1. **CSS 变量支持**: 确保目标浏览器支持 CSS 自定义属性
2. **事件清理**: 组件卸载时正确清理事件监听器
3. **错误处理**: 处理 CSS 变量更新可能的异常
4. **性能监控**: 监控背景切换的性能影响

## 🚀 未来扩展

1. **背景预加载**: 预加载背景图片提升切换体验
2. **动画过渡**: 添加背景切换的过渡动画
3. **批量更新**: 支持批量背景设置更新
4. **主题联动**: 背景与主题色的联动效果

# 动态主题背景切换功能

## 功能概述

本项目实现了动态切换主题背景的功能，用户可以在8种不同的背景图片之间自由切换，为应用提供个性化的视觉体验。

## 主要特性

- 🎨 **8种预设背景**：提供8种不同风格的背景图片
- 🔄 **实时切换**：背景图片切换即时生效，无需刷新页面
- 💾 **状态持久化**：用户选择的背景图片会保存到本地存储
- 🌓 **主题适配**：支持明暗主题，背景图片在不同主题下都有良好的显示效果
- 📱 **响应式设计**：背景图片自适应不同屏幕尺寸
- �� **多语言支持**：支持中英文界面
- 🚀 **全局挂载**：提供全局服务、Hook和组件，可在任何地方使用

## 使用方法

### 1. 通过主题控制面板切换

在页面右下角的主题控制面板中，点击"背景"按钮，会弹出背景选择器：

```
主题控制面板 → 背景 → 选择背景图片
```

### 2. 在主题演示页面测试

访问 `/examples` 路由下的主题演示页面，可以：
- 查看当前背景图片
- 快速切换不同背景
- 预览背景效果
- 使用完整的背景管理功能

### 3. 全局挂载使用

#### 使用全局服务

```typescript
import backgroundService from '@/services/backgroundService';

// 设置背景
backgroundService.setBackground('bg-variant-2');

// 随机切换背景
backgroundService.randomBackground();

// 添加自定义背景
backgroundService.addBackground({
  id: 'custom-bg-1',
  name: '自定义背景',
  path: '/bg/custom-bg.png',
  preview: '/bg/custom-bg-preview.png',
});

// 监听背景变化
backgroundService.addEventListener('backgroundChanged', (background) => {
  console.log('背景已切换到:', background.name);
});
```

#### 使用React Hook

```typescript
import { useBackground } from '@/hooks/useBackground';

const MyComponent = () => {
  const {
    currentBackground,
    backgroundImages,
    setBackground,
    randomBackground,
    addBackground,
  } = useBackground();

  return (
    <div>
      <p>当前背景: {currentBackground?.name}</p>
      <button onClick={() => setBackground('bg-variant-3')}>
        切换到背景3
      </button>
      <button onClick={randomBackground}>
        随机切换
      </button>
    </div>
  );
};
```

#### 使用预置组件

```typescript
// 快速切换组件
import BackgroundQuickSwitch from '@/components/BackgroundQuickSwitch';

<BackgroundQuickSwitch 
  type="primary"
  size="large"
  showRandom={true}
  showSettings={true}
/>

// 完整管理组件
import GlobalBackgroundManager from '@/components/GlobalBackgroundManager';

<GlobalBackgroundManager />
```

## 技术实现

### 核心架构

1. **全局服务层** (`src/services/backgroundService.ts`)
   - 提供背景图片的增删改查功能
   - 管理背景状态和本地存储
   - 支持事件监听和通知机制

2. **React Hook层** (`src/hooks/useBackground.ts`)
   - 提供响应式的背景状态管理
   - 自动同步全局服务状态
   - 支持组件级别的背景操作

3. **UI组件层**
   - `ThemeControlPanel`: 集成到主题控制面板
   - `BackgroundQuickSwitch`: 轻量级快速切换组件
   - `GlobalBackgroundManager`: 完整的背景管理界面

4. **布局应用层** (`src/layouts/index.tsx`)
   - 将背景图片应用到整个应用布局
   - 使用CSS变量动态设置背景

### 全局服务特性

- **单例模式**: 确保全局只有一个背景服务实例
- **事件系统**: 支持背景变化和背景列表更新事件
- **本地存储**: 自动保存和恢复背景设置
- **错误处理**: 完善的错误处理和日志记录
- **类型安全**: 完整的TypeScript类型定义

### Hook特性

- **响应式**: 自动响应背景状态变化
- **性能优化**: 使用useMemo和useCallback优化渲染
- **事件管理**: 自动管理事件监听器的生命周期
- **状态同步**: 与全局服务保持状态同步

### 组件特性

- **可配置**: 支持多种配置选项
- **响应式**: 自动适配不同屏幕尺寸
- **主题适配**: 支持明暗主题切换
- **国际化**: 支持中英文界面

## 文件结构

```
src/
├── services/
│   └── backgroundService.ts          # 全局背景管理服务
├── hooks/
│   ├── useGlobalSettings.ts          # 全局设置管理
│   └── useBackground.ts              # 背景管理Hook
├── components/
│   ├── ThemeControlPanel/            # 主题控制面板
│   ├── BackgroundQuickSwitch/        # 快速切换组件
│   └── GlobalBackgroundManager/      # 完整管理组件
├── layouts/
│   ├── index.tsx                     # 主布局组件
│   └── index.less                    # 布局样式
├── locales/                          # 国际化文件
│   ├── zh-CN.ts                     # 中文
│   └── en-US.ts                     # 英文
└── examples/
    └── ThemeDemo.tsx                 # 主题演示页面

public/
└── bg/                              # 背景图片资源
    ├── bg-variant-1.png
    ├── bg-variant-2.png
    └── ...
```

## 全局挂载实现

### 1. 服务层挂载

背景服务通过单例模式实现全局挂载：

```typescript
// 创建全局单例实例
export const backgroundService = new BackgroundService();

// 导出便捷方法
export const {
  setBackground,
  randomBackground,
  addBackground,
  // ... 更多方法
} = backgroundService;
```

### 2. Hook层挂载

通过React Hook提供响应式的全局状态管理：

```typescript
export const useBackground = () => {
  // 自动监听全局服务状态变化
  useEffect(() => {
    const handleBackgroundChanged = (background) => {
      setCurrentBackground(background);
    };
    
    backgroundService.addEventListener('backgroundChanged', handleBackgroundChanged);
    return () => backgroundService.removeEventListener('backgroundChanged', handleBackgroundChanged);
  }, []);
  
  // 返回状态和方法
  return { currentBackground, setBackground, /* ... */ };
};
```

### 3. 组件层挂载

提供多种预置组件，可在任何地方使用：

```typescript
// 在任何组件中直接使用
import BackgroundQuickSwitch from '@/components/BackgroundQuickSwitch';

const MyPage = () => (
  <div>
    <h1>我的页面</h1>
    <BackgroundQuickSwitch />
  </div>
);
```

### 4. 布局层挂载

在应用根布局中自动应用背景：

```typescript
const Layout = () => {
  const { getBackgroundImageStyle } = useGlobalSettings();
  
  return (
    <div style={getBackgroundImageStyle}>
      {/* 整个应用内容 */}
    </div>
  );
};
```

## 自定义背景图片

### 添加新的背景图片

1. 将新的背景图片放入 `public/bg/` 目录
2. 在 `useGlobalSettings.ts` 中添加配置：

```typescript
{
  id: 'bg-variant-9',
  name: '背景样式9',
  path: '/bg/bg-variant-9.png',
  preview: '/bg/bg-variant-9.png',
}
```

### 动态添加背景图片

```typescript
import backgroundService from '@/services/backgroundService';

// 运行时添加背景
backgroundService.addBackground({
  id: 'dynamic-bg-1',
  name: '动态背景',
  path: '/bg/dynamic-bg.png',
  preview: '/bg/dynamic-bg-preview.png',
});
```

### 修改背景图片样式

可以在 `src/layouts/index.less` 中调整背景图片的显示效果：

```less
.container {
  &::before {
    // 修改背景图片的显示方式
    background-size: contain;        // 改为contain
    background-position: top left;   // 改为左上角对齐
    background-attachment: scroll;   // 改为滚动跟随
  }
}
```

## 性能优化

- 使用 `useMemo` 缓存背景图片样式计算
- 背景图片切换使用CSS过渡动画，提升用户体验
- 背景图片通过CSS伪元素实现，避免额外的DOM节点
- 事件监听器自动清理，避免内存泄漏
- 本地存储操作异步化，避免阻塞主线程

## 浏览器兼容性

- 支持所有现代浏览器
- CSS变量和伪元素兼容性良好
- 本地存储支持所有主流浏览器
- 事件系统兼容所有现代浏览器

## 注意事项

1. **图片大小**：建议背景图片大小控制在2MB以内，避免影响加载性能
2. **图片格式**：推荐使用PNG或WebP格式，支持透明度和更好的压缩
3. **响应式**：背景图片会自动适应不同屏幕尺寸
4. **性能**：背景图片切换不会影响页面性能，因为使用了CSS变量
5. **全局状态**：背景服务是全局单例，确保状态一致性

## 故障排除

### 背景图片不显示

1. 检查图片路径是否正确
2. 确认图片文件是否存在于 `public/bg/` 目录
3. 检查浏览器控制台是否有404错误

### 背景图片切换不生效

1. 检查 `useBackground` Hook 是否正确导入
2. 确认组件是否正确使用Hook
3. 检查CSS变量是否正确设置

### 样式冲突

1. 检查是否有其他CSS规则覆盖了背景样式
2. 确认z-index设置是否正确
3. 检查是否有全局样式影响

### 全局服务问题

1. 检查 `backgroundService` 是否正确导入
2. 确认事件监听器是否正确注册
3. 检查本地存储是否正常工作

## 更新日志

- **v1.0.0** - 初始版本，支持8种背景图片切换
- 支持明暗主题适配
- 支持多语言界面
- 实现本地存储持久化
- **v1.1.0** - 全局挂载实现
- 新增全局背景管理服务
- 新增 `useBackground` Hook
- 新增 `BackgroundQuickSwitch` 组件
- 新增 `GlobalBackgroundManager` 组件
- 支持动态添加/删除背景图片
- 支持事件监听和通知机制

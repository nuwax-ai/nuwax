# AppDev 停止和重启服务功能更新

## 更新概述

本次更新为 AppDev 页面添加了停止服务和重启服务成功后自动更新地址并刷新 Preview 组件的功能。

## 主要修改

### 1. 停止服务功能增强 (`src/pages/AppDev/index.tsx`)

**修改位置**: `handleStopDev` 函数

**更新内容**:

- 停止服务成功后自动清空开发服务器 URL
- 更新服务运行状态为停止
- 确保 Preview 组件显示正确的状态

**代码变更**:

```typescript
// 停止成功后清空开发服务器URL并更新服务状态
updateDevServerUrl('');
setIsServiceRunning(false);
```

### 2. 重启服务功能增强 (`src/pages/AppDev/index.tsx`)

**修改位置**: `handleRestartDev` 函数

**更新内容**:

- 重启服务成功后检查返回的新开发服务器 URL
- 自动更新开发服务器 URL
- 延迟 100ms 后触发 Preview 组件刷新，确保 URL 已更新
- 更新服务运行状态为运行中

**代码变更**:

```typescript
// 如果返回了新的开发服务器URL，更新它
if (response?.data?.devServerUrl) {
  console.log('🔗 [AppDev] 更新开发服务器URL:', response.data.devServerUrl);
  updateDevServerUrl(response.data.devServerUrl);

  // 延迟刷新Preview组件，确保URL已更新
  setTimeout(() => {
    if (previewRef.current) {
      console.log('🔄 [AppDev] 刷新Preview组件');
      previewRef.current.refresh();
    }
  }, 100);
}
```

### 3. Preview 组件增强 (`src/components/WebIDE/Preview/index.tsx`)

**新增功能**:

- 支持 `forwardRef` 模式
- 暴露 `refresh` 方法供父组件调用
- 添加 `PreviewRef` 接口定义

**新增接口**:

```typescript
export interface PreviewRef {
  refresh: () => void;
}
```

**组件改造**:

```typescript
const Preview = React.forwardRef<PreviewRef, PreviewProps>(
  ({ devServerUrl, className }, ref) => {
    // ... 组件逻辑

    // 暴露refresh方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        refresh: refreshPreview,
      }),
      [refreshPreview],
    );

    // ... 组件渲染
  },
);
```

### 4. AppDev 页面集成 (`src/pages/AppDev/index.tsx`)

**新增功能**:

- 导入 `PreviewRef` 类型
- 创建 `previewRef` 引用
- 将 ref 传递给 Preview 组件

**代码变更**:

```typescript
// 导入PreviewRef类型
import Preview, { PreviewRef } from '@/components/WebIDE/Preview';

// 创建Preview组件的ref
const previewRef = useRef<PreviewRef>(null);

// 在Tabs中使用ref
<Preview ref={previewRef} devServerUrl={workspace.devServerUrl} />;
```

## 功能流程

### 停止服务流程

1. 用户点击"停止"按钮
2. 调用 `stopDev` API
3. 成功后清空 `devServerUrl`
4. 设置 `isServiceRunning` 为 `false`
5. Preview 组件自动显示"等待开发服务器启动"状态

### 重启服务流程

1. 用户点击"重启"按钮
2. 调用 `restartDev` API
3. 检查返回的新开发服务器 URL
4. 更新 `devServerUrl` 状态
5. 延迟 100ms 后调用 Preview 组件的 `refresh` 方法
6. Preview 组件重新加载新的 URL
7. 设置 `isServiceRunning` 为 `true`

## 技术特点

1. **状态同步**: 确保服务状态与 UI 状态保持一致
2. **自动刷新**: 重启后自动刷新 Preview 组件，无需手动操作
3. **错误处理**: 保持原有的错误处理机制
4. **性能优化**: 使用延迟刷新避免状态更新冲突
5. **类型安全**: 使用 TypeScript 确保类型安全

## 使用说明

用户现在可以：

- 点击"停止"按钮停止开发服务器，Preview 组件会显示等待状态
- 点击"重启"按钮重启开发服务器，Preview 组件会自动刷新并显示新内容
- 无需手动刷新 Preview 组件，系统会自动处理

## 注意事项

1. 重启服务后会有 100ms 的延迟刷新，确保状态更新完成
2. 如果 API 返回的响应中没有 `devServerUrl` 字段，不会触发刷新
3. 停止服务会清空 URL，Preview 组件会显示等待状态
4. 所有操作都有完整的错误处理和用户提示

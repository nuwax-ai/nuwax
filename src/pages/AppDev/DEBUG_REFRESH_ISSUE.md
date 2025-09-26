# 调试刷新问题指南

## 问题描述

停止服务和重启服务后，Preview 组件没有正确刷新。

## 已添加的调试日志

### 1. AppDev 页面调试日志

- `✅ [AppDev] 停止开发服务器成功:` - 停止服务成功
- `✅ [AppDev] 重启开发服务器成功:` - 重启服务成功
- `🔗 [AppDev] 更新开发服务器URL:` - URL 更新
- `🔄 [AppDev] 准备刷新Preview组件, previewRef:` - 准备刷新
- `🔄 [AppDev] 调用Preview组件的refresh方法` - 调用刷新
- `⚠️ [AppDev] previewRef.current 为空` - ref 为空警告
- `⚠️ [AppDev] 重启响应中没有devServerUrl字段` - 缺少 URL 字段警告

### 2. Preview 组件调试日志

- `🔄 [Preview] refreshPreview called, devServerUrl:` - 刷新方法被调用
- `🔄 [Preview] iframeRef.current:` - iframe 引用状态
- `🔄 [Preview] 有devServerUrl，调用loadDevServerPreview` - 有 URL 时刷新
- `🔄 [Preview] devServerUrl为空，清空iframe` - 无 URL 时清空
- `⚠️ [Preview] iframeRef.current 为空，无法刷新` - iframe 引用为空

## 可能的问题原因

### 1. 状态更新时机问题

- `updateDevServerUrl` 更新状态后，Preview 组件的 `devServerUrl` prop 可能还没有更新
- 导致 `refreshPreview` 方法中的 `devServerUrl` 还是旧值

### 2. ref 引用问题

- `previewRef.current` 可能为空
- 可能是组件还没有挂载完成

### 3. API 响应问题

- 重启 API 可能没有返回 `devServerUrl` 字段
- 或者字段路径不正确

## 调试步骤

### 步骤 1：检查 API 响应

1. 点击"重启"按钮
2. 查看控制台日志中的 `✅ [AppDev] 重启开发服务器成功:` 输出
3. 检查 `response.data.devServerUrl` 是否存在

### 步骤 2：检查状态更新

1. 查看 `🔗 [AppDev] 更新开发服务器URL:` 日志
2. 检查 URL 是否正确更新

### 步骤 3：检查 ref 引用

1. 查看 `🔄 [AppDev] 准备刷新Preview组件, previewRef:` 日志
2. 检查 `previewRef.current` 是否为 null

### 步骤 4：检查 Preview 组件

1. 查看 `🔄 [Preview] refreshPreview called, devServerUrl:` 日志
2. 检查 `devServerUrl` 是否为最新值
3. 查看 `🔄 [Preview] iframeRef.current:` 日志

## 修复方案

### 方案 1：使用 useEffect 监听 devServerUrl 变化

```typescript
// 在Preview组件中添加
useEffect(() => {
  if (devServerUrl) {
    loadDevServerPreview();
  }
}, [devServerUrl, loadDevServerPreview]);
```

### 方案 2：直接操作 iframe

```typescript
const refreshPreview = useCallback(() => {
  if (iframeRef.current) {
    if (devServerUrl) {
      iframeRef.current.src = devServerUrl;
    } else {
      iframeRef.current.src = '';
    }
  }
}, [devServerUrl]);
```

### 方案 3：使用状态强制刷新

```typescript
const [refreshKey, setRefreshKey] = useState(0);
const forceRefresh = () => setRefreshKey((prev) => prev + 1);
```

## 当前实现的问题

1. **时机问题**：`updateDevServerUrl` 是异步状态更新，`refreshPreview` 可能在状态更新前被调用
2. **依赖问题**：`refreshPreview` 依赖 `devServerUrl`，但调用时可能还是旧值
3. **延迟问题**：200ms 延迟可能不够，或者太长

## 建议的修复

1. 增加延迟时间到 500ms
2. 在 Preview 组件中添加 useEffect 监听 devServerUrl 变化
3. 添加更多调试日志来定位具体问题
4. 考虑使用状态强制刷新机制

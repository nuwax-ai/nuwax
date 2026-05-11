# AppDev 开发中遮罩控制说明

本文档说明 AppDev 中「Agent 生成时是否展示开发中遮罩」的两种控制方式，以及它们的优先级。

## 背景

`ContentViewer` 支持可选属性 `showDevelopingOverlayDuringAgent`：

- `true`：Agent 运行中用「开发中」空状态替换预览（历史默认行为）
- `false`：Agent 运行中尽量保持预览 iframe 可见（若无其他错误态）
- `undefined`：走组件默认值（等价 `true`）

相关代码：

- `src/pages/AppDev/components/ContentViewer/index.tsx`
- `src/utils/appDevDevelopingOverlayResolve.ts`

## 两种入参方式

### 1) 页面级 URL 查询参数

- 参数：`developingOverlay`
- 示例：`?developingOverlay=true` / `?developingOverlay=false`（也支持 `1/0`、`yes/no`、`on/off`）
- 兼容：历史参数 `agentDevelopingOverlay` 仍可用

定义位置：

- `src/constants/appDevConstants.ts` 中 `APP_DEV_AGENT_PREVIEW_OVERLAY_QUERY_PARAM`

### 2) 组件属性控制

可直接传组件属性：

```tsx
<ContentViewer showDevelopingOverlayDuringAgent={false} />
```

## 优先级规则

最终值合并规则（由 `resolveShowDevelopingOverlayDuringAgent` 统一处理）：

1. URL 查询参数
2. 不传（组件默认 `true`）

当前实现不提供页面内开关 UI，仅做状态属性透传控制。

## 页面接入建议

- 页面内建议使用 `useMergedAppDevAgentDevelopingOverlay()`，避免重复写解析逻辑。
- 返回值中的 `valueForContentViewer` 直接传给 `ContentViewer`。

## 快速排查

- 页面行为与预期不一致：先检查 URL 是否带 `agentDevelopingOverlay`
- URL 没有时：会回落到组件默认值（`true`）

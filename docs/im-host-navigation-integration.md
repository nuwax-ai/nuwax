# IM 接入宿主页面路由

IM 业务只需调用可选的 `window.NuwaxHost`。IM 原始入口保持不改，无需处理乾坤的 mount/update/unmount 或判断 `__POWERED_BY_QIANKUN__`，也无需跨工程 import、安装 SDK 或复制 hostRuntime。能力传递和生命周期接线由主站维护的现有适配层完成。

## 1. 直接调用

JavaScript 项目无需准备文件：

```js
const accepted = window.NuwaxHost?.navigate('/home') ?? false;
window.NuwaxHost?.navigate('/repo/doc/456', { replace: true });
```

TypeScript 项目在 **IM 自己的仓库**添加 `nuwax-im-web/src/types/nuwax-host.d.ts`，只声明接口，不包含实现、不需要 import：

```ts
export {};

declare global {
  interface Window {
    NuwaxHost?: {
      navigate(path: string, options?: { replace?: boolean }): boolean;
    };
  }
}
```

确保此声明文件被 IM 的 tsconfig `include` 覆盖；通常 `src` 已被包含。若已有同名 Window 声明，合并字段即可。

## 2. 业务按钮示例

以下代码放在 IM 自己的组件中，没有跨工程 import：

```tsx
function OpenAgentButton({ agentId }: { agentId: string }) {
  const onClick = () => {
    const accepted =
      window.NuwaxHost?.navigate(`/agent/${encodeURIComponent(agentId)}`) ??
      false;
    if (!accepted) {
      // 按 IM 项目的提示规范处理，独立模式可提示需从主站打开。
      console.warn('宿主未执行页面跳转');
    }
  };
  return <button onClick={onClick}>查看智能体</button>;
}
```

IM 会话及资料库地址示例：

```ts
window.NuwaxHost?.navigate(
  `/instant-message?convId=${encodeURIComponent(convId)}`,
);
window.NuwaxHost?.navigate(
  `/instant-message?agentId=${encodeURIComponent(agentId)}`,
);
window.NuwaxHost?.navigate(`/repo/doc/${encodeURIComponent(docId)}`, {
  replace: true,
});
```

在点击等事件发生时读取 `window.NuwaxHost`；不要在模块加载时缓存全局对象或方法。IM 原仓业务只消费此接口，注入与清理由主站维护的 IM 适配层负责。

## 3. 接口约定

| 规则 | 说明 |
| --- | --- |
| 方法 | `window.NuwaxHost?.navigate(path, { replace? }): boolean`，同步，无需 await |
| path | 单个 `/` 开头的完整站内路径，保留 query/hash；不能只传 `?convId=...` |
| replace | 默认 false：新增历史记录；true：替换当前历史记录 |
| true | 主站接受导航，或已在该地址；不保证目标页加载及业务授权成功 |
| false | IM 隐藏/卸载、加载/挂载/更新失败、地址非法或导航异常；不自动重试抢占页面 |
| 对象不存在 | 独立 IM、旧主站、尚未挂载或已卸载时可能不存在；使用 `?.` 与 `?? false` 处理 |
| 同地址 | 不重复写历史或重新打开会话；仅切换当前会话继续用 IM 的 `selectConv` |

ID 保持字符串，避免 19 位雪花号转成 Number。绝对 URL、`//host/path`、相对地址、反斜杠和控制字符会被拒绝。接口只用于站内业务路由，不用于静态 entry、API、外链或新窗口；调用失败时不要降级为 `window.location.href` 整页刷新。

IM 独立开发时全局不存在，业务可提示或隐藏需要主站能力的入口，项目仍可正常编译、运行。加载、挂载或更新失败后，全局对象可能暂留至卸载，但方法已禁用并返回 false；卸载时适配层按对象身份清理。

## 4. 联调与交付

1. IM 同事只添加本地类型声明和业务调用，跑 IM 自身类型检查、测试与构建；独立模式通过可选访问返回 false，不崩溃、不刷新。
2. IM 代码合入 main 后，由主站同事升级固定 pin、应用现有 patch/overlay 并构建完整主站与 IM 资源。IM 原始入口不改，适配构建由主站处理；本机子模块未提交代码不会进入主站产物。
3. 在包含此接口的新主站中，进入 IM 并等待挂载完成，再检查 `typeof window.NuwaxHost?.navigate === 'function'`；验证跳转、后退、replace、query/hash、会话目标更新和 IM 保活。目标页继续执行原有权限规则。
4. 验证 IM 隐藏时调用返回 false，返回 IM 后恢复；加载/挂载/更新失败后调用返回 false，卸载后全局被清理，旧对象引用不能继续跳转。
5. 同时交付支持注入的新主站和 IM 业务产物，核对 `/micro-apps/message/version.json` 的来源提交。仅更新 IM 原始仓库不会自动更新主站已经加载的产物。

主站测试入口：`pnpm exec vitest run tests/microApps micro-frontends/message micro-frontends/repo-web`。

## 主站维护位置

主站在 `src/layouts/MicroAppHost/index.tsx` 通过乾坤 `loadMicroApp` 的 `props.host` 传递 navigate 能力并执行路由。现有 `micro-frontends/message/overlay/src/main.tsx`、`hostRuntime.ts` 在 IM 生命周期内将该能力暴露为 `window.NuwaxHost`，并在卸载时按对象身份清理；Window 类型在 `src/types/global.d.ts`。这些接线均由主站维护，不要求 IM 原仓修改入口或引入乾坤。

旧 `onNavigate` 保留当前子应用范围限制。IM 业务仅需维护本地类型声明与全局方法调用。

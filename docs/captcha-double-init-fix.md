# AliyunCaptcha 多次初始化导致校验失败

## 现象

登录时验证码多次生成，后端校验验证信息不通过。

## 根因

`AliyunCaptcha` 组件的 `useEffect` 依赖数组包含完整的 `config` 对象（`tenantConfigInfo`）。当父组件 re-render 导致对象引用变化时：

```
config 引用变化
  → cleanup() 执行：销毁实例 + captchaInstanceRef.current = null
  → 新 effect：guard (ref === null) 通过 → initAliyunCaptcha() 再次调用
```

**阿里云官方 demo 明确注释**：多次调用 `initAliyunCaptcha` 会导致 `captchaVerifyCallback` 被多次回调。

每次 `initAliyunCaptcha()` 都会向按钮注册新的回调。如果旧回调未彻底清除，一次按钮点击触发 N 个回调 → N 个登录请求 → token 被重复消费。

## 修复

### 核心：稳定化 useEffect 依赖

```tsx
// 解构 primitive 值，避免对象引用变化触发重新初始化
const { captchaSceneId, captchaPrefix, openCaptcha } = config || {};

useEffect(() => {
  if (!captchaSceneId || !captchaPrefix || !openCaptcha) return;
  if (captchaInstanceRef.current) return;
  // ...
}, [
  captchaSceneId,
  captchaPrefix,
  openCaptcha,
  elementId /* + 稳定的 callback */,
]);
```

只有实际配置值变化时才重新初始化，对象引用变化不再触发。

### 配套修复

1. **恢复 `normalizeCaptchaVerifyParam`** — 处理 SDK 传入的 5 种参数形态
2. **Login 增加 `isVerifyingRef` 锁** — 防止 SDK 多次回调时并发执行
3. **`onReady` 改用 ref** — 避免回调引用变化导致重复触发
4. **VerifyCode / ChatTemp API 迁移** — `doAction` → `onVerify`

## 关键教训

- 阿里云验证码 SDK 的 `initAliyunCaptcha` 在组件生命周期内只能调用一次
- `useEffect` 依赖应使用 primitive 值，避免对象/数组引用导致的无效重新执行
- 回调函数通过 ref 持有最新引用，而非放入 effect 依赖

## 相关文件

- `src/components/AliyunCaptcha/index.tsx`
- `src/pages/Login/index.tsx`
- `src/pages/VerifyCode/index.tsx`
- `src/pages/ChatTemp/index.tsx`
- `src/hooks/useCaptchaConsume.ts`（已删除）

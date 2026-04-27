# AliyunCaptcha 多次初始化导致校验失败

## 现象

登录时验证码多次生成，后端校验验证信息不通过。

### 场景一：稳定触发（effect 反复初始化）

`AliyunCaptcha` 组件的 `useEffect` 依赖完整 `config` 对象，父组件 re-render → 对象引用变化 → instance 被销毁后重建。

### 场景二：无痕验证（TRACELESS）模式

测试环境下 SDK 不显示滑块直接自动完成。此时 SDK 使用 **ES5 回调模式**：`captchaVerifyCallback(token, callback)`，期望通过 `callback(result)` 传递验证结果。但我们的函数只处理了 ES6 Promise 模式（通过返回值），忽略了 `callback` 参数，导致：

- SDK 收不到结果 → 超时 → 重新生成验证码 token
- 新的 token 生成时，之前发起的登录请求带的是旧 token → 校验失败

## 根因

### 根因 1：useEffect 依赖对象引用

```
config 引用变化
  → cleanup() 执行：销毁实例 + captchaInstanceRef.current = null
  → 新 effect：guard (ref === null) 通过 → initAliyunCaptcha() 再次调用
```

**阿里云官方 demo 明确注释**：多次调用 `initAliyunCaptcha` 会导致 `captchaVerifyCallback` 被多次回调。

### 根因 2：未兼容 ES5 回调模式

阿里云 SDK 文档明确 `captchaVerifyCallback` 有两个参数：

```js
/**
 * @param {String} captchaVerifyParam - 验证参数
 * @param {Function} callback - ES5 回调函数，用于处理验证结果
 */
function captchaVerifyCallback(captchaVerifyParam, callback)
```

- ES6 模式：通过 `return` 值传递结果
- ES5 模式：通过调用 `callback(result)` 传递结果

无痕验证场景下 SDK 使用 ES5 模式，忽略 `callback` 导致 SDK 超时重试。

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
2. **兼容 ES5 回调模式** — `captchaVerifyCallback` 检测 `callback` 参数，支持两种 SDK 调用模式
3. **Login 增加 `isVerifyingRef` 锁** — 防止 SDK 多次回调时并发执行
4. **`onReady` 改用 ref** — 避免回调引用变化导致重复触发
5. **VerifyCode / ChatTemp API 迁移** — `doAction` → `onVerify`

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

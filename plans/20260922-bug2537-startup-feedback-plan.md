# #2537 首屏启动失败反馈

用户 Windows 日志证实从本地加速切到直连后 Web 主代码与宿主 token 桥仍执行；缺 guest Console/Network，不能认定现场白屏根因。独立核查发现 Umi 首屏 initialState pending 时默认只渲染空 div，getInitialState 又将意外错误吞成空菜单。

1. 在隔离检出用受控 pending 启动请求复现首屏空白，不把人工复现当成用户现场根因。
2. 配置 Umi 首屏 loading 组件：立即显示加载，15 秒后明确提示等待过久并提供重新加载。此期限仅控制反馈，不改变业务 API 超时或清除登录态。
3. 仅将意外启动异常交给初始状态错误兜底；已有未登录/重定向业务分支保持原行为。失败 UI 不展示异常原文、服务 payload 或凭据。
4. 重试使用整文档 reload 并防连续点击；浏览器销毁旧上下文后再启动新请求，不引入并发 refresh、后台重试或迟到响应覆盖。
5. 定向验证 pending、失败、正常/未登录、重复点击、自然恢复与卸载计时器清理；质量门只覆盖该改动，不重跑不相关已通过的大测试。独立提交，不 push，不改主检出或真机。

## 实施边界

- Umi initialState 的 loading 组件负责首次等待；innerProvider 在 model provider 内读取错误并挡住未就绪业务页面。
- 请求拦截器可能 `Promise.reject()` 而没有 reason；启动层将其归一为 Error，避免 Umi 的 error 仍是假值。
- 菜单意外失败不得吞为空数组；`4010` / `4011` 继续由现有业务层跳转。
- hostBridge 无宿主/拒绝回落 null、远程词典失败回落本地词典的既有可恢复行为保留；若其自身抛出未处理异常则有统一失败反馈。没有新增全局超时、重试请求或清 token。
- 启动文案只能读本地词典及纯语言策略，不 import i18nRuntime。真实 Umi 验证曾抓到该依赖提前触发 home.constants → dict 初始化顺序循环，单元 mock 不足以发现。

## 验收记录

- 改前定向测试：4 个启动拒绝用例失败，正常/null 用户与 pending 自然完成 2 项通过；失败被原实现吞成 `{menuData: []}`。
- 改前真实 Umi：仅在隔离浏览器页面延迟 `/api/user/list-menu` 的 XHR send，pendingCount=1，bodyText 为空，root 为 `<div></div>`。截图 `/tmp/codex-bug2537-startup-before.png`。未修改 token 或后端；这只能证明受控场景缺少反馈，不能证明用户现场根因。
- 改后定向测试：`npx vitest run tests/appStartupInitialState.test.ts tests/appStartupFeedback.test.tsx tests/appStartupText.test.ts src/utils/hostBridge/index.test.ts`，68/68 通过。
- 改后真实 Umi pending：立即显示“正在加载应用”；组件挂载 15s 后出现等待过久提示，pendingCount 仍为 1；释放原请求后首页自然恢复、启动提示消失。语义快照通过；本轮截图工具超时，未把不存在的截图算作证据。
- 改后真实 Umi error/retry：受控 XHR error 后立即出现安全失败文案，token 仍存在；移除注入后点“重新加载”，新文档 navigationType=reload、首页恢复、menuRequestCount=1、token 仍存在、hasInjectedHook=false。测试注入已清理，仅操作隔离页面。
- 调试期间发现共享 node_modules 的 Webpack 缓存仍输出旧本地词典；仅在独立检出临时关闭编译缓存后完成上述真实验收，提交前已移除临时配置，未清共享缓存。该问题不是用户现场故障证据。
- `lint:arch`：3 条既有 SpaceProjectManage → AppDevPro 跨页面依赖错误，base ad58304e4 同路径同 import 已存在；97 条已知豁免。本次新组件无新增违规。
- 全库 tsc 532 条存量错误；本次 app.tsx、AppStartup、定向 tests、config 路径零条。日志 `/tmp/codex-bug2537-startup-tsc.log`。
- 生产构建与机器验收必须单独记录，不以单测/受控页面结果代替真机或现场根因确认。

## 可复用人工复现方法

在一个明确隔离的测试页面中，通过 CDP `Page.addScriptToEvaluateOnNewDocument` 安装下面脚本后 reload（注入与导航须处于同一次浏览器工具调用）。只需等待一次 list-menu 被拦截，无须清缓存或登录态。

```js
(() => {
  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__startupAuditUrl = String(url);
    return open.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    if (this.__startupAuditUrl.includes('/api/user/list-menu')) {
      window.__startupPendingCount = (window.__startupPendingCount || 0) + 1;
      window.__releaseStartupRequest = () => send.apply(this, args);
      window.__failStartupRequest = () =>
        this.dispatchEvent(new ProgressEvent('error'));
      return;
    }
    return send.apply(this, args);
  };
})();
```

1. 首次反馈应立即可见；15 秒后出现等待过久提示和重新加载按钮；计数仍为 1，不自动请求。
2. 调用 `window.__releaseStartupRequest()`：原请求自然完成后回到首页，不点击 retry。
3. 另起一轮受控加载，调用 `window.__failStartupRequest()`：立即出现通用失败文案，不显示服务 payload。
4. 移除当前注入标识后点击重新加载：必须整文档 reload、正常首页恢复，已有 token 保持；该操作只影响测试页面。

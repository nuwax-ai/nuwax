# 规格：direct-web-assets-update

- 对应 intent：plans/20261009-direct-web-assets-update-intent.md
- 状态：实现完成，本地验收通过，待发布

## 方案设计

- 构建后用同一版本 payload 写 `dist/version.json`、入口 HTML 的 `nuwax-build-git-hash` / `nuwax-build-version` meta。元信息不进入业务 JS。
- 部署保留脚本支持 `.chunk.css`，沿用 3 代清理；启用保留时从历史产物补齐保留窗口内遗漏 CSS，保留原始字节和对应年龄。
- 客户端适配读取并固定初始 HTML 标记；`meta.syncWebInfo` 上报实际页面版本，缺标记时仅回退 APP_VERSION，不借用服务器最新 hash。
- 新服务仅在 Nuwax 宿主且已有 `auth.getContext()` 返回 direct 时启动。版本请求同源、no-store；启动检查，可见时每 5 分钟检查，回到前台补查，并发合并，隐藏暂停，卸载取消计时器、请求和监听。
- 有效当前 hash 与最新 hash 不同时在客户端版本旁显示“界面更新”。Tooltip 为“网页已更新，点击刷新”，支持键盘操作；点击 reload 当前 URL。

## 异常与失败场景

网络失败、超时、非成功响应、HTML、无有效 hash 或当前页面标记未知，不产生误报。已有合法提醒可在暂时失败时保留。缺宿主能力或 gateway 时不猜测 direct。历史资源不可恢复时报告缺口，不修改登录存储。回滚导致 hash 变化也提示“网页已更新”，不将 hash 解释为版本大小。

## 测试计划

构建一致性/幂等、CSS 恢复/清理/历史回填、版本服务状态/并发/隐藏/卸载、胶囊展示/点击与原客户端升级回归。以 A/B 同源产物在真实 Chromium 和 Electron webview 验证旧资源可用、版本提醒、点击刷新和登录/地址保留。

## 已否决方案

全局禁用缓存、自动整页刷新、依靠视觉监控判断样式：分别增加加载开销、打断操作，或无法可靠覆盖无错误的样式错配。

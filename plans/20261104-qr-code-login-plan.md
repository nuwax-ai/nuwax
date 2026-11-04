# 计划：PC 扫码登录

## 目标与决定

- 基于当前 `dev`（`e48b25394d5364ab8d8377fb4b71e7ce5a1c0f14`）在 `codex/qr-code-login` worktree 开发。
- 范围为 [11 月规划 L7](https://agent.nuwax.com/repo/doc/fE9VALiLLvThNueV)：PC 登录页增加扫码入口、二维码展示、状态轮询及登录收尾；App 扫码确认页不在本次范围。
- [接口契约](https://test-nvwa-api.xspaceagi.com/doc.html#/default/扫码登录/create_7)：创建返回 `sceneId/pollToken/qrContent/expireSeconds`；状态为 WAITING / SCANNED / CONFIRMED / EXPIRED。二维码仅编码 `qrContent`，轮询凭据只保存在当前组件内存。
- 保留密码、验证码和三方登录行为；确认后复用 Cookie / 桌面宿主会话同步、本地开发 Token、语言与菜单初始化和原始深链跳转。

## 实施与验证

- 创建和状态查询封装到 `src/services/qrLogin.ts`；页面私有组件处理串行轮询、过期、失败重试及取消。
- 切换登录方式、刷新二维码或卸载时取消旧请求与计时器；确认后只执行一次登录收尾。后台不重叠轮询，不能泄漏未处理拒绝。
- 复用现有登录测试，补充扫码状态、过期、取消竞态、失败重试及 Cookie / 本地开发请求边界的回归。
- 用 ego-browser 验证真实页面与测试环境二维码创建、状态查询；App 真机扫码确认的联调结论单独记录，不能以 mock 代替。

## 未完成事项

- App 真机相机扫码、用户确认与商业桌面安装包中的 Cookie 会话同步仍待联合验收。当前已用测试环境登录态调用 App 扫码/确认接口，完成本地浏览器真实接口链路，不能代替 App 真机验收。

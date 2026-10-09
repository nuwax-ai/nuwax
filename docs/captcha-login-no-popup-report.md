# 问题报告：登录页阿里云验证码无法唤起（点登录无反应）

- **日期**：2026-08-25
- **影响范围**：线上 + 测试环境，开启验证码的租户（sceneId `tmawfz3j`，prefix `187loo`）登录页。密码登录与验证码登录均无法触发人机验证，登录流程卡死
- **状态**：根因已定论；修复已提交（`856f65490`，本地 `feat-2026.7.31`，**未推送**），待部署验证

## 1. 现象

点击「登录 / 下一步」后：

- 不弹阿里云滑块验证码，页面无任何反馈
- console 仅有 `[Login doLogin] needAliyunCaptcha: true ...`，**无后续**（无 `[Captcha CB]`、无登录请求）
- 约 3 秒后防重锁被弹窗监测超时释放，可重复点击，永远无反应

## 2. 根因

**阿里云验证码 SDK 于 8 月上旬更新后，实例方法 `show()` 不再触发验证流程；而前端自 4 月 27 日起把 `show()` 作为登录页唤起验证码的唯一方式（非官方推荐姿势），导致验证码完全无法唤起。**

官方推荐姿势（[客户端接入 FAQ](https://help.aliyun.com/zh/captcha/captcha2-0/user-guide/captcha-2-0-client-access-faq)）：popup 模式下将 `initAliyunCaptcha` 的 `button` 参数指向隐藏元素，在业务按钮的点击回调中手动触发该元素的 `click` 事件。实例方法虽有 `show`/`refresh`/`destroyCaptcha` 三个（FAQ 明确列出），但 `show` 的语义是「显示验证码元素/蒙层」，不保证激活验证会话——SDK 更新后此路径失效。

## 3. 因果链与时间线

| 时间 | 事件 | 证据 |
| --- | --- | --- |
| 2026-04-27 `1328d73ca` | 修 deviceToken auto-verify 时，顺手把隐藏按钮 `click()` 换成 `captcha.show()`，当时可用 | 提交说明 "Also switch from hidden-button click() to captcha.show()" |
| 2026-08-04 `6dab17bdf` | 修「手动关闭验证码后无法再次唤起」——证明当时滑块能弹出；该提交适配的「弹窗关闭后 DOM 保留（不销毁）」行为本身即 SDK 演进的物证 | 提交描述与 diff |
| 2026-08-05 19:15 部署（test `625c66784`） | 最后一个正常版本（用户确认此前一直正常） | test 分支 dist 提交历史 |
| 8/1 → 8/10 之间 | CDN 上 SDK 更新（Wayback Machine 快照实证：8/1 ≠ 8/10；8/10 = 8/24 = 当前，此后未再变）。弹窗实现位于初始化接口下发的动态子模块（`CaptchaJsPath`），可独立热更、外部无版本痕迹 | `/tmp` 快照 md5：8/1 `1e3100ac` → 8/10 起 `be157703` |
| 8/17 – 8/20 | test 分支密集部署 7 次（1.1.18~1.1.21），全部加载新 SDK | test 分支 dist 提交历史 |
| 8 月下旬 | 用户反馈线上故障，测试环境复现 | 工单 / 本报告诊断过程 |

**为什么代码零改动也会坏**：验证码链路代码在 8/4 后无任何提交（`git diff 6dab17bdf..origin/feat-2026.7.31` 于 Login/VerifyCode/AliyunCaptcha/config/models 全为空）；8/5（好）与 8/20（坏）两版 dist 中验证码全链路产物**逐字符一致**。变化只可能来自 git 管不到的输入——本项目存在两个：① `config/config.ts:47` 的 SDK 引用无版本号（`https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js`）；② `pnpm-lock.yaml` 被 `.gitignore:18` 忽略，构建期依赖按 range 重新解析。本次定罪的是 ①（SDK 行为变化），② 为并存风险。

## 4. 诊断过程（关键实验）

1. **排除代码侧**：见上表。`app.tsx` 8 月新增的 `OpenUIDevtools`（enabled=false）与其依赖 `@openuidev/observability` 均无全局副作用（源码核验：纯事件总线，无 window/document patch）。
2. **浏览器实测测试环境**（`https://testagent.xspaceagi.com/login`）：页面加载正常、URL 无自动改写；`#captcha-element` 存在但为空（0 子节点、0 iframe），`#aliyunCaptcha-window-popup` / `#aliyunCaptcha-mask` 均不存在——SDK 初始化后未渲染任何验证结构。
3. **决定性实验**（用户在测试环境 console 执行）：

   ```js
   document.getElementById('aliyun-captcha-login').click();
   ```

   输出：`[Captcha CB]` 立即触发，param 为 deviceToken（3590 字节，无痕验证直过、不弹滑块）→ `[Login handleCaptchaVerify] deviceToken auto-verify, pass-through to backend` → `handlerPasswordLogin` 发起登录 → `authWithLoading` 拿到用户信息（uid 1746495851），**登录成功**。

   **结论：button click 有效，`show()` 无效。** 该租户当前为智能验证（无痕）形态——SDK 判定低风险时不弹滑块直接通过，属正常行为。

## 5. 修复（`856f65490`）

| # | 改动 | 说明 |
| --- | --- | --- |
| 1 | `src/pages/Login/index.tsx`：`doLogin` 两处 `captchaRef.current?.show?.()` 统一改为 `triggerCaptchaPopup()` | button click 优先（官方姿势，与手工实验一致）；按钮不在 DOM 时 fallback `show()` |
| 2 | `src/components/AliyunCaptcha/index.tsx`：`destroy()` → `destroyCaptcha()` | 原方法名不存在（官方为 `destroyCaptcha`），可选链静默吞错，**SDK 实例自引入以来从未被真正销毁**，跨页面残留弹窗 DOM 与监听 |
| 3 | 组件 init 后 8s 未收到 `getInstance` 回调时 `console.warn` | 将「初始化失败（域名白名单/SceneId 配置/接口异常）」从静默变为可见，便于下次定位 |

类型检查与 eslint 均通过。**部署路径：合入 dev → test 构建部署。**

## 6. 伴生发现（本次未修，建议排期）

1. **`GlobalEventPolling` 无条件挂载**（`src/app.tsx:287`）：注释写「只有用户已登录时才启动事件轮询」，代码无任何条件——未登录的登录页也在轮询 `/api/notify/event/collect/batch`，该接口对未登录会话返回 `4011`（REDIRECT_LOGIN）。batch 在静默列表（`common.ts:78`）中不弹错、不跳转，功能无碍，但属无效轮询。用户观察到的「console 日志短暂出现又消失」疑似页面导航清空所致，与 4011 链路的关联未最终定案。
2. **VerifyCode 页（二次验证）三处缺陷**：① `handleSendCode` 先启动倒计时而发送失败不回退——param 过期时用户看倒计时却收不到短信；② 无 `isVerifyingRef` 并发锁，无痕形态下 `handleReady` 与 SDK 自动回调可能双发短信；③ 刷新页面时 `location.state` 为 null，解构直接抛 TypeError 白屏。
3. **deviceToken 启发式脆弱**：`startsWith('{"sceneId"') && length > 500`（`Login/index.tsx`），SDK 结构变化即失效。
4. **构建可复现性**：`pnpm-lock.yaml` 未入库，任何一次构建都可能拉到依赖新版本且不留 git 痕迹。

## 7. 加固建议（防复发）

1. **SDK 版本锁定（已核实：不可行，改为约束注释）**：阿里云官方不提供带版本号的 SDK 地址，`o.alicdn.com` 上的文件为无版本滚动更新。已在 `config/config.ts` 的 SDK 引用处加注释标明风险与使用约束（唤起验证码必须用 button click 官方姿势，禁用 `show()`），并指向本报告。
2. **提交 `pnpm-lock.yaml`（已实施）**：从 `.gitignore` 移除并以 `pnpm install --lockfile-only` 刷新后入库，构建依赖从此可复现。
3. **触发方式统一（已实施）**：`VerifyCode` 页 `handleSendCodeInit` 与登录页 `triggerCaptchaPopup` 对齐——button click 优先、`show()` 仅作按钮缺失时的兜底。

## 附：关键证据索引

- 分支/提交：`origin/feat-2026.7.31`、`1328d73ca`（引入 show）、`6dab17bdf`（8/4 修复）、`856f65490`（本次修复，未推送）
- 部署点：test 分支 `625c66784`（8/5，正常）→ `728d8ad9a`（8/20，故障）
- SDK 快照（Wayback Machine，解压后 md5）：7/10 `35fb4b20`、8/1 `1e3100ac`、8/10 `be157703`（=8/24=当前）
- 官方文档：[阿里云验证码 2.0 客户端接入 FAQ](https://help.aliyun.com/zh/captcha/captcha2-0/user-guide/captcha-2-0-client-access-faq)（实例方法 `show`/`refresh`/`destroyCaptcha`；popup 官方触发姿势）

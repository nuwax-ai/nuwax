# 规格：本期桌面三方登录

- 对应 intent：`plans/20260928-release0930-remaining-intent.md` Q9 / C2。
- 10.08 用户确认“要支持三方登录”，覆盖历史隐藏默认。技术边界已按现有源代码收敛；真实 IdP 身份与安装包验收仍待完成。

## 需求基线

商业版 Nuwax 登录页展示租户启用的 CAS / OAuth2 / 微信扫码方式。协议确认、绑定已有账号的后端中间页、配置的自动跳转及 local/idpError 逃生沿用 Web 规则。设置里的已绑定身份管理随同开放，复用现有接口。IM、Ask Question、资料库不在本轮范围；不更改共享租户开关，C1 已由用户与后端确认：只调用原有 `/api/user/logout`，不联动 CAS；保留 `/login?local=1` 逃生落点。

## 方案设计

使用客户端现有 WebView 作为授权窗口，整页跳转 IdP；外部页面不获得宿主桥或业务 ticket。商业版从 `auth.getContext()` 读取当前业务域，不能用构建期 BASE_URL 推断企业域。授权直接发往业务域，保持授权状态 Cookie 与 IdP 回调同源。gateway 模式的成功 redirect 使用现有 `/login` 路由携带桌面返回标记和经过同源路径校验的业务目标；返回业务域后用现有 `auth.syncSession()` 确认服务端 Cookie，再回当前 gateway origin。direct 返回业务路径。所有返回 origin 来自主进程上下文，URL 参数不能指定任意 origin。

登录发起前调用现有 `auth.beginLogin()` 清理旧会话与服务；绑定不调用 beginLogin。getInitialState 已在首个鉴权请求前 syncSession，业务域回调可使用该链路，返回 helper 仍显式检查同步结果。无新增 token 传输、后端接口或宿主 IPC 契约。后端绑定/注册中间页保持业务域，不能送进本地 dist 的 `/auth/` SPA 兜底。

客户端网关须配套保留业务域顶层 `/auth/`、`/api/auth/idp/`、`/api/user/identity/bind/` 导航，避免归一到 loopback 后 state Cookie 与后端回调跨源。只对受信页面的顶层导航生效，iframe/XHR 和票据门禁不变；配套源码位于客户端独立分支 `codex/desktop-idp-20261008`。

| 场景 | direct | gateway |
| --- | --- | --- |
| 列表和协议确认 | 展示可用方式，遵守协议确认 | 相同 |
| 授权及 IdP 回调 | 配置业务域 | 配置业务域，避免回调状态跨源 |
| 登录成功 | Cookie 同步后返回安全业务路径 | Cookie 同步后返回当前 gateway + 安全业务路径 |
| IdP 错误 | 普通登录表单展示错误，不自动重跳 | 回 gateway 登录表单并保留错误与 local 逃生参数 |
| 绑定成功/失败 | 回原业务页并打开绑定面板 | 同步 Cookie 后回 gateway 原页并打开绑定面板 |

## 异常与失败场景

列表失败回落普通登录。宿主缺失上下文、beginLogin/syncSession 失败时保留表单并提示，不发起未确认的授权。异步宿主响应不能覆盖已改变的导航；重复点击只允许一条登录链路。第三方 origin 没有桥；来源和协议不匹配的上下文拒绝。桌面回跳标记在普通浏览器不生效。失败回跳即使后端不保留 redirect 也可回普通登录，不循环。

## 测试计划

纯函数与边界测试覆盖运行时企业域、direct/gateway、深链 query/hash、非法回跳、同步失败、重复点击和迟到响应。ego-browser 验证实际登录页按钮、协议、自动跳转逃生与绑定页面。使用临时 Electron profile 与本地 IdP/后端 fixture 验证 Cookie、外部页面桥隔离与 gateway 返回；该结果不替代真实 IdP 身份、安装包登录/重启/登出验收。

## 已否决的备选方案

- 只删除桌面隐藏条件：gateway 授权与回调状态可能跨源，企业域仍可能使用构建期错误地址。
- 外部系统浏览器登录：当前没有受信回调/会话交换契约，不能把外部 Cookie 或 token 搬入客户端。

# 消息 main 的隔离适配层

业务来源为 `submodules/nuwax-im` 的固定 main 提交，构建目标为其中 `nuwax-im-web/`。原始子模块保持干净；构建在独立缓存应用 `adapter.patch` 与 `overlay/`，依赖继续使用 main 原始 lock。只构建前端，不修改后端模块。

资源入口为 `/micro-apps/message/index.html`，业务地址为 `/instant-message/*`，稳定菜单入口为 `/message-entry`。dev/build 均强制 `VITE_IM_AUTH_MODE=platform`，REST `/api/instant-message/*` 与 WS `/instant-message/ws` 使用同源 Cookie。

`mount/update` 接收 `container/path/active/onNavigate/onAuthExpired`。main 当前选会话只通过 Zustand，不消费 URL 查询或定义会话路由；适配器保留宿主输入深链，不增加未经定义的会话 URL 协议。隐藏仅更新 active，保留消息状态和 WebSocket；未显示时不能自动标已读。

若受信 preload 提供 `NuwaClawBridge.im.setNotificationEnabled`，桌面通知交给商业壳：IM 不创建 Browser Notification、不请求浏览器权限，原桌面通知开关仍保存 `nuwax-im.notify` 并同步壳；浏览器测试通知项在此模式隐藏。普通 Web 和没有此能力的旧宿主保留原逻辑。主站 `initClientShell` 在 IM 未打开时也恢复保存的开关，等待 `auth.getContext` 完成当前文档握手后同步；等待期间只保留最新偏好，卸载会丢弃迟到动作。

显式卸载释放 React/Query、独立 store/socket、已读心跳和重试定时器、缓存订阅与事件订阅者，并关闭仍挂着的桌面通知及其旧会话回调。重挂创建新 store，晚到的旧探测与设备注册不能建连或写进新实例。此路径不调用业务 logout，不注销设备、不删除用户磁盘缓存。

HTTP 请求与挂载代次绑定：真卸载立即使旧代次失效，旧普通请求或上传的晚到 401 仍抛原始错误，但不能清新凭据或向新 App 广播鉴权失效。隐藏保活不换代，当前请求的 401 与静默探测维持 main 原语义。

嵌入时输入监听和所有 antd 弹层限定消息根；antd 使用私有 prefix，静态 CSS 和动画经 PostCSS 限定范围；标题由宿主管理，启动骨架查询不能删除宿主同名节点。独立运行仍保留原登录/消息行为和标题能力。

`git apply --check` 绑定 main 内容；合同测试验证路由、隐藏、样式和真实 store 的晚到请求/重挂/定时器清理。生产构建、真实账号收发、协作和桌面通知需分别验收。

宿主经 `window.__im` 订阅自定义事件与未读总数，接线口径、WS OpCode 对照及客户端独立接入要点见 [IM 事件对照表](../../docs/im-event-reference.md)。

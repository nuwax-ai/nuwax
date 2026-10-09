# F4 独立会话 PC 空白修复

## 来源与范围

研发组 2026-09-26 08:56：独立智能体链接大窗口空白。原链接 `/app/chat/4175/1694826?hideMenu=true&hideNew=true&hideTitle=true&hideTerminal=true&hideTree=true`。PC 问题；移动端不在本轮范围。

## 因果与处理

在线 1512px 页面主 Outlet 为空、无 JavaScript 异常。ChatPage 只按 PC 策略和有效 ID 判断是否让缓存宿主渲染，遗漏路由条件。OpenApp 的 `/app/chat` 没有常驻宿主，因此误返回 null。

仅真实宿主管理的 `/home/chat/:id/:agentId` 让出 Outlet；独立页保留 ChatCore 与共享面板、隐藏参数和鉴权行为。测试中的 AgentDetailModal mock 随 G5 共享路径同步。

## 验证

- 两个新增用例覆盖独立页带/不带 hide 参数；移除 guard 时均因空 DOM 失败；恢复后页面套件 30/30 通过。
- 会话合同 103 文件 / 937 用例通过；分层检查 2898 模块 / 12700 依赖，无新增违规（97 已知豁免）。
- 真实浏览器复用登录态及原会话：本地 1512/600/1200px 均有一个可见输入器；同会话 `/home/chat/1694826/4175` 有且仅一个输入器。没有发送会话消息。
- 截图捕获超时，不能列为截图证据；UI 结论来自真实浏览器 DOM 和可见元素等待。量化结果 `bug-batch-20260926/evidence/inventory-recheck/openapp-ui.json`。
- 独立评审：runtime_implementation 核对宿主路由 parser、ID 门禁、隐藏参数和新增用例，无 Important。
- 原始隔离提交 ab0be61b5（测试）→377d6b517（修复）；集成分支 fa4a94afc→e2dcc134f。
- 尚未部署测试站点，线上页面仍是旧版本。

# 飞书补充任务：独立审阅与集成记录

范围：2026-09-24 至 26 的 PC/客户端反馈，移动端排除。与禅道产品 3 全状态清单去重后分为 F1–F4。未推送、部署或写外部任务状态。

## 改动范围及审阅

- F1 下载：客户端保存能力复用既有 trusted sender、逐跳业务凭据与原子落盘；前端只增加可选文件能力和 await。root 独立审阅，并复跑原生保存 46 项；旧宿主回退、取消与错误页保护仍在。
- F2 文件树：纯文件变更判定在 domain，两轨消费；AppDevPro 经 conversation/react hook 绑定刷新资源，复用既有文件树和正文刷新，未新造面板。client reviewer 抓到首次回调闭包失效，稳定 ref + 会话/激活变更取消尾任务已修；root 独立跑 hook/domain 36 项绿。
- F4 独立会话：ChatPage 只对主壳 `/home/chat` 让出 Outlet；runtime reviewer 对照实际缓存路由 parser，无阻塞问题。`/app/chat` 保持 ChatCore 及共享组件，未改隐藏参数与鉴权。
- F3 仅前端终态：ERROR 明确终态不再被 close 的陈旧状态查询覆盖，文案/requestId 投影与重复事件去重复用既有消息域。Java 改动按用户要求已完整撤回；服务端不发 ERROR 的根因只提供交接证据。

## 维护性及分层

- 文件保存错误页校验仍集中于客户端保存函数；来源信任与鉴权不散落到页面。
- 文件变更语义复用 domain，生命周期 guard 在 React hook；页面仅做资源接线，主会话与全栈应用复用面板。
- 独立路由修复仅增加与实际缓存宿主对应的 guard，新增用例覆盖宽屏带/不带隐藏参数。
- F1–F4 的原始反馈、源码因果、fixture/真实环境边界和提交各有独立报告，未知的原安装包与真实沙箱行为保留为待验收项。

## 集成位置

- 前端：`/Users/apple/workspace/nuwax-bugs-sandbox-layout-20260926`，`codex/bugs-frontend-combined-20260926`。
- 客户端：`/Users/apple/workspace/nuwax-client-bugs-combined-20260926`，`codex/bugs-client-combined-20260926`。
- Java 不属于交付：隔离提交 64bcbb2c7 已由 bc2cfde89 撤回，HEAD 与起点 694fa8f07 净差为零。

## 最终前端与客户端门禁

- 最终前端会话门：105 文件 / 986 项通过。
- F1/F4/默认 ERROR 合同集成定向：6 文件 / 149 项通过；legacy 合同独立工作树 4 文件 / 97 项通过，并包含在最终会话门。
- 分层门：2902 模块 / 12708 依赖，零新增违规，97 存量忽略。
- 客户端下载集成复跑：3 文件 / 46 项通过；独立实现阶段完整下载相关 76 项、真实 Electron 文件字节写入均通过。
- F4 原会话本地 1512/1200/600px 可见，主壳同会话一个输入器；F2/F3 浏览器验证为生产组件 + SSE 供数 fixture，不能当后端部署验收。
- 差异检查通过。未推送本批 Bug 分支、未部署、未关禅道；旧安装包、真实沙箱文件和 Windows 待对应环境验收。
- Ego Lite 提示存在更新，本轮未升级。

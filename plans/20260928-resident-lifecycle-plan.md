# 实施计划：PC Web 常驻生命周期

- 依据：/Users/apple/workspace/nuwax-client/docs/20260928-resident-performance-audit.md
- 规格与总体计划：/Users/apple/workspace/nuwax-client/specs/resident-lifecycle.md、/Users/apple/workspace/nuwax-client/plans/20260928-resident-lifecycle-plan.md
- 状态：已接受；用户确认包含 AppDev 且不得改变业务逻辑，既有源码已经 checkpoint。

分工实施通用 SSE、AppDev 保活/轮询、登录态通知、终端流控、会话思考锚点与预览 observer。保留消息顺序、尾部消息、任务执行、登录和容器保活语义；不做页面/路由/权限重构。

每项补生命周期回归，执行会话合同与分层检查；实际客户端与 24/72 小时验收单列。保持其他工作者改动，不自动发布。

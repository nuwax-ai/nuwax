# bug2265 接管补修：SSE 静默检查归属每条连接

- 原单：PC 多次断网后续流停止，仍显示连接中，静默计数/会话状态查询不再恢复。
- 独立代码级复现：同模块建立 A、B 两条重叠流，新流创建和 onopen 均无条件清除全局唯一 interval；65 秒无消息后只有 B 超时关闭，A 没有 timer、没有 close。上层恢复 hook 在 sub 已订阅时暂停轮询，因此 A 的静默异常失去自愈入口。
- 改动范围：只调整实际会话使用的 `fetchEventSourceConversationInfo.ts` 的 timer 归属，创建/打开/关闭一条连接只操作自己的 timer；保留显式清理导出和 60 秒阈值、5 秒检查周期、onClose/onError exactly-once、重试和终态语义。
- 回归：真实 utility + fake transport/clock，覆盖双流独立消息时间、第二条待响应、旧 onopen 迟到、abort/close 交叠、三次断线重新建立后静默退出；运行 SSE、resume、runtime 定向和会话合同网。
- 真实复验：在开发/测试版本以执行中会话连续断网/联网 3 次，记录连接状态、消息补齐、sub 与详情接口；另制造两条重叠连接且其中一条静默超过 60 秒，确认各自 close 后恢复轮询。单测仅证明缺陷分支，不能替代原工单真机断网验收。

# bug2528 接管补修：异常 close 后的终态 setter 适配

- 原症状：异常结束后发送按钮仍显示执行中。既有快速 stop 修复不覆盖所有异常 close。
- 确认根因：runtime onClose 给 `syncTerminalConversationTaskStatus` 传入的适配器把 React 函数式 updater 当普通对象读取 `taskStatus`；真实 helper 永远传函数，后端已 FAILED/COMPLETE/CANCEL 也不写回，`effectiveIsActive` 仍被旧 EXECUTING 撑住。
- 最小改动：runtime 改用已有返回明确状态的 `fetchConversationTaskStatus`，从根本上移除伪造 React setter 的适配，保留已有终态查询和列表同步语义；异步写回及 finally 在新轮/切会话后失效，避免旧查询终结新轮。供 React 消费的原 helper 保持不变。
- 回归：实际 utility 加 HTTP mock，测试 FAILED/COMPLETE/CANCEL 恢复发送、EXECUTING 保留恢复资格、新轮迟到保护；先在原源码跑红，再跑 runtime/终态相关定向与会话合同网。
- 真实复验：执行中让流不带 FINAL 异常关闭，同时后端详情返回明确终态，确认发送按钮恢复；另测正常完成、快速停止及旧请求迟到后的下一轮。不以快速停止或 mock 测试替代原单端到端验收。

# 会话模块文档入口

> 会话模块相关文档集中在本目录。改代码后请对照本索引判断需更新哪篇。

## 修复总览（2026-08-18~20 会话卡死排查）

本轮排查从"运行完毕但按钮卡会话中"出发，历经三次根因迭代，最终以架构解耦根治。

### 修复链（按因果序）

| # | 修复 | 根因 | commit |
| --- | --- | --- | --- |
| 1 | 终态统一收敛 sweep | 终态事件到达但状态机未收敛（isAwaitingChatTerminal/isConversationActive/末条消息绑定在原连接回调上） | `da11719f1` |
| 2 | sub 流式占位收尾 | sub 死亡后占位残留 Incomplete → busy 永真 | `12a161bd4` |
| 3 | sub 网络错误对齐 | sub 断网表现与 chat 不一致 | `cf5adca1a` |
| 4 | 终态守卫 | 已终态消息被迟到分片回退到 Incomplete | `f0d7068cf` |
| 5 | ERROR 同权 | ERROR 型 SSE 事件与 FINAL_RESULT 同为终止态，应触发完整清算 | `cb91f4418` |
| 6 | 事件类型白名单 | PROCESSING 载荷误触发终态清算 → 内容丢失 | `c3399c9af` |
| 7 | 轮次边界 | 检查/清理范围不匹配（末条 vs 多条消息） | `092c9960a` |
| 8 | **架构解耦** | 工具状态不驱动会话按钮——isSessionStreamBusy 移除 hasExecutingProcessing | `1f8c77bd9` |
| 9 | 复制按钮 | Stopped/Error 状态消息无复制按钮 | `22d687728` |

### 架构决策

```
按钮状态 = isConversationActive（连接生命周期）
         || hasActiveStreamingInMessages（末条 Loading/Incomplete）
         || taskStatus === EXECUTING（后端权威）

工具状态 → 仅 UI 展示（RunOver），与按钮无关
```

三要素冗余覆盖，无单点故障。整类「工具 FINISHED 丢失 → 按钮卡死」在架构上不可能发生。

### 观测日志（验收手段）

console 过滤 `[Conv:` 即可拉出全部会话日志（均 always-on + ISO 时间戳）：

| 前缀 | 覆盖 |
| --- | --- |
| `[Conv:Terminal]` | finalize terminal（origin 区分路径）/ 占位收尾 |
| `[Conv:Status]` | applyTerminalTaskStatus / drop late / sse-on-close / sse-on-error |
| `[Conv:Resume]` | sub 恢复 / 轮询启停 / 竞态丢弃 |

### 详细文档

| 文档 | 内容 |
| --- | --- |
| [terminal-convergence-fix-summary.md](./terminal-convergence-fix-summary.md) | **修复代码实现总结**：按文件组织的改动清单 + 按钮架构 + 验收日志 |
| [conversation-complete-button-stuck-analysis.md](./conversation-complete-button-stuck-analysis.md) | 本轮排查主文档：HAR 实据 → 时间线 → 代码映射 → 修复方案 → 架构决策 → 验证表 |
| [conversation-terminal-finalizer-fix.md](./conversation-terminal-finalizer-fix.md) | 终态统一收敛修复说明（P0/占位收尾/网络错误对齐） |
| [conversation-error-taskstatus-stuck-fix.md](./conversation-error-taskstatus-stuck-fix.md) | 错误终态固化修复（早期） |
| [conversation-active-state-machine.md](./conversation-active-state-machine.md) | 会话活跃态状态机参考 |
| [conversation-stream-resume-and-intervention.md](./conversation-stream-resume-and-intervention.md) | 流式恢复与干预系统 |
| [chat-terminal-polling-flash-qa-report.md](./chat-terminal-polling-flash-qa-report.md) | 收尾闪烁 QA 报告 |
| [poll-send-race-stale-snapshot-fix.md](./poll-send-race-stale-snapshot-fix.md) | 轮询竞态修复 |
| [message-queue-design.md](./message-queue-design.md) | 消息队列设计（初版，实现已演进） |

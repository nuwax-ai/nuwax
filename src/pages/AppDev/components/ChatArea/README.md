# AppDev ChatArea

网页应用开发会话的消息、附件与输入编排。Props 以 [index.tsx](index.tsx) 为准；共享会话的边界见 [会话维护指南](../../../../../docs/conversation/dual-track/conversation-maintenance-guide.md)。

维护时关注：

- 发送前统一转换上传文件、原型图、提及文件和技能，交给 `chat.sendMessage`，不要在附件组件中另发会话请求。
- 加载更早历史后补偿滚动高度，保留用户阅读位置；历史 assistant 消息保留 history 标记。
- 会话结束回调由活跃态下降沿触发，用于刷新文件树与 Git 状态；后台与常驻页面的资源生命周期由宿主控制。
- 设计 iframe 无法响应切换命令时通过 `onDesignModeUnreachable` 通知宿主，不在视图中自行重启服务。

数据发送与历史滚动回归见 [index.test.tsx](index.test.tsx)，流生命周期回归见根目录 `tests/useAppDevChat.lifecycle.test.tsx`。

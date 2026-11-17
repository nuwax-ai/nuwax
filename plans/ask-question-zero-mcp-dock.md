# ask-question 零 MCP Dock 接入

目标：skill 的显式 `nuwax-ask-question` 协议块进入现有干预队列，复用 DockPanel、表单校验和原会话回复，不依赖 MCP 服务，不修改 agent-platform。

- 在共享会话渲染入口解析已完成的助手输出；普通 JSON、用户消息、工具/思考内容和不完整协议不触发挂载。
- 按 requestId/revision 合并交互，保留已应答状态，刷新后通过既有回复标记恢复；同 requestId 只展示最新版本。
- 提交时在原消息状态中物化交互，复用现有回流与失败回滚，保持会话隔离。
- 更新 skill 的输出契约与宿主说明；覆盖协议适配、真实 Dock 提交、历史恢复及版本隔离，运行会话保护网。
- mac-dbg 的实际 Nuwax 窗口加载本次前端构建，使用零 MCP 会话完成提问、必填校验、单选/多选提交和答案回流；保存证据后恢复临时环境。
- 普通推送代码分支到 GitHub（前端按仓库规则同步 GitLab），npm 不发布。

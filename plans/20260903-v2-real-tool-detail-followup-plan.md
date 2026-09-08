# 实施计划：V2 真实工具详情紧凑渲染修正

- 对应问题：`/home/chat/1561455/2592` 的真实 ToolCall 被错误渲染为“外层节点 + 完整旧工具卡 + 参数/结果 JSON”。
- 状态：实施中。

## 已复现的真实协议

- `result.kind = "execute"`
- `result.input.command` 保存终端命令，`result.input.description` 保存说明。
- 输出位于 `result.data[].content.text`，内容通常被 Markdown fence 包裹。
- 失败节点仍使用相同协议，仅 `status/result.success` 不同。

## 改动

1. 扩展工具语义分类，优先识别 `result.kind=execute/read/edit` 和 `input.command`。
2. 新增 V2 专用纯函数详情归一化，解开 `content.text` 与 Markdown fence。
3. 新增 V2 紧凑详情组件；外层节点唯一负责标题、状态与折叠，详情不再复用完整 `MarkdownCustomProcess`。
4. 将上述真实失败 payload 固化为测试与 mock-chat 场景。
5. 跑 `test:conversation`，再在 3000 真实会话逐项检查标题次数、详情类型和原始 JSON 消失。

## 验收信号

- 展开真实 `call_8d6add8b86db43359da35ea0` 后，标题只出现一次。
- 详情类型为 terminal，直接显示命令和错误输出。
- DOM 中没有 `markdown-custom-process`、`params-response-view`、`"type":"content"`。

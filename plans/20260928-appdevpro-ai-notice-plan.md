# AppDevPro 会话输入框 AI 内容提示修复

- 依据：用户反馈 `/space/{space_id}/app-pro/{project_id}/{conversation_id}` 输入框下缺少「内容由 AI 生成，请仔细甄别」，要求参考 Chat 页。
- 状态：已完成。

## 改动范围

- `src/pages/AppDevPro/AgentConversationChatPanel/index.tsx`：开启共享输入组件已有的 `showAnnouncement`。
- 复用 `PC.Components.ChatInputHome.generatedByAiNotice` 与既有提示样式。
- 保留工作区现有的会话滚动、显隐状态及首页改动。

## 验证

- 运行会话合同网和 AppDevPro 面板现有测试。
- ego-browser 登录态实际进入 AppDevPro 项目会话，确认提示在输入框下可见且不被底部裁切。
- 检查格式和本次改动差异。

## 验证结果

- 登录态本地页面 `/space/752/app-pro/195/1694723` 已显示「内容由 AI 生成，请仔细甄别」。
- 1920×929 和 1280×720 窗口均确认提示在输入框下方、位于可见区域内，未被任何滚动/隐藏容器裁切。
- `npm run test:conversation -- src/pages/AppDevPro/AgentConversationChatPanel/index.test.tsx`：110 个测试文件、1067 项测试通过。
- 本次源码仅新增一行 `showAnnouncement`；保留此前 `active={active}` 及其他工作区改动。
- Prettier 与 `git diff --check` 通过。

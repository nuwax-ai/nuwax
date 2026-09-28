# agent-dev 外边距与面板底部对齐

## 目标与范围

将智能体开发页的开发会话和工作区按 home/chat、已确认的 app-pro 效果对齐：显示共享 AI 提示，输入框左侧和页面右侧各保留 20px，文件树、预览及终端整体底边与开发输入框卡片底边对齐。

仅修改 ConversationAgent 页面及其专属组件；保留已有工作区改动与运行中的开发服务，不提交代码，不修改会话运行或业务数据。

## 已确认的问题

- 从空间列表点击现有「大嫂撒大嫂」进入真实地址 `/space/752/agent-dev?agentId=4301&conversationId=1693835`。
- 1920×929 下 section 外边距为 `0 12px 12px`，输入卡片距页面左边仅 12px，右侧工作区距窗口右边 12px，开发会话没有 AI 提示。
- 右侧工作区边框包住文件树、预览与终端，因此底部对齐应调整整个工作区，而不是其内部预览区。

## 实施步骤

- [x] 开发会话显式开启 UnifiedChatSession 的共享 showAnnouncement。
- [x] section 去掉左侧和底部外边距，右侧保留 20px；开发会话栏内补齐左侧 20px。
- [x] 工作区整体底部留出共享提示的 @fontHeight，全屏预览重置该间距；页头右侧操作保持同样的 20px。
- [x] 用 ego-browser 验证实际页面桌面、窄窗口和文件树/终端显示状态，确认提示未裁切、底部对齐、页面没有新增横向溢出。
- [x] 运行会话合同测试与现有 ConversationAgent 会话面板测试，检查格式与差异。

## 验证结果

- 实际地址：`http://localhost:3000/space/752/agent-dev?agentId=4301&conversationId=1693835`，来源为现有空间卡片点击，使用独立 TaskSpace 24。
- 1920×929：开发输入卡片和包含终端/日志的工作区底边均为 907px；AI 提示占 22px，底边为 929px。
- 1280×720：卡片和工作区底边均为 698px；1000×700 下均为 678px。三个尺寸中工作区右边距均为 20px，页头右侧 padding 均为 20px。
- 开发会话输入卡片高 130.398px，与调整前相同；提示没有被祖先容器裁切，文件树收起时 body 与页面均无横向溢出。
- 1920 与 1280 窗口实际展开文件树，整个文件树、预览、终端仍与输入卡片底边对齐；测试后恢复文件树收起。刷新页面后仍保持同样的 20px 与底部对齐。
- 现有固定三栏布局在窄窗下较拥挤：1000 窗口的预览宽约 227px，1280 展开文件树后约 226px。本次没有扩展为响应式布局重构。
- 全屏预览的 margin 重置已检查源码，未实际切换全屏预览，也未打开 VNC。
- `npm run test:conversation -- src/pages/ConversationAgent/AgentConversationChatPanel/index.test.tsx src/pages/ConversationAgent/ConversationAgentChatSession/index.test.tsx`：111 文件、1070 测试全部通过。
- 修改文件 Prettier 与 `git diff --check` 通过；未提交代码，其他页面的已有改动保持不变。

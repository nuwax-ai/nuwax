# 实施计划：agent-dev 面板宽度可调整

- 对应 spec：`specs/agentdev-resizable-panels.md`
- 状态：已完成。

## 改动文件

- `src/pages/ConversationAgent/index.tsx`：固定布局替换为共享 ResizableSplit，读写已有宽度偏好，计算文件树展开后的右侧下限。
- `src/pages/ConversationAgent/index.less`：左右栏适配分栏容器，section 横向滚动，保留面板圆角及底部对齐。
- `src/pages/ConversationAgent/ConversationAgentChatSession/index.less`：此前增加的左右各 20px 内边距保留。
- `src/components/ResizableSplit/index.tsx`：同容器宽度下最小宽度变化也更新边界。
- `tests/conversation/resizableSplitKeepAlive.test.tsx`：动态最小宽度回归，证明不会重建右侧子树。

## 实施顺序

1. 添加并运行动态边界测试，确认现有缺陷。
2. 修复共享分栏边界更新，再接入 agent-dev 页面。
3. 在用户指定页面检查拖动和边界、文件树、较窄窗口横向滚动，以及现有内边距和圆角。
4. 运行会话合同网及相关面板测试，完成格式与差异检查。

## 风险与回退

共享分栏变化只处理最小宽度动态更新，默认行为保持；用保活和边界测试约束。若回退，仅撤销本次分栏接入和动态边界改动，保留此前已确认的页面布局修复。

## 验证结果

- 动态边界测试先复现失败（右侧下限从 440 增至 720 后分隔位置仍为 60%），修复后自动调整为 40%，右侧子树未卸载。
- `npm run test:conversation -- src/pages/ConversationAgent/AgentConversationChatPanel/index.test.tsx src/pages/ConversationAgent/ConversationAgentChatSession/index.test.tsx`：111 文件、1071 测试通过。
- 用户指定地址的「旅伴助手」页面已实际拖动：开发会话与工作区宽度实时变化；拖动到两侧边界后约束生效，右侧预览最窄约 430.77px。
- 1920×929 下，展开文件树前后容器宽度均为 1639.5px，分隔条重新约束后右侧预览保持 430px 以上；整个调试子树 DOM 实例保持不变。
- 文件树展开时：1280×720 和 1000×700 的预览宽均为 431px；原生横向滚动至右缘后完整面板可访问，body 未产生横向溢出，section 右侧保持 20px。
- 所有场景中面板与开发输入卡片底边误差为 0，调试 padding 为 20px，面板圆角 16px。横向滚动条占用高度由左右两栏共同退让。
- 测试后恢复文件树和原有宽度偏好，退出设备模拟；TaskSpace 25 已结束。原生拖动及 DOM 测量作为验收证据，截图工具超时，未使用捕获到其他页的窗口画面作为本页证据。
- Prettier、`git diff --check` 通过，其他任务的改动保留。

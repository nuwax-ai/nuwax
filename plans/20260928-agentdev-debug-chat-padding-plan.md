# agent-dev 调试会话左右内边距

- 依据：用户截图标出 `ConversationAgentChatSession` 的 main-content，要求增加左右内边距。
- 验收地址：`http://localhost:3000/space/752/agent-dev?agentId=3937&conversationId=1556728`。
- 状态：已完成。

## 范围

- 仅修改 `src/pages/ConversationAgent/ConversationAgentChatSession/index.less` 中 main-content 的 padding，左右各留 20px；沿用原有上下内边距。
- 消息、状态及输入框共用该内容区，保持终端/日志栏及外部工作区边距不变。
- 保留当前面板 16px 圆角和之前的页面修复，不改公共会话样式或业务状态。

## 验证

- 在用户指定页面实际打开预览调试会话，检查左右内容与输入框内缩，滚动及输入区域未裁切。
- 验证普通和较窄窗口，确认外部面板圆角、右侧留白和底部对齐。
- 检查 Prettier、`git diff --check`；使用实际 UI 测量验证样式，不新增重复 CSS 的测试。

## 验证结果

- 指定页面 main-content 的上下左右 padding 均为 20px，原有上下内边距保留。
- 1280×720 下输入卡片距 main-content 左右边缘均为 20px；宽窗口保留既有输入卡片最大宽度与居中行为。
- 拖动和展开文件树后内边距保持，输入区可见，调试会话 DOM 子树保持同一实例。
- 外框 16px 圆角、工作区右侧 20px 和底部对齐均保留；格式与差异检查通过。

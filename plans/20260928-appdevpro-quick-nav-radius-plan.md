# 实施计划：全栈应用详情快捷导航与面板圆角

- 对应 spec：specs/appdevpro-quick-nav-radius.md
- 状态：已完成（按用户最终要求，两个导航项起展示）

## 改动文件清单

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| src/components/business-component/ConversationQuickNav/index.tsx | 改 | 两个导航项起展示及 auto / scrollable 模式 |
| src/components/business-component/UnifiedChatSession/types.ts | 改 | 可选快捷导航显示模式属性 |
| src/components/business-component/UnifiedChatSession/index.tsx | 改 | 透传快捷导航配置 |
| src/pages/AppDevPro/AgentConversationChatPanel/index.tsx | 改 | 工作台单轮可滚动也显示 |
| src/pages/AppDevPro/index.less | 改 | 会话导航留白和工作区 16px 圆角 |
| tests/conversationQuickNav.test.tsx | 改 | 工作台窄分栏行为回归 |
| src/pages/AppDevPro/AgentConversationChatPanel/index.test.tsx | 改 | V1/V2 及其他面板模式配置回归 |

## 实施顺序

1. 核对当前详情页、任务会话工具面板及导航显示条件。
2. 实现两个导航项起展示及工作台单轮可滚动模式，增加详情会话留白及工作区圆角。
3. 扩展已有导航门控回归，运行 test:conversation 和相关组件测试。
4. 通过已登录 ego-browser 验证真实详情页的布局、导航点击和悬停。

## 风险与回退

导航定位可能被多层 overflow 及容器查询影响；用真实页面测量和鼠标操作确认。修改仅涉及可选布局配置和详情页样式，可按本次文件 diff 回退。

## 偏离记录

用户反馈 `/space/752/app-pro/147/1694189` 仍不出现导航。实页确认只有一轮、回复可滚动，原有至少四轮门槛不满足需求。追加 scrollable 显示模式，只在 AppDevPro 使用。

随后用户最终明确“超过 1 个，2 个起”，公共规则改为两项及以上就显示，取消 600px 宽度及 1.5 倍内容高度门槛。保留 AppDevPro 单轮可滚动也显示的额外规则，移除前一版最小宽度配置。更新少轮/窄宽/无滚动和缓存隐藏回归，在指定实页完成点击及悬停验证。

## 验证结果

- 快捷导航与 AppDevPro 面板定向测试：2 个文件、37 条用例通过。
- `npm run test:conversation`：107 个文件、1044 条用例通过。
- `npm run lint:arch`：无新增违规，97 条存量豁免。
- 已登录 ego-browser 对照任务文件树工具面板，双方圆角均为 16px；AppDevPro 最小 430px 分栏下消息容器为 402px，左留白 20px，没有页面横向溢出。
- 用户指定 `/space/752/app-pro/147/1694189` 的单轮长会话：导航已出现，悬停线条从 12px 变为 24px，预览标题为本轮提问；消息区滚到 350px 后点击导航回到 0px，页面外层没有滚动。
- `/space/752/app-pro/147/1694190`：实际出现两个导航项，消息区 512px 宽、684px 高、内容 997px 高，已验证取消原 600px / 1.5 倍高度门槛。
- `git diff --check` 通过。

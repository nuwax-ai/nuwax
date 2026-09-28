# 实施计划：全栈应用详情快捷导航与面板圆角

- 对应 spec：specs/appdevpro-quick-nav-radius.md
- 状态：跟进实施中（用户反馈指定页面快捷导航仍未出现）

## 改动文件清单

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| src/components/business-component/ConversationQuickNav/index.tsx | 改 | 最小显示宽度及 auto / scrollable 模式 |
| src/components/business-component/UnifiedChatSession/types.ts | 改 | 可选快捷导航宽度及显示模式属性 |
| src/components/business-component/UnifiedChatSession/index.tsx | 改 | 透传快捷导航配置 |
| src/pages/AppDevPro/AgentConversationChatPanel/index.tsx | 改 | 工作台配置 400px，单轮可滚动也显示 |
| src/pages/AppDevPro/index.less | 改 | 会话导航留白和工作区 16px 圆角 |
| tests/conversationQuickNav.test.tsx | 改 | 工作台窄分栏行为回归 |

## 实施顺序

1. 核对当前详情页、任务会话工具面板及导航显示条件。
2. 增加可选宽度配置、详情会话留白及工作区圆角。
3. 扩展已有导航门控回归，运行 test:conversation 和相关组件测试。
4. 通过已登录 ego-browser 验证真实详情页的布局、导航点击和悬停。

## 风险与回退

导航定位可能被多层 overflow 及容器查询影响；用真实页面测量和鼠标操作确认。修改仅涉及可选布局配置和详情页样式，可按本次文件 diff 回退。

## 偏离记录

用户反馈 `/space/752/app-pro/147/1694189` 仍不出现导航。实页确认只有一轮、回复可滚动，原有至少四轮门槛不满足需求。追加 scrollable 显示模式，只在 AppDevPro 使用；普通会话保留原规则。补充单轮/少量溢出和无滚动隐藏回归，在指定实页完成点击及悬停验证。

## 验证结果

- 快捷导航与 AppDevPro 面板定向测试：2 个文件、27 条用例通过。
- `npm run test:conversation`：107 个文件、1030 条用例通过。
- `npm run lint:arch`：无新增违规，97 条存量豁免。
- 已登录 ego-browser 对照任务文件树工具面板，双方圆角均为 16px；AppDevPro 最小 430px 分栏下消息容器为 402px，左留白 20px，没有页面横向溢出。
- `git diff --check` 通过。

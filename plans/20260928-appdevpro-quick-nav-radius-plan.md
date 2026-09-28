# 实施计划：全栈应用详情快捷导航与面板圆角

- 对应 spec：specs/appdevpro-quick-nav-radius.md
- 状态：已完成（所有入口必须两个及以上才展示）

## 改动文件清单

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| src/components/business-component/ConversationQuickNav/index.tsx | 改 | 所有入口两个及以上才显示，删除单轮例外 |
| src/components/business-component/UnifiedChatSession/types.ts | 改 | 删除快捷导航显示模式属性 |
| src/components/business-component/UnifiedChatSession/index.tsx | 改 | 删除快捷导航模式透传 |
| src/pages/AppDevPro/AgentConversationChatPanel/index.tsx | 改 | 删除工作台单轮可滚动例外配置 |
| src/pages/AppDevPro/index.less | 改 | 会话导航留白和工作区 16px 圆角 |
| tests/conversationQuickNav.test.tsx | 改 | 工作台窄分栏行为回归 |
| src/pages/AppDevPro/AgentConversationChatPanel/index.test.tsx | 改 | 保留 V1/V2 面板回归，删除模式配置断言 |

## 实施顺序

1. 核对当前详情页、任务会话工具面板及导航显示条件。
2. 统一为两个及以上才展示，删除单轮例外和模式透传；保留已完成的会话留白及工作区圆角。
3. 扩展已有导航门控回归，运行 test:conversation 和相关组件测试。
4. 通过已登录 ego-browser 验证真实详情页的布局、导航点击和悬停。

## 风险与回退

导航定位可能被多层 overflow 及容器查询影响；用真实页面测量和鼠标操作确认。修改仅涉及可选布局配置和详情页样式，可按本次文件 diff 回退。

## 偏离记录

早期修复仅降低宽度门槛，随后为单轮长回复增加过工作台显示例外。用户最后明确“要两个及其以上才展示”，本次删除该例外及所有显示模式配置，所有入口统一为至少两项。原 600px 宽度及 1.5 倍内容高度限制已取消。

## 最终验证结果

- 快捷导航 29 条用例通过（包含在会话合同网），AppDevPro 面板 7 条用例通过。
- `npm run test:conversation`：108 个文件、1047 条用例通过。
- `npm run lint:arch`：无新增违规，97 条存量豁免。
- 已登录 ego-browser 对照任务文件树工具面板，双方圆角均为 16px；AppDevPro 最小 430px 分栏下消息容器为 402px，左留白 20px，没有页面横向溢出。
- 用户指定 `/space/752/app-pro/147/1694189` 的单轮长会话：消息区 684px 高、内容 1034px 高，导航项数量为 0，已验证单轮即便可滚动也隐藏。
- `/space/752/app-pro/147/1694190`：实际出现两个导航项，消息区 512px 宽、684px 高、内容 997px 高，已验证取消原 600px / 1.5 倍高度门槛。
- `git diff --check` 通过。

# 实施计划：移除会话未读功能

- 对应需求：`plans/20260928-remove-conversation-unread-intent.md`
- 状态：已完成，用户已授权移除项目会话和任务会话上的未读功能。

## 改动文件清单

- 删除 `NewHomeSection/finishedConversationUnread.ts`、`useFinishedConversationUnread.ts` 和专属测试。
- 清理 `SidebarNavHomeSection`、`TaskListSection`、`ConversationItem`、`ProjectPanel` 和 `useHomeSectionData` 中的未读属性与接线，保留任务状态同步所需观察。
- 删除 `ConversationStatusMark` 蓝点分支、LESS 样式、专用尺寸变量和五种语言的专用文案。
- 调整已有组件与列表测试，移除未读断言，保留状态同步、回包竞态、选中、菜单行为覆盖。

## 实施顺序

1. 在临时目录保存改动前文件，保留工作区已有的其他改动。
2. 从状态来源到展示层清理未读链路，并同步现有测试。
3. 运行侧栏相关测试、会话合同网、格式及依赖检查。
4. 使用现有 localhost:3000 开发服务与浏览器登录态检查项目/任务会话展示。

## 风险与回退

未读观察与列表事件去重共用部分代码，只删除未读部分；用现有状态同步测试验证执行完成与下一轮执行。回退时仅还原本任务增量，避免覆盖原有未提交改动。

## 偏离记录

暂无。

## 验证结果

- 侧栏、项目面板、任务状态事件及选中策略：10 个测试文件、126 项通过。
- `npm run test:conversation`：108 个测试文件、1047 项通过。
- `npm run lint:arch`：无新增依赖违规，沿用 97 项已有豁免；`git diff --check` 通过。
- 源码、测试、脚本和文档扫描确认已无未读模块、属性、专用文案和蓝点尺寸变量的遗留引用。
- ego-browser 在 localhost:3000 的真实登录态下检查：任务列表 17 行、项目子会话均无未读蓝点，失败标记仍可见；点击任务会话可正确选中，点击项目子会话可进入对应开发页、选中该子行并取消任务行选中。
- 已有侧栏布局、会话运行时、终端和轮询改动保留；本任务仅提交未读功能清理相关文件，不含部署。

# 实施计划：工具调用类型化展开渲染

- 对应 spec：`docs/conversation/agent-session-rendering-plan.md`、用户会话 `sess_af05e4f1-e629-4d8c-a39e-534ef0a543ed` 参考图
- 状态：已完成（代码、会话合同网与 3000 端口真实浏览器验收通过）

## 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | `src/components/MarkdownCustomProcess/toolPresentation.ts` | 新增 | 纯函数识别终端、技能、文件读取/编辑、待办、搜索/浏览器和通用工具形态 |
| 2 | `src/components/MarkdownCustomProcess/ParamsResponseView.tsx` | 修改 | 从统一 JSON 块升级为带工具语义的参数/结果展示，两个区域独立折叠和滚动 |
| 3 | `src/components/MarkdownCustomProcess/index.tsx` | 修改 | 专属形态互斥渲染，修复终端详情重复挂载 |
| 4 | `src/components/MarkdownCustomProcess/index.less` | 修改 | 对齐参考图的克制工具型卡片、代码块、结果块和暗色主题 |
| 5 | `src/features/conversation/presentation-v2/react/ProcessNodeRow.tsx` | 修改 | V2 节点按工具语义显示图标，保留统一状态和 disclosure |
| 6 | `mock/conversationScenarios.ts` | 修改 | 新增工具渲染专用场景，逐类提供真实入参/结果数据 |
| 7 | `tests/conversation/toolPresentation.test.ts`、`tests/conversation/paramsResponseView.test.tsx` | 新增 | 锁定类型识别、独立折叠和终端不重复渲染规则 |

## 实施顺序

1. 先建立纯函数分类与测试，锁定参考图对应的七类形态。
2. 重构详情组件和专属分支，确保 terminal/diff/plan/skill 与通用兜底互斥。
3. 增加 mock-chat 专用场景，覆盖收起、展开和长内容独立滚动。
4. 运行定向测试与 `npm run test:conversation`，再用 3000 端口做浏览器目检。

## 证明成立的测试

- 新增测试：工具形态分类；参数/结果独立展开；专属工具不进入通用重复分支。
- 回归范围：`npm run test:conversation`。
- 浏览器验收：`/mock-chat` 新场景在 V2 下逐类展开；DOM 中单个终端节点仅一个参数/结果视图。

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 后端工具名不稳定导致形态误判 | 协议 `type/result.kind/result.data.type` 优先，名称启发式仅影响图标和轻量展示 | 回退到通用参数/结果视图 |
| 长结果撑高会话 | 参数与结果各自限高滚动，外层节点仍受 V2 高度约束 | 移除类型样式，保留纯文本兜底 |
| V1/V2 共用组件发生回归 | 不改标签协议，专属分支保持既有数据入口；跑会话合同网 | 单独回退本次提交 |

## 偏离记录

- V2 节点详情增加 `embedded` 模式，由外层节点统一负责 disclosure；否则会形成“点外层后还需再点内部 +”的双层折叠，与参考稿的一次展开不符。
- 实测基线已增长为 46 个测试文件、430 条用例（全部通过），不再是早期记录的 419 条。

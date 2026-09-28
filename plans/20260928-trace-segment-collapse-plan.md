# 实施计划：trace-segment-collapse

- 对应 spec：specs/trace-segment-collapse.md
- 状态：已完成本地实现与验证（用户已授权该展示调整，尚未提交/发布）

## 改动文件清单

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| src/features/conversation/presentation-v2/traceSegments.ts | 新增 | 正文边界、稳定段键和独立汇总 |
| src/features/conversation/presentation-v2/react/WorkTraceDisclosure.tsx | 修改 | 托管段折叠，保留节点与工具组状态 |
| src/features/conversation/presentation-v2/react/index.less | 修改 | 段汇总按钮与折叠间距 |
| tests/conversation/traceSegments.test.ts | 新增 | 分段、边界与计数合同 |
| tests/conversationRendererComponent.test.tsx | 修改 | 流式自动收起及手动状态回归 |
| tests/conversation/openUiTraceNode.test.tsx | 修改 | 折叠、收尾前后保持产物实例 |

## 实施顺序

1. 落盘需求、规格与本计划，按代码核对 finalAnswer 边界。
2. 并行编写纯函数合同测试；实现分段纯函数及组件状态。
3. 运行相关组件测试与完整会话合同网，修复回归。
4. ego-browser 在已有 dev server 的 mock 页面验证流式切换，保留验收证据。

## 证明成立的测试

- 纯函数：节点原序、首节点稳定键、正文关闭段、finalAnswer 尾边界、该段计数、时间缺失。
- 组件：正文初始分片立即关闭段，下一段展示、旧段重开不被后续分片覆盖、OpenUI 保留。
- 回归：npm run test:conversation、渲染器相关测试、格式与 git diff --check。

## 风险与回退

| 风险 | 缓解 | 回退 |
| --- | --- | --- |
| 最新正文不在 nodes | 明确检查 finalAnswer.text | 撤回本次展示层修改 |
| 自动折叠覆盖用户重开 | 只在 active → closed 时重置一次 | 同上 |
| 折叠导致产物或正文隐藏 | 常显项置于详情门禁之前 | 同上 |

## 偏离记录

为防止运行态到终态重挂载 OpenUI，统一保留过程段的 React 父路径；终态不显示段级按钮，保留原整轮折叠交互。隐藏恢复同时打开含隐藏项的过程段，失败段汇总保留错误图标。

## 验证结果

- `npm run test:conversation`：106 文件 / 1017 测试通过。
- 渲染器组件：41 测试通过；OpenUI 12、计时隔离 2、纯函数分段 16 通过。
- 投影/偏好/双数据线/页面渲染选择：54 测试通过。
- `lint:arch`、ESLint、Stylelint、Prettier、`git diff --check` 通过；全库 tsc 存量错误存在，改动路径无报错。
- ego-browser：`V2_GROUPED_TOOL_TRACE` 和 `RENDERER_SHOWCASE` × legacy/runtime 四组合通过。观测到正常正文开始时闭合段、下一段展开、旧段手动重开保持、失败提示和终态收起。页面协议终态断言均通过。
- 本地截图：`/tmp/nuwax-trace-segment-running.png`；流式观测记录：`/tmp/nuwax-trace-segment-runtime.json`、`/tmp/nuwax-trace-segment-showcase.json`。

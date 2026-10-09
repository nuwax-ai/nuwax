# 2026-10-09 PC 六项 BUG 合入检查

- 目标分支：`feat-dong.0930-remaining`，合入前 HEAD `598396c00d20a0ff33af79c1cbc97a2eeeabaf45`。
- 来源分支：`codex/pc-bugs-20261008`，修复提交 `da8da74b1acf5bb97004905e2ff13dae8f7800c4`。
- 范围：BUG-4、17、51、54、75、78。
- 在隔离 worktree 合并验证；主工作区实际合并产生的源码树与已验证树一致（`bea034d7721af9b8e1de52918bd07e915de66498`）。本记录是合入时追加的文档。
- 自动归并五处重叠文件，无文本冲突；复核了问答快照与跨端消息归并、停止等待与恢复连接、任务终端缓存的组合行为。

## 合并前质量自查

按 `pre-commit-quality-review` 三问走查整批 53 个改动文件，结论：可合并，无阻塞问题。

- **内聚通过**：停止等待由 runtime session 统一维护（`src/features/conversation/runtime/createConversationRuntimeSession.ts:213`），V1 复用停止 hook（`src/hooks/useConversationStopRequest.ts:37`）；终端打开意图归任务缓存，隐藏释放连接（`src/pages/Chat/index.tsx:1733`）。
- **分层通过**：周期和问答快照规则是仅依赖类型的纯函数（`src/utils/timedPeriod.ts:6`、`src/utils/mcpAskResolution.ts:8`）；选项请求与表单派生态由 hook 承接（`src/hooks/useTimedPeriodOptions.ts:7`）。页面消费共享规则，分层检查无新增违规。
- **可维护性通过**：停止回包以代际隔离旧会话（`src/hooks/useConversationStopRequest.ts:42`）；问答关闭按会话、requestId、revision 去重（`src/components/business-component/AgentIntervention/AgentInterventionChatLayer/index.tsx:47`）；IM 导航版本区分同地址明确导航和普通恢复（`src/layouts/MicroAppHost/store.ts:55`）。关键竞态已有行为测试。

## 合入回归

- 会话质量门：116 个文件、1202 个用例通过。
- 相关组件与微应用测试：17 个文件、119 个用例通过。
- 分层检查：3030 个模块、13171 条依赖，无新增违规；97 项历史豁免。
- 类型门：四个检查域均 0 诊断；与目标 HEAD 全量诊断比对，基线 289、合并后 288，新增 0。
- 固定 IM / 资料库版本的适配构建通过；子模块版本仍为 `e541befd2` / `5c676b854`。
- 浏览器矩阵：正常输出、恢复、问答及交互，V1/V2 数据与渲染组合，16 项全部通过。首次瞬间档出现一次 `sawActive=false`，原速单项复查通过；放慢回放后整套通过，未修改断言或业务源码。

## 人工验收

页面逐项验收由用户执行：停止保留尾部 SSE、确认后关闭问答卡片、任务终端 A→B→A、能力弹窗自定义主题、电脑卡片直达 IM、周期原 cron 回显与保留。

原修复 worktree 保留。本次仅本地合并，不推送或部署；主工作区原有两处子模块 checkout 差异保留。

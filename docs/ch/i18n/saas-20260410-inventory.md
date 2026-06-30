# 多语言治理全量扫描报告（SAAS 2026-04-10）

- 生成时间：2026-06-30T14:51:27.356Z
- 扫描范围：src/pages, src/components, src/layouts, src/hooks, src/models, src/services
- 规则：hardcoded 中文字符串 / legacy `System.*` key / invalid `dict()` key 格式

## 汇总

- 总问题数：803
- hardcoded 中文：782
- legacy System key：0
- invalid dict key：21

## 按模块统计

| 模块 | hardcoded 中文 | legacyKey | invalidKey | 总计 |
| --- | --: | --: | --: | --: |
| src/pages/Antv-X6 | 252 | 0 | 0 | 252 |
| src/components/business-component | 165 | 0 | 0 | 165 |
| src/components/KnowledgeGraph | 153 | 0 | 0 | 153 |
| src/pages/SpaceResource | 53 | 0 | 0 | 53 |
| src/pages/SpaceKnowledge | 33 | 0 | 0 | 33 |
| src/components/MarkdownRenderer | 29 | 0 | 0 | 29 |
| src/models | 20 | 0 | 0 | 20 |
| src/pages/SystemManagement | 4 | 0 | 12 | 16 |
| src/layouts/DynamicMenusLayout | 8 | 0 | 2 | 10 |
| src/components/MarkdownCustomProcess | 6 | 0 | 0 | 6 |
| src/components/ProComponents | 2 | 0 | 4 | 6 |
| src/components/TiptapVariableInput | 6 | 0 | 0 | 6 |
| src/components/CodeViewer | 5 | 0 | 0 | 5 |
| src/components/SelectComponent | 5 | 0 | 0 | 5 |
| src/pages/IMChannel | 4 | 0 | 0 | 4 |
| src/pages/MorePage | 2 | 0 | 2 | 4 |
| src/pages/AppDev | 3 | 0 | 0 | 3 |
| src/pages/Login | 3 | 0 | 0 | 3 |
| src/pages/SpaceDevelop | 3 | 0 | 0 | 3 |
| src/pages/ConversationAgent | 2 | 0 | 0 | 2 |
| src/pages/GlobalModelManage | 2 | 0 | 0 | 2 |
| src/pages/SpaceLibrary | 2 | 0 | 0 | 2 |
| src/pages/SpaceTable | 2 | 0 | 0 | 2 |
| src/components/AgentSidebar | 2 | 0 | 0 | 2 |
| src/components/ChatInputHome | 2 | 0 | 0 | 2 |
| src/components/PublishComponentModal | 2 | 0 | 0 | 2 |
| src/components/TestRun | 2 | 0 | 0 | 2 |
| src/pages/ChatTemp | 1 | 0 | 0 | 1 |
| src/pages/EditAgent | 1 | 0 | 0 | 1 |
| src/pages/PublishAudit | 1 | 0 | 0 | 1 |
| src/pages/PublishedManage | 1 | 0 | 0 | 1 |
| src/pages/SpacePageDevelop | 1 | 0 | 0 | 1 |
| src/components/ChatView | 1 | 0 | 0 | 1 |
| src/components/NoMoreDivider | 1 | 0 | 0 | 1 |
| src/components/Skill | 1 | 0 | 0 | 1 |
| src/layouts/HoverMenu | 1 | 0 | 0 | 1 |
| src/layouts/Setting | 0 | 0 | 1 | 1 |
| src/hooks | 1 | 0 | 0 | 1 |

## src/pages/Antv-X6

- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/createdPicker.test.ts:17 -> `非 AgentFlow 时保持原 tabs`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/createdPicker.test.ts:27 -> `AgentFlow 添加工作流节点仅展示工作流 Tab`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/createdPicker.test.ts:37 -> `AgentFlow 添加智能体节点仅展示智能体 Tab`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/createdPicker.test.ts:48 -> `优先识别合法 subType`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/createdPicker.test.ts:56 -> `无效 subType 时回退 targetSubType / agentType`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/createdPicker.test.ts:76 -> `TaskAgent 无 subType 时视为 General`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/createdPicker.test.ts:83 -> `仅 ChatBot / General / Custom 可被 AgentFlow 智能体节点选中`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/edgeConnect.test.ts:19 -> `RouteDecision 任意出口端口走分支路径`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/edgeConnect.test.ts:28 -> `HumanInteraction options 端口走分支路径`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/edgeConnect.test.ts:42 -> `HumanInteraction 文本模式走普通边路径`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/edgeSync.test.ts:34 -> `findGraphEdgesBetween 按 cellId 匹配`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/edgeSync.test.ts:51 -> `purgeEdgeBetween 同步删除 proxy 与画布`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/edgeSync.test.ts:68 -> `purgeNodeIncidentEdges 清理 proxy 与画布关联边`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/middleNodeEdgeCleanup.test.ts:13 -> `删除与节点相关的入边和出边`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/middleNodeEdgeCleanup.test.ts:34 -> `支持 excludeEdgeIds`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:28 -> `RouteDecision / HumanInteraction 需要映射`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:33 -> `其它类型不需要映射`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:54 -> `其它类型原样返回`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:61 -> `null/undefined 返回空串`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:67 -> `serializeNodeForBackend (出参)`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:68 -> `RouteDecision 节点改写为 IntentRecognition，保留 nodeConfig`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:77 -> `HumanInteraction 节点改写为 QA，保留 nodeConfig`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:87 -> `非映射节点不变（保持引用相等）`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:93 -> `normalizeLoadedNode (入参·按 flow 上下文)`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:112 -> `Workflow：IntentRecognition / QA 保持不变`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:127 -> `非映射后端类型在任何 flow 下都不变`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:139 -> `normalizeLoadedNodes (批量)`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:140 -> `AgentFlow：IntentRecognition/QA 分别还原为 RouteDecision/HumanInteraction`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:158 -> `Workflow：IntentRecognition / QA 全部保持`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:172 -> `null/undefined 入参返回空数组`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:178 -> `遗留默认文案修正 (defaults)`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:181 -> `路由决策`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:182 -> `AI 决策走哪条分支`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:183 -> `意图识别`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:184 -> `意图识别描述`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:187 -> `询问用户`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:188 -> `向用户提问并获取回复`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:189 -> `问答`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:190 -> `问答描述`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:194 -> `AgentFlow：意图识别默认文案 → 路由决策默认文案`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:197 -> `意图识别`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:198 -> `意图识别描述`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:202 -> `路由决策`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:203 -> `AI 决策走哪条分支`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:206 -> `AgentFlow：问答默认文案 → 询问用户默认文案`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:209 -> `问答`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:210 -> `问答描述`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:214 -> `询问用户`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:215 -> `向用户提问并获取回复`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:218 -> `AgentFlow：空名 → 前端默认名`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:221 -> `路由决策`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:225 -> `询问用户`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:229 -> `AgentFlow：用户自定义名/描述不被覆盖`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:232 -> `我的提问`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:233 -> `自定义说明`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:236 -> `我的提问`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:237 -> `自定义说明`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:240 -> `不传 defaults 时只改 type，不动文案`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:243 -> `问答`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:244 -> `问答描述`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:248 -> `问答`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:249 -> `问答描述`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:253 -> `往返一致性`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:254 -> `RouteDecision: 出参序列化 → AgentFlow 入参还原 → 类型一致`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:266 -> `HumanInteraction: 出参序列化 → AgentFlow 入参还原 → 类型一致`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:269 -> `订单号?`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/nodeTypeMapping.test.ts:275 -> `订单号?`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:21 -> `normalize: 补全 answerType 与 formArgs 默认值`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:23 -> `你好？`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:27 -> `你好？`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:34 -> `normalize: formArgs 非空推断为 FORM`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:42 -> `normalize: contextWriteKey 迁移到 outputArgs[0].name`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:58 -> `serialize: 保留 answerType`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:68 -> `serialize: SELECT 保留 options 连线，FORM/TEXT 清空`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:82 -> `getHitlOptions 读取扁平 options`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:90 -> `serialize: 选择类 selectConfig 归一化为 {label,value}[]，其余清空`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:95 -> `类型`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:98 -> `退货\n换货`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:101 -> `说明`
- [hardcoded_chinese] src/pages/Antv-X6/v3/agentFlow/**tests**/qaConfigAdapter.test.ts:104 -> `脏数据`
- ... 省略 172 条

## src/components/business-component

- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:8 -> `权限审批`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:9 -> `安全确认`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:10 -> `已提交`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:51 -> `执行 bash 命令`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:55 -> `允许一次`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:56 -> `始终允许`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:57 -> `拒绝一次`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:58 -> `始终拒绝`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:82 -> `允许一次`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:83 -> `始终允许`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:84 -> `拒绝一次`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:85 -> `始终拒绝`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:98 -> `允许一次`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:116 -> `已提交`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:147 -> `网络错误`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:154 -> `网络错误`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/AcpPermissionCard/index.test.tsx:181 -> `安全确认`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/McpAskFormField.test.tsx:34 -> `并发数`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/McpAskFormField.test.tsx:57 -> `并发数`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/McpAskFormField.test.tsx:71 -> `数量`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/McpAskFormField.tsx:248 -> `点击或拖拽文件到此区域上传`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:9 -> `确认`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:10 -> `取消`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:11 -> `取消（Esc）`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:12 -> `Agent 提问`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:13 -> `请填写此项`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:14 -> `请至少选择一项`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:15 -> `跳过`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:42 -> `请选择继续方式`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:43 -> `Agent 需要你确认下一步。`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:47 -> `请选择继续方式`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:51 -> `选项`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:55 -> `直接部署`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:56 -> `先跑测试`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:57 -> `取消任务`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:60 -> `补充说明`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:63 -> `检查项`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:67 -> `代码检查`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:68 -> `单元测试`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:72 -> `提交`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:73 -> `取消`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:89 -> `请选择继续方式`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:90 -> `Agent 需要你确认下一步。`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:91 -> `选项`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:92 -> `先跑测试`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:93 -> `补充说明`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:94 -> `检查项`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:95 -> `代码检查`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:97 -> `先跑测试`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:98 -> `补充说明`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:99 -> `先跑关键链路`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:101 -> `代码检查`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:102 -> `提 交`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/McpAskQuestionCard/index.test.tsx:115 -> `先跑关键链路`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue.test.ts:18 -> `毕业论文 PPT 前置信息收集`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue.test.ts:22 -> `毕业论文 PPT 前置信息收集`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/hooks/useAgentInterventionHandlers.test.ts:64 -> `测试问题`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/hooks/useAgentInterventionHandlers.test.ts:136 -> `失败`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/hooks/useAgentInterventionHandlers.test.ts:165 -> `失败`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/hooks/useAgentInterventionHandlers.test.ts:435 -> `测试问题`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyAcpPermissionSseEvent.test.ts:225 -> `编辑文件`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyAcpPermissionSseEvent.test.ts:334 -> `写入文件`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyAcpPermissionSseEvent.test.ts:373 -> `写入文件`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:16 -> `选项`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:235 -> `确认方案`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:239 -> `确认方案`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:240 -> `确认`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:276 -> `确认`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:301 -> `确认`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:338 -> `nuwax_ask_question 演示`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:342 -> `演示表单`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:346 -> `最喜欢的颜色`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:348 -> `红色`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:379 -> `服务端盖戳`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:386 -> `选项`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:389 -> `甲`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.test.ts:390 -> `乙`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/applyMcpAskToolCallSseEvent.ts:23 -> `设为`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/extractMcpAskStructuredInput.test.ts:23 -> `确认方案`
- [hardcoded_chinese] src/components/business-component/AgentIntervention/utils/extractMcpAskStructuredInput.test.ts:27 -> `确认方案`
- ... 省略 85 条

## src/components/KnowledgeGraph

- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:33 -> `文档导入`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:34 -> `手动添加`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:35 -> `API导入`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:36 -> `其他`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:41 -> `包含`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:42 -> `关联`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:43 -> `属于`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:44 -> `引用`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:45 -> `依赖`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:46 -> `其他`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:61 -> `请输入图谱对象`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:65 -> `请选择图谱关系`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:69 -> `请输入图谱对象值`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:96 -> `手动添加图谱节点`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:109 -> `手动添加`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:125 -> `请输入图谱对象名称`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:138 -> `请选择或输入图谱关系`
- [hardcoded_chinese] src/components/KnowledgeGraph/AddNodeModal.tsx:157 -> `请输入图谱对象值`
- [hardcoded_chinese] src/components/KnowledgeGraph/BatchImportModal.tsx:67 -> `图谱节点导入模板.csv`
- [hardcoded_chinese] src/components/KnowledgeGraph/BatchImportModal.tsx:72 -> `模板下载成功`
- [hardcoded_chinese] src/components/KnowledgeGraph/BatchImportModal.tsx:89 -> `请上传正确的文件类型`
- [hardcoded_chinese] src/components/KnowledgeGraph/BatchImportModal.tsx:97 -> `请上传 PDF、TXT、DOC、DOCX、MD、JSON、JPG、PNG、GIF、WEBP、SVG、HEIC、MP4、MKV、MOV、WEBM、MP3、AAC、WAV、FLAC、OGG、OPUS 类型文件!`
- [hardcoded_chinese] src/components/KnowledgeGraph/BatchImportModal.tsx:103 -> `文件大小不能超过100MB!`
- [hardcoded_chinese] src/components/KnowledgeGraph/BatchImportModal.tsx:127 -> `请先上传文件`
- [hardcoded_chinese] src/components/KnowledgeGraph/BatchImportModal.tsx:131 -> `最多可上传 300 个文件`
- [hardcoded_chinese] src/components/KnowledgeGraph/BatchImportModal.tsx:140 -> `导入成功`
- [hardcoded_chinese] src/components/KnowledgeGraph/BatchImportModal.tsx:152 -> `批量导入图谱节点`
- [hardcoded_chinese] src/components/KnowledgeGraph/BatchImportModal.tsx:158 -> `下载导入模板`
- [hardcoded_chinese] src/components/KnowledgeGraph/EditModal.tsx:39 -> `标签不能为空`
- [hardcoded_chinese] src/components/KnowledgeGraph/EditModal.tsx:53 -> `确认删除`
- [hardcoded_chinese] src/components/KnowledgeGraph/EditModal.tsx:54 -> `删除后数据将无法恢复，确定要删除吗？`
- [hardcoded_chinese] src/components/KnowledgeGraph/EditModal.tsx:55 -> `确定`
- [hardcoded_chinese] src/components/KnowledgeGraph/EditModal.tsx:56 -> `取消`
- [hardcoded_chinese] src/components/KnowledgeGraph/EditModal.tsx:66 -> `编辑节点`
- [hardcoded_chinese] src/components/KnowledgeGraph/EditModal.tsx:66 -> `编辑关系`
- [hardcoded_chinese] src/components/KnowledgeGraph/EditModal.tsx:79 -> `请输入标签`
- [hardcoded_chinese] src/components/KnowledgeGraph/EditModal.tsx:88 -> `请输入详细内容`
- [hardcoded_chinese] src/components/KnowledgeGraph/SearchBar.tsx:33 -> `搜索对象或内容...`
- [hardcoded_chinese] src/components/KnowledgeGraph/Toolbar.tsx:30 -> `放大`
- [hardcoded_chinese] src/components/KnowledgeGraph/Toolbar.tsx:33 -> `缩小`
- [hardcoded_chinese] src/components/KnowledgeGraph/Toolbar.tsx:36 -> `适应画布`
- [hardcoded_chinese] src/components/KnowledgeGraph/Toolbar.tsx:39 -> `重置`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:10 -> `人工智能`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:12 -> `应用领域`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:12 -> `自然语言处理`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:13 -> `应用领域`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:13 -> `计算机视觉`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:14 -> `应用领域`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:14 -> `语音识别`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:15 -> `核心技术`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:15 -> `深度学习`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:16 -> `核心技术`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:16 -> `机器学习`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:17 -> `编程语言`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:21 -> `深度学习`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:23 -> `框架`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:24 -> `框架`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:25 -> `应用`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:25 -> `图像识别`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:26 -> `应用`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:26 -> `文本生成`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:30 -> `自然语言处理`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:32 -> `任务`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:32 -> `文本分类`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:33 -> `任务`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:33 -> `情感分析`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:34 -> `任务`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:34 -> `机器翻译`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:35 -> `模型`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:36 -> `模型`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:44 -> `前端开发`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:46 -> `框架`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:47 -> `框架`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:48 -> `框架`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:49 -> `构建工具`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:50 -> `构建工具`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:51 -> `语言`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:52 -> `语言`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:58 -> `特点`
- [hardcoded_chinese] src/components/KnowledgeGraph/data/docGraphData.ts:58 -> `组件化开发`
- ... 省略 73 条

## src/pages/SpaceResource

- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:42 -> `免费版`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:43 -> `适合轻度使用，体验基础智能体功能`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:46 -> `50次/日`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:53 -> `标准版`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:54 -> `适合个人开发者日常使用，性价比之选`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:57 -> `500次/日`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:64 -> `专业版`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:65 -> `适合专业开发者，更多调用和高级模型`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:68 -> `2000次/日`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:75 -> `企业版`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:76 -> `适合团队使用，不限调用和专属资源`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:79 -> `不限`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:86 -> `季度标准`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:87 -> `按季度付费，享受标准版全部能力`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:90 -> `500次/日`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:97 -> `年度专业`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:98 -> `按年付费优惠，专业版能力全覆盖`
- [hardcoded_chinese] src/pages/SpaceResource/AgentSubscriptions/index.tsx:101 -> `2000次/日`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ModelPricingTab/ModelPricingModal/index.tsx:65 -> `可为`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ModelPricingTab/index.tsx:98 -> `走`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ToolPricingTab/index.tsx:89 -> `；删除：`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ToolPricingTab/index.tsx:89 -> `；表单：`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ToolPricingTab/index.tsx:349 -> `由接口`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ToolPricingTab/index.tsx:349 -> ` 过滤；`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:29 -> `基础版`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:30 -> `适合个人开发者入门使用，包含核心功能，性价比之选`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:31 -> `月`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:40 -> `专业版`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:41 -> `适合专业开发者，更多调用次数和高级功能`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:42 -> `月`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:51 -> `企业版`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:52 -> `适合团队使用，无限调用和专属技术支持`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:53 -> `月`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:62 -> `AI工具订阅`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:63 -> `仅限功能使用，模型调用按量计费，灵活搭配`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:64 -> `月`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:73 -> `代码助手包`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:74 -> `代码生成、审查、重构等开发工具专用订阅`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:75 -> `月`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:84 -> `旗舰定制版`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:85 -> `全功能包含，包干价，不限调用次数`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:86 -> `年`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:109 -> `月`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:109 -> `季`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:109 -> `年`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:109 -> `月`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:143 -> `月`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:685 -> `月`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:685 -> `季`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:685 -> `年`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:688 -> `月`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:694 -> `季`
- [hardcoded_chinese] src/pages/SpaceResource/SubscriptionSettings/index.tsx:700 -> `年`

## src/pages/SpaceKnowledge

- [hardcoded_chinese] src/pages/SpaceKnowledge/DocWrap/DocItem/index.tsx:36 -> `分析中`
- [hardcoded_chinese] src/pages/SpaceKnowledge/DocWrap/DocItem/index.tsx:37 -> `分段生成中`
- [hardcoded_chinese] src/pages/SpaceKnowledge/DocWrap/DocItem/index.tsx:61 -> `构建中`
- [hardcoded_chinese] src/pages/SpaceKnowledge/GraphDocTable/index.tsx:224 -> `确定要关闭图谱吗？`
- [hardcoded_chinese] src/pages/SpaceKnowledge/GraphDocTable/index.tsx:228 -> `确定`
- [hardcoded_chinese] src/pages/SpaceKnowledge/GraphDocTable/index.tsx:229 -> `取消`
- [hardcoded_chinese] src/pages/SpaceKnowledge/GraphDocTable/index.tsx:231 -> `关闭图谱`
- [hardcoded_chinese] src/pages/SpaceKnowledge/LocalCustomDocModal/index.tsx:245 -> `分段标识符`
- [hardcoded_chinese] src/pages/SpaceKnowledge/LocalCustomDocModal/index.tsx:251 -> `分段标识符`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaBatchModal/index.tsx:74 -> `上传失败，请检查文件格式是否正确`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaBatchModal/index.tsx:77 -> `上传文件出错:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaBatchModal/index.tsx:100 -> `仅支持Excel文件(.xlsx/.xls)`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaBatchModal/index.tsx:107 -> `文件大小不能超过10MB`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaBatchModal/index.tsx:125 -> `请上传文件`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaBatchModal/index.tsx:134 -> `批量导入成功`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaBatchModal/index.tsx:159 -> `导出失败`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaBatchModal/index.tsx:168 -> `QA批量excel模板.xlsx`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaBatchModal/index.tsx:173 -> `下载QA批量excel模板失败`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaBatchModal/index.tsx:179 -> `QA批量导入`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaBatchModal/index.tsx:185 -> `下载Excel导入模板`
- [hardcoded_chinese] src/pages/SpaceKnowledge/RawSegmentInfo/RawSegmentEditModal/index.tsx:61 -> `分段内容不能超过2000个字符`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:99 -> ` 显示表格，`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:188 -> `加载知识图谱列表失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:374 -> `检查知识图谱生成状态失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:383 -> `生成知识图谱失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:486 -> `删除文档 ${id} 失败`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:503 -> `批量删除知识图谱失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:556 -> `删除知识图谱失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:579 -> `查看全部知识图谱失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:698 -> `QA问答更新失败`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:698 -> `添加QA问答失败`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:772 -> `添加节点数据:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:782 -> `导入文件列表:`

## src/components/MarkdownRenderer

- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:16 -> `空输入返回空串`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:20 -> `无定界符文本原样返回`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:21 -> `hello world，没有数学公式`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:25 -> `替换行内定界符 \\( \\) 为 $...$`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:26 -> `公式 \\(a + b\\) 结束`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:27 -> `公式 $a + b$ 结束`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:31 -> `替换块级定界符 \\[ \\] 为 $$...$$`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:32 -> `块 \\[\\int_0^1 x\\,dx\\] 尾`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:33 -> `块 $$\\int_0^1 x\\,dx$$ 尾`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:37 -> `base64 data URL 原样还原，不被当作定界符扫描`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:39 -> `前缀 ![img](${url}) 后缀`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:43 -> `单个 data URL 内部即便含有形似定界符的片段也不被替换`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:52 -> `多个 data URL 共存：每个都完整还原，互不吞并（验证 \\s 被移除）`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:53 -> `URL1 + 空格 + URL2 的 data 前缀`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:65 -> `data URL 与数学公式混合：两边各得其所`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:67 -> `![img](${url}) 然后 \\(c = a + b\\)`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:68 -> `![img](${url}) 然后 $c = a + b$`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:73 -> `空输入返回空串`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:77 -> `不含 markdown-custom-process 标签时原样返回（短路）`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:78 -> `![img](${makeDataUrl(500)}) 普通文本，没有过程标签`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:83 -> `含 base64 data URL 但无过程标签时不进入正则扫描`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:85 -> `![big](${url}) 文本`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:90 -> `单个过程标签被 div 包装保留`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:93 -> `前文\n${tag}\n后文`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:100 -> `连续多个过程标签合并为 markdown-custom-process-group`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:109 -> `type=Plan 标签单独成块，type 排在 name 之前时不并入 group`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:119 -> `type=Plan 标签单独成块，type 排在 name 之后时也不并入 group`
- [hardcoded_chinese] src/components/MarkdownRenderer/**tests**/utils.test.ts:131 -> `同一 executeId 的重复标签只保留最后一个（去重）`
- [hardcoded_chinese] src/components/MarkdownRenderer/utils.ts:516 -> `执行计划`

## src/models

- [hardcoded_chinese] src/models/autoErrorHandling.ts:170 -> `[AutoErrorHandling] 📊 自动重试次数: ${newCount}`
- [hardcoded_chinese] src/models/conversationAgent.ts:349 -> `问答`
- [hardcoded_chinese] src/models/conversationAgent.ts:594 -> `Agent正在执行任务，请等待当前任务完成后再发送新请求`
- [hardcoded_chinese] src/models/conversationAgent.ts:597 -> `正在执行任务`
- [hardcoded_chinese] src/models/conversationAgent.ts:598 -> `正在执行任务`
- [hardcoded_chinese] src/models/conversationAgent.ts:636 -> `用户主动取消任务`
- [hardcoded_chinese] src/models/conversationInfo.ts:179 -> `发出后长时间无状态`
- [hardcoded_chinese] src/models/conversationInfo.ts:766 -> `问答`
- [hardcoded_chinese] src/models/conversationInfo.ts:1108 -> `Agent正在执行任务，请等待当前任务完成后再发送新请求`
- [hardcoded_chinese] src/models/conversationInfo.ts:1111 -> `正在执行任务`
- [hardcoded_chinese] src/models/conversationInfo.ts:1112 -> `正在执行任务`
- [hardcoded_chinese] src/models/conversationInfo.ts:1144 -> `用户主动取消任务`
- [hardcoded_chinese] src/models/conversationInfo.ts:1446 -> `发送后会话开始状态`
- [hardcoded_chinese] src/models/conversationInfo.ts:1448 -> `发送后保活`
- [hardcoded_chinese] src/models/spaceAgent.ts:29 -> `保存成功`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:25 -> `租户配置为空`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:54 -> `租户配置保存完成，重新初始化统一主题服务`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:77 -> `已同步租户主题配置（本地无配置）:`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:92 -> `租户信息接口失败`
- [hardcoded_chinese] src/models/workflowV3.ts:4 -> `) 代替 useModel(`

## src/pages/SystemManagement

- [invalid_dict_key] src/pages/SystemManagement/PaymentEarnings/Config/index.tsx:201 -> `PC.Routes.paymentConfig`
- [invalid_dict_key] src/pages/SystemManagement/PaymentEarnings/DevPayment/index.tsx:119 -> `PC.Routes.devPaymentInfo`
- [hardcoded_chinese] src/pages/SystemManagement/PaymentEarnings/EarningsDetail/index.tsx:76 -> `请选择日期`
- [invalid_dict_key] src/pages/SystemManagement/PaymentEarnings/EarningsStats/index.tsx:36 -> `PC.Routes.devEarningsStats`
- [invalid_dict_key] src/pages/SystemManagement/PaymentEarnings/MerchantInfo/index.tsx:484 -> `PC.Routes.paymentMerchantInfo`
- [invalid_dict_key] src/pages/SystemManagement/PaymentEarnings/Orders/index.tsx:160 -> `PC.Routes.paymentOrders`
- [hardcoded_chinese] src/pages/SystemManagement/PaymentEarnings/Withdrawal/components/PendingWithdrawalTable/index.tsx:181 -> `支付宝`
- [hardcoded_chinese] src/pages/SystemManagement/PaymentEarnings/Withdrawal/components/PendingWithdrawalTable/index.tsx:181 -> `银行卡`
- [hardcoded_chinese] src/pages/SystemManagement/PaymentEarnings/Withdrawal/index.tsx:17 -> `的兼容重定向至`
- [invalid_dict_key] src/pages/SystemManagement/PaymentEarnings/Withdrawal/index.tsx:65 -> `PC.Routes.devWithdrawal`
- [invalid_dict_key] src/pages/SystemManagement/SubscriptionCredits/BasicConfig/index.tsx:80 -> `PC.Routes.subsBasicConfig`
- [invalid_dict_key] src/pages/SystemManagement/SubscriptionCredits/CreditPackages/index.tsx:261 -> `PC.Routes.creditsPackages`
- [invalid_dict_key] src/pages/SystemManagement/SubscriptionCredits/CreditRecords/index.tsx:376 -> `PC.Routes.creditsRecordsQuery`
- [invalid_dict_key] src/pages/SystemManagement/SubscriptionCredits/Orders/index.tsx:272 -> `PC.Routes.subsOrders`
- [invalid_dict_key] src/pages/SystemManagement/SubscriptionCredits/Plans/index.tsx:378 -> `PC.Routes.subsPlans`
- [invalid_dict_key] src/pages/SystemManagement/SubscriptionCredits/UserCredits/index.tsx:247 -> `PC.Routes.userCreditsQuery`

## src/layouts/DynamicMenusLayout

- [hardcoded_chinese] src/layouts/DynamicMenusLayout/DynamicSecondMenu/index.tsx:661 -> `成员与设置`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/DynamicSecondMenu/index.tsx:661 -> `成员与设置`
- [invalid_dict_key] src/layouts/DynamicMenusLayout/NewHomeSection/components/SearchHeader/index.tsx:44 -> `PC.Constants.Menus.newChat`
- [invalid_dict_key] src/layouts/DynamicMenusLayout/NewHomeSection/utils.ts:18 -> `PC.Utils.Common.yesterday`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/NewHomeSection/utils.ts:23 -> `M月D日`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/SpaceSection/SpaceTitle/PersonalSpaceContent/index.tsx:92 -> `智能体开发`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/SpaceSection/SpaceTitle/PersonalSpaceContent/index.tsx:97 -> `成员与设置`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/SpaceSection/SpaceTitle/PersonalSpaceContent/index.tsx:97 -> `成员与设置`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/SpaceSection/index.tsx:105 -> `工作空间智能体`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/index.tsx:630 -> `和 动态菜单的`

## src/components/MarkdownCustomProcess

- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:202 -> `暂无数据`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:255 -> `页面预览`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:384 -> `暂无数据`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:390 -> `数据格式错误`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:398 -> `页面路径不存在`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:582 -> `复制`

## src/components/ProComponents

- [hardcoded_chinese] src/components/ProComponents/TableActions/index.tsx:31 -> `更多`
- [hardcoded_chinese] src/components/ProComponents/TableActions/index.tsx:63 -> `(经典) 和`
- [invalid_dict_key] src/components/ProComponents/XProTable/index.tsx:187 -> `PC.Constants.DataTable.search`
- [invalid_dict_key] src/components/ProComponents/XProTable/index.tsx:188 -> `PC.Constants.DataTable.reset`
- [invalid_dict_key] src/components/ProComponents/XProTable/index.tsx:239 -> `PC.Constants.DataTable.totalPrefix`
- [invalid_dict_key] src/components/ProComponents/XProTable/index.tsx:247 -> `PC.Constants.DataTable.itemsPerPage`

## src/components/TiptapVariableInput

- [hardcoded_chinese] src/components/TiptapVariableInput/extensions/VariableSuggestion.tsx:20 -> `，默认 `
- [hardcoded_chinese] src/components/TiptapVariableInput/extensions/VariableSuggestion.tsx:95 -> `之前遇到了`
- [hardcoded_chinese] src/components/TiptapVariableInput/types.ts:105 -> `，默认 `
- [hardcoded_chinese] src/components/TiptapVariableInput/utils/htmlUtils.ts:572 -> `，默认 `
- [hardcoded_chinese] src/components/TiptapVariableInput/utils/htmlUtils.ts:728 -> `，默认 `
- [hardcoded_chinese] src/components/TiptapVariableInput/utils/suggestionUtils.ts:21 -> `开头，或者 variable.type 是`

## src/components/CodeViewer

- [hardcoded_chinese] src/components/CodeViewer/MonacoEditor/index.tsx:132 -> `[MonacoEditor] 无法加载语言支持: ${language}`
- [hardcoded_chinese] src/components/CodeViewer/MonacoEditor/index.tsx:139 -> `❌ [MonacoEditor] 加载语言支持失败 (${language}):`
- [hardcoded_chinese] src/components/CodeViewer/MonacoEditor/index.tsx:175 -> `⚠️ [MonacoEditor] HTML语言支持加载失败，使用默认配置:`
- [hardcoded_chinese] src/components/CodeViewer/MonacoEditor/index.tsx:211 -> `❌ [MonacoEditor] Monaco Editor初始化失败:`
- [hardcoded_chinese] src/components/CodeViewer/MonacoEditor/index.tsx:735 -> `❌ [MonacoEditor] 更新编辑器内容失败:`

## src/components/SelectComponent

- [hardcoded_chinese] src/components/SelectComponent/index.tsx:82 -> `全部`
- [hardcoded_chinese] src/components/SelectComponent/index.tsx:89 -> `全部`
- [hardcoded_chinese] src/components/SelectComponent/index.tsx:93 -> `文档`
- [hardcoded_chinese] src/components/SelectComponent/index.tsx:97 -> `表格`
- [hardcoded_chinese] src/components/SelectComponent/index.tsx:104 -> `组件库数据表`

## src/pages/IMChannel

- [hardcoded_chinese] src/pages/IMChannel/components/IMChannelCardList/index.tsx:159 -> `启用`
- [hardcoded_chinese] src/pages/IMChannel/components/IMChannelCardList/index.tsx:159 -> `停用`
- [hardcoded_chinese] src/pages/IMChannel/components/IMChannelCardList/index.tsx:251 -> `禁用`
- [hardcoded_chinese] src/pages/IMChannel/components/IMChannelCardList/index.tsx:251 -> `启用`

## src/pages/MorePage

- [hardcoded_chinese] src/pages/MorePage/ApiKey/ApiKeyPermissionModal/index.tsx:207 -> `或 ISO 字符串且非`
- [invalid_dict_key] src/pages/MorePage/ModelPermissions/index.tsx:340 -> `PC.Routes.modelPermissions`
- [hardcoded_chinese] src/pages/MorePage/MyEarnings/components/DailyEarningsList/index.tsx:49 -> `4月`
- [invalid_dict_key] src/pages/MorePage/MyEarnings/components/EarningsSummary/index.tsx:49 -> `PC.Utils.AntCustom.okText`

## src/pages/AppDev

- [hardcoded_chinese] src/pages/AppDev/components/ChatArea/components/ChatAreaTabs.tsx:51 -> ` → 平时；`
- [hardcoded_chinese] src/pages/AppDev/components/DesignViewer/messages.ts:8 -> `前缀，以及是否带前导`
- [hardcoded_chinese] src/pages/AppDev/components/Preview/index.tsx:1076 -> `与前导`

## src/pages/Login

- [hardcoded_chinese] src/pages/Login/ModalSliderCaptcha/index.tsx:50 -> `临时签名`
- [hardcoded_chinese] src/pages/Login/ModalSliderCaptcha/index.tsx:51 -> `临时token`
- [hardcoded_chinese] src/pages/Login/ModalSliderCaptcha/index.tsx:54 -> `验证码验证参数:`

## src/pages/SpaceDevelop

- [hardcoded_chinese] src/pages/SpaceDevelop/CreateTempChatModal/CopyChatWidgetCode/index.tsx:44 -> `复制代码`
- [hardcoded_chinese] src/pages/SpaceDevelop/CreateTempChatModal/CopyChatWidgetCode/index.tsx:46 -> `复制代码`
- [hardcoded_chinese] src/pages/SpaceDevelop/CreateTempChatModal/CopyChatWidgetCode/index.tsx:47 -> `，默认`

## src/pages/ConversationAgent

- [hardcoded_chinese] src/pages/ConversationAgent/hooks/useConversationAgentChatSession.ts:175 -> `重置`
- [hardcoded_chinese] src/pages/ConversationAgent/index.tsx:648 -> `已发布`

## src/pages/GlobalModelManage

- [hardcoded_chinese] src/pages/GlobalModelManage/Pricing/ModelPricingModal/index.tsx:62 -> `可为`
- [hardcoded_chinese] src/pages/GlobalModelManage/Pricing/ModelPricingTab/index.tsx:64 -> `走`

## src/pages/SpaceLibrary

- [hardcoded_chinese] src/pages/SpaceLibrary/CreateModel/index.tsx:403 -> `（无可识别项时置 `
- [hardcoded_chinese] src/pages/SpaceLibrary/CreateModel/index.tsx:406 -> `与表单`

## src/pages/SpaceTable

- [hardcoded_chinese] src/pages/SpaceTable/StructureTable/index.tsx:281 -> `是否必须`
- [hardcoded_chinese] src/pages/SpaceTable/index.tsx:435 -> `文件上传中，进度:`

## src/components/AgentSidebar

- [hardcoded_chinese] src/components/AgentSidebar/TimedTask/index.tsx:88 -> `进行中`
- [hardcoded_chinese] src/components/AgentSidebar/TimedTask/index.tsx:153 -> `进行中`

## src/components/ChatInputHome

- [hardcoded_chinese] src/components/ChatInputHome/AtMentionIcon/index.tsx:39 -> `；向上使用 `
- [hardcoded_chinese] src/components/ChatInputHome/index.tsx:1092 -> `加入发送队列`

## src/components/PublishComponentModal

- [hardcoded_chinese] src/components/PublishComponentModal/index.tsx:318 -> `允许复制（模板）`
- [hardcoded_chinese] src/components/PublishComponentModal/index.tsx:369 -> `允许复制模板`

## src/components/TestRun

- [hardcoded_chinese] src/components/TestRun/index.tsx:63 -> `角色陪伴-苏瑶`
- [hardcoded_chinese] src/components/TestRun/index.tsx:64 -> `智慧家具管家`

## src/pages/ChatTemp

- [hardcoded_chinese] src/pages/ChatTemp/index.tsx:284 -> `问答`

## src/pages/EditAgent

- [hardcoded_chinese] src/pages/EditAgent/PreviewAndDebug/index.tsx:281 -> `重置`

## src/pages/PublishAudit

- [hardcoded_chinese] src/pages/PublishAudit/index.tsx:154 -> `网页应用`

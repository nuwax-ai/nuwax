# 实施计划:统一聊天输入框(unified-chat-input)

- 对应 spec:无独立 spec(需求经 codex 会话评估 + 本会话计划模式对齐;用户方向:复用会话页聊天框组件,兼容首页功能场景)
- 状态:已完成(含偏离记录)

## 决策记录

1. **插件入口**:首页统一为 CapabilityModal 四能力(技能/连接器/专家/资料库),旧 SlashPopup 的「插件」Tab 在首页消失(连接器 ≠ 插件,后续产品另立需求;问询未获答复,采用推荐项)
2. **迁移范围**:本次只切 Home 页;ConversationDetails / SpaceCreateProject-PromptBox / ChatTemp 保留旧 ChatInputHome 分批迁移
3. **首页草稿**:支持(draftKey 参数化,Home 传固定 key)
4. 专家召唤 Home 侧接入纳入本次(按 plans/20260910-expert-summon-home-plan.md 接入指引)

## 架构

`UnifiedChatSession/components/ChatInputHomeIndependent/**` 升迁为 `src/components/business-component/ChatInputUnified/**`(组件改名 ChatInputUnified,draftStorage / ConversationDebugFab / ConversationDisplaySettings 同迁)。理由:business-component 定位跨页面复用;避免页面深引 UnifiedChatSession 私有子组件(零先例)。组件已是纯 props 设计,升迁零行为变化。

## 改动文件清单

| # | 文件 | 动作(增/改/删) | 说明 |
| --- | --- | --- | --- |
| 1 | src/components/business-component/ChatInputUnified/\*\*(新位置) | 增 | 自 UnifiedChatSession/components/ChatInputHomeIndependent 整目录迁移,组件改名;补首页能力:forwardRef、工作目录全链路(workspaceDir/onWorkspaceDirChange/disablePersonalComputer/cloudOnly/切云清目录/目录栏/WorkspaceDirPickerModal)、SpaceSelector 组、selectedTag pill、showDebugFab/showVoiceInput 开关(默认 true)、draftKey、buttonSlotActive 800ms 回落、summonedExpert chip |
| 2 | src/components/business-component/UnifiedChatSession/index.tsx | 改 | 引用路径更新为新位置 |
| 3 | src/pages/Home/index.tsx | 改 | 切换到 ChatInputUnified;handleEnter 扩参 selectedDocs/expertComponents 入 attach;专家召唤接入(consume/chip/agentId 优先级/清理时机) |
| 4 | src/pages/Chat/index.tsx | 改 | 首条消息 sendParams 补 selectedDocs/expertComponents(expert 按 id+type 去重并入 infos) |
| 5 | tests/(引用旧路径的测试) | 改 | draftStorage/ConversationDebugFab/ConversationDisplaySettings 路径更新 |
| 6 | tests/chatConversation/chatInputUnified.home.test.tsx | 增 | 首页场景组件测试(mock services,参照 mentionCommands.test.tsx 桩法) |

注:hooks/useConversation.ts 的 attach 透传、projectCreateStrategy 项目分支 payload 视检查结果增改;旧 ChatInputHome 及其余 3 个消费方本次不动。

## 实施顺序

1. 升迁移动(纯移动+改名,行为零变化)→ 跑 `npm run test:conversation` 验证
2. ChatInputUnified 补首页能力(全部可选 props,不传=会话页现状)
3. Home 页切换 + 专家召唤接入
4. Chat 页首条消息补参
5. 新增测试 + 质量门(test:conversation 全绿;tsc 改动文件零新增;E2E 需 ego-browser,本机缺则标注)

## 证明成立的测试

- 新增:tests/chatConversation/chatInputUnified.home.test.tsx(工作目录栏渲染条件、cloudOnly 透传、切云清目录、SpaceSelector/标签 pill、ref clear/focus、'home' 草稿 key、召唤 chip 展示/取消)
- 回归范围:npm run test:conversation(改动路径含 UnifiedChatSession/pages/Chat,必跑全绿)

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 升迁移动造成引用断裂 | 步骤 1 单独验证 test:conversation | revert 移动 commit |
| 首条消息协议扩展跨 3 文件(Home attach → location.state → sendParams) | 类型层同步改 + 组件测试 | 各文件独立可回退 |
| 首页能力变化(失插件 Tab/得四能力) | 决策 1 已接受,迭代说明明示 | — |
| 会话页回归 | 新增 props 全可选,UnifiedChatSession 不传 → 行为零变化 | revert ChatInputUnified 内新增 props |

## 偏离记录

(实现中偏离原计划的逐条补记)

- 2026-09-10:**不移植 buttonSlotActive 800ms 按钮回落**。分析结论:该逻辑依赖会话活跃态(isActiveConversation),首页无活跃会话,当前即为恒 false 的无效路径;而移植进共享组件反而会改变会话页现有按钮行为(活跃+有输入时由「停止」变「入队发送」),违背「会话页零变化」约束。首页点击反馈由 wholeDisabled=submitting 覆盖。
- 2026-09-10:**不新增 showVoiceInput 开关**。核实旧 ChatInputHome 本就渲染同一 VoiceFooter.Provider(语音输入),首页切换后行为自动对等,无需开关。showDebugFab 保留(旧首页无调试 FAB,统一后会多出,Home 传 false 关闭)。
- 2026-09-10:**专家组件合并在 Home 侧完成(不透传 expertComponents 给 Chat 页)**。Home handleEnter 按会话页同款规则(id+type 去重)把专家合并进 attach.infos;Chat 页首条消息只需补 selectedDocs 一参,useConversation attach 不设 expertComponents 字段。
- 2026-09-10:**草稿清除改为「发送即消费」**。confirmSendMessage 无论 isClearInput 均清草稿并置 draftConsumedRef,卸载兜底跳过回写——否则首页 isClearInput=false 时,发送成功后卸载会把已发送内容重新落成草稿,回首页时错误恢复。后续再次编辑自动复位标记。
- 2026-09-10(二轮,用户指示「SlashPopup 可以不要了」):**删除 SlashPopup 与 AtMentionIcon 组件**,MentionEditor 移除 slashMode prop('/' 恒为 capability 模式,全部消费方统一走 CapabilityModal);连带清理:SlashItem 类型、PopupList Item 联合收敛、handleMentionSelect plugin 分支、ChatInputHome 底部平铺 @ 入口与 handleInsertAtMention、测试 4 项 SlashPopup 用例(23→19)、locales 死键 ChatInputCommands.{skill,plugin,choose} ×5。handleAtIconMentionSelect 保留为编辑器编程式插入 API(测试在用)。顺手修复存量类型错误:ChatInputHome.handleUnsubscribedSkillSelect 补 doc 过滤(对齐会话版)。
- 2026-09-10(三轮):**@ 文件提及接入智能体开发/全栈应用开发**。新增共用 hook useConversationMentionFiles(会话沙箱文件递归拉取),两个 AgentConversationChatPanel 以「会话 id && agent.type===TaskAgent」门槛接线 onFetchMentionFiles;已核实 runtime 线 conversationProps 不含该键,末尾展开不会覆盖。应用开发(AppDev)为独立旧输入框,不在范围。
- 2026-09-10(四轮):**选择专家仅首页开放,其余入口仅隐藏**。CapabilityModal 新增 resourceTypes 过滤(导航按开放范围收敛,defaultResourceType 被过滤时回落首个可用);MentionEditor 透传 capabilityResourceTypes,缺省 DEFAULT_CAPABILITY_RESOURCE_TYPES=['skill','connector','knowledge'](不含 expert)——所有非首页入口(含旧 ChatInputHome)零改动自动隐藏;ChatInputUnified 暴露 showExpertCapability(默认 false)拼入 expert,首页开启。专家功能链路(onExpertSelect/expertComponents pill/随消息发送)全保留。
- 2026-09-10(五轮):**首页专家选中 = 切换会话智能体**(与召唤同语义)。ChatInputUnified 新增 onExpertAgentSelect,提供时 MentionEditor 的 onExpertSelect 路由到外部而非内部 expertComponents;Home 实现为清 selectedRecommend + 写入 summonedExpert 召唤态(chip/清理时机/提交优先级全复用),发送走 handleCreateConversation(专家 agentId = targetId ?? rawId,与召唤协议同源),不走项目分支(selectedRecommend 清空后 selectedProjectType 为 undefined)。
- 2026-09-10(六轮):**选专家仅替换上方智能体,其余保持 + chip 位置修正**。Home 删除 currentAgentId effect 里的 chatInputRef.clear() 与 [selectedRecommend] 统一 reset effect——清输入/复位电脑('')/模型/空间只发生在用户显式切推荐 pill 或切分类时(移入对应 handler,分类复位电脑为 '-1');选专家/取消 chip/切任务模式不再清输入与已选项(顺带修复 tenant 配置异步到达时误清输入的存量问题)。召唤专家 chip 从 VoiceFooter.Right(电脑旁)移至工具栏左区最右侧(ManualComponentItem 之后、Expand 之前)。另修复:首页 enableMention 不再随 agentDetail 派生(选专家后 '/' 唤不起的根因),恒用组件默认 true。
- 2026-09-10(七轮):**/ 能力弹窗全局随时可唤起**。拆除 MentionEditor 中 '/' 触发的 enableMention 双重门控(runMentionDetection 早退 + 分支判断)——此前会话页(ChatCore 派生 type===TaskAgent && allowAtSkill===Yes)等入口的非任务型智能体(如大赛咨询)无法唤起;占位文案统一为含 / 引导(外部 defaultPlaceholder 覆盖不受影响)。enableMention 语义收敛为技能 chip 守卫(编程化插入/defaultMentions 回显)。@ 文件仍以 onFetchMentionFiles 为自然门槛。唯一入口差异 = capabilityResourceTypes(专家仅首页)。
- 2026-09-10(八轮):**@ 弹层加载态修正 + 菜单可点性 + 文案**。MentionPopup 的 loading 初始值改为 true——此前首次打开的渲染周期里自动收起 effect 读到旧值 loading=false+空列表,弹窗刚开即被 onClose 收起(取数完成前看不到弹层);现在打开即显示「加载中...」(PopupList 既有 loading UI),取数完成才回落。+ 菜单 @ 行去掉无数据源禁用(插入 @ 纯文本,不弹框)。占位文案 5 locale 更新:补 @ 引用文件、/ 改「添加能力」。
- 2026-09-10(九轮,**真机调试定案**):八轮的 loading 初始值修复不彻底——无数据源防御分支在挂载时(visible=false)把 loading 置回 false,弹层首次翻开(visible=true)的渲染周期内,取数 effect 与自动收起 effect 同 commit 执行,后者读到 stale 的 loading=false+空列表 → 立即 onClose。表现为:**首次 @ 弹层闪关、第二次起正常**(首次打开触发的取数已在后台完成);用户观察到的「必须先输过 /」为巧合(/ 与 @ 无任何耦合,已用真机日志证实:检测层 trigger='@' 正确、position 正确,close 来自 MentionPopup 自动收起 effect)。修复:新增 loadingRef(取数 effect 同步置位),自动收起判定读 ref 而非 state,彻底消除跨 effect 状态时序依赖;新增「先不可见挂载再翻开」真实序列回归测试。真机验证:全新加载页面首次输 @ 立即弹出文件列表。另发现:智能体开发页同时挂两个输入框(AgentConversationChatPanel 左栏=已接数据源;ConversationAgentChatSession 中央=未接,该处 @ 恒为纯文本,属另一项待接线工作)。
- 2026-09-10(十轮,**selectedDocs 契约对齐**):后端 chat 接口契约为 SelectedDocDto{slugId,title,pageType},而前端发的是 {slugId,name}——字段名错配后端收不到(真机抓包证实)。对齐:SelectedDocInfo 改 {slugId,title,pageType?};pageType 自资料库树接口(RepoPageInfo.pageType)经 CapabilityItem→doc chip(dataset.mentionPageType,撤销/重做重建不丢)→onDocsChange 派生全链路透传。同时补齐 runtime 轨三层缺口(RuntimeSessionSendInput 字段/params 映射/绑定层 onSendMessage 第 6 参——skillIds 在 runtime 三层都有而 selectedDocs 全缺)。真机复验:请求体 selectedDocs=[{slugId,title,pageType}] ✓。

## 执行与验证记录

- 2026-09-10 实施完成。改动:ChatInputUnified 升迁+补首页能力(工作目录全链路/SpaceSelector/标签 pill/forwardRef/showDebugFab/draftKey/召唤 chip)、Home 页切换+专家召唤接入、useConversation 与 projectCreateStrategy 透传 selectedDocs、Chat 页首条消息补 selectedDocs。
- `npm run test:conversation`:**54 文件 514 项全部通过**(502 存量 + 12 新增 chatInputUnified.home.test.tsx)。
- tsc:改动文件零新增错误(报错均为存量测试文件预存问题,未触碰)。
- 手动 E2E 未执行:本机缺 ego-browser 登录态,合入前需补(首页云/个人电脑+目录创建会话、/ 四能力随首条消息、召唤 chip 全流程、双轨会话页回归)。

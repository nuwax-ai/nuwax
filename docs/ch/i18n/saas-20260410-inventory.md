# 多语言治理全量扫描报告（SAAS 2026-04-10）

- 生成时间：2026-05-19T16:23:09.503Z
- 扫描范围：src/pages, src/components, src/layouts, src/hooks, src/models, src/services
- 规则：hardcoded 中文字符串 / legacy `System.*` key / invalid `dict()` key 格式

## 汇总

- 总问题数：417
- hardcoded 中文：399
- legacy System key：0
- invalid dict key：18

## 按模块统计

| 模块 | hardcoded 中文 | legacyKey | invalidKey | 总计 |
| --- | --: | --: | --: | --: |
| src/components/KnowledgeGraph | 153 | 0 | 0 | 153 |
| src/pages/SpaceResource | 59 | 0 | 0 | 59 |
| src/pages/SystemManagement | 33 | 0 | 12 | 45 |
| src/pages/SpaceKnowledge | 33 | 0 | 0 | 33 |
| src/components/business-component | 25 | 0 | 0 | 25 |
| src/models | 12 | 0 | 0 | 12 |
| src/layouts/DynamicMenusLayout | 7 | 0 | 0 | 7 |
| src/pages/GlobalModelManage | 6 | 0 | 0 | 6 |
| src/components/MarkdownCustomProcess | 6 | 0 | 0 | 6 |
| src/components/ProComponents | 2 | 0 | 4 | 6 |
| src/components/TiptapVariableInput | 6 | 0 | 0 | 6 |
| src/components/CodeViewer | 5 | 0 | 0 | 5 |
| src/components/SelectComponent | 5 | 0 | 0 | 5 |
| src/pages/AppDev | 4 | 0 | 0 | 4 |
| src/pages/IMChannel | 4 | 0 | 0 | 4 |
| src/hooks | 4 | 0 | 0 | 4 |
| src/pages/Login | 3 | 0 | 0 | 3 |
| src/pages/MorePage | 2 | 0 | 1 | 3 |
| src/pages/SpaceDevelop | 3 | 0 | 0 | 3 |
| src/pages/SpaceLibrary | 3 | 0 | 0 | 3 |
| src/components/CreateAgent | 3 | 0 | 0 | 3 |
| src/components/FileTreeView | 3 | 0 | 0 | 3 |
| src/pages/SpaceTable | 2 | 0 | 0 | 2 |
| src/components/AgentSidebar | 2 | 0 | 0 | 2 |
| src/components/PublishComponentModal | 2 | 0 | 0 | 2 |
| src/components/TestRun | 2 | 0 | 0 | 2 |
| src/pages/ChatTemp | 1 | 0 | 0 | 1 |
| src/pages/EditAgent | 1 | 0 | 0 | 1 |
| src/pages/PublishAudit | 1 | 0 | 0 | 1 |
| src/pages/PublishedManage | 1 | 0 | 0 | 1 |
| src/pages/SpacePageDevelop | 1 | 0 | 0 | 1 |
| src/components/ChatInputHome | 1 | 0 | 0 | 1 |
| src/components/ChatView | 1 | 0 | 0 | 1 |
| src/components/NoMoreDivider | 1 | 0 | 0 | 1 |
| src/components/Skill | 1 | 0 | 0 | 1 |
| src/layouts/HoverMenu | 1 | 0 | 0 | 1 |
| src/layouts/Setting | 0 | 0 | 1 | 1 |

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
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ModelPricingTab/ModelPricingModal/index.tsx:61 -> `可为`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ModelPricingTab/index.tsx:25 -> `单次`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ModelPricingTab/index.tsx:26 -> `买断`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ModelPricingTab/index.tsx:27 -> `包月`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ModelPricingTab/index.tsx:28 -> `阶梯计费`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ModelPricingTab/index.tsx:105 -> `走`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/SkillPricingTab/SkillPricingFormModal/index.tsx:103 -> `请选择技能`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/SkillPricingTab/SkillPricingFormModal/index.tsx:255 -> `技能`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ToolPricingTab/index.tsx:88 -> `；删除：`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ToolPricingTab/index.tsx:88 -> `；表单：`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ToolPricingTab/index.tsx:351 -> `由接口`
- [hardcoded_chinese] src/pages/SpaceResource/Pricing/ToolPricingTab/index.tsx:351 -> ` 过滤；`
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
- [invalid_dict_key] src/pages/SystemManagement/SubscriptionCredits/BasicConfig/index.tsx:75 -> `PC.Routes.subsBasicConfig`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/CreditPackages/index.tsx:194 -> `启用`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/CreditPackages/index.tsx:195 -> `禁用`
- [invalid_dict_key] src/pages/SystemManagement/SubscriptionCredits/CreditPackages/index.tsx:257 -> `PC.Routes.creditsPackages`
- [invalid_dict_key] src/pages/SystemManagement/SubscriptionCredits/CreditRecords/index.tsx:355 -> `PC.Routes.creditsRecordsQuery`
- [invalid_dict_key] src/pages/SystemManagement/SubscriptionCredits/Orders/index.tsx:255 -> `PC.Routes.subsOrders`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:166 -> `创建成功`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:184 -> `更新成功`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:285 -> `编辑套餐`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:314 -> `例如：基础版`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:318 -> `套餐包含积分（每月）`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:330 -> `套餐价格 (¥)`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:340 -> `例如：99`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:346 -> `套餐有效期`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:352 -> `1个月`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:353 -> `3个月`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:354 -> `12个月`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:355 -> `永久`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:362 -> `热门标签`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:363 -> `是`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:363 -> `否`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:369 -> `上架状态`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:370 -> `是`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:370 -> `否`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:376 -> `套餐描述`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/CreatePlanModal/index.tsx:382 -> `描述套餐的定位和适用场景`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/PlanItemCard/index.tsx:20 -> `月`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/PlanItemCard/index.tsx:21 -> `季度`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/PlanItemCard/index.tsx:22 -> `年`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/PlanItemCard/index.tsx:23 -> `永久`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/PlanItemCard/index.tsx:35 -> `月`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/PlanItemCard/index.tsx:80 -> `每月 ${creditAmount.toLocaleString()} 积分`
- [hardcoded_chinese] src/pages/SystemManagement/SubscriptionCredits/Plans/index.tsx:243 -> `排序已更新`
- [invalid_dict_key] src/pages/SystemManagement/SubscriptionCredits/Plans/index.tsx:400 -> `PC.Routes.subsPlans`
- [invalid_dict_key] src/pages/SystemManagement/SubscriptionCredits/UserCredits/index.tsx:165 -> `PC.Routes.userCreditsQuery`

## src/pages/SpaceKnowledge

- [hardcoded_chinese] src/pages/SpaceKnowledge/DocWrap/DocItem/index.tsx:36 -> `分析中`
- [hardcoded_chinese] src/pages/SpaceKnowledge/DocWrap/DocItem/index.tsx:37 -> `分段生成中`
- [hardcoded_chinese] src/pages/SpaceKnowledge/DocWrap/DocItem/index.tsx:61 -> `构建中`
- [hardcoded_chinese] src/pages/SpaceKnowledge/GraphDocTable/index.tsx:222 -> `确定要关闭图谱吗？`
- [hardcoded_chinese] src/pages/SpaceKnowledge/GraphDocTable/index.tsx:226 -> `确定`
- [hardcoded_chinese] src/pages/SpaceKnowledge/GraphDocTable/index.tsx:227 -> `取消`
- [hardcoded_chinese] src/pages/SpaceKnowledge/GraphDocTable/index.tsx:229 -> `关闭图谱`
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
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:187 -> `加载知识图谱列表失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:373 -> `检查知识图谱生成状态失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:382 -> `生成知识图谱失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:486 -> `删除文档 ${id} 失败`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:503 -> `批量删除知识图谱失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:556 -> `删除知识图谱失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:574 -> `查看全部知识图谱失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:691 -> `QA问答更新失败`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:691 -> `添加QA问答失败`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:765 -> `添加节点数据:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:775 -> `导入文件列表:`

## src/components/business-component

- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:7 -> ` 横向 padding、`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:49 -> `月`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:50 -> `季度`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:51 -> `年`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:52 -> `永久`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:61 -> `订阅套餐`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:64 -> `订阅套餐`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:65 -> `订阅买断套餐`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:99 -> `已买断套餐`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:102 -> `套餐已过期(续订)`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:104 -> `当前套餐(续订)`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:116 -> `升级`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:237 -> `选择订阅套餐`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:237 -> `选择订阅套餐（可试用）`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:271 -> `暂无可用套餐`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:280 -> `月`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:287 -> `每月 ${plan.creditAmount} 积分`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:291 -> `不限制`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:291 -> `${callLimit ?? 0} 次/月`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:353 -> `原价¥${firstPrice}/${period}`
- [hardcoded_chinese] src/components/business-component/PaymentSubscriptionModal/index.tsx:405 -> `可调用次数：${callLimitText}`
- [hardcoded_chinese] src/components/business-component/SubscriptionPlanCards/index.tsx:43 -> `月`
- [hardcoded_chinese] src/components/business-component/SubscriptionPlanCards/index.tsx:44 -> `季`
- [hardcoded_chinese] src/components/business-component/SubscriptionPlanCards/index.tsx:45 -> `年`
- [hardcoded_chinese] src/components/business-component/SubscriptionPlanCards/index.tsx:184 -> `月`

## src/models

- [hardcoded_chinese] src/models/autoErrorHandling.ts:170 -> `[AutoErrorHandling] 📊 自动重试次数: ${newCount}`
- [hardcoded_chinese] src/models/conversationInfo.ts:692 -> `问答`
- [hardcoded_chinese] src/models/conversationInfo.ts:1013 -> `Agent正在执行任务，请等待当前任务完成后再发送新请求`
- [hardcoded_chinese] src/models/conversationInfo.ts:1016 -> `正在执行任务`
- [hardcoded_chinese] src/models/conversationInfo.ts:1017 -> `正在执行任务`
- [hardcoded_chinese] src/models/conversationInfo.ts:1049 -> `用户主动取消任务`
- [hardcoded_chinese] src/models/spaceAgent.ts:29 -> `保存成功`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:25 -> `租户配置为空`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:54 -> `租户配置保存完成，重新初始化统一主题服务`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:77 -> `已同步租户主题配置（本地无配置）:`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:92 -> `租户信息接口失败`
- [hardcoded_chinese] src/models/workflowV3.ts:4 -> `) 代替 useModel(`

## src/layouts/DynamicMenusLayout

- [hardcoded_chinese] src/layouts/DynamicMenusLayout/DynamicSecondMenu/index.tsx:641 -> `成员与设置`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/DynamicSecondMenu/index.tsx:641 -> `成员与设置`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/SpaceSection/SpaceTitle/PersonalSpaceContent/index.tsx:92 -> `智能体开发`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/SpaceSection/SpaceTitle/PersonalSpaceContent/index.tsx:97 -> `成员与设置`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/SpaceSection/SpaceTitle/PersonalSpaceContent/index.tsx:97 -> `成员与设置`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/SpaceSection/index.tsx:105 -> `工作空间智能体`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/index.tsx:590 -> `和 动态菜单的`

## src/pages/GlobalModelManage

- [hardcoded_chinese] src/pages/GlobalModelManage/Pricing/ModelPricingModal/index.tsx:58 -> `可为`
- [hardcoded_chinese] src/pages/GlobalModelManage/Pricing/ModelPricingTab/index.tsx:22 -> `单次`
- [hardcoded_chinese] src/pages/GlobalModelManage/Pricing/ModelPricingTab/index.tsx:23 -> `买断`
- [hardcoded_chinese] src/pages/GlobalModelManage/Pricing/ModelPricingTab/index.tsx:24 -> `包月`
- [hardcoded_chinese] src/pages/GlobalModelManage/Pricing/ModelPricingTab/index.tsx:25 -> `阶梯计费`
- [hardcoded_chinese] src/pages/GlobalModelManage/Pricing/ModelPricingTab/index.tsx:74 -> `走`

## src/components/MarkdownCustomProcess

- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:115 -> `暂无数据`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:168 -> `页面预览`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:285 -> `暂无数据`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:291 -> `数据格式错误`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:299 -> `页面路径不存在`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:428 -> `复制`

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

## src/pages/AppDev

- [hardcoded_chinese] src/pages/AppDev/components/ChatArea/components/ChatAreaTabs.tsx:48 -> ` → 平时；`
- [hardcoded_chinese] src/pages/AppDev/components/ChatArea/index.tsx:488 -> `传统附件（图片、文件等）allAttachments：`
- [hardcoded_chinese] src/pages/AppDev/components/DesignViewer/messages.ts:8 -> `前缀，以及是否带前导`
- [hardcoded_chinese] src/pages/AppDev/components/Preview/index.tsx:1076 -> `与前导`

## src/pages/IMChannel

- [hardcoded_chinese] src/pages/IMChannel/components/IMChannelCardList/index.tsx:159 -> `启用`
- [hardcoded_chinese] src/pages/IMChannel/components/IMChannelCardList/index.tsx:159 -> `停用`
- [hardcoded_chinese] src/pages/IMChannel/components/IMChannelCardList/index.tsx:251 -> `禁用`
- [hardcoded_chinese] src/pages/IMChannel/components/IMChannelCardList/index.tsx:251 -> `启用`

## src/hooks

- [hardcoded_chinese] src/hooks/useAgentSubscription.ts:59 -> `创建订阅订单失败`
- [hardcoded_chinese] src/hooks/useAgentSubscription.ts:68 -> `获取收银台地址失败`
- [hardcoded_chinese] src/hooks/useAgentSubscription.ts:82 -> `点击套餐卡片失败:`
- [hardcoded_chinese] src/hooks/useRequestPromiseBridge.ts:60 -> `错误已通过 message.warning 展示`

## src/pages/Login

- [hardcoded_chinese] src/pages/Login/ModalSliderCaptcha/index.tsx:50 -> `临时签名`
- [hardcoded_chinese] src/pages/Login/ModalSliderCaptcha/index.tsx:51 -> `临时token`
- [hardcoded_chinese] src/pages/Login/ModalSliderCaptcha/index.tsx:54 -> `验证码验证参数:`

## src/pages/MorePage

- [hardcoded_chinese] src/pages/MorePage/ApiKey/ApiKeyPermissionModal/index.tsx:212 -> `或 ISO 字符串且非`
- [hardcoded_chinese] src/pages/MorePage/MyEarnings/components/DailyEarningsList/index.tsx:49 -> `4月`
- [invalid_dict_key] src/pages/MorePage/MyEarnings/components/EarningsSummary/index.tsx:59 -> `PC.Utils.AntCustom.okText`

## src/pages/SpaceDevelop

- [hardcoded_chinese] src/pages/SpaceDevelop/CreateTempChatModal/CopyChatWidgetCode/index.tsx:44 -> `复制代码`
- [hardcoded_chinese] src/pages/SpaceDevelop/CreateTempChatModal/CopyChatWidgetCode/index.tsx:46 -> `复制代码`
- [hardcoded_chinese] src/pages/SpaceDevelop/CreateTempChatModal/CopyChatWidgetCode/index.tsx:47 -> `，默认`

## src/pages/SpaceLibrary

- [hardcoded_chinese] src/pages/SpaceLibrary/ComponentItem/index.tsx:70 -> `无此资源权限`
- [hardcoded_chinese] src/pages/SpaceLibrary/CreateModel/index.tsx:398 -> `（无可识别项时置 `
- [hardcoded_chinese] src/pages/SpaceLibrary/CreateModel/index.tsx:401 -> `与表单`

## src/components/CreateAgent

- [hardcoded_chinese] src/components/CreateAgent/index.tsx:149 -> `生成`
- [hardcoded_chinese] src/components/CreateAgent/index.tsx:234 -> `请描述你希望创建一个什么样的智能体`
- [hardcoded_chinese] src/components/CreateAgent/index.tsx:238 -> `请描述你希望创建一个什么样的智能体`

## src/components/FileTreeView

- [hardcoded_chinese] src/components/FileTreeView/FilePathHeader/ShareDesktopModal/index.tsx:113 -> `永久`
- [hardcoded_chinese] src/components/FileTreeView/FilePathHeader/ShareDesktopModal/index.tsx:117 -> `永久`
- [hardcoded_chinese] src/components/FileTreeView/index.tsx:437 -> `/api/computer/static/1464425/国际财经分析报告_20241222.md`

## src/pages/SpaceTable

- [hardcoded_chinese] src/pages/SpaceTable/StructureTable/index.tsx:281 -> `是否必须`
- [hardcoded_chinese] src/pages/SpaceTable/index.tsx:435 -> `文件上传中，进度:`

## src/components/AgentSidebar

- [hardcoded_chinese] src/components/AgentSidebar/TimedTask/index.tsx:88 -> `进行中`
- [hardcoded_chinese] src/components/AgentSidebar/TimedTask/index.tsx:153 -> `进行中`

## src/components/PublishComponentModal

- [hardcoded_chinese] src/components/PublishComponentModal/index.tsx:318 -> `允许复制（模板）`
- [hardcoded_chinese] src/components/PublishComponentModal/index.tsx:369 -> `允许复制模板`

## src/components/TestRun

- [hardcoded_chinese] src/components/TestRun/index.tsx:63 -> `角色陪伴-苏瑶`
- [hardcoded_chinese] src/components/TestRun/index.tsx:64 -> `智慧家具管家`

## src/pages/ChatTemp

- [hardcoded_chinese] src/pages/ChatTemp/index.tsx:284 -> `问答`

## src/pages/EditAgent

- [hardcoded_chinese] src/pages/EditAgent/PreviewAndDebug/index.tsx:325 -> `重置`

## src/pages/PublishAudit

- [hardcoded_chinese] src/pages/PublishAudit/index.tsx:149 -> `网页应用`

## src/pages/PublishedManage

- [hardcoded_chinese] src/pages/PublishedManage/index.tsx:117 -> `网页应用`

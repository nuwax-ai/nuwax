# 更新日志

本项目的所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

## [1.2.0](https://github.com/nuwax-ai/nuwax/compare/v1.1.13...v1.2.0) (2026-09-08)

### ⚡️ 性能优化

- **components:** 优化多窗口同步会话状态时的重复接口调用 ([60bf6f0](https://github.com/nuwax-ai/nuwax/commit/60bf6f09b408d3de459f896ccb0bcdd7082f7881))
- **layouts:** 调整首页最近列表的默认单页数据量为 30 ([38afc4d](https://github.com/nuwax-ai/nuwax/commit/38afc4d1d98b511b2993c30caeb190312bfb406d))

### 👷 CI/CD

- **conversation:** add contract test workflow ([5f21302](https://github.com/nuwax-ai/nuwax/commit/5f213027a555ede61cbce75978751c42c56c50e5))

### ✅ 测试

- add findCurrentRoundStart + resume handler callback coverage ([265ba49](https://github.com/nuwax-ai/nuwax/commit/265ba493f1dd617381d0a91ad67209e95f96041b))
- add useConversationTerminalFinalizer direct hook tests (16 cases) ([af6fa8e](https://github.com/nuwax-ai/nuwax/commit/af6fa8e5a6383856cc28fa229de41ba0ade5e60b))
- **Chat/Workflow:** 补充核心功能测试用例 ([1884032](https://github.com/nuwax-ai/nuwax/commit/1884032c05b4c18edb1800a6d065888b7e0b8d48))
- **conversation:** add preview tab e2e scenario ([cd36922](https://github.com/nuwax-ai/nuwax/commit/cd36922b202eac85b16b1617c3167cb89bc0909b))
- **conversation:** add real page e2e acceptance suite ([3aad568](https://github.com/nuwax-ai/nuwax/commit/3aad568fa02c2f296455e138d870d1bb5184ef78))
- **conversation:** freeze dual track parity digest ([51d479a](https://github.com/nuwax-ai/nuwax/commit/51d479ab875f59f9409533cb48d62ce66359a2a4))
- **conversation:** freeze key business scenario regression net ([85e6e19](https://github.com/nuwax-ai/nuwax/commit/85e6e190805069ea34a751753796d3c6d836f3bf))
- **conversation:** 修复 ConversationStatus 测试读取非 module less 导出崩溃 ([547b7d6](https://github.com/nuwax-ai/nuwax/commit/547b7d64e73bb5dc140c8c387893aacf84574d07))
- **home:** 最近使用分组展开合同测试 ([2e7288d](https://github.com/nuwax-ai/nuwax/commit/2e7288d680cbaa719944a561ac304edc382494cc))
- **openui:** 补充 renderInputToOpenUiFile 单测 ([42bc27f](https://github.com/nuwax-ai/nuwax/commit/42bc27f9eb4cc184ac80d2ce1c0d00d173b18271))
- 修复 vitest 运行环境与 busy 语义滞后断言 ([db71314](https://github.com/nuwax-ai/nuwax/commit/db71314dfe11cd49f71ed001e0585d46d3172136))
- 补充会话相关页面与 model 单元测试 ([196616d](https://github.com/nuwax-ai/nuwax/commit/196616db5f2c78761be05a04d2011b7ed5ca72f0))

### 📝 文档

- **agent-intervention:** fix broken imports and add integration README ([e1740d3](https://github.com/nuwax-ai/nuwax/commit/e1740d3758a08bf411e275c55d0641614db10250))
- **AgentFlow:** document backend node fields ([4b244d9](https://github.com/nuwax-ai/nuwax/commit/4b244d9ac867c927205cbef0dd84bda81b2a5862))
- **AgentIntervention:** 完善 DockPanel 显隐规则文档 ([74434e6](https://github.com/nuwax-ai/nuwax/commit/74434e6219e0e5b5b0c5f974429af7d3ce87feb1))
- **AgentIntervention:** 按落地代码对齐 README 字段与 API ([cf96467](https://github.com/nuwax-ai/nuwax/commit/cf96467b574180a7944c7963b4d90b4dedfdbc50))
- **chat:** add terminal polling QA report, remove superseded docs ([7aadee0](https://github.com/nuwax-ai/nuwax/commit/7aadee09337ad11d72480ef27e6a7878bd3b8953))
- **chat:** summarize terminal polling fix ([c710ab2](https://github.com/nuwax-ai/nuwax/commit/c710ab29659b655d3d21feee313e24a99872166a))
- **conversation:** §0.3 执行者修正为连接级 onerror 路径（调用栈逐帧定案），同步 §3/§4 ([5956ce6](https://github.com/nuwax-ai/nuwax/commit/5956ce6dd01213d323efb2e204e6ab4553179c87))
- **conversation:** §6.1.1 事件类型白名单修复记录 + §6.4 修复版图更新 ([601ed6d](https://github.com/nuwax-ai/nuwax/commit/601ed6d08c139c8e50f87298b8ce8c3e20555fee))
- **conversation:** §6.1.2 sweep 近 5 条 processing 清理修复记录 + §6.4 版图更新 ([5da3520](https://github.com/nuwax-ai/nuwax/commit/5da3520022cfd0ea2d77b7c90d871dc1843eed37))
- **conversation:** §6.1.2 清除中间演进记录，只保留轮次边界最终方案 ([582f3ba](https://github.com/nuwax-ai/nuwax/commit/582f3ba2231c47d3798ca83bf3aeed64831aab01))
- **conversation:** §6.1.2 补轮次边界升级记录（092c9960a） ([8088370](https://github.com/nuwax-ai/nuwax/commit/80883707a4d78789fd3af4b71372a45ebd94d986))
- **conversation:** §6.1.3 架构解耦决策——工具状态不驱动会话按钮 ([09e7e89](https://github.com/nuwax-ai/nuwax/commit/09e7e895ff65cd5dfc5cf0aae4533dc83d309044))
- **conversation:** §6.3/§7.1 日志前缀同步为最终格式 + 清除已移除的降级日志引用 ([c7101b7](https://github.com/nuwax-ai/nuwax/commit/c7101b71456713c94a8a661e372f15527de7cc20))
- **conversation:** §7.1 验收日志体系更新为统一 Conv: 前缀格式 ([d1764b9](https://github.com/nuwax-ai/nuwax/commit/d1764b9b1ffdb7f003151d1d3f34356d4dd9a056))
- **conversation:** add docs index, business-logic acceptance checklist and QA regression plan ([775f613](https://github.com/nuwax-ai/nuwax/commit/775f613ce7fc661b99f57f018beb6958f0824381))
- **conversation:** add team maintenance guide and dependency rule ([215b826](https://github.com/nuwax-ai/nuwax/commit/215b82601b33524ce85713a2ed394328704425bf))
- **conversation:** consolidate into docs/conversation/, enrich ADR, archive stale doc ([b182d3f](https://github.com/nuwax-ai/nuwax/commit/b182d3f13cd43b4e90e862985623dee4f259b81d))
- **conversation:** mock testing plan - 28 scenarios, data types, implementation approach ([0c7ef43](https://github.com/nuwax-ai/nuwax/commit/0c7ef435c396260ec3902e887284ef3983a0340a))
- **conversation:** organize docs into dual-track/ and fixes/ subdirectories ([c40997c](https://github.com/nuwax-ai/nuwax/commit/c40997cd4d2385442be2ccd1a7a4d9faad29dbce))
- **conversation:** organize docs to conversation/ + fix summary README ([c7b82ba](https://github.com/nuwax-ai/nuwax/commit/c7b82bafcaebaddb7c14f56cd17137c553d4390e))
- **conversation:** re-sync all docs to current state after merge ([cf5ab96](https://github.com/nuwax-ai/nuwax/commit/cf5ab966caaee2b0b8ff8b8c9019fa54ba545a98))
- **conversation:** record browser verification results ([4a19504](https://github.com/nuwax-ai/nuwax/commit/4a19504a26828a8f55bbbfe66bf93c2099ae9018))
- **conversation:** record runtime line retest results ([eac6e8c](https://github.com/nuwax-ai/nuwax/commit/eac6e8cfebd5cc7170c2a1dc1bf2104665e25aa2))
- **conversation:** regression checklist update - terminal convergence fixes C10-C15 D13-D15 C1 architecture decoupling ([eb4c628](https://github.com/nuwax-ai/nuwax/commit/eb4c62876363a193a65843e113dd9dbcd85c88aa))
- **conversation:** sync docs structure to dual-track/fixes subdirectories ([28afe76](https://github.com/nuwax-ai/nuwax/commit/28afe769e58de52ef43c17b666078362e55d218e))
- **conversation:** sync PR 381374062 log enhancement to fix summary and README ([45a5d11](https://github.com/nuwax-ai/nuwax/commit/45a5d1176b242228c3cac15bde17dac88cad9654))
- **conversation:** terminal convergence fix summary - code implementation organized by file ([c247f74](https://github.com/nuwax-ai/nuwax/commit/c247f7460f49d08581fa62c7bb45f03808ee2627))
- **conversation:** 会话中卡死分析定案（HAR-only）与修复方案/验证日志标志 ([ef7cee2](https://github.com/nuwax-ai/nuwax/commit/ef7cee20a3b323fde8b2f3df021042b1454e0e12))
- **conversation:** 会话优化 PC↔Mobile 拉齐清单 ([f9ff608](https://github.com/nuwax-ai/nuwax/commit/f9ff6089ec4a35af203f357aad8aea4fd4330108))
- **conversation:** 会话活跃态状态机参考文档 + 复现 [#3](https://github.com/nuwax-ai/nuwax/issues/3) 分析增补 ([baaa56f](https://github.com/nuwax-ai/nuwax/commit/baaa56fe99a306d660eff33bbe4f4bc078a3fd80))
- **conversation:** 会话渲染调研与升级开发计划 + 已完成功能演示回归补齐 ([9f20428](https://github.com/nuwax-ai/nuwax/commit/9f20428e19536193d05fcfa542b4f877b938634b))
- **conversation:** 手动验收清单 + e2e 文案语言钉死（修复环境性 9 连挂） ([6ee65dc](https://github.com/nuwax-ai/nuwax/commit/6ee65dc7306b9387d264b0d9ce21c43c321aa428))
- **conversation:** 智能体电脑桌面仅云电脑 gate 修复说明落档 ([d87bea8](https://github.com/nuwax-ai/nuwax/commit/d87bea8914bfd6cfcec435cc9711f8aedcbea9f7))
- **conversation:** 清理分析文档的撤回/前版记录，保留最终定案叙述 ([3ce9380](https://github.com/nuwax-ai/nuwax/commit/3ce938028d4f3cac19ecc544f419aff203a74cbd))
- **conversation:** 补修复方案详述（A/B 代码级 before-after、影响面推演、风险与边界） ([1e05e7a](https://github.com/nuwax-ai/nuwax/commit/1e05e7adc5b3e58b1d682fb2302bef3a579f57f3))
- **conversation:** 补充轮询与发消息竞态修复说明 ([019dd8f](https://github.com/nuwax-ai/nuwax/commit/019dd8f1830af32d86c12cb18b6da2f8cbb730bc))
- **conversation:** 补边界场景——终态后迟到详情响应的四层守卫推演（§6.6） ([0b606fd](https://github.com/nuwax-ai/nuwax/commit/0b606fd5bdb8b82383993c889668eb6507a4e046))
- **home:** 需求 11 交付文档——feature 清单与需求对照 ([9fbaf60](https://github.com/nuwax-ai/nuwax/commit/9fbaf6053e1a04f982941dd2e69e7077e25383ba))
- **openui:** 场景 3 要求必须有 nuwax_render_openui 才算通过 ([f551f2b](https://github.com/nuwax-ai/nuwax/commit/f551f2b07defbfd21d56c347c8e1b4706cbcbfbe))
- unify agent instructions into AGENTS.md ([2130e60](https://github.com/nuwax-ai/nuwax/commit/2130e601de95cff70be4cf792b06d67e7a527871))
- 会话流式恢复(sub)与权限审批交互逻辑梳理 ([5b4a6be](https://github.com/nuwax-ai/nuwax/commit/5b4a6be056dab9a1602a5ca2331d77dd9367abbc))
- 审查处置留存——runtime 桥接死循环/终态 text 覆盖修复报告 + 预览缓存版本 bump 记录 ([7505cdd](https://github.com/nuwax-ai/nuwax/commit/7505cdd17e5cefbe0105316c758cf60d349677fb))

### ♻️ 重构

- **acp:** 重构并迁移权限审批卡片至最新数据结构 ([ef777c5](https://github.com/nuwax-ai/nuwax/commit/ef777c528cd92acbfa1fcd4d64f62763c2d1a216))
- **agent-intervention:** compact card styles — tighter padding, smaller radii, refined hover states ([9d4e4f8](https://github.com/nuwax-ai/nuwax/commit/9d4e4f881182fd04822db282b043155163087569))
- **agent-intervention:** consolidate into business-component module ([7015e61](https://github.com/nuwax-ai/nuwax/commit/7015e61eb391e8626828b32cae967794b3d35e71))
- **agent-intervention:** extract integration hook and remove mock code ([c8e639a](https://github.com/nuwax-ai/nuwax/commit/c8e639abf756f86916a9ebe3a316ea422a413719))
- **agentflow:** align implementation with v2 schema and grill-me decisions ([37e382b](https://github.com/nuwax-ai/nuwax/commit/37e382b7b96a5feb2ae0d7de12a93b61b03d00da))
- **agentflow:** align node visual to prototype + port layout cleanup ([d92bdab](https://github.com/nuwax-ai/nuwax/commit/d92bdab0b98b72d06f342e412a5d41e159a10664)), closes [#fa8c16](https://github.com/nuwax-ai/nuwax/issues/fa8c16)
- **AgentFlow:** flowKind 配置中立化 + 询问用户 formArgs/路由单条件重构 ([56365ca](https://github.com/nuwax-ai/nuwax/commit/56365ca1e656bc30123dcab49cc18d4d758fb4d9))
- **AgentFlow:** WorkflowSaveService 接入扩展注册表，优化 ExternalConnector 响应映射 ([7bae2f4](https://github.com/nuwax-ai/nuwax/commit/7bae2f4fad430895696b53b5e164f97a1b6a6ebf))
- **AgentFlow:** 内聚画布全屏到 AgentFlowCanvas，清理 codex 残留 mock/死代码 ([83b5a79](https://github.com/nuwax-ai/nuwax/commit/83b5a79dc70edbdbe7d782f4d6ca0e22bdacc531))
- **AgentIntervention:** 扁平化组件目录并内联 DockPanel ([a762ea4](https://github.com/nuwax-ai/nuwax/commit/a762ea43cba63a9465a5ab52011539530e2464d3))
- **AgentIntervention:** 移除 MCP Ask 响应前的自动停止对话 ([f3d485d](https://github.com/nuwax-ai/nuwax/commit/f3d485d26342449c10c0a1d1fb2e6a66f113f655))
- **AgentIntervention:** 精简工具名称定义并更新相关文档 ([6087c81](https://github.com/nuwax-ai/nuwax/commit/6087c81a2a565d52b72484b34ef53f4018c22781))
- **agent:** 统一会话模型及修复状态回显与截断问题 ([053c746](https://github.com/nuwax-ai/nuwax/commit/053c74609534fca6479498dace44798d3a32c15f))
- **appdev:** 升级新建项目接口补充必填参数 spaceId ([903709c](https://github.com/nuwax-ai/nuwax/commit/903709cf7fd77374992d6998271ec5d0e91e3971))
- **appdev:** 移除冗余的 RecentProjects 组件 ([6ba4f96](https://github.com/nuwax-ai/nuwax/commit/6ba4f960883946ab36c8d34850b2e85619d324d4))
- **AppDev:** 移除刷新 Git 列表失败的错误提示和相关逻辑 ([3c44a5a](https://github.com/nuwax-ai/nuwax/commit/3c44a5a9ff73972e2812b8ac1bf50fc280dbdce9))
- **AppDev:** 移除文件上传功能并清理无用代码 ([2075eb7](https://github.com/nuwax-ai/nuwax/commit/2075eb7098c2a2b72fb7aaa7d616c6dd9b017007))
- **captcha:** 重构验证码 WebView 消息回传逻辑 ([857d013](https://github.com/nuwax-ai/nuwax/commit/857d013eb3068ded45c46e0319042c17b4f2bd40))
- **chat:** 优化技能详情会话页面中的技能详情接口调用次数 ([ea989db](https://github.com/nuwax-ai/nuwax/commit/ea989dbf8aad29b4dccd103c7bda83d03780f194))
- **chat:** 优化智能体文件面板展示条件 ([0e0e5f1](https://github.com/nuwax-ai/nuwax/commit/0e0e5f1be464a29bd3bd0510aac8cc0f28eea903))
- **chat:** 删除死代码 isMcpAskCompletedComponent ([e42ac3f](https://github.com/nuwax-ai/nuwax/commit/e42ac3f30f67a184c2ce6232e929bc9be63fdca8))
- **chat:** 将角色信息默认生成逻辑内聚至 UnifiedChatSession 内部 ([d15c2e9](https://github.com/nuwax-ai/nuwax/commit/d15c2e9c9fa10162379931e8f92cca0b7bd050ea))
- **chat:** 移除 useExecutingTaskStatusPoll，改由流式态判定覆盖执行中状态 ([c465a94](https://github.com/nuwax-ai/nuwax/commit/c465a949c9bb985223dfcd48057711f12a4c8155))
- **chat:** 移除聊天页面及组件中的移动端适配逻辑与样式 ([34defb4](https://github.com/nuwax-ai/nuwax/commit/34defb47911aec86026b711886790e4e79b98752))
- **chat:** 重构主页面视图状态与会话逻辑 ([1096c53](https://github.com/nuwax-ai/nuwax/commit/1096c5380ac76ab1c24755604e9956237b52e51c))
- **chat:** 重构并统一封装 UnifiedChatSession 聊天会话组件 ([887e6df](https://github.com/nuwax-ai/nuwax/commit/887e6dfeb2b24ee919cb0fe9fbadb2eabbff400e))
- **chat:** 重构聊天页面以支持技能详情会话复用 ([dc4f28d](https://github.com/nuwax-ai/nuwax/commit/dc4f28d4fdebb6893516e8c6c4be056d36a2afdc))
- **chat:** 重构聊天页面组件目录结构 ([45b704c](https://github.com/nuwax-ai/nuwax/commit/45b704c5df9156a5063ac5f3fc0ba1a983e2ac5b))
- **components:** 将 UnifiedChatSession 的 mode 属性重构细化为 messageBottomMode ([a65f17b](https://github.com/nuwax-ai/nuwax/commit/a65f17be999cbf2ac694c3d32c08e22f07a8831d))
- **components:** 更新文件树 Git 源面板的类型定义与引用 ([75d8211](https://github.com/nuwax-ai/nuwax/commit/75d8211e80527e2e6c243df69fe24dfd984c2ddc))
- **components:** 移除聊天消息气泡流中的 ACP 权限审批卡片 ([f50d174](https://github.com/nuwax-ai/nuwax/commit/f50d1746920ce6d6e43bc9cdc1263b18653dedd8))
- **components:** 调整会话及对话面板组件属性为可选并增加空值保护 ([0ad9bec](https://github.com/nuwax-ai/nuwax/commit/0ad9bec8edc6f474222faac886c45d34ab3cb74e))
- **components:** 重命名 TaskAgentFileTree 组件为 FileTreePanel ([67c674e](https://github.com/nuwax-ai/nuwax/commit/67c674e18fcfa572e8fd85b369814e3cc3d5ef69))
- **components:** 重构 FileTreeGitSourcePanel 组件的类型引用与工具函数 ([a55ec45](https://github.com/nuwax-ai/nuwax/commit/a55ec45e940761f8af6c1e2debf920ba9e74aab8))
- **components:** 重构并内聚聊天会话的滚动控制与检测逻辑 ([acf9bd7](https://github.com/nuwax-ai/nuwax/commit/acf9bd72af305d97fb46a7bfe1ed99583c0a9dda))
- **components:** 重构并解耦 UnifiedChatSession 会话组件与样式 ([edf9386](https://github.com/nuwax-ai/nuwax/commit/edf93862601f5a762d2603d19983eeb1818f403c))
- **ConversationAgentSourceControl:** 增强代码可读性与注释 ([6755efd](https://github.com/nuwax-ai/nuwax/commit/6755efd8bd5d482f6ee3e318f11d5838b2702223))
- **ConversationAgent:** 优化源代码管理相关类型和状态管理 ([7e97e0f](https://github.com/nuwax-ai/nuwax/commit/7e97e0fab3ad339819a870472d9668f06b86ca30))
- **ConversationAgent:** 使用 TooltipIcon 组件优化图标栏 ([2cc972d](https://github.com/nuwax-ai/nuwax/commit/2cc972d5c1c6b68a699a3a2612387fa08275c5ae))
- **ConversationAgent:** 更新 Git 版本管理服务和相关类型定义 ([11de20a](https://github.com/nuwax-ai/nuwax/commit/11de20a2273b32005e113fe10d2e3ac9e0e404e8))
- **ConversationAgent:** 更新 Git 版本管理相关函数和错误处理逻辑 ([d21f867](https://github.com/nuwax-ai/nuwax/commit/d21f867f15d85bab9a296afbb6fb001148c21cda))
- **conversationagent:** 注释掉开发页面的智能体对话面板 ([3a7c588](https://github.com/nuwax-ai/nuwax/commit/3a7c588f82dc0a89ea1fc30571316870bbed2751))
- **conversationagent:** 注释掉智能体配置加载逻辑 ([7d8cc1c](https://github.com/nuwax-ai/nuwax/commit/7d8cc1c5063cae00d6216c6a89b01fd4215878f5))
- **ConversationAgent:** 移除 Git 暂存和取消暂存操作中的错误提示逻辑 ([fcf1312](https://github.com/nuwax-ai/nuwax/commit/fcf13121bf99e66457ade3989de58a9e253fb292))
- **ConversationAgent:** 移除不必要的边框样式 ([6fcebe7](https://github.com/nuwax-ai/nuwax/commit/6fcebe7a0fdb662d8fefe4dd0d395ed00dc6c03c))
- **ConversationAgent:** 移除视图模式相关状态，简化文件预览逻辑 ([5f14e53](https://github.com/nuwax-ai/nuwax/commit/5f14e533bfb618e7d158b3ed540a0086ade0b939))
- **conversation:** M1 mock-chat 判断收敛单点 + 文档同步 ([0c03dfa](https://github.com/nuwax-ai/nuwax/commit/0c03dfac1d77dc05e553d3a897c8f6f7840db0b7))
- **conversation:** mock 目录规范迁移 + M0 双轨接入 ([d8d78ca](https://github.com/nuwax-ai/nuwax/commit/d8d78ca258a8479be8a281b2cde07a4be2660363))
- **conversation:** 升级 V2 工作轨迹分组与类型化渲染 ([1ab3fd4](https://github.com/nuwax-ai/nuwax/commit/1ab3fd44e12c2786ad5f0697f2719704d586c00e))
- **conversation:** 统一重构消息列表运行时状态同步机制 ([47ed1a7](https://github.com/nuwax-ai/nuwax/commit/47ed1a754e7fbaff9b04c6f4a39862d56a46fe70))
- **conversation:** 轮次边界替代固定 5 条窗口（检查与清理共用） ([092c996](https://github.com/nuwax-ai/nuwax/commit/092c9960a792a992b5f0e33a63bcb7d006f4af22))
- **examples:** 将干预 Demo 迁移至 src/examples 规范目录 ([15c7691](https://github.com/nuwax-ai/nuwax/commit/15c76918c335271187b4ee5c17b87ce6d25e1e15))
- **examples:** 拆分 AgentIntervention Demo Mock 并精简鉴权配置 ([6e175d3](https://github.com/nuwax-ai/nuwax/commit/6e175d3652ffa5514ea671b88e6de478299717b5))
- **home:** 移除任务 Agent 手动切换模式并优化激活判定 ([101d2c4](https://github.com/nuwax-ai/nuwax/commit/101d2c41085e13410e0620e734562336216eab4e))
- **home:** 精简首页布局并保留核心功能区 ([9927ac2](https://github.com/nuwax-ai/nuwax/commit/9927ac23c8d171e99f1cf716bd484b58d0d34c45))
- **i18n:** MCP Ask resume 标点改为按 locale 写死 ([0061655](https://github.com/nuwax-ai/nuwax/commit/0061655c7db7b38d0683a3637343f9d796aa5cda))
- **layouts:** 统一新首页搜索框占位符逻辑 ([83cd8aa](https://github.com/nuwax-ai/nuwax/commit/83cd8aaa0a39e5ce939ed60170464e339b489c92))
- **layouts:** 重构侧边栏菜单高亮归一化算法以支持动态正则配置 ([a3ab7e0](https://github.com/nuwax-ai/nuwax/commit/a3ab7e05a1b97259cd9296db87cbe6f65cff3127))
- **layout:** 统一主页二级菜单为新版 HomeSection ([013427e](https://github.com/nuwax-ai/nuwax/commit/013427ea870c0fac80e46a8f38b8ecf53ac1c204))
- move agent-intervention from features/ to layered dirs (components/hooks/utils/types) ([6e3dc33](https://github.com/nuwax-ai/nuwax/commit/6e3dc33a7b9e428e2957f04a4026841b1935c0af))
- **openui:** 将分享页 OpenUI 逻辑抽至 file-preview-openui.js ([bcfc0e7](https://github.com/nuwax-ai/nuwax/commit/bcfc0e7cec87989aeced2d97ac3fa8015a8db042))
- optimize conversation agent component structure and state management ([6ac1c65](https://github.com/nuwax-ai/nuwax/commit/6ac1c65c51048416441eb007a35f4a4ddfc830ac))
- **pages:** 抽取并优化新建项目元数据初始化逻辑 ([860544a](https://github.com/nuwax-ai/nuwax/commit/860544aae3c6a7e86d0f4bd2a52aff4513a1c049))
- **pages:** 重构并拆分技能详情与插件详情页面 ([80759d5](https://github.com/nuwax-ai/nuwax/commit/80759d5cf537e340c4a7f1103775ec7c9d2f16d2))
- **pages:** 重构智能体调试会话加载与切换逻辑 ([aeb8025](https://github.com/nuwax-ai/nuwax/commit/aeb8025f256c2e794afc9ea4bccb316d79638a9d))
- remove redundant Aliyun captcha callbacks and encapsulate WeChat mini-program detection logic ([9cd6211](https://github.com/nuwax-ai/nuwax/commit/9cd6211c3a06e00c5bfbc7d8fc97a8821241798d))
- **routes:** 将智能体开发路由从 conversation-agent 重命名为 agent-dev ([2e12dd1](https://github.com/nuwax-ai/nuwax/commit/2e12dd1dd0106d255507445d5715c49bd55b7de0))
- **shell:** 避让集中层——路由 wrapper 收口独立页退让 + 全局样式补偿 fixed 返栏 ([90dcff7](https://github.com/nuwax-ai/nuwax/commit/90dcff74f264091d0344c182eb0754fa9b83878b))
- simplify AliyunCaptcha webview bridge by removing redundant environment checks and adding retry logic for message transmission ([c3992a9](https://github.com/nuwax-ai/nuwax/commit/c3992a93a757120f627a1112a34b771f4e0f0f86))
- **skill:** 移除技能详情页的调试会话及关联功能 ([2febf8d](https://github.com/nuwax-ai/nuwax/commit/2febf8d3e95028b524e81590949f57eca02bc76b))
- **space-create-project:** 使用全局枚举重构创建项目页面组件类型 Key ([87b9649](https://github.com/nuwax-ai/nuwax/commit/87b964902ad30a2531bd9fa4d1119dab54733825))
- **SpaceDevelop:** 优化智能体类型处理逻辑 ([26cb51e](https://github.com/nuwax-ai/nuwax/commit/26cb51e44c16c19c910bce1cb44b580e3299b922))
- **SpaceNewProject:** 移除工作流相关功能逻辑 ([39e5082](https://github.com/nuwax-ai/nuwax/commit/39e50823b295fd8c1cd1b1fee7512d5313a617e7))
- sweep 与 isSessionStreamBusy 共享 PROCESSING_RECENT_WINDOW 常量 ([7a5198d](https://github.com/nuwax-ai/nuwax/commit/7a5198d3ddd3bd024dbf3075e07a0ed8a07ea37b))
- **useUnifiedChatScroll:** 提取 pinToBottomInstant 统一复用瞬间置底逻辑 ([bd5961e](https://github.com/nuwax-ai/nuwax/commit/bd5961ee6d4a71a439301312f5cf9ffd71096ce3))
- **views:** 使用 Space.Compact 替换弃用的 addonBefore 属性 ([8766110](https://github.com/nuwax-ai/nuwax/commit/87661109f15a066595577ad5ebd34171c2e54af4))
- 为保持一致性，重命名项目创建路由和组件 ([b55f39a](https://github.com/nuwax-ai/nuwax/commit/b55f39a78cdee2397d1457c7557c9d61dcd62938))
- 从 ChatBoxRecommendNav 中移除 selectedId，并在 index.less 中更新图标样式 ([3bcc434](https://github.com/nuwax-ai/nuwax/commit/3bcc4348e7ddfd2b6284e26e6355a5a6f6a37ca1))
- 从聊天页面和技能详情页面移除导航保护逻辑 ([18b175a](https://github.com/nuwax-ai/nuwax/commit/18b175a2378c9cc34e53d08c29030ea589d14202))
- 优化知识和存储页面的过滤逻辑，移除不必要的状态管理 ([fdb476c](https://github.com/nuwax-ai/nuwax/commit/fdb476c0e1ab20e30b47eb12bbdbb534e8342b35))
- 在 SpaceSquare 项目交互中将 conversationId 传递给 handleClick ([8839f39](https://github.com/nuwax-ai/nuwax/commit/8839f390982f73e2b6ea942b22fecf17e9bb82a7))
- 更新输入框样式 ([8a3b252](https://github.com/nuwax-ai/nuwax/commit/8a3b252629466dd14d76a77763cb5a729daafba3))
- 移除 ConversationAgentTabPicker 中未使用的编辑器相关国际化键值 ([5071a82](https://github.com/nuwax-ai/nuwax/commit/5071a82dff2a5a290585b729aed13194bf4bfde1))
- 移除已弃用的代理订阅和计划管理本地化多语言 KEY 字符串 ([181fe46](https://github.com/nuwax-ai/nuwax/commit/181fe468d0bbea9318b83dcde8d3d863a473c7a5))
- 移除空间库和资源定价中未使用的国际化键值 ([fe7150f](https://github.com/nuwax-ai/nuwax/commit/fe7150fffca928ed288e2c141ac3e3d5d160d013))
- 简化 ConversationAgent 电脑选择同步逻辑 ([8699d65](https://github.com/nuwax-ai/nuwax/commit/8699d65b728a5c58136893d9c6db8914ede17913))
- 简化 FINAL_RESULT 终态判定，去掉 error 文案推断 ([8746683](https://github.com/nuwax-ai/nuwax/commit/8746683f6c83bb48e64a7e9db05f87af6a40c690))

### 🔧 构建/工具

- **.gitignore:** add .hermes to ignore list ([f45f70b](https://github.com/nuwax-ai/nuwax/commit/f45f70b7e175fb3eae828c751bc5f861b6d9821a))
- [ConvPoll] 并入 [ConvSR]，统一为一个前缀 ([655a59f](https://github.com/nuwax-ai/nuwax/commit/655a59f8c50e8a5b6159f22f3c03f0ba6ea0df04))
- **agent-intervention:** remove unused stubs and redundant hook ([fce7284](https://github.com/nuwax-ai/nuwax/commit/fce72843e59b7d5edc1aa96c9fe5d8bd6e291ebf))
- **build:** pnpm-lock.yaml 入库保证构建依赖可复现 ([e8f2fa8](https://github.com/nuwax-ai/nuwax/commit/e8f2fa8289919d4b881c854e431c625291b2d342))
- bump project version to 1.1.16 ([592d0b0](https://github.com/nuwax-ai/nuwax/commit/592d0b01b40286f46f7c58280f69b67fdaccef13))
- bump version to 1.1.18 ([8ebc794](https://github.com/nuwax-ai/nuwax/commit/8ebc794a2ee611926096cca438a6bd13327a5f0a))
- bump version to 1.1.19 + generate ([8f0cf4e](https://github.com/nuwax-ai/nuwax/commit/8f0cf4e219675f32116313f860f7b7ad1520ec58))
- bump version to 1.1.20 + generate ([685873b](https://github.com/nuwax-ai/nuwax/commit/685873bcfd9d7aaab729b51a21b2ee545087884f))
- bump version to 1.1.21 + generate ([e47a151](https://github.com/nuwax-ai/nuwax/commit/e47a1519334a8c362caf614c88d8df86ab8b66e6))
- **captcha:** 防复发加固——触发方式统一 + SDK 风险约束注释 ([79d38dc](https://github.com/nuwax-ai/nuwax/commit/79d38dcbb508a6f555314cdcfec34be43369f1f3))
- **components:** 调整 MentionPopup 组件分页请求大小 ([e8c00d8](https://github.com/nuwax-ai/nuwax/commit/e8c00d8f7f78cabc2500fd9b6d02f898d53363f4))
- **config:** 还原开发/生产环境配置中的 OpenUI 开关 ([dc5a174](https://github.com/nuwax-ai/nuwax/commit/dc5a17432dfee9e29d89d71c9282ef7ee492f625))
- **conversation:** port runtime components onto dual track base ([5a8c376](https://github.com/nuwax-ai/nuwax/commit/5a8c3763efe77aaf4f644d8111426050d6127a09))
- **conversation:** sync regression commands to scripts and docs ([14ed8b5](https://github.com/nuwax-ai/nuwax/commit/14ed8b577abb02fe0d0fad61ead2c61055c1d90d))
- **conversation:** 添加出错落终态验证日志与修复文档 ([c69a15c](https://github.com/nuwax-ai/nuwax/commit/c69a15c4f2cd78e5153ba278fe74414058810481))
- **conversation:** 移植日志清理至 features 版恢复 hook，文档归位 conversation 目录 ([bf7a56d](https://github.com/nuwax-ai/nuwax/commit/bf7a56df4ba075e16a4601907d153ce07906dd46))
- **conversation:** 移除会话卡死定位期的临时诊断日志 ([e5e4bb5](https://github.com/nuwax-ai/nuwax/commit/e5e4bb5f92146167f6eb49b1ae4032ab1f55f34a))
- **conversation:** 移除会话卡死定位期的临时诊断日志 ([7658458](https://github.com/nuwax-ai/nuwax/commit/765845874da173af3c2c9e2f523a9e624bddba1d))
- **deploy:** 更新合并策略以优先保留本地 test 分支的更改 ([8416cc0](https://github.com/nuwax-ai/nuwax/commit/8416cc036347890318ac73be8ae0b92ef062b120))
- **e2e:** 保留两个会话诊断探针(渲染负载量化/思考滚动行为) ([b397488](https://github.com/nuwax-ai/nuwax/commit/b397488b592f45c4a5e633e21a9cddb15ac83322))
- **e2e:** 移除思考滚动探针——mock 复现窗口未调通的半成品 ([59b8573](https://github.com/nuwax-ai/nuwax/commit/59b857384624df8f891590f862b566063d7c7a35))
- **examples:** 移除已废弃的 MCP Ask Resume 展示 Demo ([d9efbe9](https://github.com/nuwax-ai/nuwax/commit/d9efbe9b7d683bd8c4dd1eff116643c4471a9ed9))
- **file-preview:** bump ?v= 缓存版本，兑现 8-25 标题修复的缓存失效 ([d50c511](https://github.com/nuwax-ai/nuwax/commit/d50c5119ec1b8a9d7c0473e083e1c0264dd4c792))
- generate version file for 1.1.18 ([dfc6ec4](https://github.com/nuwax-ai/nuwax/commit/dfc6ec4076549b097959b75afbf809a00ff04c25))
- **i18n:** 更新 McpAskQuestionCard 翻译词条 ([722fac9](https://github.com/nuwax-ai/nuwax/commit/722fac9a9f2677740d3e868e9a641c6cb66f652d))
- **i18n:** 移除多语言文件中的“已修改”字段 ([514db68](https://github.com/nuwax-ai/nuwax/commit/514db689e25888ad1db86632eec0d0166f8fd3f0))
- lint-staged 格式化 X6 文档 markdown 文件 ([1688ca6](https://github.com/nuwax-ai/nuwax/commit/1688ca6c6c280ac240c148eb536ab7106e76defa))
- **locales:** 补全繁体台湾语言的会话列表相关词条 ([50585cc](https://github.com/nuwax-ai/nuwax/commit/50585ccd7258cdadf58b5b1938dadb076bf9d0f9))
- **merge:** 合并 origin/feat-2026.6.18 到 fix/chat-stop-button-state ([3054200](https://github.com/nuwax-ai/nuwax/commit/305420015cd791af79e3a685385c38eee90d1d46))
- **openui:** 升级 @nuwax-ai/openui-runtime 至 0.3.10，并同步相关资源版本 ([a719d6b](https://github.com/nuwax-ai/nuwax/commit/a719d6b632670829c4a61007d621a9472ed81331))
- **openui:** 升级 openui-mcp 0.3.0，运行时改用 openui-runtime 包 ([5331658](https://github.com/nuwax-ai/nuwax/commit/5331658287207d45fb00babda2c6ee23fb2d86e4))
- **openui:** 同步 @nuwax-ai/openui-runtime 至 0.3.9（index.html/runtime.js 重新生成） ([6e9bc80](https://github.com/nuwax-ai/nuwax/commit/6e9bc8047311c48436abeecd2a8d5ae38cdd699d))
- **pages:** 移除项目创建过程中的提示信息 ([05b87cf](https://github.com/nuwax-ai/nuwax/commit/05b87cf5b074e65228828ddb8f5d1d4ddc99dc25))
- **sdlc:** kit 引擎件跟平 v1.2.0（upgrade 仅刷引擎头版本，逻辑不变） ([9fbb7e9](https://github.com/nuwax-ai/nuwax/commit/9fbb7e9c6e99786197ec915d3fbf113c3d7fc783))
- **sdlc:** 播种 nuwa-sdlc-kit v1.1.0 工程化基建 ([684b39c](https://github.com/nuwax-ai/nuwax/commit/684b39c6c998c61226f30a9c9fd20df76e7291d7))
- **SpaceCreateProject:** 移除新建项目页面智能体子类型下拉选择框 ([4c5ffef](https://github.com/nuwax-ai/nuwax/commit/4c5ffef114a08bb210ece65bffc6a945138ff84b))
- update ACP permission card eyebrow text across all locales ([19fe7d7](https://github.com/nuwax-ai/nuwax/commit/19fe7d708de313084b3f7927077f07427e5a33c8))
- update default BRANCH to feat/nuwa-zhuoda-2026.07 in mobile build script ([cf384c8](https://github.com/nuwax-ai/nuwax/commit/cf384c8e1270d3484ca042024e5ed5b101cff450))
- update dev config - point to localhost:8081 ([1768419](https://github.com/nuwax-ai/nuwax/commit/1768419536af1e8c4f76f609ceb573f3c8ed2177))
- upgrade @antv/x6 from 2.x to 3.1.7 ([91ab602](https://github.com/nuwax-ai/nuwax/commit/91ab602aff88a91105fdcdcf799b445350ce7469))
- **version:** 更新应用版本至 1.1.13 ([646e9a1](https://github.com/nuwax-ai/nuwax/commit/646e9a1308dcbc432ee1cc98ec257332de32698a))
- 停止跟踪 dist 构建产物，让 /dist 忽略规则生效 ([e580086](https://github.com/nuwax-ai/nuwax/commit/e580086fa8224b5e62c7332594acc120ca9eb70c))
- 升级 @nuwax-ai/openui-mcp 依赖至 0.1.10 ([49a89a4](https://github.com/nuwax-ai/nuwax/commit/49a89a4da170150013052fe788972e051550e46e))
- 对齐 dist 停止跟踪，清除合并残留产物 ([2e628a0](https://github.com/nuwax-ai/nuwax/commit/2e628a0e12a40322fb1a30e453a524c9d628ec52))
- 提交未暂存的本地改动 ([af46e3c](https://github.com/nuwax-ai/nuwax/commit/af46e3cb516fce08807042e3a6e3b527e90755f4))
- 日志前缀改为中文 [Conv:终态] [Conv:状态] [Conv:恢复] ([50dfe30](https://github.com/nuwax-ai/nuwax/commit/50dfe30fa9ea788a534369773547ca07b029d088))
- 日志前缀改英文 [Conv:Terminal] [Conv:Status] [Conv:Resume] ([adeb0a7](https://github.com/nuwax-ai/nuwax/commit/adeb0a799b252d201482b94f0d8c9e417200e61e))
- 日志前缀简化 [ConversationTerminalSweep]→[ConvTS] [ConversationErrorTerminal]→[ConvET] ([209da2e](https://github.com/nuwax-ai/nuwax/commit/209da2ec8f099e32b0f0f2faa5f65cc76f8a63c1))
- 更新应用版本至 1.1.17 ([c6869ae](https://github.com/nuwax-ai/nuwax/commit/c6869aec488d695c7b7934da3ca049db25720aab))
- 更新应用版本至 1.1.15 ([e0b9885](https://github.com/nuwax-ai/nuwax/commit/e0b98859a02f406b819a54ea0a4a371bddf8d7ab))
- 移除 .pi taskplane 本地配置文件 ([f2bc975](https://github.com/nuwax-ai/nuwax/commit/f2bc975f30037e4870834c1c4ac26f9a16b1692e))
- 移除误提交的调试工作流保存 payload 文件 ([eb1baf8](https://github.com/nuwax-ai/nuwax/commit/eb1baf81470d5995647d369f4198467bb6333b4f))
- 统一前缀格式 [Conv:TS] [Conv:ET] [Conv:SR] ([111c5df](https://github.com/nuwax-ai/nuwax/commit/111c5dfd7e1a099bcdc1c85f93615ae7ba685d6b))
- 轮询/恢复日志前缀简化 [ConversationStreamResume]→[ConvSR] [..][Poll]→[ConvPoll] ([46acd53](https://github.com/nuwax-ai/nuwax/commit/46acd5354a573652959b89b48d6d89bec109d82a))

### 🐛 Bug 修复

- accept mcp ask raw input variants ([603d888](https://github.com/nuwax-ai/nuwax/commit/603d888f6910606c735c484dcc1f10ad8b9ee9da))
- **AcpPermissionCard:** 优化权限卡片选项过滤逻辑，增加特定选项的隐藏条件 ([9e65cb1](https://github.com/nuwax-ai/nuwax/commit/9e65cb19a285597aab2d9e6e63dbfda945f1857d))
- address PR [#166](https://github.com/nuwax-ai/nuwax/issues/166) review blockers and quality issues ([39ce75a](https://github.com/nuwax-ai/nuwax/commit/39ce75af687e95bcd608793bac8c7aa11938d54b))
- adjust aliyun captcha slide style width to 320px ([23e05c4](https://github.com/nuwax-ai/nuwax/commit/23e05c401249d3a83209f6ff37b020c1d07f72af))
- adjust aliyun-captcha slide width to 160px ([50e19dd](https://github.com/nuwax-ai/nuwax/commit/50e19ddc35ec8581052a650292d6f181c08c3556))
- **agent-intervention:** 修复会话刷新覆盖用户未提交编辑的问题 ([b7970e6](https://github.com/nuwax-ai/nuwax/commit/b7970e6f922da4da710930e02a3fcc47f379af6e))
- **AgentDetails:** 更新参数解析注释说明 ([e486688](https://github.com/nuwax-ai/nuwax/commit/e486688e9879a76765ae781fea6de972ec81851b))
- **agentflow:** address code review findings from v2 refactoring ([9fc1870](https://github.com/nuwax-ai/nuwax/commit/9fc18705b32869d93bfefd514855b628d74754fd))
- **agentflow:** address code-review findings from d92bdab0b ([6611bbb](https://github.com/nuwax-ai/nuwax/commit/6611bbb05ca437cd1ea30be0112d497abcafd493))
- **agentflow:** align AgentFlow node/edge rendering with workflow v3 style ([28ba253](https://github.com/nuwax-ai/nuwax/commit/28ba25392f3041ee72e7b2deff0f74588ca49c8b))
- **agentflow:** correct workflowId extraction, fix create type, fix NaN ([166eca1](https://github.com/nuwax-ai/nuwax/commit/166eca1382950df6c30f5e962a2b82cd2d95b624))
- **AgentFlow:** mock local debug saves ([d3efbbe](https://github.com/nuwax-ai/nuwax/commit/d3efbbeca7c321fc64c26c25b3a54a44f2d900df))
- **agentflow:** pass flowKind to port/edge quick-add stencil panel ([63c9b38](https://github.com/nuwax-ai/nuwax/commit/63c9b38d6fc894c1d09d1731e3712077bf7d2e65))
- **agentflow:** restore chip inside .general-node + overflow:visible for AgentFlow ([f33f43d](https://github.com/nuwax-ai/nuwax/commit/f33f43d97412a0771eddb3f25494f55b8faa33b4))
- **agentflow:** restore workflow v3 CSS styles in indexV3.less ([12d2dc7](https://github.com/nuwax-ai/nuwax/commit/12d2dc7d134302c994789706541b75454debf659))
- **agentflow:** restore workflow v3 layout, use flowKind branch ([7a1ec43](https://github.com/nuwax-ai/nuwax/commit/7a1ec432d2a709b9e3b9db3322b3e0d8d6e6f946))
- **agentflow:** restore workflow v3 stencil Popover with two-column grid ([d1d2a06](https://github.com/nuwax-ai/nuwax/commit/d1d2a066132f5b0633193175cdb43d1c45072abb))
- **agentflow:** show output branch names in EvalGate, HITL-Approve, HITL-Ask node bodies ([415402c](https://github.com/nuwax-ai/nuwax/commit/415402cc3c33216c71ae16ed7c621a28e7a3d12b)), closes [#52c41](https://github.com/nuwax-ai/nuwax/issues/52c41) [#ff4d4](https://github.com/nuwax-ai/nuwax/issues/ff4d4) [#52c41](https://github.com/nuwax-ai/nuwax/issues/52c41) [#ff4d4](https://github.com/nuwax-ai/nuwax/issues/ff4d4) [#5147](https://github.com/nuwax-ai/nuwax/issues/5147)
- **AgentFlow:** 修复 RouteDecision 作为新插入节点时出边连接丢失 ([41f7a85](https://github.com/nuwax-ai/nuwax/commit/41f7a85e213b2c4a5b7103f42bfa4dc807649b5c))
- **AgentFlow:** 修复画布缩放到适配无效及路由决策出边连接 ([403bae1](https://github.com/nuwax-ai/nuwax/commit/403bae176023e39b364ad89211edec487607d9bc))
- **AgentFlow:** 修复端口点击事件及节点连接逻辑 ([dd20115](https://github.com/nuwax-ai/nuwax/commit/dd201157ed1ed0960d5e1948fb59ecd88c3f3b82))
- **AgentFlow:** 修复询问用户节点中文输入法被打断 ([ce18243](https://github.com/nuwax-ai/nuwax/commit/ce182437993434c57c5d747d0f1efa23de7c805c))
- **AgentFlow:** 修复询问用户选项端口连线与边序列化报错 ([2ff80c4](https://github.com/nuwax-ai/nuwax/commit/2ff80c4977f30b4963e8a988b7be686f27f67b44))
- **AgentFlow:** 修复路由条件默认值、全屏缩放与 Agent 变量引用 ([52f9fcc](https://github.com/nuwax-ai/nuwax/commit/52f9fcc9a77722419a68cedab1ee18c0b9f82654))
- **AgentFlow:** 加固边补画校验并补充风险回归文档 ([aa0f8be](https://github.com/nuwax-ai/nuwax/commit/aa0f8bebca1a17a3dd9ab002e2a735ecee506b69))
- **AgentFlow:** 嵌入编辑器时隐藏自带 Header，顶部栏与 TaskAgent 一致 ([63a5c21](https://github.com/nuwax-ai/nuwax/commit/63a5c2131d2fac458114c72ffc49c60bd120c957))
- **agentflow:** 恢复智能体节点补充提示词区块底部分隔线 ([5d62a1a](https://github.com/nuwax-ai/nuwax/commit/5d62a1ab8457317dc7976bc32d35923dec7744a8))
- **AgentFlow:** 智能体节点添加流程与图标展示对齐 ([ffa11e2](https://github.com/nuwax-ai/nuwax/commit/ffa11e293fc268efd7015ee3c98a8cf57fb33e40))
- **AgentFlow:** 更新智能体节点补充提示词 placeholder 文案 ([2d72902](https://github.com/nuwax-ai/nuwax/commit/2d729022e91f498a2300baf5ae228b8b10b8575b))
- **AgentFlow:** 补充提示词 placeholder 使用独立 i18n key ([3472617](https://github.com/nuwax-ai/nuwax/commit/34726179eb45ffdb0b2a5f48f4d6e0e06693e291))
- **AgentFlow:** 询问用户节点输出配置对齐问答节点 ([cafbf97](https://github.com/nuwax-ai/nuwax/commit/cafbf97a2cb6f0e66ab25765958ebf4cc948ef0d))
- **AgentFlow:** 调整节点选择面板节点展示顺序 ([c96bd0e](https://github.com/nuwax-ai/nuwax/commit/c96bd0e661d5064aba06b44123c774fffc3d1f54))
- **AgentHeader:** 优化导出配置权限判断逻辑 ([27c6c3b](https://github.com/nuwax-ai/nuwax/commit/27c6c3b11fcc2cb5b3099530d94e867feba10e76))
- **AgentIntervention:** MCP Ask 文件上传提交改为远程 URL ([2b51023](https://github.com/nuwax-ai/nuwax/commit/2b510231e3276918215832b5badee1c44834dec7))
- **AgentIntervention:** 优化 MCP Ask resume 消息展示 ([2c0f923](https://github.com/nuwax-ai/nuwax/commit/2c0f923895af8855256358465df207867bf8cc3b))
- **AgentIntervention:** 优化 MCP Ask resume 附件展示与重复匹配 ([8564508](https://github.com/nuwax-ai/nuwax/commit/8564508b05b554607daf35fe038a9284e402efea))
- **AgentIntervention:** 优化最终消息状态处理逻辑 ([216f737](https://github.com/nuwax-ai/nuwax/commit/216f7375d823869c84ab730089a952d30a68e956))
- **AgentIntervention:** 修复 AgentFlow 同标题多次 AskQuestion 不弹窗 ([89af360](https://github.com/nuwax-ai/nuwax/commit/89af360c25755a9963fec672e8960d4c54083a9b))
- **AgentIntervention:** 修复 MCP ask 事件解析 ([33f48d6](https://github.com/nuwax-ai/nuwax/commit/33f48d6b8eb6d6c92c55c47e2fa822275013540f))
- **AgentIntervention:** 修复 MCP Ask 重复询问匹配 ([2d4081f](https://github.com/nuwax-ai/nuwax/commit/2d4081f37a177622f2c6a9b24ca0ae106ab400f8))
- **AgentIntervention:** 修复权限审批失败后阻塞后续审批 ([4bc7fa7](https://github.com/nuwax-ai/nuwax/commit/4bc7fa73caf314b2fe48b97f2ebd2facfb6fd026))
- **AgentIntervention:** 修复权限审批报错时重复弹窗 ([1b8f8f1](https://github.com/nuwax-ai/nuwax/commit/1b8f8f12229b437496f56ee2535ae02a3831594d))
- **AgentIntervention:** 修复测试断言路径并清理死代码和多余依赖 ([db40c00](https://github.com/nuwax-ai/nuwax/commit/db40c00800ac1e8036a361143564f898f8b83910))
- **AgentIntervention:** 收紧 MCP Ask resume 远程文件判定，网页链接不再误判为附件 ([da48d69](https://github.com/nuwax-ai/nuwax/commit/da48d69aa3b2885992324cfcf6a218e87475ffc0))
- **AgentIntervention:** 识别裸 v2 input(agent 省略 schemaVersion/ui.version) ([ca12f85](https://github.com/nuwax-ai/nuwax/commit/ca12f852f79350f6d1f768b8cc3268cce421cb85))
- **agent:** 修复标签栏宽度计算偏差导致出现多余滚动条的问题 ([f681118](https://github.com/nuwax-ai/nuwax/commit/f6811187e105315241d012be281f5a3003927204))
- **agent:** 同步智能体右侧调试会话沙盒参数与 mention 弹窗方向 ([685b73d](https://github.com/nuwax-ai/nuwax/commit/685b73d47227c9600a956e39dc57b97e4c8dcf57))
- **agent:** 解决首次进入智能体开发页面后刷新导致右上角模型重置的问题 ([690fd24](https://github.com/nuwax-ai/nuwax/commit/690fd243c2cec2d2d59c02150cec45faff369fed))
- align ACP permission flow with backend API and simplify card UI ([9b3dfd7](https://github.com/nuwax-ai/nuwax/commit/9b3dfd7813ccb1a112ba2d4d36410f39f2b7aad2))
- **Antv-X6:** 修复 V3 属性面板中文 IME 输入被打断 ([23249ca](https://github.com/nuwax-ai/nuwax/commit/23249ca2255014f1ab536b3d50b380bf13986503))
- **Antv-X6:** 修复工作流属性面板列表输入中文 IME 被打断 ([f3641f4](https://github.com/nuwax-ai/nuwax/commit/f3641f42864732d90052a1864d385cfda975a186))
- **Antv-X6:** 修复快捷添加节点坐标偏移与弹层定位 ([ce849eb](https://github.com/nuwax-ai/nuwax/commit/ce849eb45360cce245e17e9b805c98403f895a05))
- **app-dev:** 修复网页应用新建后首条消息透传 ([a37915e](https://github.com/nuwax-ai/nuwax/commit/a37915e9cbce82147b21cf1a521087097d8f77ac))
- **appdev:** 优化工具调用重复展示过滤 ([6de9565](https://github.com/nuwax-ai/nuwax/commit/6de9565f11db1726ea6aba298df699568b6971d1))
- **AppDev:** 优化版本记录面板切换逻辑 ([171dc7c](https://github.com/nuwax-ai/nuwax/commit/171dc7c97a7d00744c7f0a9f2cbbc0b323420e10))
- **AppDev:** 增加 Preview 最后刷新时间状态注释 ([bddc6d8](https://github.com/nuwax-ai/nuwax/commit/bddc6d8751b47b67e0ecb2c09e7d27f01ab8fb87))
- **AppDev:** 增加模型选择权限判断注释 ([1974bb0](https://github.com/nuwax-ai/nuwax/commit/1974bb0359e172979e366650157d9a16c01c5788))
- **AppDev:** 更新 refreshGitListAfterSaveRef.current 的逻辑 ([da50b2a](https://github.com/nuwax-ai/nuwax/commit/da50b2a20801ac211970940e9824d2dfcdfb5ddc))
- **AppDev:** 添加 designViewer 组件的 ref 注释说明 ([9d74195](https://github.com/nuwax-ai/nuwax/commit/9d74195b4604ed42c2b5682b59907f6daf71a7b4))
- **app:** 禁用 OpenUI 调试工具面板 ([4c75caf](https://github.com/nuwax-ai/nuwax/commit/4c75cafe7e8951fe105bfced7b5932b47bffe6f3))
- **App:** 调整 Chunk 加载失败弹窗文案 ([6513cde](https://github.com/nuwax-ai/nuwax/commit/6513cde1d56d0489f67d522cde5778c509de07c1))
- **ask-question:** 支持历史 result.data JSON 字符串恢复 DockPanel ([8ab3309](https://github.com/nuwax-ai/nuwax/commit/8ab3309dbd81b3a179b405cb6e373400b72737ae))
- **captcha:** 优化 App 端阿里云验证码 WebView 消息回传可靠性 ([3c0f00c](https://github.com/nuwax-ai/nuwax/commit/3c0f00c563d6fef2cb98d1222aa0a50eac50d8a6))
- **captcha:** 修复 WebView 环境未就绪时验证码校验参数丢失问题 ([8db0868](https://github.com/nuwax-ai/nuwax/commit/8db086882ca3d3f4489c9fe9fa00c7a665b99ce6))
- **captcha:** 登录滑块不弹出——触发方式回归官方 button click 姿势 ([856f654](https://github.com/nuwax-ai/nuwax/commit/856f654902d0a5c7b9366a2bbda20786a4f67e08))
- **chat:** .gitignore 写入三态判定，空文件/拉取失败不再误走 create ([076db0b](https://github.com/nuwax-ai/nuwax/commit/076db0b0f720b3f472b599c746b53b4f7e215ced))
- **Chat): safe error.message access in handleClear; fix(McpAsk:** scrollable form with max-height ([ceb5f6e](https://github.com/nuwax-ai/nuwax/commit/ceb5f6e9e841aa2a7af52b062c9ef55dac956da4))
- **chat:** gate history polling on terminal events ([fa00967](https://github.com/nuwax-ai/nuwax/commit/fa009672512accdb59713fa1027d01c279599077))
- **chat:** handleChatProcessingList 稳定函数身份，阻断 runtime 桥接 effect 自激循环 ([73dab37](https://github.com/nuwax-ai/nuwax/commit/73dab375522d342a0853ebd0e26136521beadcee))
- **chat:** sub 恢复流的自动滚动补 \_\_isProgrammaticScroll 标志 ([46c80e6](https://github.com/nuwax-ai/nuwax/commit/46c80e6dc14004fb3f2b6ab752724e904272209c))
- **chat:** sub 流收到 ERROR(会话失败)时主动断开，恢复轮询 ([9eb8019](https://github.com/nuwax-ai/nuwax/commit/9eb80196d4d4652ed093682f2d235021135c3f26))
- **chat:** sub 续上前 reload 历史，补全多页签下其它页签发送的用户消息 ([34bdb24](https://github.com/nuwax-ai/nuwax/commit/34bdb245eaf55d7a5e0f5142386bb9fe421bbcce))
- **chat:** sub 续上后立即停止状态轮询 ([57b82e3](https://github.com/nuwax-ai/nuwax/commit/57b82e36c5e4893ad5a436579d6f15cd1019ec5e))
- **ChatTemp:** 修复流式消息异常时内容被旧状态覆盖导致空消息 ([067c600](https://github.com/nuwax-ai/nuwax/commit/067c60039e317e48e05db77c7996a0ac85539a52))
- **ChatView:** 用户主动停止的会话消息补渲染复制按钮 ([22d6877](https://github.com/nuwax-ai/nuwax/commit/22d6877284ca5505511a82c304052a30f379d101))
- **Chat:** 个人电脑会话隐藏打开智能体电脑按钮 ([3f8a242](https://github.com/nuwax-ai/nuwax/commit/3f8a2426ae27a730b0de1832492dc99dc3530fb0))
- **Chat:** 临时关闭消息队列并拦截会话活跃期间的连续发送 ([ab3897d](https://github.com/nuwax-ai/nuwax/commit/ab3897dc173d1b5e94b5d2e24cb38b1646717639))
- **Chat:** 优化会话历史加载逻辑，避免页面闪动 ([6097579](https://github.com/nuwax-ai/nuwax/commit/60975794f83e348bab095bda331de40b3e35211a))
- **chat:** 优化未落库轮次消息归并与会话结束状态栏抖动问题 ([9ba18ef](https://github.com/nuwax-ai/nuwax/commit/9ba18efb5878c761d55aa7ed665a201a33635733))
- **chat:** 会话执行中(sub 订阅时)不轮询，sub 关闭后恢复轮询 ([870fe0e](https://github.com/nuwax-ai/nuwax/commit/870fe0eae43335146e3e904a0379068f8b150269))
- **chat:** 会话结束后持续轮询状态（回退 ready 的 taskStatus 限制） ([22748cc](https://github.com/nuwax-ai/nuwax/commit/22748cc3871e7af42c436022b82fa05d23d24b28))
- **chat:** 会话结束态不显示审批，跨页签审批自动关闭 ([f8c72c2](https://github.com/nuwax-ai/nuwax/commit/f8c72c2a64633e905a4077f7ca240eb3a6cfd239))
- **chat:** 会话结束态只关闭 acp 权限审批，不影响 ask-question ([c80d03c](https://github.com/nuwax-ai/nuwax/commit/c80d03ca00d17371b7e62c0bff18ae5cacc1bb9c))
- **Chat:** 会话英文消息按单词换行，避免逐字母断行 ([a573084](https://github.com/nuwax-ai/nuwax/commit/a57308459b4efd79c4c149d3f58bdc82034072fd))
- **chat:** 修复 EXECUTING 会话刷新后 sub 流未订阅（isLocallyStreaming 混入 taskStatus） ([f058629](https://github.com/nuwax-ai/nuwax/commit/f0586295569ab5ae03ee81b7f10169dcee0f02f1))
- **Chat:** 修复 sub 流报错后重订阅死循环与恢复机制卡死 ([db935a6](https://github.com/nuwax-ai/nuwax/commit/db935a687823f44e50dd111f9fcb593b56b26f23))
- **chat:** 修复会话历史记录中工具调用查看详情按钮无法打开的问题 ([58e0a1f](https://github.com/nuwax-ai/nuwax/commit/58e0a1fad189a2933dc798dfb468e9ef7f88ce1b))
- **Chat:** 修复会话流式输出时停止按钮不显示 ([5fa89ba](https://github.com/nuwax-ai/nuwax/commit/5fa89bae0608d63c4bcdfb2c218e6d37e0810989))
- **chat:** 修复会话结束后工具调用状态卡在加载中的问题 ([73b2f1a](https://github.com/nuwax-ai/nuwax/commit/73b2f1ae991a5ad9d2a7b66c806f2ee9cb284dd1))
- **chat:** 修复停止生成后权限审批弹窗未销毁的问题并重构相关逻辑 ([9920f9a](https://github.com/nuwax-ai/nuwax/commit/9920f9a8af45043c8fb18a12754d6b1f98193e48))
- **chat:** 修复切换会话时短暂闪现空白付费订阅弹窗的问题 ([bb47fdc](https://github.com/nuwax-ai/nuwax/commit/bb47fdce06f1efb94e37249c726da041e243f6a0))
- **chat:** 修复历史会话轮询时最新消息未能实时同步更新的问题 ([30fb007](https://github.com/nuwax-ai/nuwax/commit/30fb00730440c9186f2c5dd3543474096aba2f2d))
- **chat:** 修复右侧聊天会话心跳包自动滚动以及流式打字中无法打断滚动的问题 ([e70e1b7](https://github.com/nuwax-ai/nuwax/commit/e70e1b7f5811a03ddcf740ffa87e3867f66dce28))
- **chat:** 修复工具调用与询问事件 ID 冲突导致卡片无法展示的缺陷 ([62bbe11](https://github.com/nuwax-ai/nuwax/commit/62bbe1156ad1b31a89620f07c8b1f73ab962acc8))
- **chat:** 修复带有开场白的初始会话导致电脑不可选的问题 ([d457663](https://github.com/nuwax-ai/nuwax/commit/d4576638943ef9919b201ea4da82c2e09055a1e1))
- **chat:** 修复思考流未结束前因正文提前到达被误判为已思考的问题 ([d4b17ba](https://github.com/nuwax-ai/nuwax/commit/d4b17babdb02e2d1eb75b1be0a015608c590405f))
- **chat:** 修复新开会话仅有开场白时误显示任务完成状态栏问题 ([d225497](https://github.com/nuwax-ai/nuwax/commit/d225497397fe6c3779be43d8816fb3fc586e372c))
- **chat:** 修复消息补齐 index 时 React key 变化导致的渲染闪烁问题 ([6d74a47](https://github.com/nuwax-ai/nuwax/commit/6d74a474f35150b71c5fe6471d341d95ed0acdf1))
- **chat:** 修复消息队列活跃态卡死及入队参数丢失 ([6be9f5f](https://github.com/nuwax-ai/nuwax/commit/6be9f5f72c1fab1559433943258634848f1a29a2))
- **chat:** 修复消息队列活跃态卡死及入队参数丢失 ([a2483b9](https://github.com/nuwax-ai/nuwax/commit/a2483b979c3230d3277fa3a31d2bdf1593789666))
- **chat:** 修复聊天会话刷新后不显示任务执行加载状态及流式中双重 loading 的问题 ([0d4761d](https://github.com/nuwax-ai/nuwax/commit/0d4761dab57a7cd92756cb8ff94be0be935315a8))
- **chat:** 修复聊天会话自动滚动失效及类型声明报错 ([17d4a88](https://github.com/nuwax-ai/nuwax/commit/17d4a889399d5c2d84e2a59fa2108bbce5a60d04))
- **chat:** 修复队列过早消费并优化入队按钮与面板交互 ([16595c4](https://github.com/nuwax-ai/nuwax/commit/16595c4367bdc59966f70b7b792081906f44df95))
- **Chat:** 切换视图时关闭 Git 版本记录面板 ([dc0f0bf](https://github.com/nuwax-ai/nuwax/commit/dc0f0bf43f85c42883a3b3568a1f103f0032bf6a))
- **chat:** 历史 hydrate 的 ASK_QUESTION 默认 pending,恢复渲染 dockpanel 表单 ([b6da909](https://github.com/nuwax-ai/nuwax/commit/b6da9096191ebedd9973ad677365f6280e87b974))
- **Chat:** 在切换会话时重置 Git 版本记录面板和终端状态 ([4517282](https://github.com/nuwax-ai/nuwax/commit/4517282237c91592f7b7ed28fd73fb2cbd64ce66))
- **chat:** 完善 TaskAgent 任务状态同步与消息队列信号拆分 ([6c2097d](https://github.com/nuwax-ai/nuwax/commit/6c2097d5b890905f51d38ad58eb8e85309cbbc78))
- **chat:** 审批 DockPanel 只渲染最新消息，避免 sub 续上时历史审批闪烁 ([47d42be](https://github.com/nuwax-ai/nuwax/commit/47d42beb6118486de22098f119c11ad57ee111be))
- **chat:** 支持 ASK_QUESTION 类型的 SSE 事件识别与弹框展示 ([733ec78](https://github.com/nuwax-ai/nuwax/commit/733ec789efd1d39e23ffc5641f9bb32c0d63e864))
- **Chat:** 更新会话 icon 的注释说明 ([f71c82b](https://github.com/nuwax-ai/nuwax/commit/f71c82bfd090a4bda8dc8b46fe6704e494bb4330))
- **chat:** 未开启模式切换(allowChooseMode)的会话框不再误用全局 ask ([2d59485](https://github.com/nuwax-ai/nuwax/commit/2d59485851268424f7c986f8480ac2721623990e))
- **chat:** 权限审批 DockPanel 按 executeId 关闭过期审批卡 ([da4556b](https://github.com/nuwax-ai/nuwax/commit/da4556bca3880a235c2c57fb3c758962c9be9a69))
- **Chat:** 添加 Git 列表刷新功能 ([7c2f5cc](https://github.com/nuwax-ai/nuwax/commit/7c2f5ccc738481d7c898f61b9c66d8df224c7af1))
- **Chat:** 添加关闭页面预览的注释说明 ([8908989](https://github.com/nuwax-ai/nuwax/commit/890898991588567b711208a282a7b4c19dcf85f2))
- **Chat:** 添加文件树选中文件时关闭 Git 版本记录面板的注释说明 ([f8aaff1](https://github.com/nuwax-ai/nuwax/commit/f8aaff18844c761d03f8705a78ec8fb227fab901))
- **Chat:** 滚到底部按钮随队列高度上移，避免与待发送面板重叠 ([bceec6d](https://github.com/nuwax-ai/nuwax/commit/bceec6d83e523fc9e3dc9b624a7c0da91db98ce5))
- **chat:** 禁用 ConversationAgent 预览 Tab 的会话流式恢复/轮询 ([3d9917c](https://github.com/nuwax-ai/nuwax/commit/3d9917cce68f34f51b29a403293ea78f815563fb))
- **chat:** 稳定会话进行中发送/停止按钮状态 ([d3dc283](https://github.com/nuwax-ai/nuwax/commit/d3dc28379defd72f03bf2ba0878717da90f3528d))
- **chat:** 轮询/storage 事件同步 agentMode(nuwax_agent_mode_cache) 到状态 ([de5660e](https://github.com/nuwax-ai/nuwax/commit/de5660e0c5dccb216c7b66d2e1c626b22112e520))
- **Chat:** 队列消费期间修正执行提示与 suggest 展示 ([c36f46d](https://github.com/nuwax-ai/nuwax/commit/c36f46dbbc7d0282c59f9405a0b674caf41ea10d))
- **chat:** 隐藏终端收起时的重启容器加载中状态 ([887f031](https://github.com/nuwax-ai/nuwax/commit/887f031432b3edc51a79b29700ad0ab431856e35))
- complete ask question resume flow ([7377079](https://github.com/nuwax-ai/nuwax/commit/737707917e3902b86fd63be7d4f65a7c72b06006))
- **components:** 优化会话项组件的内容展示逻辑 ([8c417a9](https://github.com/nuwax-ai/nuwax/commit/8c417a942bebc7852d042ff01eba3c0a88fa4c4f))
- **components:** 优化选择电脑组件展示逻辑并解耦模式图标选中状态 ([a1b53f1](https://github.com/nuwax-ai/nuwax/commit/a1b53f15537c82183e0f9bfb9ae358d4f178e37f))
- **components:** 修复 HTML 文件预览重复调用接口及预览区闪烁问题 ([6f9ccd4](https://github.com/nuwax-ai/nuwax/commit/6f9ccd440817cd42dfe6accdbe728d4bb70b7e7d))
- **components:** 修复 Markdown 过程分组误将 Event 类型节点计入工具调用分组的问题 ([37a33e8](https://github.com/nuwax-ai/nuwax/commit/37a33e8fc29b7eba928f9974dc3309c155ed3362))
- **components:** 修复 RecentAgentItem 组件 TS 报错与渲染逻辑 ([2a0e117](https://github.com/nuwax-ai/nuwax/commit/2a0e117f74404ddd7902373144bfb04300044bf7))
- **components:** 修复历史会话中 OpenUI 工具调用卡片渲染缺失的问题 ([50acd3c](https://github.com/nuwax-ai/nuwax/commit/50acd3cd5a46bb9ad88e27930bc12f7f55b4e5b2))
- **components:** 修复向上加载历史数据页面和滚动条跳动问题 ([a6c6fa1](https://github.com/nuwax-ai/nuwax/commit/a6c6fa16c56783768f35c59b1335736bbfb6aaea))
- **components:** 修复废弃的 Tooltip 样式属性并清理冗余的调试日志 ([8254c5d](https://github.com/nuwax-ai/nuwax/commit/8254c5d99871cee7f40d08543fad38720f79d48a))
- **components:** 修复技能提及弹窗在数据为空时无法自动关闭的问题 ([a94a9ed](https://github.com/nuwax-ai/nuwax/commit/a94a9edccfd309542e2f5545840db7ba119bfc20))
- **components:** 修复提示词放大弹窗被底层表单元素穿透的层级问题 ([dd3d223](https://github.com/nuwax-ai/nuwax/commit/dd3d223b1ed9237ae0591e98a4fd401f9a6638c5))
- **components:** 修复文件预览重复请求接口及 HTML 预览闪烁问题 ([bf266b8](https://github.com/nuwax-ai/nuwax/commit/bf266b883377284e642e2fb7586d13d6381fca74))
- **components:** 修复添加组件弹窗中列表文本无法被鼠标选中的问题 ([9dc2fac](https://github.com/nuwax-ai/nuwax/commit/9dc2fac42fafa9edea9869ecb389a4015e0bf394))
- **components:** 修复滚动时双滚动条闪烁问题 ([662a4ff](https://github.com/nuwax-ai/nuwax/commit/662a4ffdfbed3012a55c111bdd2e7f50f916836a))
- **components:** 修复聊天会话轮询同步后偶尔无法回到底部问题 ([9b171c7](https://github.com/nuwax-ai/nuwax/commit/9b171c7ca360966ecb340ae2c14ff2a74f4efef0))
- **components:** 修复聊天历史记录中流式更新产生重复执行计划卡片的问题 ([59e309b](https://github.com/nuwax-ai/nuwax/commit/59e309b6efb74948bad92061c2f7fee5e7ed491c))
- **components:** 修复表单回填类型错误并支持校验报错滚动 ([06fceb9](https://github.com/nuwax-ai/nuwax/commit/06fceb982924f748702e769ac02520d5c1446ead))
- **components:** 修复输入法回车直接提交表单 ([63c6151](https://github.com/nuwax-ai/nuwax/commit/63c61519c7816f1e25d8f06cbd8fdc5a22b9fec7))
- **components:** 修复鼠标移入内容区未显示回底按钮的异常 ([af5f6bb](https://github.com/nuwax-ai/nuwax/commit/af5f6bb47da617272b8f8738618098e56d652988))
- **components:** 固定 ACP 权限审批卡片的按钮排序及补全多语言支持 ([ace8504](https://github.com/nuwax-ai/nuwax/commit/ace8504dcacc0b93a57ff0457e65e45441567f1a))
- **components:** 在渲染层过滤清除会话中的默认开场白 ([0f443ef](https://github.com/nuwax-ai/nuwax/commit/0f443ef49355a059f4290fd96851c9660dcedabe))
- **components:** 增加个人电脑下线时的云电脑选项回退逻辑 ([ead5f2c](https://github.com/nuwax-ai/nuwax/commit/ead5f2cf1251cf7714b74de5703318f9f4d84079))
- **components:** 强行使步骤条序号圆圈与标题在垂直方向上绝对居中对齐 ([04ada14](https://github.com/nuwax-ai/nuwax/commit/04ada1461acb09681220612c381747786cdb1d6c))
- **components:** 恢复被宿主样式重置覆盖的 OpenUI 表格单元格内边距 ([d6f0aec](https://github.com/nuwax-ai/nuwax/commit/d6f0aec959ba479c661c63005114ce72ea405fcb))
- **components:** 解决聊天会话滚动区域底部 padding-bottom 坍塌未生效的 Bug ([e612ec5](https://github.com/nuwax-ai/nuwax/commit/e612ec51c07444d4750cfdeaa1ed246a7010f65f))
- **config:** 更新开发环境 BASE_URL 配置，移除代理设置 ([e517ab7](https://github.com/nuwax-ai/nuwax/commit/e517ab716256d0e66845e27f67f5d856b6e36d82))
- **Connector:** 导出按钮按导出类型独立 loading，勾选导出所选不再影响导出全部样式 ([1056be5](https://github.com/nuwax-ai/nuwax/commit/1056be5db36a566784a0148ecd107cc3e7c4dbc3))
- **Connector:** 空间侧删除连接器业务报错不再重复提示，修复报错后页面崩溃 ([e5a4183](https://github.com/nuwax-ai/nuwax/commit/e5a4183c4b85d73d0befbb0db2ae30733cf38693))
- **ConversationAgentHeader:** 添加图片错误处理功能 ([0739386](https://github.com/nuwax-ai/nuwax/commit/07393864d52a396f898bce264cec91ce2b163afb))
- **ConversationAgent:** 修复 devConversationId 为 queryConversationId 的引用问题 ([8a96067](https://github.com/nuwax-ai/nuwax/commit/8a960674043a70e881a756f80ae83a5c71750fad))
- **ConversationAgent:** 修复开发会话 ID 的 ref 注释重复问题 ([59f0ef6](https://github.com/nuwax-ai/nuwax/commit/59f0ef69eab8978ae49e036a4bb6813fcb6b4cbc))
- **ConversationAgent:** 修复开发日志轮询逻辑 ([46dc703](https://github.com/nuwax-ai/nuwax/commit/46dc70382faeea0e8806e3b412fff948f7d24f53))
- **conversationagent:** 修复智能体页面中电脑选择被意外重置的问题并下沉状态逻辑 ([911348e](https://github.com/nuwax-ai/nuwax/commit/911348e135f65536e920ff9cf1845e07054a1519))
- **ConversationAgent:** 修复更新静态文件时的 cId 传递逻辑 ([11f7a6d](https://github.com/nuwax-ai/nuwax/commit/11f7a6d7e50900a7de3690ccb9ee93faa1fcd0af))
- **ConversationAgent:** 修改文件树区域默认显示状态 ([3c0e69d](https://github.com/nuwax-ai/nuwax/commit/3c0e69dfb6ff8c0b956702d3235867dbbadb148a))
- **ConversationAgent:** 增加会话消息列表注释 ([b89dad7](https://github.com/nuwax-ai/nuwax/commit/b89dad7cb1953da899f70230c395116c03136947))
- **ConversationAgent:** 增加保存单个文件逻辑注释 ([d6803b4](https://github.com/nuwax-ai/nuwax/commit/d6803b451eb6085549ea35a774f0f01c5794f15d))
- **ConversationAgent:** 增加保存文件逻辑注释 ([c697928](https://github.com/nuwax-ai/nuwax/commit/c6979285b730c3a1b61a7e5c9edb72b2cbd41ee2))
- **ConversationAgent:** 增加切换文件树显隐逻辑注释 ([4aee1e4](https://github.com/nuwax-ai/nuwax/commit/4aee1e464e10ff87a1e360ffea35cb59cce4be2f))
- **ConversationAgent:** 增加创建文件逻辑注释 ([f1179c9](https://github.com/nuwax-ai/nuwax/commit/f1179c9d9edd5bc05887184f609360de5238e49c))
- **ConversationAgent:** 增加创建文件逻辑注释 ([5a2c254](https://github.com/nuwax-ai/nuwax/commit/5a2c2541ac1c88450af2f4d2b867e9a8f073465f))
- **ConversationAgent:** 增加删除文件逻辑注释 ([0b17251](https://github.com/nuwax-ai/nuwax/commit/0b17251648f20a1419071621fbb44259fdc11cfe))
- **ConversationAgent:** 增加刷新 Git 列表逻辑注释 ([c83b0cd](https://github.com/nuwax-ai/nuwax/commit/c83b0cd5c0eb7b098cdcd39e3724376aeb36ba4f))
- **ConversationAgent:** 增加刷新文件树逻辑注释 ([23c8147](https://github.com/nuwax-ai/nuwax/commit/23c814781236dd0207c89aec6e47bc4140403d98))
- **ConversationAgent:** 增加刷新文件树逻辑注释 ([17d79e4](https://github.com/nuwax-ai/nuwax/commit/17d79e41642a8e4f56d8fc7985a7af62a3d44d0f))
- **ConversationAgent:** 增加刷新文件树逻辑注释 ([2ee1cc7](https://github.com/nuwax-ai/nuwax/commit/2ee1cc75fccae88233997c442a8460d70d06abf2))
- **ConversationAgent:** 增加去除空格逻辑注释 ([3388a13](https://github.com/nuwax-ai/nuwax/commit/3388a13b5b09804fe06b24090cb0d3d58d316f8f))
- **ConversationAgent:** 增加导入项目逻辑注释 ([857270c](https://github.com/nuwax-ai/nuwax/commit/857270c25cb8b192fe796b09379af59b9ab6f883))
- **ConversationAgent:** 增加开发会话 ID 的 ref 注释说明 ([8422b84](https://github.com/nuwax-ai/nuwax/commit/8422b843e762ec371f0bd879635c9144e52336e4))
- **ConversationAgent:** 增加文件夹名称相同提示注释 ([b89ed46](https://github.com/nuwax-ai/nuwax/commit/b89ed460b0bbd4460e2d2e2b383ba789bc196870))
- **ConversationAgent:** 增加文件夹路径拼接注释 ([9d1e621](https://github.com/nuwax-ai/nuwax/commit/9d1e6213f9ffef12aa58674429a305c32e546a2c))
- **ConversationAgent:** 增加文件树侧栏可见性逻辑注释 ([a2ead99](https://github.com/nuwax-ai/nuwax/commit/a2ead99642894b0fd71627f2ca244308c28cef73))
- **ConversationAgent:** 增加是否正在导入项目逻辑注释 ([c6aa33c](https://github.com/nuwax-ai/nuwax/commit/c6aa33ce744212f77a39a7dff5916425870d41a9))
- **ConversationAgent:** 增加智能体电脑关闭逻辑注释 ([a069145](https://github.com/nuwax-ai/nuwax/commit/a069145b3e30d0c89fffca4297979fafc74cda88))
- **ConversationAgent:** 增加清空文件树选中逻辑注释 ([cdbaf7e](https://github.com/nuwax-ai/nuwax/commit/cdbaf7e93dcefbf59d3e5066604e43ca1bbfa21c))
- **ConversationAgent:** 增加版本管控状态的 ref 注释说明 ([08aa8f4](https://github.com/nuwax-ai/nuwax/commit/08aa8f42d608272dbb40f0e852e5be656463f437))
- **ConversationAgent:** 增加版本管控状态的注释说明 ([dc6c6d5](https://github.com/nuwax-ai/nuwax/commit/dc6c6d5c3ec9f72f5f7ccd25b0493ab361c184c4))
- **ConversationAgent:** 增加终端全屏折叠与文件树逻辑注释 ([01f658d](https://github.com/nuwax-ai/nuwax/commit/01f658d7ee9aeda6666eb12845be3e5ec75412b8))
- **ConversationAgent:** 增加终端全屏折叠逻辑注释 ([98e728c](https://github.com/nuwax-ai/nuwax/commit/98e728cc5bf5fb1b340241963f448852d552ee74))
- **ConversationAgent:** 增加终端面板打开状态注释 ([366380d](https://github.com/nuwax-ai/nuwax/commit/366380d243b0f4b1390218b743c27fd655cafedd))
- **ConversationAgent:** 增加重启智能体逻辑注释 ([20f95b0](https://github.com/nuwax-ai/nuwax/commit/20f95b09e866fec58591e98bd0a044dab2a26888))
- **ConversationAgent:** 增加重命名文件逻辑注释 ([820d0d7](https://github.com/nuwax-ai/nuwax/commit/820d0d79ffc0c93696998b723b729e5baef6d82f))
- **ConversationAgent:** 增加项目元数据初始化注释 ([c7d21f8](https://github.com/nuwax-ai/nuwax/commit/c7d21f830508dc564112e54718992786a5aab472))
- **ConversationAgent:** 导入项目后重置顶部标签栏状态 ([44e14da](https://github.com/nuwax-ai/nuwax/commit/44e14da1b7e92393cd8711d77f21a572b06dd678))
- **ConversationAgent:** 更新提交成功后的逻辑说明 ([dcfd58d](https://github.com/nuwax-ai/nuwax/commit/dcfd58df932b5fa3f631faa20a5e635344ff6524))
- **ConversationAgent:** 更新文件树刷新逻辑注释 ([22be720](https://github.com/nuwax-ai/nuwax/commit/22be720e2a762ee7216da841943fb1fd92b2b551))
- **ConversationAgent:** 更新文件树数据 ref 的注释说明 ([d15ae6c](https://github.com/nuwax-ai/nuwax/commit/d15ae6c3e4a48d29e1d2e73eb2e3ee12f55fa849))
- **ConversationAgent:** 更新模型组件配置的注释说明 ([ba40dc1](https://github.com/nuwax-ai/nuwax/commit/ba40dc198162ce65a94a7b74fa2487605bfff8e2))
- **ConversationAgent:** 注释掉不必要的加载状态逻辑 ([3eb69d2](https://github.com/nuwax-ai/nuwax/commit/3eb69d2ff01457105e6072c015e88ee9dcbefce2))
- **ConversationAgent:** 移除未使用的 setIsLoadingConversation 参数 ([565ca30](https://github.com/nuwax-ai/nuwax/commit/565ca305be2c7104f62ba5bfc260ac17cfbca06f))
- **ConversationAgent:** 自动触发消息发送逻辑优化 ([f15d4e2](https://github.com/nuwax-ai/nuwax/commit/f15d4e23861f4eb3e33fd457c3e2e7e4c250b5bc))
- **ConversationAgent:** 预览 Tab agentMode 透传并与主聊隔离 ([9e48c35](https://github.com/nuwax-ai/nuwax/commit/9e48c35e164f4654cf75cf6fac5b950c0901e268))
- **conversation:** checkConversationActive 移除 slice(-5) 预截断 ([f73b15c](https://github.com/nuwax-ai/nuwax/commit/f73b15ce8447cd314d64ccfcfdbe340335725926))
- **conversation:** correct runtime line override order and gaps ([51289f3](https://github.com/nuwax-ai/nuwax/commit/51289f39d5efe18e39a317cb56ffb44b4bffbe2d))
- **conversation:** ERROR 型 SSE 事件降级处理，活跃态清除权归还连接生命周期 ([452094f](https://github.com/nuwax-ai/nuwax/commit/452094f2888fb292c1298b0cdf57bf92a5082394))
- **conversation:** finalizeChatTerminalEvent 只处理 FINAL_RESULT/ERROR 事件类型 ([c3399c9](https://github.com/nuwax-ai/nuwax/commit/c3399c9af01d675dea98586393e0115a49e71682))
- **conversationInfo:** 为处理列表添加类型注解 ([7a2ef8e](https://github.com/nuwax-ai/nuwax/commit/7a2ef8ea097d75198cf13065c88066cf4f03677b))
- **conversationInfo:** 简化文件列表刷新逻辑 ([fb9e574](https://github.com/nuwax-ai/nuwax/commit/fb9e57440a53c6eb786b9ec3163d660cbb5bac9a))
- **conversation:** isSessionStreamBusy 移除工具状态检查（架构解耦） ([1f8c77b](https://github.com/nuwax-ai/nuwax/commit/1f8c77bd98d52490ff2934d339c65b95f6cfb95f))
- **conversation:** OPEN_DESKTOP gate 补齐 agent.sandboxId 层，对齐计划书四级取值链 ([64db47a](https://github.com/nuwax-ai/nuwax/commit/64db47a9d6c6c43fc744157e71fb168b831b82ea))
- **conversation:** polish V2 renderer controls and dark theme ([8cbf7a8](https://github.com/nuwax-ai/nuwax/commit/8cbf7a87b93213a44423476a438af0ded3d9d2f8))
- **conversation:** roundTerminalAck 乐观终态——SSE 终态事件直接驱动会话框终止态 ([c283b96](https://github.com/nuwax-ai/nuwax/commit/c283b9653918db505efd3d35265f3d740b9bd2c9)), closes [#3](https://github.com/nuwax-ai/nuwax/issues/3)
- **conversation:** sub 流式占位收尾，修复仅 sub 连接场景下详情轮询永堵 ([ddab02f](https://github.com/nuwax-ai/nuwax/commit/ddab02fcb36ef17d73792d4d86a4cab49a3db2d0))
- **conversation:** sub 流式占位收尾，修复仅 sub 连接场景下详情轮询永堵 ([12a161b](https://github.com/nuwax-ai/nuwax/commit/12a161bd450c5458817da6c453bc6dfd1d4bea85))
- **conversation:** sub 网络错误按 chat onError 同款收敛，统一断网页面表现 ([a6e8756](https://github.com/nuwax-ai/nuwax/commit/a6e8756c56d09cde2f210c70a32b5233fab321bb))
- **conversation:** sub 网络错误按 chat onError 同款收敛，统一断网页面表现 ([cf5adca](https://github.com/nuwax-ai/nuwax/commit/cf5adca1a8575d3a95541a1c6ed716c28739e535))
- **conversation:** sweep 的 processing 残留清理从仅末条扩展到近 5 条 ([8a7156e](https://github.com/nuwax-ai/nuwax/commit/8a7156e7c83d32a94faff612ec487ca2a218f25d))
- **conversation:** sync terminal convergence system from feat branch ([982bdd3](https://github.com/nuwax-ai/nuwax/commit/982bdd34c8ef5a2388855081aebdcce135958132))
- **conversationTaskStatusSync:** 增强任务状态合并逻辑 ([aac3d19](https://github.com/nuwax-ai/nuwax/commit/aac3d1939e9e2aaf7b72bf34857a488239c68bdf))
- **conversation:** unlock input after failed final result ([706bb8b](https://github.com/nuwax-ai/nuwax/commit/706bb8be0752b7f75e78600f76180ee9a165c223))
- **conversation:** V2 最终回答操作栏对 home 入口显示并补轮级耗时 ([3e692f7](https://github.com/nuwax-ai/nuwax/commit/3e692f7d2a4bcff42ad74963112bb87f1bb5786d))
- **conversation:** V2 渲染验收返工——回答去重/角色过滤/终态合并/无障碍 ([e99af1a](https://github.com/nuwax-ai/nuwax/commit/e99af1a19cdd97b9ca2513adadb8cfa100984bde))
- **conversation:** V2 评审加固——chunk 失败回退/终态参考消息/边界修正 ([58c09b2](https://github.com/nuwax-ai/nuwax/commit/58c09b2cff5d04990da57d7821efffb7b4d7aa6e))
- **conversation:** 优化 SSE 关闭时会话流式状态释放逻辑 ([46478bf](https://github.com/nuwax-ai/nuwax/commit/46478bfa6b78356b02d18b6d2afbe69ca657827f))
- **conversation:** 优化高频连续发送时的连接管理逻辑 ([4409797](https://github.com/nuwax-ai/nuwax/commit/4409797974da2edcb6ea12e51c05e0e9f42bba02))
- **conversation:** 会话出错时落终态 taskStatus，避免固化执行中 ([b8ec155](https://github.com/nuwax-ai/nuwax/commit/b8ec155a31ae03e1ca549b0eb9f93fac119910fd))
- **conversation:** 会话结束后自动收起工作轨迹 ([ce87ce9](https://github.com/nuwax-ai/nuwax/commit/ce87ce9e215ebf5f85d341251d772f4515417295))
- **conversation:** 修复会话结束时消息闪烁及调试面板加载状态问题 ([08c5979](https://github.com/nuwax-ai/nuwax/commit/08c59792fc1764158c2b6b27fefc1aec461a5f4b))
- **conversation:** 修复快照同步时消息节点重挂导致的置顶与闪烁问题 ([e56e7ed](https://github.com/nuwax-ai/nuwax/commit/e56e7ed7f5d07e62884cefa5e97a05284a191950))
- **conversation:** 修复流式消息异常覆盖与渲染期状态更新 ([c46f66c](https://github.com/nuwax-ai/nuwax/commit/c46f66c0b1e491ade4ec40abfdf3ab41d34244c4))
- **conversation:** 完善 V2 轨迹交互与消息时间 ([7deeec3](https://github.com/nuwax-ai/nuwax/commit/7deeec38990df04f39fb09f67b8262da4dbe234b))
- **conversation:** 恢复 ERROR 与 FINAL_RESULT 同权完整清算，撤回降级方案 ([cb91f44](https://github.com/nuwax-ai/nuwax/commit/cb91f4418cf560a49fc2a00cd49560457905e2d5))
- **conversation:** 智能体电脑桌面仅云电脑会话可打开 ([5706604](https://github.com/nuwax-ai/nuwax/commit/5706604efb9761b657b7be96c7d6c3ddf9e83f4d))
- **conversation:** 状态机日志补 model 标识、节流与末条现场 ([fe0fe08](https://github.com/nuwax-ai/nuwax/commit/fe0fe08b91179301f31ce9791f78ac44db728ff5))
- **conversation:** 状态机日志补 model 标识、节流与末条现场 ([3813740](https://github.com/nuwax-ai/nuwax/commit/381374062b31e1846a6070156f3298fb1feca150))
- **conversation:** 终态守卫丢弃迟到 MESSAGE 分片，防已终态消息被回退 ([f0d7068](https://github.com/nuwax-ai/nuwax/commit/f0d7068cf06fb6e95ff1fd764448f43cda6a52da))
- **conversation:** 终态投影基于 reconcile 后 text，保留补投 OpenUI 块 ([69eb89b](https://github.com/nuwax-ai/nuwax/commit/69eb89b9d54fa2de7b18a383039aee4d5fbeb726))
- **conversation:** 终态经任一路径到达统一收敛会话状态机 ([479a2a4](https://github.com/nuwax-ai/nuwax/commit/479a2a4920ac8e1cfc5a1382baa83b259c602dd2))
- **conversation:** 终态经任一路径到达统一收敛会话状态机 ([da11719](https://github.com/nuwax-ai/nuwax/commit/da11719f1aa33eeaab0f6bc77c596270915dfd19))
- **conversation:** 过程说明改为穿插直出——留在信息流原位，替换折叠行 ([230dc2f](https://github.com/nuwax-ai/nuwax/commit/230dc2f38a0727a2972552e7aabe0f55eda3833c))
- **conversation:** 重做示例页 OpenUI 演示源码——真实组件形态 ([6fe4878](https://github.com/nuwax-ai/nuwax/commit/6fe4878907fe0a09c6b5b2f2d85561e1bd4233d4))
- **create-project:** 禁止新建项目连续发送并置灰@图标 ([576efb7](https://github.com/nuwax-ai/nuwax/commit/576efb7f8adc575cd58714d53ac1cc660231e02a))
- **DynamicTabs:** 优化经典滚动条样式及相关逻辑 ([eb6c18a](https://github.com/nuwax-ai/nuwax/commit/eb6c18a6c63e20d7891cc73b2292225bd6733e5a))
- **edgeSync:** 优化边删除逻辑，支持无 port 情况下的删除 ([2aedbef](https://github.com/nuwax-ai/nuwax/commit/2aedbefb0768b039ba3a75e6eaa99a1a28bb030b))
- **EditAgent:** AgentFlow 场景隐藏工作流与数据表并抽取编排策略 ([f0cf241](https://github.com/nuwax-ai/nuwax/commit/f0cf241dc3849f75965a42546554bf16881e1eb8))
- **EditAgent:** 增加工具配置块 DOM 引用 ([8187c21](https://github.com/nuwax-ai/nuwax/commit/8187c219e36488ffdeadb4bf6cd21d02b979a598))
- **EditAgent:** 增加技能配置块 DOM 引用 ([d22808d](https://github.com/nuwax-ai/nuwax/commit/d22808d3c9d28149111fc7a23eb21b38f35f5c6d))
- **EditAgent:** 增加滚动目标元素的计算逻辑 ([47d601d](https://github.com/nuwax-ai/nuwax/commit/47d601dafc36e3fafe47654496f72a6b66b4a5de))
- **EditAgent:** 增加组员配置块 DOM 引用 ([15f11ff](https://github.com/nuwax-ai/nuwax/commit/15f11ffba1c45d7a30ae8d0e6a046e831fac8656))
- **examples:** 修复 MCP Ask 重复询问 Demo 类型定义 ([e29e822](https://github.com/nuwax-ai/nuwax/commit/e29e8228cbb233f5ee34c44f7da01c27280ee94d))
- **file-preview:** isChat 认 mode=preview，会话内 openui 可提交 ([7ed0213](https://github.com/nuwax-ai/nuwax/commit/7ed0213a179eab3ee45b4c72998e1d6d7fc6641f))
- **file-preview:** 脚本资源增加版本参数避免缓存不生效 ([09ccb96](https://github.com/nuwax-ai/nuwax/commit/09ccb967ec47eeb43a722e93b8d765176f3448e7))
- **file-preview:** 表格卡审查修复——i18n 标签/margin 重置/文档措辞 ([e8687dd](https://github.com/nuwax-ai/nuwax/commit/e8687dd7042380e7ae476446a73bfcb32e3a324d))
- **FileTreePreviewPanel:** 移除不必要的导入项目触发标志并优化文件选择逻辑 ([f0230f5](https://github.com/nuwax-ai/nuwax/commit/f0230f5b6ce6b9e6f3bfbd9a62768932e1c2f877))
- **FileTree:** 新增清空文件树选中态功能 ([99daf69](https://github.com/nuwax-ai/nuwax/commit/99daf69556c78739ab5d247cfe8254249ebd767f))
- **GlobalModelManage:** 修改数据列名称为“modified” ([a90aa53](https://github.com/nuwax-ai/nuwax/commit/a90aa5302e144aade2bfeed83ccea8f5d503942a))
- **home:** 优化首页输入框展示行数和文本行高 ([b443d5b](https://github.com/nuwax-ai/nuwax/commit/b443d5b8e3b7052547b1090aa64c5ede16233835))
- **home:** 侧栏 tab 恢复原组件,首页分类 Segmented 居中加大 ([1a411c3](https://github.com/nuwax-ai/nuwax/commit/1a411c3177f8ef468a8418bf8f7631db22da1ae9))
- **home:** 侧栏与首页分类切换统一 Segmented,分类数据驱动化 ([db2fd97](https://github.com/nuwax-ai/nuwax/commit/db2fd971e5ed05c946968b56101c7570ea7496de))
- **home:** 修复主页输入框重复回车导致重复创建项目或会话的问题 ([9501623](https://github.com/nuwax-ai/nuwax/commit/95016235a4b31355e8cd40a9b008fabd68f9d317))
- **home:** 修复分类标签栏在 Safari 下溢出及滚动动态选中 Tab 失效的问题 ([e9d0273](https://github.com/nuwax-ai/nuwax/commit/e9d0273cc84b3b137d1571169c73f74abf34b1d0))
- **home:** 修复分类标签栏溢出、滚动同步偏差及提及输入特殊符号异常弹出的问题 ([09e02d7](https://github.com/nuwax-ai/nuwax/commit/09e02d7089b2be4ab864e9d446e73fe1a8b5b4e8))
- **home:** 修复可拖拽分类标签页组件的布局溢出与拖拽层级问题 ([6d87d2a](https://github.com/nuwax-ai/nuwax/commit/6d87d2ae8fe71f621a5bc0244e046aca03c1e71a))
- **home:** 修复首页滚动到底部后再滑到顶部时分类固钉保留在顶部的缺陷 ([24c6423](https://github.com/nuwax-ai/nuwax/commit/24c642328eeda671328c889120ff443143fb6747))
- **home:** 修复默认智能体为任务型智能体时未根据配置展示选择电脑组件的问题 ([4f0dfe9](https://github.com/nuwax-ai/nuwax/commit/4f0dfe90813769232c5f123754fd2da6628e946c))
- **home:** 分类 Segmented 选中值在首挂前确定,消除加载时滑块滑动 ([1373ae6](https://github.com/nuwax-ai/nuwax/commit/1373ae65720636568c2dbf7008b5d547a0d4ea25))
- **home:** 执行中会话列表下拉框改为右侧显示 ([c32de03](https://github.com/nuwax-ai/nuwax/commit/c32de0330c238af447e71008f107a5918c6598e4))
- **home:** 调整首页对话框单行高度计算系数至 32.2px ([5fee15d](https://github.com/nuwax-ai/nuwax/commit/5fee15dbf04a14e0b37374dcda47e2e109f405cc))
- **home:** 项目行「+」常驻显示,语义为新建会话 ([d68cab1](https://github.com/nuwax-ai/nuwax/commit/d68cab159ce4e70a915cf7cffcdcb0a6ab57753b))
- **i18n:** add 14 missing AgentFlowNode translation keys to all locales ([6007d45](https://github.com/nuwax-ai/nuwax/commit/6007d45ea858fad07d5838ae20a6ed357bbb4a97))
- **i18n:** 修复 zh-TW/zh-HK 简繁残留 ([6ad1008](https://github.com/nuwax-ai/nuwax/commit/6ad10084bfa19d8459c618c6d3e496d0898c1685))
- **i18n:** 更新提交信息的翻译文本 ([4f6f343](https://github.com/nuwax-ai/nuwax/commit/4f6f343dedca7503fb98faefa90e5f44a70a1f62))
- **i18n:** 移除多余的技能翻译项 ([5fb63f9](https://github.com/nuwax-ai/nuwax/commit/5fb63f9dc8d3b5aaeea3bfe817440f5ee67937fc))
- **intervention-demo:** show ACP buttons, fix list alignment, add wizard form ([c5b9c5f](https://github.com/nuwax-ai/nuwax/commit/c5b9c5f454c564c516419423d4c1d681d0feed66))
- **layouts:** 优化首页侧边栏菜单切换及列表滚动条重置 ([b07f301](https://github.com/nuwax-ai/nuwax/commit/b07f301687feff3eacce1470f0f3259ec8490cb5))
- **layouts:** 修复历史会话列表滑动报错与重复 key 问题 ([853f680](https://github.com/nuwax-ai/nuwax/commit/853f68023bbbc3d8828472ca2c296312729e736a))
- **layouts:** 注释掉移动端全宽样式以修复布局 bug ([e168ba6](https://github.com/nuwax-ai/nuwax/commit/e168ba6e9758db479eae74149107338fc05eeb31))
- **layout:** 二级菜单列内容不可见——补 second-column 滚动区尺寸链 ([de6f4cd](https://github.com/nuwax-ai/nuwax/commit/de6f4cd6fdcadd2de6fc9b1b333a8308fe79a7f2))
- **layout:** 侧栏顶栏对齐原型——压缩顶栏高度与 logo 尺寸、统一行样式 ([ad77b2a](https://github.com/nuwax-ai/nuwax/commit/ad77b2a027359bb0dd9e7e2ff7cb637e481843b0))
- **layout:** 修复悬浮菜单主页的显示和滚动加载异常 ([459aab7](https://github.com/nuwax-ai/nuwax/commit/459aab7c10e9285b0ca009232344f52f6d6f8455))
- **layout:** 修正智能体菜单跳转的会话 ID 参数 ([b502726](https://github.com/nuwax-ai/nuwax/commit/b5027265b8dcb1b26006a1ed1fdc75c40778d388))
- **layout:** 命令面板工作空间入口按菜单权限门禁 + 移动端侧栏折叠防护 ([4d8ddb0](https://github.com/nuwax-ai/nuwax/commit/4d8ddb0f5212e7675371341382258e3e4dd81f01)), closes [#16](https://github.com/nuwax-ai/nuwax/issues/16)
- **layout:** 底部栏「更多」按钮后端未配图标导致渲染为空——按原型以 ... 呈现 ([2469b3b](https://github.com/nuwax-ai/nuwax/commit/2469b3bceb2fab1268e43593ec3859bb16e8920d))
- **layout:** 折叠后无法展开——左缘悬浮展开按钮替代被收起的顶栏入口 ([a2be836](https://github.com/nuwax-ai/nuwax/commit/a2be83688fee262ce4db82d91cc89b34e1aa5e1b))
- **layout:** 经典布局恢复搜索框与新建会话入口 ([eb036ea](https://github.com/nuwax-ai/nuwax/commit/eb036ea5d32a40e3dcd858286e4a0ec603bd1dff))
- **lint:** 修复合并 pc-client-bridge 带入的 SpaceKnowledge 系存量错误 ([a63b77c](https://github.com/nuwax-ai/nuwax/commit/a63b77c2a5f5cc9e92cf71e8de1f5e076790ab30))
- **locales:** 修复国际化文本中的标点错误 ([895bd7c](https://github.com/nuwax-ai/nuwax/commit/895bd7c13085ed862982a54147df9eee3975ffd1))
- **logger:** 会话关键日志打包后仍输出 ([22a769c](https://github.com/nuwax-ai/nuwax/commit/22a769ca2a3cffd9c3111e0817afb8fac5f1b934))
- **login:** 修复手动关闭阿里云验证码后无法再次唤起的问题 ([6dab17b](https://github.com/nuwax-ai/nuwax/commit/6dab17bdf358d3bab6fef41929478c29faa876d1))
- **login:** 修复阿里云验证码登录成功回调触发的空引用报错及类型问题 ([6346d0a](https://github.com/nuwax-ai/nuwax/commit/6346d0a7be6c466f3cb90e1feeb1ddc0d48948c6))
- **login:** 验证码登录跳转延迟到返回结果之后——对齐密码登录路径 ([b1eb275](https://github.com/nuwax-ai/nuwax/commit/b1eb2756e8fc5efe98e631dc94f0782ebfec6d7f))
- **login:** 验证码登录跳转延迟到返回结果之后——对齐密码登录路径 ([7920659](https://github.com/nuwax-ai/nuwax/commit/79206595ac4915eff386790369fec216c655f457))
- **MarkdownRenderer:** 优化 LaTeX 公式识别逻辑，避免误判 Windows 路径和转义字符 ([8d45a6a](https://github.com/nuwax-ai/nuwax/commit/8d45a6aa241fbae1fb00dea8eab4ae3555f33be5))
- **MarkdownRenderer:** 优化公式识别逻辑以支持更多函数格式 ([333e594](https://github.com/nuwax-ai/nuwax/commit/333e594ef566b3b5d610252774e7d40d2d4b8029))
- **markdownrenderer:** 修复 Markdown 裸链接边界识别及参考文献尾标误匹配问题 ([eeced39](https://github.com/nuwax-ai/nuwax/commit/eeced390d02c75af146a4589845930e5e4613666))
- **markdownrenderer:** 修复裸 URL 误解析中日韩正文的问题 ([84e7933](https://github.com/nuwax-ai/nuwax/commit/84e793329705fc99b37fe05a4d9372ecb5235af9))
- **markdown:** TaskResult 单元素 children 不再抛 filter 异常 ([2bf5a19](https://github.com/nuwax-ai/nuwax/commit/2bf5a19adf43ff0896ab32daa13c9339b3d65587))
- **markdown:** 优化 LaTeX 识别逻辑，排除 snake_case 标识符误判 ([a0e9bb9](https://github.com/nuwax-ai/nuwax/commit/a0e9bb96ec6ef236266317ca72d6e5bb6b0ea055))
- **markdown:** 修复 MarkdownCMD 样式渲染降级及 OpenUI 子树样式重置 ([72e8671](https://github.com/nuwax-ai/nuwax/commit/72e8671f63f5a737ad8c5a64a7935d8f03d5a95b))
- **MCP Ask:** resume 附件走 chat attachments 并恢复普通消息渲染 ([f4f764e](https://github.com/nuwax-ai/nuwax/commit/f4f764e1294d9ed6e2b45f3c2338755148158962))
- **mcp-ask:** subTitle 副标题补展开/收起兜底并修正 ellipsis 配置(P4) ([7d2e13a](https://github.com/nuwax-ai/nuwax/commit/7d2e13af8e9db3ee8b3735286ad8f76afa533df8))
- **MentionEditor:** 优化序列化逻辑，保留换行与块级节点处理 ([eaa45c0](https://github.com/nuwax-ai/nuwax/commit/eaa45c016cd8984ae2b907e8049f309869ed0ef4))
- **MentionEditor:** 优化文本序列化逻辑以处理多行内容 ([f559646](https://github.com/nuwax-ai/nuwax/commit/f559646e53754a4e3435a3639f3479f779d0039c))
- **merchant-info:** 修复保存草稿逻辑并实现上传后自动保存 ([9247841](https://github.com/nuwax-ai/nuwax/commit/924784127d7e40f18fa9d7446f3838529819032a))
- **message-queue:** 优化消息队列逻辑，增加流式消费控制与定时器管理 ([412e2cf](https://github.com/nuwax-ai/nuwax/commit/412e2cf561d5448a2394168f3debb94cfd024469))
- **MessageQueue:** suggest 加载期间阻塞队列消费 ([16847ff](https://github.com/nuwax-ai/nuwax/commit/16847ffafc5325dce5bc3e04e5020c0000f875d6))
- **MessageQueue:** 优化操作按钮 Tooltip 显示延迟 ([5acc30f](https://github.com/nuwax-ai/nuwax/commit/5acc30f23d2c8df19b744c898146e9c9c9e67228))
- **MessageQueue:** 修复队列消息连发，强制逐条等待流式结束 ([e00953f](https://github.com/nuwax-ai/nuwax/commit/e00953f7cec3f9da24d34c0c17142596ecddaae8))
- **MessageQueue:** 修正 paddingSm 变量名大小写 ([126edec](https://github.com/nuwax-ai/nuwax/commit/126edece81c630775a0d107833a627f8702ae4aa))
- **MessageQueue:** 合并 taskStatus 活跃判定 + 样式对齐 intervention ([b42b7fb](https://github.com/nuwax-ai/nuwax/commit/b42b7fb2ebe8758c6d09c8d3cd6481fdbb694554))
- **MessageQueue:** 恢复稳定消费逻辑并安全加回持久化与参数快照 ([963c629](https://github.com/nuwax-ai/nuwax/commit/963c62938527a67522c5d75ad8a4a134ba11513f))
- **models:** 优化会话结束时会话状态接口的重复请求 ([540dbec](https://github.com/nuwax-ai/nuwax/commit/540dbec8b895dd597c62491b37a1e0f6527c5ad7))
- **models:** 修复 conversationInfo 中的 TypeScript 类型报错 ([2656da5](https://github.com/nuwax-ai/nuwax/commit/2656da5ac7fafabeae3ba8f6d97eff3166751299))
- **models:** 修复主动停止会话后工具调用仍处于加载中的问题 ([bfbb077](https://github.com/nuwax-ai/nuwax/commit/bfbb077d9c40512755c7e3bf3cfdbf3c6932a73a))
- **models:** 修复会话结束时后端快照差异导致的页面闪烁 ([a404f50](https://github.com/nuwax-ai/nuwax/commit/a404f501557b50737e790ac04c70e7e63171df45))
- **models:** 修复多轮流式思考状态与中止时的思考完成标记 ([74582a0](https://github.com/nuwax-ai/nuwax/commit/74582a06108cbfd1f28b1e88b33c3af4e39421de))
- **models:** 修复流式会话中思考状态无法正常完结的问题 ([d39719d](https://github.com/nuwax-ai/nuwax/commit/d39719d70467186906c3b43db3fff0c853f81a25))
- **models:** 修复轮询更新时无 ID 合成开场白消息重复累加问题 ([996d3b2](https://github.com/nuwax-ai/nuwax/commit/996d3b261875b99cbfc8ad413c185b34ef63d63a))
- **models:** 延迟任务结束后的文件树刷新和文件选中 ([f4d4674](https://github.com/nuwax-ai/nuwax/commit/f4d46746b818d897fd19ab824c916e51cbee7b09))
- **OpenIframePage:** 恢复 origin 检查逻辑 ([149a646](https://github.com/nuwax-ai/nuwax/commit/149a646f63fd4a0f800bff6d8076a4bc4fa33ac4))
- **OpenIframePage:** 恢复 origin 检查逻辑注释 ([edbb5d4](https://github.com/nuwax-ai/nuwax/commit/edbb5d45b76f3d56cfdc8d5ebad01709b50d3768))
- **OpenIframePage:** 注释掉 origin 检查逻辑 ([4711183](https://github.com/nuwax-ai/nuwax/commit/471118375c4a759147b42c4f1604b0df75ab1c6e))
- **openui:** App webview 经 uni-webview.js 自适应高度，升级 runtime 0.3.6 ([108eafa](https://github.com/nuwax-ai/nuwax/commit/108eafa31b65fef00259dc9d35fccf5a3c93cda4))
- **openui:** Card 样式补丁 + sync runtime 0.3.12，对齐 inline 与预览 ([69255a5](https://github.com/nuwax-ai/nuwax/commit/69255a5142300ed458945d6ce93eb6cb91312799))
- **openui:** inline 渲染不展示左侧强调边框(.markdown-custom-process::before) ([bb2b399](https://github.com/nuwax-ai/nuwax/commit/bb2b39967c04058f737d2e245c43ab5c1c93baf0))
- **openui:** inline 渲染不展示左侧强调边框(.markdown-custom-process::before) ([4d71afd](https://github.com/nuwax-ai/nuwax/commit/4d71afd5a175428a1a31687cac4d15ac53cfde4c))
- **openui:** polyfill randomUUID in webviews ([1760eee](https://github.com/nuwax-ai/nuwax/commit/1760eeede0ffb653b4a3b52e914587b50b185b69))
- **openui:** RENDER_UI 渲染修正 ([60585f6](https://github.com/nuwax-ai/nuwax/commit/60585f63abe7a84c0d68efc8cc6ee2db12b3a9d0))
- **openui:** resume 消息不再拼入 actionId 标记 ([30bf916](https://github.com/nuwax-ai/nuwax/commit/30bf91687bc11f5dff0c0610916f04f3e7ad1096))
- **openui:** runtime 切换不再重载 + 移动端布局适配 ([9a49afd](https://github.com/nuwax-ai/nuwax/commit/9a49afd22b6e3c5667ba1a57c9bb22efc72d1bc4))
- **OpenUI:** sidecar 预览复用工具返回内容，不再请求 .openui.json ([79787d4](https://github.com/nuwax-ai/nuwax/commit/79787d4d97d627ddb0eae65145213f3a66663549))
- **openui:** unify file preview runtime loading ([e4b6a1f](https://github.com/nuwax-ai/nuwax/commit/e4b6a1faaf04eec42505437a3f2debf0308276b0))
- **OpenUI:** 优化表单回传展示并避免空壳工具条 ([672d93b](https://github.com/nuwax-ai/nuwax/commit/672d93b617910daa6ab5d072d7690e0499574fdd))
- **openui:** 保留 RENDER_UI(type=Event) 标签到渲染层 ([5637859](https://github.com/nuwax-ai/nuwax/commit/5637859ce62874fc6598579646833d5388e4733a))
- **OpenUI:** 修复会话 ID 透传并支持内联 Renderer 渲染 ([fa8a674](https://github.com/nuwax-ai/nuwax/commit/fa8a674568cb23c95baf7eeba0d0f1042b462ce2))
- **openui:** 修复消息传递中的数据包装问题 ([896d1d6](https://github.com/nuwax-ai/nuwax/commit/896d1d6ddc48008c65f6d29ab00a17bfa340f944))
- **openui:** 修复预览 digest 误判与裸文件 URL 回退 ([f66976b](https://github.com/nuwax-ai/nuwax/commit/f66976b977df9bfe8bbc796a67ba2c7e5bde1990))
- **OpenUI:** 加宽 Runtime 握手超时阈值至 60s，避免后台/节流误判失败 ([ca5871c](https://github.com/nuwax-ai/nuwax/commit/ca5871cf9c9b67bbb767bdb59ded2198950165c6))
- **openui:** 同步 runtime 0.3.11 并接入表单默认值同步 ([9a71fe7](https://github.com/nuwax-ai/nuwax/commit/9a71fe7a363c1abe26a61db9920957b8ae5b7927))
- **openui:** 处理 WebView 消息源问题并优化运行时加载 ([a76a4a6](https://github.com/nuwax-ai/nuwax/commit/a76a4a68e3733a27037b93f33588897b9f0a3771))
- **openui:** 完善文件预览对裸 .openui 的嗅探与契约错误提示 ([264b713](https://github.com/nuwax-ai/nuwax/commit/264b713c964187eba99801cd5aae689c758fe330))
- **openui:** 将 runtime 迁至 static 并修复 iframe CORS 缓存问题 ([a5ce0df](https://github.com/nuwax-ai/nuwax/commit/a5ce0dfe9f987b8fdd7d11869cd26c4728caa569))
- **openui:** 恢复被宿主 reset 误伤的 inline 列表样式 + 宿主样式示例页 ([713f480](https://github.com/nuwax-ai/nuwax/commit/713f48086add61101d2e77b7db2594c4ec39733a))
- **openui:** 文件树预览 .openui.json 复用内存内容，避免重复拉取/loading 卡死 ([cd888c4](https://github.com/nuwax-ai/nuwax/commit/cd888c4e9e4a15652ebd183329155810cf330286))
- **openui:** 更新 OpenUI 文档，增加能力象限与执行闭环说明 ([bde1fe2](https://github.com/nuwax-ai/nuwax/commit/bde1fe2fd761201ecb026ca243318ffa0e96fa0a))
- **openui:** 更新 OpenUI 文档与工具边界说明 ([8c09f63](https://github.com/nuwax-ai/nuwax/commit/8c09f63f3ea3e7c1057c7ca20d07a2f10d17c22b))
- **openui:** 渲染工具(type=Event 的 RENDER_UI 历史项)恢复渲染 ([d9736f8](https://github.com/nuwax-ai/nuwax/commit/d9736f86e58c763548114346a1ba2076083b1101))
- **openui:** 跨引擎识别 sidecar 并接入 openui-mcp 0.3.7 契约判断 ([0e71670](https://github.com/nuwax-ai/nuwax/commit/0e716702d28ae6dff66ec8b4999aad9d4bb21fa1))
- **openui:** 隔离 inline Renderer 与 ds-markdown 样式污染 ([a8d9a45](https://github.com/nuwax-ai/nuwax/commit/a8d9a451802712893974e45f3acf7f251f0330ba))
- **opeui:** 优化 OpenUI 运行时入口，统一加载逻辑并删除冗余文件 ([2e6d705](https://github.com/nuwax-ai/nuwax/commit/2e6d705fac34518ae4faf5cd83c52a4b4b23c6c6))
- **package:** 更新 @nuwax-ai/openui-mcp 依赖版本至 0.3.8 ([3afff16](https://github.com/nuwax-ai/nuwax/commit/3afff168f450baa4b0d85f6b8b345508f20297f9))
- **package:** 更新依赖版本以修复潜在兼容性问题 ([419b87f](https://github.com/nuwax-ai/nuwax/commit/419b87ff75d97ac4673c29e6ccdec4e258e6be5f))
- **package:** 更新依赖版本以提高稳定性 ([7dd50b7](https://github.com/nuwax-ai/nuwax/commit/7dd50b7d3049102fc233cbdbb6777c4267053716))
- page-container 顶部避让改用 margin（padding 会压缩列表页可视高度） ([563b567](https://github.com/nuwax-ai/nuwax/commit/563b567c7143d4cf4e763886553346d31f67fe1f))
- **pages:** 简化并修复智能体私有沙盒只读模式判定逻辑 ([b8a0501](https://github.com/nuwax-ai/nuwax/commit/b8a05014d783584526d644b906f1f8c4e73ce133))
- **permission:** 修复历史会话页面受订阅与积分功能开关限制的问题 ([17b64a1](https://github.com/nuwax-ai/nuwax/commit/17b64a1f46a048c2d5ca344aa7f3db98fc9728b9))
- **PersonalSpaceContent:** 修复搜索框样式与增加注释 ([9e9f3fe](https://github.com/nuwax-ai/nuwax/commit/9e9f3fe76b7ac6fcd879ba8f98517a2ade64069f))
- **plugin:** 修复插件云工具页面返回按钮跳转异常问题 ([a7e22a4](https://github.com/nuwax-ai/nuwax/commit/a7e22a47c74de91262ba60d6ec4f603bcbc8ef7c))
- **plugin:** 修复插件新建首条消息 agentMode 未透传问题 ([74e05f3](https://github.com/nuwax-ai/nuwax/commit/74e05f3bffb15bb73e1bc307bcb807dc0877c784))
- **PreviewAndDebug:** 优化有效沙箱 ID 的计算逻辑 ([40eda43](https://github.com/nuwax-ai/nuwax/commit/40eda436f4415b3b71ad848ab390fd90a623925a))
- **preview:** 保留 Markdown 预览页面标题的文件后缀名 ([0558312](https://github.com/nuwax-ai/nuwax/commit/0558312626c5795b9232ccab8e98d4f3ddc35aed))
- **project:** 修复新建项目跳转后未更新名称等元数据的问题 ([5546a8a](https://github.com/nuwax-ai/nuwax/commit/5546a8a4a409d0b2226a22db228966d38f6c629d))
- restore development BASE_URL to shared test environment ([fff71b7](https://github.com/nuwax-ai/nuwax/commit/fff71b7041ae1a73202c12cea97ad376670db1db))
- **sandbox:** 统一云端电脑的默认标识为 -1 并支持创建会话时透传 ([4c1ae72](https://github.com/nuwax-ai/nuwax/commit/4c1ae7221f97aebf445e88a651cc7e4c4379273a))
- **shell/chat:** 全屏预览逃逸避让层补口 + 流式快照保留内联思考 ([bd15400](https://github.com/nuwax-ai/nuwax/commit/bd1540040a9b2210f7cbd2e40713b014b2afcb11))
- **shell:** immersiveShellAvoid 改 padding 单盒方案 + TOOLBAR 48→44 ([b21ecec](https://github.com/nuwax-ai/nuwax/commit/b21ecec27b77ba95c19f0f29a84485a83c5d5ea5))
- **shell:** 同窗避让收口——style 子节点崩溃白屏修复 + 顶部退让统一由外层承担 ([9b81d46](https://github.com/nuwax-ai/nuwax/commit/9b81d46e91b31cd9f178e282e18af36bd78ab704))
- **shell:** 独立窗口标记 sessionStorage 粘滞（SPA 路由丢 query 不再翻转避让） ([0a6d896](https://github.com/nuwax-ai/nuwax/commit/0a6d896c5a5f982cc889e358ce567eb1941085b5))
- **SkillDetails:** 优化技能信息查询逻辑 ([d25caf9](https://github.com/nuwax-ai/nuwax/commit/d25caf98440d140028459479433e3724da35bdee))
- **skill:** 优化技能开发页面的参数设计与路由，改为通过会话 ID 异步获取智能体 ID ([1a324a4](https://github.com/nuwax-ai/nuwax/commit/1a324a4480e6ecbbf26cde757c32e18c7a93cdf0))
- **skill:** 完善技能详情页调试会话功能与电脑回显 ([a42810d](https://github.com/nuwax-ai/nuwax/commit/a42810df9c14b16edf05912f2a3daf4a51c7f12e))
- **skill:** 调整技能详情页返回按钮的跳转路由 ([22681a5](https://github.com/nuwax-ai/nuwax/commit/22681a564e8a4b5dd70314fcd9a96bc5950c6505))
- smooth markdown streaming render ([e91ee7c](https://github.com/nuwax-ai/nuwax/commit/e91ee7c7d3426420c63f17077ea429c7a47dcb08))
- **SourceControlPanel:** 移除放弃更改失败的错误提示逻辑 ([3067068](https://github.com/nuwax-ai/nuwax/commit/3067068cfd85e1c888a54993dfd08bf252e047a1))
- **SpaceNewProject:** 统一使用 userInfo model 获取用户昵称 ([76e3e73](https://github.com/nuwax-ai/nuwax/commit/76e3e73e427386cabc583b3ac53e917859e4761d))
- **SpacePluginCloudTool:** 优化样式和版本历史组件布局 ([361fd59](https://github.com/nuwax-ai/nuwax/commit/361fd594885c20dcfcc9c1e26b57044b2ae60c51))
- **space:** 修复在主页创建技能开发项目时 agentId 丢失的问题 ([8da6977](https://github.com/nuwax-ai/nuwax/commit/8da69771fc6078a55fcdb2cd39048bb0a3ab9acb))
- stabilize resumed chat sessions ([4b534e3](https://github.com/nuwax-ai/nuwax/commit/4b534e3c322b07ac296882b82acad89bace73ff9))
- **system:** adjust connector table virtual height ([f48fd42](https://github.com/nuwax-ai/nuwax/commit/f48fd4214d6d3dfea9c6186bced65eba69b99ecf))
- **Terminal:** 更新重连配置类型定义 ([dfd7f53](https://github.com/nuwax-ai/nuwax/commit/dfd7f5326f6f543ab07c2af47bf3321f1d2c26ff))
- **tests:** 优化会话信息快照合并测试用例 ([3e2cea3](https://github.com/nuwax-ai/nuwax/commit/3e2cea3e503e8e92d27d1db910d23e4b32335ef2))
- **theme:** NavigationStylePanel 词条改为渲染期取词 ([418fd51](https://github.com/nuwax-ai/nuwax/commit/418fd510506c69f43655a41ed10d4f73392a3682))
- **theme:** 女娲主题侧栏/整体灰底对齐原型 #F2F2F2 ([d43fd18](https://github.com/nuwax-ai/nuwax/commit/d43fd185f4282bde0aa6da8c3ae33f85b45010bb)), closes [#F2F2F2](https://github.com/nuwax-ai/nuwax/issues/F2F2F2) [#F2F2F2](https://github.com/nuwax-ai/nuwax/issues/F2F2F2) [#F3F4F6](https://github.com/nuwax-ai/nuwax/issues/F3F4F6)
- **theme:** 灰白 solid 外观改挂背景维度，修复「切换纯色背景不生效」 ([b3f062f](https://github.com/nuwax-ai/nuwax/commit/b3f062f7e4be24e648122b9b34fcaecef04017da))
- **theme:** 灰白纯色外观放开到浏览器（双端一致），宿主动作保持桌面专属 ([3ae4747](https://github.com/nuwax-ai/nuwax/commit/3ae47478704609d757c7b6678579ceaddec97f9c))
- **theme:** 网关形态专属主题不命中——租户默认回声不算显式定制 ([beb0a8f](https://github.com/nuwax-ai/nuwax/commit/beb0a8f464532c97caa24cd081c1c0c32cbca1c1)), closes [#5147](https://github.com/nuwax-ai/nuwax/issues/5147)
- **types:** Page 补可选 docname 字段——feat-2026.9.30 合入的知识库原文对照引用了后端返回但类型缺失的字段 ([2b18d6d](https://github.com/nuwax-ai/nuwax/commit/2b18d6dc652fcaf7debd2fb9812d202d08c3b2d5))
- **ui:** 修复输入框首行 At 标签与智能体 Tag 之间的空白间距异常 ([a04e8e6](https://github.com/nuwax-ai/nuwax/commit/a04e8e60149891766d9890187a186ab36cd4e5ea))
- **UnifiedChatSession:** 修复会话流式恢复跨会话竞态 ([37d4303](https://github.com/nuwax-ai/nuwax/commit/37d4303e0cfdedba4423ad9e9b261006781ed298))
- **UserManage:** 优化用户管理页面的模态框功能 ([f8d82f9](https://github.com/nuwax-ai/nuwax/commit/f8d82f986c5252c71811c0650e1574686c74138f))
- **UserViewMenuModal:** 还原用户查看权限弹窗组件，前端取消修改 ([be2a24d](https://github.com/nuwax-ai/nuwax/commit/be2a24d72441a1634466485e39eaad76d9b6487f))
- **UserViewMenuModal:** 优化菜单树过滤逻辑 ([5066280](https://github.com/nuwax-ai/nuwax/commit/50662804025c618bcc0cfb17a3670f00e8669572))
- **voice-input:** 完善会话禁用态与录音异步竞态处理 ([490c0a1](https://github.com/nuwax-ai/nuwax/commit/490c0a10ab6b92939357df7b7c7e150cead6a0c6))
- **voice-input:** 录音启动前等待 PCM 稳定产出 ([cfea1b9](https://github.com/nuwax-ai/nuwax/commit/cfea1b91366bc626b368941838bdd6f644e294cf))
- **workflow:** Agent 节点添加改用顶层 agentId 传参 ([be472e7](https://github.com/nuwax-ai/nuwax/commit/be472e73d536ad684c0913f0fd129b90f8a239cf))
- **workflow:** 知识库写入只读展示与 Agent 节点改用 typeId 传参 ([c62e61e](https://github.com/nuwax-ai/nuwax/commit/c62e61ebf04f67baf0829afc7ffe55cc2e4ef6e1))
- **workflow:** 补齐 AgentFlow 新节点在变量引用下拉中的图标映射 ([77b1f6c](https://github.com/nuwax-ai/nuwax/commit/77b1f6c8b59e2b7df1ffe10bfc2c44cdff50e7a4))
- wrap captcha verify parameter in an object for uni-app x Android WebView compatibility ([986937c](https://github.com/nuwax-ai/nuwax/commit/986937c3886b4df44133edd836cfcd9d3bd2e8ae))
- 仅在关闭时，将聊天消息状态更新为错误，且仅限于加载或未完成的状态 ([11a515d](https://github.com/nuwax-ai/nuwax/commit/11a515d66f97d2f206e35e0a1233d51d083240bc))
- 优化会话流恢复终态写回，避免轮询闪烁并兜底重载消息 ([91d15ca](https://github.com/nuwax-ai/nuwax/commit/91d15ca01c94aaadef1b3b41c7ee794910a74791))
- 优化会话消息乐观更新与终态 reload，避免闪动与占位错挂 ([6062242](https://github.com/nuwax-ai/nuwax/commit/60622428e6d8999a8bb41b5c0866ba2673e3aa19))
- 优化推荐管理列表页，调整数据拉取逻辑与排序更新接口 ([4c72bf0](https://github.com/nuwax-ai/nuwax/commit/4c72bf09c461c9d91420ea344cf8a2c6670def2d))
- 优化文件上传后刷新逻辑 ([6707204](https://github.com/nuwax-ai/nuwax/commit/67072048455f4d0832ccd0cd1b89501c87ebe6b7))
- 优化请求拦截器以支持 FormData 上传 ([53227da](https://github.com/nuwax-ai/nuwax/commit/53227da34ebaea52aca0e1d83aaa200905f9948b))
- 保留乐观消息尾巴并避免流结束 reload 闪烁 ([bdd6dbe](https://github.com/nuwax-ai/nuwax/commit/bdd6dbe9acd814074412a1632c8ef0c63fb0e560))
- 修复 base64 data URL 导致 MarkdownRenderer 性能退化 O(N^2) ([e179d3a](https://github.com/nuwax-ai/nuwax/commit/e179d3ae93c2109b71b0aad93d18ad3fb7d7f5ca))
- 修复 ConversationAgent 电脑选择不同步 ([30597b9](https://github.com/nuwax-ai/nuwax/commit/30597b90a985f9136fa4074b1d28ba4e635e4dcf))
- 修复 Markdown 流式渲染消息切换时的状态残留 ([d648a91](https://github.com/nuwax-ai/nuwax/commit/d648a91996e081a99bca28210d0fc3ecd6d80ec3))
- 修复 sub 恢复后 taskStatus 固化 EXECUTING 的问题 ([4f5d152](https://github.com/nuwax-ai/nuwax/commit/4f5d15219edc6c2451bf410ac4b255e2ae998c5f))
- 修复 ConversationAgentChatSession 样式问题 ([bac73c3](https://github.com/nuwax-ai/nuwax/commit/bac73c3c0d4d60727ab25c76d72713470c17dc82))
- 修复 ConversationBottomConsole 组件的 conversationId 传递逻辑 ([bfe3174](https://github.com/nuwax-ai/nuwax/commit/bfe31749cbbf0800ba3c042f81483859e1a2be2f))
- 修复刷新页面后 MCP 卡片未正常弹出问题 ([adf2307](https://github.com/nuwax-ai/nuwax/commit/adf2307f11435188c0284368c67a7850f9b118d6))
- 修复加载历史消息时 ask-question dock 误弹 ([073d45c](https://github.com/nuwax-ai/nuwax/commit/073d45c78cdc30803d978374759a7dafbf894225))
- 修复文件树面板上传逻辑 ([1e54354](https://github.com/nuwax-ai/nuwax/commit/1e543540886755a7d0725175a57a5ab9c1a0059e))
- 修复智能体任务完成后 taskStatus 固化 EXECUTING 致 UI 仍显示执行中 ([7fb4fa0](https://github.com/nuwax-ai/nuwax/commit/7fb4fa0fb5298523db97b53cb0c80a0fcd244891))
- 修复消息队列消费间隔计时基准并启用队列功能 ([56c3470](https://github.com/nuwax-ai/nuwax/commit/56c3470a2a0365b268f0d21cc7de11cb4a4072f3))
- 修改生成多样性选项的导出方式 ([c479ee2](https://github.com/nuwax-ai/nuwax/commit/c479ee2fdc19c0ebf2861040236db4399106d870))
- **创建:** 优化生成图标接口的错误与超时处理 ([ffccf00](https://github.com/nuwax-ai/nuwax/commit/ffccf001dfa8a14145af9f541b9c33e2c8606d82))
- **创建:** 生成图标 prompt 优先使用描述 ([2e96196](https://github.com/nuwax-ai/nuwax/commit/2e9619657c409fce37a7bb18754a7c985d8395cd))
- 在 ChatTemp 中，流结束后更新消息状态为完成 ([806c030](https://github.com/nuwax-ai/nuwax/commit/806c030c8c3d8baefdb6228b27f2b582e0efb887))
- 在代理对话路由路径中，使用 devTargetId 而不是 agentId ([e195cb2](https://github.com/nuwax-ai/nuwax/commit/e195cb2a08dd1097dc72e2fbf4aeae34718a5747))
- 在错误信息访问中添加可选链操作，并移除项目创建流程中的冗余行 ([53fef80](https://github.com/nuwax-ai/nuwax/commit/53fef80b7b34f9ba5578cbf94a7a71ae41b41131))
- 女娲主题补主内容区灰底（--xagi-layout-bg-container）+ html 灰底兜缝隙 ([f256f4b](https://github.com/nuwax-ai/nuwax/commit/f256f4b5fe27693c335acf1d69736cd0926161c7)), closes [#EFF1F6](https://github.com/nuwax-ai/nuwax/issues/EFF1F6) [#E5E8](https://github.com/nuwax-ai/nuwax/issues/E5E8)
- 完善会话终态判定与 ConversationAgent 流式恢复 ([254ea89](https://github.com/nuwax-ai/nuwax/commit/254ea89742b998bf2b5c0a32ea2e0e4af4e88f34))
- **工作流:** 修复知识库写入节点 name/description 保存与回退 ([c5c9382](https://github.com/nuwax-ai/nuwax/commit/c5c9382e7ecb27fb1d41ef57281a995144b54cb7))
- **工作流:** 切换模型时按当前模型上限动态回显并钳位参数 ([96e3580](https://github.com/nuwax-ai/nuwax/commit/96e3580792fde1e1d8094ccd14fe42578a82a4b2))
- **工作流:** 切换节点保存时保护顶层 description，避免被表单空值覆盖 ([6b9c42a](https://github.com/nuwax-ai/nuwax/commit/6b9c42aba380c7864778386f922767e90c166cee))
- **工作流:** 工作流节点描述为空时回退使用名称 ([14b768f](https://github.com/nuwax-ai/nuwax/commit/14b768f2e2de8bf14b56668caf55ea1b1e6a8e31))
- 开窗失败回落页内导航（旧壳/校验拒绝时点击不再无响应） ([f18069b](https://github.com/nuwax-ai/nuwax/commit/f18069b78a31879847aee1adfde2fc64d4b4456f))
- 弱化菜单选中高亮（悬浮二级菜单接入 navItem 变量链） ([3507400](https://github.com/nuwax-ai/nuwax/commit/350740000c4ba50d80191d6b2187104a83639a11))
- 当 UnifiedChatSession 中存在待处理干预时，禁用输入字段 ([d52dbef](https://github.com/nuwax-ai/nuwax/commit/d52dbefc545417af1fa14ad4a7199d5de827e223))
- 收紧 data URL 正则并修复 isPlan 漏判，补充 MarkdownRenderer 单测 ([268e062](https://github.com/nuwax-ai/nuwax/commit/268e062eb661d7f5adbf85f1ae76a0a5f3407aa9))
- **智能体配置:** 优化群组智能体选择器逻辑 ([edfb01a](https://github.com/nuwax-ai/nuwax/commit/edfb01a88ca677ebb7b39a75fdd176203a390044))
- 更新多语言文件中的容器相关提示为服务相关提示 ([0199822](https://github.com/nuwax-ai/nuwax/commit/0199822823adbd8f124e929ef23f3d0b0c96a566))
- 更新多语言文件中的部分翻译以提升准确性 ([6be0b1a](https://github.com/nuwax-ai/nuwax/commit/6be0b1a5ba73751026ad5b59eb9b1291b6f844c5))
- 权限请求字段解析兼容 ACP camelCase 标准格式 ([3d278bf](https://github.com/nuwax-ai/nuwax/commit/3d278bfa66f88cfd3146a8e62f6183193746b212))
- 注释掉不必要的工作流 ID 返回逻辑 ([38b7418](https://github.com/nuwax-ai/nuwax/commit/38b7418a17f942730be43ed630edc604cbf91477))
- 清理未保存更改提示相关代码 ([45bc088](https://github.com/nuwax-ai/nuwax/commit/45bc088b8532052bf8e39b16d1591ec0025c05f5))
- 移除开发收藏功能及相关样式 ([a1b727a](https://github.com/nuwax-ai/nuwax/commit/a1b727a552c5ed9dd725d20b7c9ed0d4f5789749))
- 自定义智能体编排页隐藏 Hook 设置 ([b440a7f](https://github.com/nuwax-ai/nuwax/commit/b440a7fef42727c912e72dbef236615e6b181e5b))
- 调整 ConversationAgent 页面的 z-index 值以修复样式问题 ([c2d2478](https://github.com/nuwax-ai/nuwax/commit/c2d247883379833a6d56b8e2873adb860b082f3c))
- 调整主内容区顶部避让，增加 8 像素以适应收起态二级菜单 ([774e6d4](https://github.com/nuwax-ai/nuwax/commit/774e6d4af629435610550d1ddf8f49a42fda0b48))
- 调整开发权限表单中数字输入项的最大值限制 ([8f1e7b8](https://github.com/nuwax-ai/nuwax/commit/8f1e7b8e8b5457a86c1e2170c9446cbff668e970))
- 调整文件树组件的样式和布局 ([5593b31](https://github.com/nuwax-ai/nuwax/commit/5593b31b8ea69fc832e77823316aaacf76dad2a0))
- 轮询 devConversationId 变更并自动切换调试会话 ([5ab7fd7](https://github.com/nuwax-ai/nuwax/commit/5ab7fd7778e6f066c664509db3b22255b5855c9e))

### 💄 样式

- **agentflow:** migrate node property panels to af-\* design system ([ec2bf21](https://github.com/nuwax-ai/nuwax/commit/ec2bf210a33ebefcf3831833c416fe218d0e3f86))
- **chat-input:** 优化输入框提及标签缩进与长文本折行样式 ([a8fcb43](https://github.com/nuwax-ai/nuwax/commit/a8fcb434630bb79049854bd3c6ddeebe01658568))
- **chat-input:** 将输入框选中的 agent 标签样式调整为灰色主题 ([2643148](https://github.com/nuwax-ai/nuwax/commit/26431480209a3ab63e80f37d0fc2a659e04def36))
- **ChatInputHome:** 调整聊天输入图标的字体大小 ([4c7d2e6](https://github.com/nuwax-ai/nuwax/commit/4c7d2e61cdd619d87309b1e46342e9b5df8453cc))
- **chat:** 增加文件树展开时聊天区域默认宽度 ([98027ca](https://github.com/nuwax-ai/nuwax/commit/98027cae1af01cfff8acca466f994404b02c2b01))
- **chat:** 调整聊天页面文件树显示时的左侧默认宽度为百分之三十五 ([c093b8c](https://github.com/nuwax-ai/nuwax/commit/c093b8cce709a2d1f821c0b0d30d9e6dbe15f332))
- **components:** 临时注释 MCP Ask 结构化提问卡片确认按钮的回车快捷键提示 ([e5d4796](https://github.com/nuwax-ai/nuwax/commit/e5d47964bf2952bff622e3c28695b46e405e4b41))
- **components:** 优化 ACP 权限审批组件交互样式及清理冗余引用 ([037d680](https://github.com/nuwax-ai/nuwax/commit/037d6804872b0077c5f7e96976f66a455135adac))
- **components:** 优化 Diff 视图排版及文件路径展示效果 ([219cfcd](https://github.com/nuwax-ai/nuwax/commit/219cfcdd6d667dc1fe4f9013ee18507f32cfac6d))
- **components:** 优化 MCP Ask 结构化提问卡片表单和上传控件样式 ([9ea9424](https://github.com/nuwax-ai/nuwax/commit/9ea94248848d457d0165f1ecc6489029998e1e55))
- **components:** 优化代码比对组件的默认字体大小 ([30a9e7c](https://github.com/nuwax-ai/nuwax/commit/30a9e7c4034e157445e04f0cb8fe7a9691641823))
- **components:** 优化工具调用折叠面板及子项的样式与交互 ([3a3fe3c](https://github.com/nuwax-ai/nuwax/commit/3a3fe3c1753f38c528b45f2676b8cc4cb26cd6e8))
- **components:** 优化积分余额卡片大金额换行排版溢出 ([a30bacd](https://github.com/nuwax-ai/nuwax/commit/a30bacdae18c06d3b506968d34794bc2d81806d6))
- **components:** 使用 EllipsisTooltip 替换原按钮文本渲染组件 ([fe1bb14](https://github.com/nuwax-ai/nuwax/commit/fe1bb14e0d7f672b87a89494eb7338dad874ede7))
- **components:** 提取工具子项的 Plan 任务展开列表至平行层级 ([5c66107](https://github.com/nuwax-ai/nuwax/commit/5c6610709b9c775a815ba1ba2fcccee2c2461094))
- **components:** 移动对话设置表单至滚动容器顶部 ([538426e](https://github.com/nuwax-ai/nuwax/commit/538426ebec2fa5362a30d7f430e6c544a813df9a))
- **components:** 统一快捷键提示角标尺寸与样式 ([00d7342](https://github.com/nuwax-ai/nuwax/commit/00d73426200938a9edf9cc941289679d6ac4ce36))
- **ConversationAgentHeader & MiddlePanel:** 更新样式以优化布局和视觉效果 ([f61fec2](https://github.com/nuwax-ai/nuwax/commit/f61fec2f428adf21c2bb790224ce1e5d63348a94))
- **ConversationAgent:** 优化 TabPickerPanel 样式与布局 ([9a77e00](https://github.com/nuwax-ai/nuwax/commit/9a77e00b67593b12bf0b148dcee001d76a97a93e))
- **ConversationAgent:** 优化样式背景色设置 ([828523d](https://github.com/nuwax-ai/nuwax/commit/828523de2a561b36b8c6659ce12fd2b25aa3a79d)), closes [#f5f5f5](https://github.com/nuwax-ai/nuwax/issues/f5f5f5)
- **conversationagent:** 增加页面顶部间距 ([b332d7f](https://github.com/nuwax-ai/nuwax/commit/b332d7fc9f6fd3eb72ab8cd46bbc708ca3fbc0bf))
- **ConversationAgent:** 更新标签栏样式与注释 ([f74bdb9](https://github.com/nuwax-ai/nuwax/commit/f74bdb9396fe50d0f7d6de801ddb6038f9879385))
- **ConversationAgent:** 更新样式以优化布局和视觉效果 ([0f8b3df](https://github.com/nuwax-ai/nuwax/commit/0f8b3df594caca87b6664a0ce6818ef01ad3bfe3))
- **conversation:** V2 回答耗时样式对齐 V1 状态栏 timer——等宽字体定宽右对齐 ([64a228f](https://github.com/nuwax-ai/nuwax/commit/64a228fccaedc48702c2e620c090dd46fc703e76))
- **file-preview:** md 预览列表样式对齐会话区渲染 ([4d5b257](https://github.com/nuwax-ai/nuwax/commit/4d5b257179188ea4d558d9dfdb1d0fad173a736e))
- **FileTreeView:** 优化文件树视图样式 ([b583d50](https://github.com/nuwax-ai/nuwax/commit/b583d50fcdc60461d250f01f79950ecb8129b109))
- **home:** 优化首页推荐导航组件的布局位置与间距样式 ([9620490](https://github.com/nuwax-ai/nuwax/commit/962049070b6c85e871c41a3d81b0b1524bd3d437))
- **home:** 优化首页推荐导航组件的文本对齐样式 ([6ab3232](https://github.com/nuwax-ai/nuwax/commit/6ab32329cda68f73f755fa1d790f0eeedba76c65))
- **home:** 修改首页分类导航标签文字字体大小为 14px ([6fb49e0](https://github.com/nuwax-ai/nuwax/commit/6fb49e05746c2030d570b613afa6fb762c0a44b5))
- **home:** 去除首页分类标签页在激活选中状态下的加粗效果 ([71d6bb6](https://github.com/nuwax-ai/nuwax/commit/71d6bb628afa9d4ff4424c2d22ca724238d7519e))
- **home:** 规范分类导航标签文字字体大小使用 [@font](https://github.com/font)Size 变量 ([ac57a21](https://github.com/nuwax-ai/nuwax/commit/ac57a21f7887b84f68be6b7aca3b4587e1a03dae))
- **home:** 调整 Slogan 区域高度占用及对齐方式 ([cabe621](https://github.com/nuwax-ai/nuwax/commit/cabe6216d4ff4adb164e201b360775f053503361))
- **imchannel:** 调整企业微信机器人与应用表单字段顺序 ([a258793](https://github.com/nuwax-ai/nuwax/commit/a258793de7cf0a7cdcee1924c6f9aa0a27a4f384))
- increase file tree width to 37% in chat left content ([36fd32e](https://github.com/nuwax-ai/nuwax/commit/36fd32e243a6a6338dcc02c2546e4f287a169366))
- **intervention:** 动态计算输入框高度并优化干预卡片自适应布局 ([fd046e2](https://github.com/nuwax-ai/nuwax/commit/fd046e2288a7f27e8b9ad775b05183a2b6cf2a85))
- **layouts:** 优化主页最近使用及会话记录列表空描述布局 ([cb315f3](https://github.com/nuwax-ai/nuwax/commit/cb315f31d68904634f658d1c3af9180485cebdf1))
- **layouts:** 微调侧边栏导航及历史会话列表组件样式间距与颜色 ([ba9ddaa](https://github.com/nuwax-ai/nuwax/commit/ba9ddaa11877a175e3758ccbc09fdeed5c2a309c))
- **layout:** 优化新版会话列表右侧边距补偿 ([7df04cb](https://github.com/nuwax-ai/nuwax/commit/7df04cb7e9cc9018c2a5c92e41b290fb2e8f74b7))
- **layout:** 对齐侧栏导航原型样式 ([5d78b71](https://github.com/nuwax-ai/nuwax/commit/5d78b7168760cd05b96f481f218dfdefb1664abe))
- **layout:** 对齐侧栏导航原型间距 ([2486b96](https://github.com/nuwax-ai/nuwax/commit/2486b96ec4d42ac28911b40df3b5e10364d938c7))
- **layout:** 搜索栏与 tabs 间距收紧为 8px ([0489c70](https://github.com/nuwax-ai/nuwax/commit/0489c70bfc881f90ca554091b62621ad7c1cdd40))
- **layout:** 经典布局搜索栏与竖栏 Logo 对齐并收紧间距 ([d42a07f](https://github.com/nuwax-ai/nuwax/commit/d42a07f638fd2dfb35f372fdbf041ffc4982c1c2))
- **layout:** 隐藏新版首页会话列表底部的没有更多提示 ([401d7cf](https://github.com/nuwax-ai/nuwax/commit/401d7cf7e096d481d340c822bb65a703554010a6))
- **layout:** 顶栏搜索/折叠图标对齐原型——移植原型描边 SVG ([3f75771](https://github.com/nuwax-ai/nuwax/commit/3f757717cf5f709bfbea393eafaeebe3281749c1))
- **login:** 优化登录页面左侧文本排版与样式规范 ([5cd9782](https://github.com/nuwax-ai/nuwax/commit/5cd9782c798e0950819848416e5dbe7fdd969a82))
- **MarkdownCustomProcess:** 长标题 tooltip 限高 5 行并加宽 ([0239735](https://github.com/nuwax-ai/nuwax/commit/0239735d67e6f523ab1cbff97919bb3bd2999112))
- **MessageQueue:** 优化队列消息操作按钮入场动画 ([04d64f4](https://github.com/nuwax-ai/nuwax/commit/04d64f4e40590a864a69aa7514ce1161fd6a5d42))
- **openui:** inline 渲染容器(.inlineRenderer)去掉 padding 与顶部边框 ([24a6a38](https://github.com/nuwax-ai/nuwax/commit/24a6a38f9ca0257baa25ef0491700bdb7413216f))
- **openui:** 暂时注释 sidecar 行宿主外边距 ([0743c99](https://github.com/nuwax-ai/nuwax/commit/0743c9957b48824e5ba226f952dad3776b8c59c6))
- **plugin:** 优化空间插件云工具表格的列宽与自适应排版 ([62f3b03](https://github.com/nuwax-ai/nuwax/commit/62f3b03759bba252fa1f464ddbb2b2832e72084c))
- **terminal:** 优化终端视口的滚动条展示样式 ([4f26e2b](https://github.com/nuwax-ai/nuwax/commit/4f26e2ba6a6df5882dc905be44ac87d7ca268a5a))
- **ui:** 优化输入框选中标签与首页推荐卡片的样式 ([8e4e56c](https://github.com/nuwax-ai/nuwax/commit/8e4e56ce7d3a831bf653e519b0e840976620be30))
- **ui:** 调整分类页签设计与输入框折行对齐样式 ([7299f32](https://github.com/nuwax-ai/nuwax/commit/7299f32c6ef5391cf09ae1d5e27eef5ab7ce854f))
- update aliyun-captcha slide width to 260px ([7d74775](https://github.com/nuwax-ai/nuwax/commit/7d74775836d0f79ab05a94fe4568964322ca5435))
- update layout and spacing in home page styles ([c7ec3f1](https://github.com/nuwax-ai/nuwax/commit/c7ec3f11f401838370301f9a24dc37bc75eb2d8d))
- update layout spacing and typography in home page stylesheet ([f02783b](https://github.com/nuwax-ai/nuwax/commit/f02783b3ccea94ba32a09c16bea73c42a5b6b576))
- 主页布局容器增加滚动条 ([5615917](https://github.com/nuwax-ai/nuwax/commit/56159171d6237d926e97549192b8f2c95721a7fb))
- 优化日志面板时间戳显示和样式 ([dd29734](https://github.com/nuwax-ai/nuwax/commit/dd29734c924419998288648d887eb99bdd9f3b5b))
- 优化终端连接提示的颜色显示 ([a469077](https://github.com/nuwax-ai/nuwax/commit/a46907763b1c6dd2665e7d4da57791f12f965684))
- 在 ChatInputHome 操作按钮中居中对齐图标 ([30d23aa](https://github.com/nuwax-ai/nuwax/commit/30d23aa79f205a1c1ba205a10d47bf14c5f33e15))
- 女娲主题整体调亮一档（米黄色相不变、各层加白） ([1c6ba3a](https://github.com/nuwax-ai/nuwax/commit/1c6ba3a95b5a4c5a974c34115e42614557619b07)), closes [#F1EFE9](https://github.com/nuwax-ai/nuwax/issues/F1EFE9) [#F5F3](https://github.com/nuwax-ai/nuwax/issues/F5F3) [#E7E4](https://github.com/nuwax-ai/nuwax/issues/E7E4) [#EDEAE2](https://github.com/nuwax-ai/nuwax/issues/EDEAE2) [#EAE7](https://github.com/nuwax-ai/nuwax/issues/EAE7) [#F0EEE6](https://github.com/nuwax-ai/nuwax/issues/F0EEE6) [CFCBBE/#E0](https://github.com/CFCBBE/nuwax/issues/E0) [#D6D2C6](https://github.com/nuwax-ai/nuwax/issues/D6D2C6) [#E5E1D6](https://github.com/nuwax-ai/nuwax/issues/E5E1D6) [#F3F1](https://github.com/nuwax-ai/nuwax/issues/F3F1) [#F7F5F0](https://github.com/nuwax-ai/nuwax/issues/F7F5F0) [#FBFAF6](https://github.com/nuwax-ai/nuwax/issues/FBFAF6) [#FDFCF9](https://github.com/nuwax-ai/nuwax/issues/FDFCF9)
- 女娲主题调色板改为米白色（带黄加灰） ([bd08994](https://github.com/nuwax-ai/nuwax/commit/bd08994d1ad0f3351d391bf4e884cd1776a53a13)), closes [#F1EFE9](https://github.com/nuwax-ai/nuwax/issues/F1EFE9) [#E7E4](https://github.com/nuwax-ai/nuwax/issues/E7E4) [#EAE7](https://github.com/nuwax-ai/nuwax/issues/EAE7) [#E0](https://github.com/nuwax-ai/nuwax/issues/E0)
- 将聊天框包装器的间距从 margin-left 改为 padding-left ([90733b4](https://github.com/nuwax-ai/nuwax/commit/90733b4a9d57bbe99c2207cbb0d7590461f18358))
- 更新 ChatInputHome 的填充，并注释掉 ManualComponentItem 的布局约束 ([5ba609e](https://github.com/nuwax-ai/nuwax/commit/5ba609eb7326766e2adf926065e1e9d42b1eeb00))
- 更新字体族并移除计时器组件的粗细属性 ([729b1e5](https://github.com/nuwax-ai/nuwax/commit/729b1e59f906b6c96ede3c1abe618c0914eba42f))
- 更新标签颜色以提升视觉一致性 ([7d1fe3c](https://github.com/nuwax-ai/nuwax/commit/7d1fe3c3a9cdc00add19ce93291ea76cac97894a))

### ✨ 新功能

- **account:** 优化用户信息更新功能 ([a29cf33](https://github.com/nuwax-ai/nuwax/commit/a29cf33902cac608ea6e46e1f0dd5a6b6aafb441))
- **acp:** Agent 模式新增 plan 档 + ACP 计划渲染全量替换语义 ([c421ace](https://github.com/nuwax-ai/nuwax/commit/c421acee335ffa4e5aa698dc0545487bd66aaf19))
- add ACP mode and permission UI to chat ([8997721](https://github.com/nuwax-ai/nuwax/commit/8997721d7e08e0bee92aa01d3d06309390d590a1))
- add AgentConversationChatPanel component to handle conversation chat interface ([7fbd587](https://github.com/nuwax-ai/nuwax/commit/7fbd5871890f548fc9871d021de441cd7e0ad161))
- add ai package dependency to project manifest ([234f2c2](https://github.com/nuwax-ai/nuwax/commit/234f2c25c3c1d9634976f5629ae23fbdc054214c))
- add stacked agent intervention dock for ACP and MCP Ask ([86c09de](https://github.com/nuwax-ai/nuwax/commit/86c09de7b1ba15aa9f67a8d7c9ec5d34f9633491))
- add UI feedback for Aliyun captcha bridge status and connection errors ([5788c63](https://github.com/nuwax-ai/nuwax/commit/5788c63aca2922e2a62221117f1b4fa80ee9fcec))
- **agent-dev:** 文件树支持上传文件夹并保留目录结构 ([4c79fa4](https://github.com/nuwax-ai/nuwax/commit/4c79fa4add8944e32e6fa1143ad8431289a7f9f5))
- **agent-flow:** add AgentFlow workflow editor with node types and mock support ([1035a85](https://github.com/nuwax-ai/nuwax/commit/1035a85990ed834d15a5b6ccf3735baaf6443274))
- **agent-intervention:** add file upload and list widget support for MCP Ask form ([9448241](https://github.com/nuwax-ai/nuwax/commit/9448241729ccad995ee0b2d768f9c7b25067dd46))
- **agent-intervention:** ask-question 卡提级展示——标题/副标题/描述分层 + 描述展开全文 ([39b6ad5](https://github.com/nuwax-ai/nuwax/commit/39b6ad58164003915d71484ff92362ecada7035d))
- **agent-intervention:** enhance ACP permission request structure and add MCP Ask message formatting ([fb116e1](https://github.com/nuwax-ai/nuwax/commit/fb116e13d8ccf0aea90b4a282846ff0a497e63a5))
- **agent-intervention:** enhance MCP Ask and ACP Permission components with new tests and message formatting ([578a0d3](https://github.com/nuwax-ai/nuwax/commit/578a0d37978e818ba4fec8b4099101f1d32f88d7))
- **agent-intervention:** PC 审批队列 FIFO 与会话恢复 reconcile ([3e1a6f3](https://github.com/nuwax-ai/nuwax/commit/3e1a6f3b32f9db934422159080f7c413a954ff15))
- **agent-intervention:** 优化权限审批队列排队机制并增加文件变更视图支持 ([227d889](https://github.com/nuwax-ai/nuwax/commit/227d889cdf2675eed379b96273e7672ac955ec63))
- **AgentArrangeConfig:** 增加 agentSubType 支持调用审批功能 ([a97d230](https://github.com/nuwax-ai/nuwax/commit/a97d230bcd87b969577ad981ed53bba9e8e457df))
- **AgentArrangeConfig:** 增加开发模式下会话 ID 支持，优化子智能体与定时任务模块显示逻辑 ([390e5e4](https://github.com/nuwax-ai/nuwax/commit/390e5e408ef072609d5890d89c816f2d5f15b5c2))
- **AgentArrangeConfig:** 新增允许用户选择模式功能与国际化文本 ([f69683a](https://github.com/nuwax-ai/nuwax/commit/f69683a3b4ce88bd8bca9c2b61468deedecbd446))
- **AgentArrangeConfig:** 新增版本管理功能与国际化文本 ([f9cb8f4](https://github.com/nuwax-ai/nuwax/commit/f9cb8f4c8ad9f3de080a1bb1f16f070a7a8afd8c))
- **AgentArrangeConfig:** 新增询问用户功能与国际化文本 ([73cbd8d](https://github.com/nuwax-ai/nuwax/commit/73cbd8d925c8b8bde2fd6e07c3cf43483efcd576))
- **AgentArrangeConfig:** 新增询问用户描述与国际化文本 ([7937a9c](https://github.com/nuwax-ai/nuwax/commit/7937a9c86b2be8b48cda708512a18c59d783a22f))
- **AgentArrangeConfig:** 移除定时任务相关国际化文本 ([518d423](https://github.com/nuwax-ai/nuwax/commit/518d4237d3b19ec23c030c525ce6d3355a6810fb))
- **AgentComponent:** 新增 Hook 配置相关接口与类型定义 ([61b129a](https://github.com/nuwax-ai/nuwax/commit/61b129a20ec5fe94cb118d10e9a0019b02899164))
- AgentFlow 记忆变量变更后通过 ref 刷新工作流 ([c779ff6](https://github.com/nuwax-ai/nuwax/commit/c779ff661b4ebdef2f17db3dcaaadb14eef170ee))
- **agentflow:** add detailed decision records and schema updates for AgentFlow ([11358aa](https://github.com/nuwax-ai/nuwax/commit/11358aa367e1b5f620e030e286745d7f0906e8ff))
- **AgentFlow:** add edge branch labels, colors, flow animation and fix Path.normalize crash ([bfe9a71](https://github.com/nuwax-ai/nuwax/commit/bfe9a714ee5a947e873234810fda6e45d2006161)), closes [#52c41](https://github.com/nuwax-ai/nuwax/issues/52c41) [#ff4d4](https://github.com/nuwax-ai/nuwax/issues/ff4d4)
- **AgentFlow:** differentiate 4 node types with distinct colors, icons and canvas badges ([8e015bb](https://github.com/nuwax-ai/nuwax/commit/8e015bb59b50a47c45588f096a1d0c173009add0)), closes [#E8F5E9](https://github.com/nuwax-ai/nuwax/issues/E8F5E9) [#FFF3E0](https://github.com/nuwax-ai/nuwax/issues/FFF3E0) [#E3F2](https://github.com/nuwax-ai/nuwax/issues/E3F2) [#F3E5F5](https://github.com/nuwax-ai/nuwax/issues/F3E5F5)
- **agentflow:** embed canvas in EditAgent, refine nodes, add subType support ([1c4996c](https://github.com/nuwax-ai/nuwax/commit/1c4996cf80df10a34acade3ac511def9e2564fe3))
- **AgentFlow:** integrate Loop node for retry cycles in mock workflow ([f8a37a7](https://github.com/nuwax-ai/nuwax/commit/f8a37a7574f2fb8bbfaddcc135c0a91414c35a93))
- **AgentFlow:** Start 节点第二条拖线复用中间插入并修复边同步 ([61fca4c](https://github.com/nuwax-ai/nuwax/commit/61fca4c86949f53bf8d8863755e756f6996f8aed))
- **AgentFlow:** 人机交互 answerType 统一与表单/路由/连线规则优化 ([38164a6](https://github.com/nuwax-ai/nuwax/commit/38164a6398a4d56bbe0cc4a3027d96ba7a7a495f))
- **AgentFlow:** 增加分支连线断开功能及相关逻辑 ([ee9fda1](https://github.com/nuwax-ai/nuwax/commit/ee9fda173810a20677177a878faefe42d8d60730))
- **AgentFlow:** 控制条紧凑态与异常配置/废弃字段清理 ([11febc4](https://github.com/nuwax-ai/nuwax/commit/11febc41415f976f1a30f070616e54785723b908))
- **AgentFlow:** 新增 AgentFlow 产品与技术方案文档 ([13a8835](https://github.com/nuwax-ai/nuwax/commit/13a88357692e52c74548fb22df320fa9d3de6328))
- **AgentFlow:** 新增 AgentFlow 工作流分支与 4 个 AI 驱动节点 ([05b9884](https://github.com/nuwax-ai/nuwax/commit/05b9884f690563b12cd962c33f44075ab3fecb71))
- **AgentFlow:** 智能体选器接口过滤与画布节点展示优化 ([6c87825](https://github.com/nuwax-ai/nuwax/commit/6c87825c1186f42bcfb4544dbe3d2d2283718e15))
- **agentflow:** 暂时隐藏自循环配置与技能编排区块 ([fb499d7](https://github.com/nuwax-ai/nuwax/commit/fb499d7448bc7fb2087209e999869f6fff93758d))
- **AgentFlow:** 独立属性面板改造并与 Workflow V3 样式对齐 ([b4cd4b2](https://github.com/nuwax-ai/nuwax/commit/b4cd4b2fe9f552ccbc6a6b9628da14d4a1a43ac8))
- **AgentFlow:** 画布节点优先展示接口返回的自定义图标 ([6965cb3](https://github.com/nuwax-ai/nuwax/commit/6965cb33eeed79543f768a6309760772ac7ed42b))
- **AgentFlow:** 画布隐藏调试/试运行入口 ([1f6d60a](https://github.com/nuwax-ai/nuwax/commit/1f6d60ac728e3f5e8444d0ce4b9899ce1b5fad9a))
- **AgentFlow:** 统一 /agent/:id 路由，画布并入系统提示词区块并支持全屏 ([84440aa](https://github.com/nuwax-ai/nuwax/commit/84440aa4e5d1717fb85bdc80ed2c46f90010bcec))
- **AgentFlow:** 统一询问用户 formArgs inputType 为 PascalCase 枚举 ([c71dbf5](https://github.com/nuwax-ai/nuwax/commit/c71dbf5c7d2b014ef783745e38ea59476beddcae))
- **AgentFlow:** 节点配置对齐后端契约（路由决策/询问用户/智能体） ([680bbb7](https://github.com/nuwax-ai/nuwax/commit/680bbb7a0319d710dc32dc1667f30c2a26dd0275))
- **AgentFlow:** 解耦分支节点处理逻辑，新增扩展注册表与单元测试 ([63a3e30](https://github.com/nuwax-ai/nuwax/commit/63a3e30b966218e122a945081e513b7c2f1c9910))
- **AgentFlow:** 路由决策/询问用户映射后端类型收发，收敛为 4 节点并深清理 ([fcf56ed](https://github.com/nuwax-ai/nuwax/commit/fcf56edbd08d58987938806418dda2384cb1cddf))
- **AgentFlow:** 路由决策分支支持结构化条件匹配编辑 ([9bf5ca5](https://github.com/nuwax-ai/nuwax/commit/9bf5ca5db17be689eba8f750bb78f1f6bf43d8e3))
- **AgentFlow:** 退出全屏自动适配画布并聚合专属类型 ([529427c](https://github.com/nuwax-ai/nuwax/commit/529427cbb23f7614b89605298dfeb6c5c3124896))
- **AgentIntervention:** enhance active intervention queue handling ([856a6df](https://github.com/nuwax-ai/nuwax/commit/856a6dfff127e3c56f66ebcbb7dbe59842502d99))
- **AgentIntervention:** MCP Ask resume 消息支持多语言 ([cd2d470](https://github.com/nuwax-ai/nuwax/commit/cd2d470bc52db31e23794df5906ba98b9bdd8de4))
- **AgentIntervention:** MCP Ask 渲染迁移至 nuwax.interaction.v2 字段数组模型 ([d1805b1](https://github.com/nuwax-ai/nuwax/commit/d1805b1aaf956753bd2764599a1e7e5f32f75b36))
- **AgentIntervention:** 增强 MCP Ask SSE 输入解析兼容性 ([1107e30](https://github.com/nuwax-ai/nuwax/commit/1107e3074c88495af9d687e47da2a213a57300c0))
- **AgentIntervention:** 完善 MCP Ask resume 用户消息展示 ([d79c6d1](https://github.com/nuwax-ai/nuwax/commit/d79c6d1866a8334fd073dac296f838e19aef4ab1))
- **AgentIntervention:** 添加干预模块及相关组件 ([d9dd600](https://github.com/nuwax-ai/nuwax/commit/d9dd600beeb91bfb581c159d40e622ec967e4576))
- **AgentIntervention:** 预览 Tab 接入 MCP Ask / ACP 权限 DockPanel ([9b36b86](https://github.com/nuwax-ai/nuwax/commit/9b36b865ce2a0bb102a3728ddfb40fa11ab88907))
- **agent:** support flexible create result ([ee1ab41](https://github.com/nuwax-ai/nuwax/commit/ee1ab4116abb5a7586448b1d3582ce6140b7cf7f))
- **Agent:** 优化智能体子类型标签显示与国际化支持 ([0adb0b0](https://github.com/nuwax-ai/nuwax/commit/0adb0b0058a1485d4931b6aae3b18481b1b5e6ff))
- **agent:** 新增任务产物标签跨页面跳转与文件定位预览功能 ([ca8e896](https://github.com/nuwax-ai/nuwax/commit/ca8e8963c426257440cb23d9a99e5e67195110bf))
- **Agent:** 新增智能体子类型选项并优化代码结构 ([68c02fd](https://github.com/nuwax-ai/nuwax/commit/68c02fdbc3ae0f169d573a088aea21dd396ea5f6))
- **ai-sdlc:** 引入 nuwa-sdlc-kit v1.1.0 规则层——guard-paths/plan-gate/deploy-gate 三 hook(读 .sdlc.json：src 源码区/NUWACLAW 前缀停用开关)+intent/spec/plan 模板与 plans/specs 约定+双 skill(路由 config 约定/mock 切换/tests 分域/Page 契约教训/build:m 流程五项本仓拷问)+REVIEW.md 五遍清单+verifier(vitest run)+evals CI workflow 与 samples；.gitignore 将整仓忽略 .claude 精确化为放行 kit 子路径(散落截图仍忽略)；注意：根 .env 被 git 跟踪为已知政策隐患 ([0fc8e32](https://github.com/nuwax-ai/nuwax/commit/0fc8e32aae860803d3a61c1bfd835339c814b3bd))
- **AppDevFileTreePanel:** 网页应用开发页面，移除版本对比相关逻辑，简化组件结构 ([a2b705c](https://github.com/nuwax-ai/nuwax/commit/a2b705c5b54e26b1d1506d8885dd2b3878ff540a))
- **AppDev:** 优化多模态模型选择逻辑 ([99a5148](https://github.com/nuwax-ai/nuwax/commit/99a51484e4c9ef60f4b5846a14bd9136e4a47e94))
- **AppDev:** 初始化项目元数据 ([897c0ee](https://github.com/nuwax-ai/nuwax/commit/897c0eedef00630be77904589a646391905fb0be))
- **AppDev:** 增加应用预览功能的国际化支持 ([42ea1f3](https://github.com/nuwax-ai/nuwax/commit/42ea1f3fa3b61eb4638b458a5ef96bdb17d4999d))
- **AppDev:** 增加数据 Tab 切换时刷新项目详情的功能 ([635d140](https://github.com/nuwax-ai/nuwax/commit/635d140e3d003560235e3346f228e9fe34476a85))
- **AppDev:** 增加文件夹上传功能并优化上传逻辑 ([cc216e1](https://github.com/nuwax-ai/nuwax/commit/cc216e1e925a54b0e63086d47189f655c44f4441))
- **appDev:** 增强文件上传功能，支持批量上传 ([60f5439](https://github.com/nuwax-ai/nuwax/commit/60f543986bfc70c828c9755b3917911cef2660cf))
- **AppDev:** 增强源代码管理功能与版本记录面板交互 ([adddffb](https://github.com/nuwax-ai/nuwax/commit/adddffbb92086eceee5b05582b1619c989ece741))
- **appdev:** 支持会话框选择模型按范围分组 ([421d3fe](https://github.com/nuwax-ai/nuwax/commit/421d3fe45be3cc1c0c3831599879b44622cb1063))
- **AppDev:** 新增全栈应用创建与更新功能 ([24f0885](https://github.com/nuwax-ai/nuwax/commit/24f08856d6234f4abd492dfb668b81f58901e08f))
- **AppDev:** 新增全栈应用相关接口及类型定义 ([7b715fe](https://github.com/nuwax-ai/nuwax/commit/7b715fe7fdc8a6d24fb107f7e29760e52f82a528))
- **AppDev:** 新增删除节点状态管理 ([5376b0e](https://github.com/nuwax-ai/nuwax/commit/5376b0e23f5be3355a2bb241d53f3e083d0148e8))
- **AppDev:** 新增单文件上传加载状态的状态管理 ([4e764d4](https://github.com/nuwax-ai/nuwax/commit/4e764d4919ed09bc8fd376ad1ff4c6f4e3e32239))
- **AppDev:** 新增单文件上传文件的状态管理 ([1f4ce0c](https://github.com/nuwax-ai/nuwax/commit/1f4ce0c7341c3dbee0fd4e4fdceb391425813f21))
- **AppDev:** 新增单文件上传路径的状态管理 ([ca19040](https://github.com/nuwax-ai/nuwax/commit/ca190408ebe314beac739998ac29c9f1d2d64363))
- **AppDev:** 新增应用下架接口及参数定义 ([1701814](https://github.com/nuwax-ai/nuwax/commit/170181409cc75615b8c5cab7eb4c9f32cc24a1ea))
- **AppDev:** 新增应用域名管理接口及类型定义 ([89a4196](https://github.com/nuwax-ai/nuwax/commit/89a4196dfa7ee66463336127c0d7cffc6ad26d0c))
- **AppDev:** 新增提交成功后的 Git 列表刷新逻辑 ([5548cb9](https://github.com/nuwax-ai/nuwax/commit/5548cb9d3e32a246cef0b23a5d8214fa1a29617b))
- **AppDev:** 新增数据库管理功能与国际化支持 ([49cbd43](https://github.com/nuwax-ai/nuwax/commit/49cbd4353823aaa5ac086ecf5343d10bc38988b0))
- **AppDev:** 新增数据库账号密码管理接口及类型定义 ([f27e41e](https://github.com/nuwax-ai/nuwax/commit/f27e41e52c2b539a494e8fb5e6960705a14559c4))
- **AppDev:** 新增源代码管理 Hook 以支持文件修改跟踪和 Git 操作 ([8ce6698](https://github.com/nuwax-ai/nuwax/commit/8ce6698d2286a35f3b46b842fa7fcd5f69d612c4))
- **AppDev:** 新增自动发送消息定时器引用 ([d272c56](https://github.com/nuwax-ai/nuwax/commit/d272c561040ea53d78a381daef1be9810f9b34cf))
- **AppDev:** 新增设置相关功能与国际化支持 ([4283ab7](https://github.com/nuwax-ai/nuwax/commit/4283ab721876864c655892abe8b120f3ea80d6dd))
- **AppDev:** 更新应用域名管理功能与国际化支持 ([a04f155](https://github.com/nuwax-ai/nuwax/commit/a04f155d4551dedd26df6f075be65da909a84d4f))
- **AppDev:** 更新应用日志查询功能与类型定义 ([765927a](https://github.com/nuwax-ai/nuwax/commit/765927a290044bedaa34d49061f7a47d04613694))
- **appDev:** 更新文件信息接口，替换为更新文件信息类型 ([e18d5d1](https://github.com/nuwax-ai/nuwax/commit/e18d5d16d18ea8360ca740cc292302fbb98e378d))
- **AppDev:** 移除版本选择相关功能，简化项目状态管理 ([82b516c](https://github.com/nuwax-ai/nuwax/commit/82b516cc391f48256e0774fcdd0331676f808fdd))
- **AppDev:** 获取空间 ID 并更新注释 ([54a68c8](https://github.com/nuwax-ai/nuwax/commit/54a68c8720f80adcf423f62c53cc03919b22bb17))
- **AppDev:** 获取终端 WebSocket URL ([bfb1577](https://github.com/nuwax-ai/nuwax/commit/bfb15778c65c8d7118a2f35f779bcf0d3b557fb3))
- **AppDev:** 获取统一主题并更新注释 ([b9c8618](https://github.com/nuwax-ai/nuwax/commit/b9c86187aa690ff9048a39a3c3aef7f7fa3bd34e))
- **ApplicationItem:** 优化智能体子类型标签逻辑 ([c4446cb](https://github.com/nuwax-ai/nuwax/commit/c4446cb6f28134b62f859f103d6dcbf3be33ec1a))
- **ApplicationItem:** 新增智能体子类型隐藏操作项 ([8d2b1e8](https://github.com/nuwax-ai/nuwax/commit/8d2b1e8c58399a68300dd3ff905c93c46358e7ac))
- **ApplicationItem:** 移除独立会话操作项 ([d56e426](https://github.com/nuwax-ai/nuwax/commit/d56e42647c89a07aa7fa9a128b57018b3861df93))
- **ApplicationItem:** 简化临时会话操作项逻辑 ([8fc9230](https://github.com/nuwax-ai/nuwax/commit/8fc9230296d9f1ed16ae0088de463b113d996a90))
- **BindUser:** 增加左侧当前可选成员的注释说明 ([057dd0e](https://github.com/nuwax-ai/nuwax/commit/057dd0efc59dbf631860ac2f7de7e0b0eff9b08b))
- **captcha:** 支持 App 端阿里云验证码校验结果回传 ([529a079](https://github.com/nuwax-ai/nuwax/commit/529a079ea39011064c2551346546f59c360113f8))
- **ChangeFileGitDiffView:** 优化文件差异视图样式和结构 ([a53f45d](https://github.com/nuwax-ai/nuwax/commit/a53f45dd7b4225af5818cf78d4a3842d6269bc5c))
- **ChangeFileGitDiffView:** 新增文件差异对比组件 ([cbc73c7](https://github.com/nuwax-ai/nuwax/commit/cbc73c7f305560874dc5bd21b8b20749c3b93b05))
- **ChangeFileListSection:** 为已删除文件添加删除横杠线以及统一颜色 ([5ae1587](https://github.com/nuwax-ai/nuwax/commit/5ae15870531774d0b68d6c02fa924c6b6d91ead6))
- **ChangeFileListSection:** 新增合并冲突文件处理逻辑 ([f6daf26](https://github.com/nuwax-ai/nuwax/commit/f6daf26da5e38acb692257395ac9b1eff9d59873))
- **chat:** [#5](https://github.com/nuwax-ai/nuwax/issues/5)a 文件树懒加载收尾——模型层全量拉取门控 + 网关透传对齐 ([d86fe8d](https://github.com/nuwax-ai/nuwax/commit/d86fe8dc54ae28cd2bf08b1b5cc8b8a5a878e57a))
- **ChatArea:** 新增会话结束回调功能 ([60276f7](https://github.com/nuwax-ai/nuwax/commit/60276f72ffd6d50d1b311156d7c3e82a17226997))
- **ChatArea:** 重构数据资源列表组件并优化样式 ([8db2930](https://github.com/nuwax-ai/nuwax/commit/8db2930bc1ebe9939da841fb02b6420e1157e2a3))
- **ChatCore:** 优化聊天核心组件状态管理 ([e626dae](https://github.com/nuwax-ai/nuwax/commit/e626dae7b7a3e62a676bc723fb99b286e7ab1f20))
- **ChatCore:** 增加初始智能体模式支持 ([965e7fd](https://github.com/nuwax-ai/nuwax/commit/965e7fd50b5214aafa105b91e55eefe91826c222))
- **ChatCore:** 增强聊天核心组件的文件处理逻辑 ([098ba81](https://github.com/nuwax-ai/nuwax/commit/098ba813d13d577881c14fcc5d8600e2454db14e))
- **ChatCore:** 新增 Git 源代码管理 props 注释 ([7b4466d](https://github.com/nuwax-ai/nuwax/commit/7b4466d5355d988f807096666b5054276e70ec91))
- **ChatFileTreeSidebar:** 重构文件预览逻辑与样式 ([c3b1b21](https://github.com/nuwax-ai/nuwax/commit/c3b1b21d0b9dbc08c211e65a3585fed30452e1ad))
- **Chat:** 为左侧内容区域添加注释说明 ([482c3f9](https://github.com/nuwax-ai/nuwax/commit/482c3f98504f47a0e756cf373b071b00c1fe55d5))
- **Chat:** 优化文件预览功能，关闭版本记录面板 ([68de98c](https://github.com/nuwax-ai/nuwax/commit/68de98cd68074831f6b78cbc0a3cae86eb2fbe87))
- **Chat:** 优化文件预览功能，关闭版本记录面板 ([f7bdd27](https://github.com/nuwax-ai/nuwax/commit/f7bdd272822edc38f1ae9723ded87020cdc9c4d0))
- **chat:** 会话内搜索——顶栏搜索入口+本地过滤+滚动定位高亮 ([506b752](https://github.com/nuwax-ai/nuwax/commit/506b75233d4bc854085337646ad41f74134808d0))
- **Chat:** 增加移动端适配逻辑，优化最小宽度设置 ([9281ec1](https://github.com/nuwax-ai/nuwax/commit/9281ec1cd19d79dc7453286ac002c9f9f1550e59))
- **Chat:** 增强底部终端功能与布局管理 ([71f60b1](https://github.com/nuwax-ai/nuwax/commit/71f60b1e7c5854e97d5ac510d5d08ca3291452d4))
- **Chat:** 增强文件预览与 Git 源代码管理功能 ([770db32](https://github.com/nuwax-ai/nuwax/commit/770db32b0bc9cbedb9daab395365a83363d0426a))
- **chat:** 工作区文件导航——fileDataSource 抽象 + TaskResult 选文件路由到逐级文件树 + openWorkspaceFile 预览适配 ([566b322](https://github.com/nuwax-ai/nuwax/commit/566b32297da11e3ee59aa612f9f24612aaf23908))
- **chat:** 支持会话图标修改与上传并同步刷新列表 ([c45f19b](https://github.com/nuwax-ai/nuwax/commit/c45f19b323426011fbcd9c788421ebb9e526fab4))
- **chat:** 支持会话重命名和删除的状态实时同步 ([c40311d](https://github.com/nuwax-ai/nuwax/commit/c40311dee25a9eb9d86878679916eb6e6a8b9acb))
- **chat:** 支持对话输入框空间选择并重构项目创建与推荐逻辑 ([297d617](https://github.com/nuwax-ai/nuwax/commit/297d6175ff9c59fabf6d7a64eed7a09432408eb5))
- **chat:** 支持技能详情页面默认展开并固定文件树 ([47f9490](https://github.com/nuwax-ai/nuwax/commit/47f94909c0d793db18e16f46d2f76dcb0a4e1190))
- **chat:** 支持控制清空会话图标展示并在设备智能体下隐藏 ([fac0572](https://github.com/nuwax-ai/nuwax/commit/fac0572aee8ab67112dd4e96e16cb6a710bed6da))
- **Chat:** 新增 Git 版本记录面板功能 ([64838b5](https://github.com/nuwax-ai/nuwax/commit/64838b50907376f11f49c8375cb08bc8da1a0f95))
- **chat:** 新增会话流式恢复(sub)订阅与权限审批 DockPanel 显示修复 ([447d00e](https://github.com/nuwax-ai/nuwax/commit/447d00ee03bf845d7db3e59552d204eafcfbd685))
- **chat:** 本地目录数据面改走 file-server（customTargetDir）——浏览器与客户端同链路 ([c29ba3c](https://github.com/nuwax-ai/nuwax/commit/c29ba3ce863432057882fd1e6406b6fa8f189723))
- **chat:** 消息队列按会话持久化到 localStorage ([d61c558](https://github.com/nuwax-ai/nuwax/commit/d61c5585e91d776a89ab4e6340cf27932185b9ad))
- **Chat 组件:** 优化终端控制逻辑与状态管理 ([20e2074](https://github.com/nuwax-ai/nuwax/commit/20e20746180b13370f817b1a411633432e641337))
- **chat:** 输入框草稿缓存——离开会话再回来内容还在(对齐飞书/微信) ([8d759f3](https://github.com/nuwax-ai/nuwax/commit/8d759f30e98a55164ffbbdf338e2a45126efb83d))
- **CodeEditor:** 增加主题支持与样式优化 ([9bfcaa4](https://github.com/nuwax-ai/nuwax/commit/9bfcaa4b83cc52b6e9127e7ade78e9d8e6d01cff))
- **components:** 为 ACP 权限审批卡片增加 Esc 快捷键绑定及状态修复 ([dd3f148](https://github.com/nuwax-ai/nuwax/commit/dd3f148c6ce6c27e6cbe1cbe777eb99d20f60924))
- **components:** 优化 ACP 和 MCP 卡片的键盘交互与按钮样式一致性 ([83d1d20](https://github.com/nuwax-ai/nuwax/commit/83d1d20ad91be8a774aa71c7ca291658b805f14f))
- **components:** 优化 Agent 模式选择器与国际化支持 ([9a22296](https://github.com/nuwax-ai/nuwax/commit/9a222962667f335861c84f896f249d763b9f9baa))
- **components:** 优化文件树面板创建文件/文件夹功能 ([834d489](https://github.com/nuwax-ai/nuwax/commit/834d4896b6a2dfc1655e544a8cf0e0bb1f3e7e8d))
- **components:** 优化文件树面板重命名节点逻辑 ([15a1b3d](https://github.com/nuwax-ai/nuwax/commit/15a1b3da8f82e6fec33c8ccc4e0127bb68cbebf8))
- **components:** 优化版本记录面板加载样式与逻辑 ([17233cb](https://github.com/nuwax-ai/nuwax/commit/17233cb11f468658eeac7b145a1acff5f3541ee7))
- **components:** 增加智能体交互模式本地缓存并全链路透传配置 ([a8c899c](https://github.com/nuwax-ai/nuwax/commit/a8c899ccfc05fbf62880172abd4dca999f6f098b))
- **components:** 增强底部控制台功能与布局信号管理 ([dae2c46](https://github.com/nuwax-ai/nuwax/commit/dae2c464b91a4b142c1f0fdc479c5cfc94fd6a55))
- **components:** 增强底部控制台的信号管理与激活 Tab 功能 ([e1a447f](https://github.com/nuwax-ai/nuwax/commit/e1a447f137b6554a2fb7baea5473fd9d369e52d4))
- **components:** 增强版本管理功能支持 ([e690d7c](https://github.com/nuwax-ai/nuwax/commit/e690d7cee4db9b32ee6cbebc6e032d25101d7add))
- **components:** 实现创建项目页面大模型选择与快捷组件功能 ([d13da02](https://github.com/nuwax-ai/nuwax/commit/d13da029584d2167493d98f3e11888c41a900e44))
- **components:** 实现智能体选择模型根据 scope 进行分组展示 ([c72b501](https://github.com/nuwax-ai/nuwax/commit/c72b501be7926cde11d7646d549eece22d693582))
- **components:** 封装并引入技能详情会话自适应头部及发布按钮插槽 ([0e5b6fd](https://github.com/nuwax-ai/nuwax/commit/0e5b6fd8c49833e512ecacfa3e5826faf24bec45))
- **components:** 扩展 UnifiedChatSession 的 mode 属性支持自定义聊天框底部样式 ([bf19abd](https://github.com/nuwax-ai/nuwax/commit/bf19abd736706a1e66b141b9a6dba5c4ae9ff60b))
- **components:** 支持 Markdown 过程分组在正文输出时自动平滑收起 ([39bec65](https://github.com/nuwax-ai/nuwax/commit/39bec65649fd2613e2230baf09dcea9bad92729b))
- **components:** 支持创建项目时根据 activeTab 场景过滤 @ 提及技能列表 ([da1e9f3](https://github.com/nuwax-ai/nuwax/commit/da1e9f35e273e7d6c170fa80b03ea8525c191f08))
- **components:** 支持在 Markdown 渲染中解析会话标签并转为任务详情按钮 ([a333118](https://github.com/nuwax-ai/nuwax/commit/a3331183599f63490fc8207077180cbdcdaf01ff))
- **components:** 支持已完成消息的工具调用过程分组默认自动收起 ([a3ba6eb](https://github.com/nuwax-ai/nuwax/commit/a3ba6eb01e69b1e07a0b0e6231bc3dc01bc99630))
- **components:** 支持渲染自定义 agent-info 聊天组件 ([6d53528](https://github.com/nuwax-ai/nuwax/commit/6d53528a808dd3f03e5475faab94e78eb0a3e37c))
- **components:** 新增 Git discard 后的 UI 同步功能 ([003de8f](https://github.com/nuwax-ai/nuwax/commit/003de8ff69ee51f0fb0bc4d793618cbe11270d9a))
- **components:** 新增 showDebug 属性以控制聊天消息调试面板的显隐 ([da9e7b7](https://github.com/nuwax-ai/nuwax/commit/da9e7b7d7d6a4fc16765403e0c248f21afe8fd3f))
- **components:** 新增变更文件列表区块及样式 ([8afc06d](https://github.com/nuwax-ai/nuwax/commit/8afc06da97a2410ef6273fcc35692e112825f3ed))
- **components:** 新增开发日志操作按钮组及面板 ([88c79bc](https://github.com/nuwax-ai/nuwax/commit/88c79bcd3af3a9945c41c69ff10a4c82349559d5))
- **components:** 新增执行计划列表自动滚动跟随与手动暂停机制 ([c7a3c03](https://github.com/nuwax-ai/nuwax/commit/c7a3c0322e243aebe79c1fd20c60a99b290376a0))
- **components:** 新增文件树 Git 源面板及相关功能 ([30f775a](https://github.com/nuwax-ai/nuwax/commit/30f775a2f98c752ad9c02f7ff2a708dfbc383036))
- **components:** 新增文件树 Git 源面板的可折叠侧栏功能 ([d1e5d60](https://github.com/nuwax-ai/nuwax/commit/d1e5d6087ef441351af5149fdfb0e122ea46d44f))
- **components:** 新增文件树刷新功能及样式调整 ([8589f9a](https://github.com/nuwax-ai/nuwax/commit/8589f9ade23e9c4b1f275f359207d4810bcf66d2))
- **components:** 新增文件树面板的类型检查与功能增强 ([12b37e0](https://github.com/nuwax-ai/nuwax/commit/12b37e0e733e5e3cf5cb80a728d650cef60691f7))
- **components:** 新增源代码管理面板及相关功能 ([09df004](https://github.com/nuwax-ai/nuwax/commit/09df004974ab8285d0f977ebc221cfa1638cee73))
- **components:** 新增群组智能体相关功能 ([cdb1837](https://github.com/nuwax-ai/nuwax/commit/cdb1837ad4acaf577e54a8cbe160b5ce286ee3f0))
- **components:** 新增调用审批功能支持 ([ccd6fd8](https://github.com/nuwax-ai/nuwax/commit/ccd6fd8bc0896f22e04dcab50553982989d21cd5))
- **components:** 更新文件变更列表功能与样式 ([a143910](https://github.com/nuwax-ai/nuwax/commit/a1439109fcd699f2ffc78eb8c80cb7a203e07f19))
- **components:** 更新文件树 Git 源面板类型定义 ([0677f97](https://github.com/nuwax-ai/nuwax/commit/0677f972e5501e60fa434b108ea417ee03cd9972))
- **components:** 更新智能体模式选择器逻辑 ([cec900b](https://github.com/nuwax-ai/nuwax/commit/cec900b53e2686b461d045dbb46449350dd0f6d6))
- **components:** 更新智能体模式选择器逻辑与样式调整 ([6142411](https://github.com/nuwax-ai/nuwax/commit/61424110b1f96279f261df83cdbd4ab2ad7667a8))
- **components:** 移除文件树组件中的聊天加载状态相关代码 ([20e586d](https://github.com/nuwax-ai/nuwax/commit/20e586d9196a84fc8400b962f4b130f2e3dce2bc))
- **components:** 移除权限审批组件中的取消功能与取消按钮 ([b19e8e0](https://github.com/nuwax-ai/nuwax/commit/b19e8e01a54b3e0f13f7c5879f80722e850eabe5))
- **ConnectorManage:** 优化连接器管理列表的列布局与样式隔离 ([87e99ed](https://github.com/nuwax-ai/nuwax/commit/87e99ed5ac4b2d34d91c094566d227782a29e7d0))
- **ConnectorManage:** 完成添加工具功能 ([1bbbf9a](https://github.com/nuwax-ai/nuwax/commit/1bbbf9a8da616d8b22115d1b7cbef0eb0dc256dd))
- **ConnectorManage:** 实现启用/停用操作调用真实 API ([005296a](https://github.com/nuwax-ai/nuwax/commit/005296a665c84afa66bf772ad690ac6d1df179cd))
- **ConnectorManage:** 实现导入官方包与工具调试功能 ([fbd2edc](https://github.com/nuwax-ai/nuwax/commit/fbd2edcc01e039f18916b63241eb9c645a140d55))
- **ConnectorManage:** 实现工具编辑功能并精简详情抽屉工具栏 ([56bc1bc](https://github.com/nuwax-ai/nuwax/commit/56bc1bcf50f8b08ffc6caa5fb12c0ba60da184c6))
- **ConnectorManage:** 实现连接器导出功能（导出全部/所选/单行） ([4a19c43](https://github.com/nuwax-ai/nuwax/commit/4a19c43f1662e74d85d095505bf79526ae1eac3e))
- **ConnectorManage:** 实现连接器新增与编辑功能 ([1df3945](https://github.com/nuwax-ai/nuwax/commit/1df39454adfeb4d1b27043e162de324dd9c28566))
- **ConnectorManage:** 新增系统管理-连接器管理列表页 ([f06e98a](https://github.com/nuwax-ai/nuwax/commit/f06e98a8fc2c441567ac83f0db6fb22631d1704a))
- **ConnectorManage:** 筛选态禁用拖拽 + 修复虚拟列表最后一行裁切 ([2167d64](https://github.com/nuwax-ai/nuwax/commit/2167d64022d661bfdba8970e98d518da622d5dee))
- **Connector:** 新增连接器菜单图标并完成前端配置 ([e1e0f7c](https://github.com/nuwax-ai/nuwax/commit/e1e0f7c2d3ef3c06f5a03f47a163a9038093949e))
- **Connector:** 详情页已连接状态新增断开连接按钮 ([be103a7](https://github.com/nuwax-ai/nuwax/commit/be103a7343e246160e813d656e94d874d9de4578))
- **Connector:** 连接器列表筛选搜索改造与详情/调试子页面重构 ([89c3461](https://github.com/nuwax-ai/nuwax/commit/89c346161c85dfece1347b2ee2ec1ca4024dc5eb))
- **conversation-agent:** 优化新创建智能体与云电脑的自动绑定时序与防重复调用 ([345021e](https://github.com/nuwax-ai/nuwax/commit/345021e1e09d759762da8e33557c6388f33f8ce2))
- **conversation:** /mock-chat dev acceptance page with Umi SSE mock replay ([f46d99e](https://github.com/nuwax-ai/nuwax/commit/f46d99ef190f82b84200933171d1f1bfb640f668))
- **conversation:** 5c 会话内搜索收尾 + 会话/消息分享落地页(mock 全链路) ([794b295](https://github.com/nuwax-ai/nuwax/commit/794b2957d92927a2002d12bf337645ec6e9947c4))
- **conversation:** 5c 会话内搜索收尾 + 会话/消息分享落地页(mock 全链路) ([f1a78b2](https://github.com/nuwax-ai/nuwax/commit/f1a78b2f6718544fcf32a6e59e065e468dbb5e72))
- **conversation:** add message store and transport for runtime line ([4c99513](https://github.com/nuwax-ai/nuwax/commit/4c99513c0473491ba23061eef5ef2861696778fe))
- **conversation:** add runtime line flag and react binding ([a5485d9](https://github.com/nuwax-ai/nuwax/commit/a5485d9c8cace8f628932ab81c100b26fd413e7c))
- **conversation:** add runtime session send lifecycle ([5c8080b](https://github.com/nuwax-ai/nuwax/commit/5c8080b9d9f6342b8ba50699645ebe9780695ea8))
- **ConversationAgentBottomConsole:** 增强控制台功能与样式 ([ed905c6](https://github.com/nuwax-ai/nuwax/commit/ed905c6fa4afa739e801f4a1b0f36633bf430bf4))
- **ConversationAgentBottomConsole:** 添加标签点击切换功能 ([a83a217](https://github.com/nuwax-ai/nuwax/commit/a83a21775863fab6c6c7a773023f90fb75ffed35))
- **ConversationAgentSourceControl:** 增强状态徽章样式和逻辑 ([ecaeb65](https://github.com/nuwax-ai/nuwax/commit/ecaeb655ec599d50b846bbd5420f36ecb00a94fc))
- **ConversationAgentSourceControl:** 添加放弃更改的二次确认功能 ([4ba8d1d](https://github.com/nuwax-ai/nuwax/commit/4ba8d1d89b6c0f26321c09a6119eda3d4ec5a405))
- **ConversationAgent:** 优化头部组件样式与发布按钮逻辑 ([b7c4a34](https://github.com/nuwax-ai/nuwax/commit/b7c4a34191ce3d45bbaf783ce867ffeb400ae116))
- **ConversationAgent:** 优化工作区工具页签管理逻辑 ([7590b95](https://github.com/nuwax-ai/nuwax/commit/7590b95120089e3e685aa050b8f4a0f805f452df))
- **ConversationAgent:** 优化文件操作与标签管理功能 ([d0780f3](https://github.com/nuwax-ai/nuwax/commit/d0780f30ad3eb5995abd9d8c983874783b56abde))
- **ConversationAgent:** 优化文件树刷新逻辑 ([c9095cd](https://github.com/nuwax-ai/nuwax/commit/c9095cdc7fe26eda427ced337792b327b768ebaf))
- **ConversationAgent:** 优化文件路径头部组件与预览功能 ([a1c0348](https://github.com/nuwax-ai/nuwax/commit/a1c0348a0a5f3293fe629e0d568ac22b8eb8623b))
- **ConversationAgent:** 优化智能体对话面板与头部组件 ([c056135](https://github.com/nuwax-ai/nuwax/commit/c0561354ea03705eac438fef890edce1135b70e9))
- **ConversationAgent:** 优化版本管控逻辑与状态管理 ([1dc760d](https://github.com/nuwax-ai/nuwax/commit/1dc760d9c6c4b8c1c077e1b417ecfc73ddfb8dbe))
- **ConversationAgent:** 优化订阅功能的显示逻辑 ([80ec26f](https://github.com/nuwax-ai/nuwax/commit/80ec26fa826d3d2c0052b5c32bbb44e766827914))
- **ConversationAgent:** 优化预览标签栏的拖拽与点击交互 ([f092a56](https://github.com/nuwax-ai/nuwax/commit/f092a569ece17aa710452cc205d9def9e3eda648))
- **ConversationAgent:** 删除不再使用的编排配置区组件及样式 ([ced1caa](https://github.com/nuwax-ai/nuwax/commit/ced1caa67a3fff6e7415700aaaa7717fac28a132))
- **ConversationAgent:** 在成功处理后刷新 Git 列表 ([08a1e25](https://github.com/nuwax-ai/nuwax/commit/08a1e25c46432608647c132fa49150b26883accc))
- **ConversationAgent:** 在成功处理后刷新 Git 列表 ([d7ff863](https://github.com/nuwax-ai/nuwax/commit/d7ff8639f1c9c00e59926020825c2e1804c06d20))
- **ConversationAgent:** 增加回滚成功后的 Git 源代码管理状态刷新 ([9f37754](https://github.com/nuwax-ai/nuwax/commit/9f377548b0d2154dca28fafb4a0a96d7d43bdf5f))
- **ConversationAgent:** 增加按钮禁用状态和变更检测逻辑 ([7044c85](https://github.com/nuwax-ai/nuwax/commit/7044c850ddb8a0a3b4a231f3925d0d23c5dea9a0))
- **ConversationAgent:** 增加文件/文件夹删除后的标签管理功能 ([94f797e](https://github.com/nuwax-ai/nuwax/commit/94f797e125dc7393717fdce9ca0b15a6b0c0307c))
- **ConversationAgent:** 增加模型切换功能与样式优化 ([0faada5](https://github.com/nuwax-ai/nuwax/commit/0faada5c0f2504d12bc8c96dc5c5a2a51ce640a9))
- **ConversationAgent:** 增强 Git 暂存和取消暂存功能，支持文件夹右键菜单操作 ([9eb2214](https://github.com/nuwax-ai/nuwax/commit/9eb22140a41e51437c0d00597382a29e4d43567d))
- **ConversationAgent:** 增强会话状态管理与流式交互 ([f74ed90](https://github.com/nuwax-ai/nuwax/commit/f74ed907dc5e47d2339eff1d172bc201fea61369))
- **ConversationAgent:** 增强底部控制台与预览区域的交互 ([bfe8962](https://github.com/nuwax-ai/nuwax/commit/bfe896226bc66071904d9564e6c46de98fa4e275))
- **ConversationAgent:** 增强文件内容实时保存功能 ([5207f59](https://github.com/nuwax-ai/nuwax/commit/5207f595cd1a094332429d22bc085dbc374de2aa))
- **ConversationAgent:** 增强文件树侧边栏功能 ([4047caf](https://github.com/nuwax-ai/nuwax/commit/4047caf68a0dcbf6a79bbe5681f7214c1c4b8c86))
- **ConversationAgent:** 增强文件预览与标签栏功能 ([b3ff5ff](https://github.com/nuwax-ai/nuwax/commit/b3ff5fff173b8bef2f95a401858dfe8f25d9b7b5))
- **ConversationAgent:** 增强文件预览功能，新增标签页管理 ([869f3ad](https://github.com/nuwax-ai/nuwax/commit/869f3adfb03011131bd12d51a27cd97a0c703f59))
- **ConversationAgent:** 增强文件预览功能与视图切换 ([e0d22d6](https://github.com/nuwax-ai/nuwax/commit/e0d22d6f78b241be3eee86aadd048f13940e3711))
- **ConversationAgent:** 增强智能体电脑（VNC）功能与样式优化 ([44152f6](https://github.com/nuwax-ai/nuwax/commit/44152f608af736daeb0d3f292d2c07c9f4abab64))
- **ConversationAgent:** 增强智能体电脑功能与文件预览 ([4604683](https://github.com/nuwax-ai/nuwax/commit/4604683efff043de7b422f78d3f96a0091518c28))
- **ConversationAgent:** 增强智能体配置更新逻辑 ([6ecfe95](https://github.com/nuwax-ai/nuwax/commit/6ecfe95a5396e8084a77a7f4d14b63a2b28b92a2))
- **ConversationAgent:** 增强标签栏功能与中间面板交互 ([92a5c6e](https://github.com/nuwax-ai/nuwax/commit/92a5c6e4adc71beec59b86c8581cf640edc48053))
- **ConversationAgent:** 增强标签滚动视口功能 ([584b130](https://github.com/nuwax-ai/nuwax/commit/584b130389715e91cd6cd8ba1e13f953dccaf44e))
- **ConversationAgent:** 增强终端全屏展开功能 ([fc0c927](https://github.com/nuwax-ai/nuwax/commit/fc0c927d9b77fbd9e5cd812b8acb123897488352))
- **ConversationAgent:** 增强预览标签页功能与国际化支持 ([4d2e888](https://github.com/nuwax-ai/nuwax/commit/4d2e888387912fe2b245e580f16cfae36028d6af))
- **ConversationAgent:** 新增 Git 列表刷新功能及相关国际化支持 ([c2a5f2b](https://github.com/nuwax-ai/nuwax/commit/c2a5f2b9839079e4e9073c42d2ebae5f4542d672))
- **ConversationAgent:** 新增 Git 提交记录面板及相关国际化支持 ([84756ec](https://github.com/nuwax-ai/nuwax/commit/84756ec0eaad6bacfe18918a2314cc5ac366af18))
- **ConversationAgent:** 新增会话结束回调功能 ([2b85d21](https://github.com/nuwax-ai/nuwax/commit/2b85d21c5449e10958523aa652f2c7fbc5d45acf))
- **ConversationAgent:** 新增分析统计功能与样式优化 ([af57f63](https://github.com/nuwax-ai/nuwax/commit/af57f63ec3c8d58f469fb2d4d6a5e3df08c8c9ee))
- **ConversationAgent:** 新增文件差异对比功能及相关组件 ([6d91efc](https://github.com/nuwax-ai/nuwax/commit/6d91efc199ce9ad92f3e74e71dd257a9e2fb089a))
- **ConversationAgent:** 新增文件差异视图组件并优化样式 ([80b691a](https://github.com/nuwax-ai/nuwax/commit/80b691a7a451191d09bb5f6372f0ef3032aa0bba))
- **ConversationAgent:** 新增文件路径头部组件及样式 ([6055c1b](https://github.com/nuwax-ai/nuwax/commit/6055c1be8f76cce3e5adf401879497485b37c44b))
- **ConversationAgent:** 新增沙盒日志轮询与控制功能 ([8fb38ae](https://github.com/nuwax-ai/nuwax/commit/8fb38ae9222b05d0685a77ae8ad716bc89599858))
- **ConversationAgent:** 新增终端面板功能与按钮 ([b031369](https://github.com/nuwax-ai/nuwax/commit/b031369fc9bc952d9d30bb2e26b5c9a3d47ca1c0))
- **ConversationAgent:** 新增编排功能及国际化支持 ([a8a850a](https://github.com/nuwax-ai/nuwax/commit/a8a850adefd20b5f701afaf2894daeb47c97723a))
- **ConversationAgent:** 新增聊天会话组件及相关逻辑 ([8edbbc5](https://github.com/nuwax-ai/nuwax/commit/8edbbc559faf8e26c4a92260e483f4b5b71d34a9))
- **ConversationAgent:** 新增重启智能体与服务器功能 ([9ec8f9b](https://github.com/nuwax-ai/nuwax/commit/9ec8f9b1d8193370d7c02e6c26c77d6b6dfea4d5))
- **ConversationAgent:** 新增项目导入功能与弹窗 ([dd99013](https://github.com/nuwax-ai/nuwax/commit/dd990133830aef3741e9458bece041fd55016c3c))
- **ConversationAgent:** 添加 Git 版本管理服务与类型定义 ([f5f17ed](https://github.com/nuwax-ai/nuwax/commit/f5f17ede09ea816fcd9b8c92589a55e23953e444))
- **ConversationAgent:** 添加文件选择预览功能 ([5bb5473](https://github.com/nuwax-ai/nuwax/commit/5bb547380255db638d480785cc7e877059f36bea))
- **ConversationAgent:** 添加标签拖拽排序功能 ([4a9c501](https://github.com/nuwax-ai/nuwax/commit/4a9c501563e3a79f4d71e5ec06db62f3691565cc))
- **ConversationAgent:** 添加终端组件及相关样式 ([4dd8644](https://github.com/nuwax-ai/nuwax/commit/4dd864466606ac8c94d37fc093e3753a3c7efc33))
- **ConversationAgent:** 添加订阅设置与统计功能 ([5357002](https://github.com/nuwax-ai/nuwax/commit/535700227cb27f66025a942a8f5a086264c2c45e))
- **ConversationAgent:** 移除 gitignore 失败提示逻辑 ([5037c98](https://github.com/nuwax-ai/nuwax/commit/5037c989475723fe348842138c8925a3039f48c5))
- **ConversationAgent:** 移除不再使用的文件路径头部工具栏和分享弹窗组件 ([d582f51](https://github.com/nuwax-ai/nuwax/commit/d582f5110626e8e93cfdc2408a3c3325912b57d3))
- **ConversationAgent:** 移除不必要的翻译项并增加发布功能 ([2b92b34](https://github.com/nuwax-ai/nuwax/commit/2b92b348d6a8b9678e7061fbb8926d26499e8686))
- **ConversationAgent:** 移除冗余的会话状态属性 ([c408700](https://github.com/nuwax-ai/nuwax/commit/c408700cf252e93d0a735544c4f611c4b90f48ea))
- **ConversationAgent:** 移除分析统计相关逻辑与样式 ([06af953](https://github.com/nuwax-ai/nuwax/commit/06af9535bf3d28e47a8cf39e46e0e49950bf6b63))
- **ConversationAgent:** 移除展示台相关逻辑与组件 ([18d1726](https://github.com/nuwax-ai/nuwax/commit/18d172651d0c7d57346d3d3560e2e0d920617c51))
- **ConversationAgent:** 移除提交成功后的文件预览保存逻辑 ([34b4cc0](https://github.com/nuwax-ai/nuwax/commit/34b4cc0d1ef99509f3cb3e5b08d6c6210c2f10ab))
- **ConversationAgent:** 精简会话代理组件逻辑 ([c5fd39b](https://github.com/nuwax-ai/nuwax/commit/c5fd39b8982e0ec7c841b9154d05bc047c792062))
- **ConversationAgent:** 精简会话状态判断逻辑 ([d8de728](https://github.com/nuwax-ai/nuwax/commit/d8de72859f3830c13a4fd9952a28cf4f4a94fa91))
- **ConversationAgent:** 精简智能体页面组件与状态管理 ([dc96861](https://github.com/nuwax-ai/nuwax/commit/dc9686114fca7884d637695f7240b61b42f9093a))
- **ConversationAgent:** 进入页面的时候查询 git status ([2a68876](https://github.com/nuwax-ai/nuwax/commit/2a68876c894a636cf0a2dcd2000b7960745b66d5))
- **ConversationAgent:** 重构文件路径头部与预览区域 ([765626e](https://github.com/nuwax-ai/nuwax/commit/765626e9a13812c7558f42d0cff7042b8b04edcb))
- **conversation:** ask 卡标题超长改为 antd Paragraph 展开收起——去 line-clamp 硬剪 ([8e4a3f1](https://github.com/nuwax-ai/nuwax/commit/8e4a3f1c3fdc4f7c01e3d2528f6035bc465a743c))
- **ConversationBottomConsole:** 优化控制台面板显示逻辑 ([46cff2e](https://github.com/nuwax-ai/nuwax/commit/46cff2e8eeeacb1a7231ba676566db3cb79df8f7))
- **ConversationBottomConsole:** 优化终端尺寸适配与渲染逻辑 ([3850c7d](https://github.com/nuwax-ai/nuwax/commit/3850c7d8ca6f50d8b4b5266dad624dc8b6d3d8ac))
- **ConversationBottomConsole:** 优化终端布局与可见性处理 ([3a912ba](https://github.com/nuwax-ai/nuwax/commit/3a912ba86f9678c4d4e0a7f9f8ade422cd48be3d))
- **ConversationBottomConsole:** 优化终端连接逻辑与尺寸同步 ([14ce3f0](https://github.com/nuwax-ai/nuwax/commit/14ce3f0421acb1f4832135afedad3160ad15c54b))
- **ConversationBottomConsole:** 优化终端面板展开逻辑与状态管理 ([81bbd26](https://github.com/nuwax-ai/nuwax/commit/81bbd26a5315c4f5d07a872daa190f85f276b690))
- **ConversationBottomConsole:** 优化终端面板布局同步与聚焦逻辑 ([3eb5bf7](https://github.com/nuwax-ai/nuwax/commit/3eb5bf7bd0c5f4b71bc48868f60f1ad8904e7c50))
- **ConversationBottomConsole:** 优化重连按钮样式和功能 ([e6fbd65](https://github.com/nuwax-ai/nuwax/commit/e6fbd65801370d5e809b88fdc34143e9bc41f850))
- **ConversationBottomConsole:** 优化首次展开终端面板的逻辑 ([687b795](https://github.com/nuwax-ai/nuwax/commit/687b795d20c7e510db772a240d3ccfcdd211745e))
- **ConversationBottomConsole:** 修改控制台布局模式及默认工作区标签 ([5714d29](https://github.com/nuwax-ai/nuwax/commit/5714d29dd30b2b37bba46a0ef757845cd208f46f))
- **ConversationBottomConsole:** 增加终端重连配置与 UI 展示逻辑 ([d8c508f](https://github.com/nuwax-ai/nuwax/commit/d8c508fec04150bbe55f96f8c4206166bc4c74ec))
- **ConversationBottomConsole:** 增强外部信号处理逻辑 ([6ac0313](https://github.com/nuwax-ai/nuwax/commit/6ac0313697dd51da3e551fd1500a8c70597a9691))
- **ConversationBottomConsole:** 增强容器启动错误处理 ([f937143](https://github.com/nuwax-ai/nuwax/commit/f937143d333c59ca2cff13dbbb69020f68cafa51))
- **ConversationBottomConsole:** 增强容器管理与错误处理 ([f692773](https://github.com/nuwax-ai/nuwax/commit/f692773a2c376102e4f81d61dc9180cf10a1fedf))
- **ConversationBottomConsole:** 新增保活轮询功能和手动重连逻辑 ([93c8945](https://github.com/nuwax-ai/nuwax/commit/93c89454aa4fb2a652681f7228d8a4a283463a9e))
- **ConversationBottomConsole:** 新增底部控制台及开发日志面板 ([f115232](https://github.com/nuwax-ai/nuwax/commit/f1152321613046d6ff52476520b3842bef70620e))
- **ConversationBottomConsole:** 新增终端自动连接功能 ([10f9272](https://github.com/nuwax-ai/nuwax/commit/10f9272a58b4b4da9b8fdc6a55e3e67d66b06c37))
- **ConversationBottomConsole:** 移除容器错误状态相关逻辑 ([f7bb0c0](https://github.com/nuwax-ai/nuwax/commit/f7bb0c07217a8faba939d97979ba7c976fa4d8a1))
- **conversation:** close runtime line known gaps ([1ff38e7](https://github.com/nuwax-ai/nuwax/commit/1ff38e7540d723d0ea5fa0c4f569b88b39da0b45))
- **conversation:** createAlwaysLogger 加 ISO 时间戳前缀，onClose 补 always-on 日志 ([76754b8](https://github.com/nuwax-ai/nuwax/commit/76754b8a3bd773772c5479d4d90e8cbba2d9f561))
- **ConversationDetails:** 移除智能体主页文件树视图相关逻辑与样式，智能体主页中不显示智能体远程桌面组件 ([26246d4](https://github.com/nuwax-ai/nuwax/commit/26246d4f26e02a5c57e2dc504472d3356918cdde))
- **conversation:** ExitPlanMode 审批三件套——计划文档卡片 + 选项语义标签 + 批准后档位回写 ([be9f1ab](https://github.com/nuwax-ai/nuwax/commit/be9f1abcb25c027963bd72844eb240be427aa363))
- **conversation:** extend runtime session with load snapshot resume ([6758856](https://github.com/nuwax-ai/nuwax/commit/6758856986c06c1c02f9f9b7cd40e9f65620199e))
- **conversation:** finalize terminal 日志补 origin 字段，区分终态到达路径 ([252ced9](https://github.com/nuwax-ai/nuwax/commit/252ced93c5c921779b4b7c52599efe5374d57ede))
- **conversation:** fold turn work trace and preserve final summary ([421150e](https://github.com/nuwax-ai/nuwax/commit/421150e9c2dae0fa3b5b6de006bb33921634845e))
- **conversationInfo:** 新增 Git 源代码管理列表刷新功能 ([d0591b4](https://github.com/nuwax-ai/nuwax/commit/d0591b41548c08f2eaed1792d67932614adfe9c4))
- **conversation:** M2 mock-chat 断言型 E2E 全场景回归 ([d8f7708](https://github.com/nuwax-ai/nuwax/commit/d8f77082c364b15b992dbeb8c68087ea816a711f))
- **conversation:** M3 mock-chat 交互型 E2E + 真实时长场景 + 补全 ([04b7684](https://github.com/nuwax-ai/nuwax/commit/04b7684785b8e209a14ff364fcf0af5e61bd084a))
- **conversation:** mock scenarios align with real UI contracts + absorb demos ([465426b](https://github.com/nuwax-ai/nuwax/commit/465426bc99c9eb3d4481fdc11c0ea98405402d27))
- **conversation:** mock 新增折叠效果全景演示场景 COLLAPSE_SHOWCASE ([954931e](https://github.com/nuwax-ai/nuwax/commit/954931eb91493da3357a76593fe8a98b307426b2))
- **conversation:** P0 会话渲染三件套——终端输出 / Plan 进度 / 工具耗时 ([80c3960](https://github.com/nuwax-ai/nuwax/commit/80c3960a23209c016f8b660f8ceb695c216748c3))
- **conversation:** V2 历史轮轨迹默认展开 + 空工具详情不渲染 ([6ee473f](https://github.com/nuwax-ai/nuwax/commit/6ee473fc83272d3b303860a6349b90d674c560bb))
- **conversation:** V2 可控会话渲染双线重构——结构化投影 + 两级工作轨迹 ([d0993b5](https://github.com/nuwax-ai/nuwax/commit/d0993b5f37cb106625e3cfc6f59182530e133cf9))
- **conversation:** V2 工作轨迹折叠条 hairline 风格 ([70887be](https://github.com/nuwax-ai/nuwax/commit/70887be280f7ab9ddd86c0f51a3bf67c5d17732f))
- **conversation:** V2 工具节点行尾操作区——耗时/复制/分享 ([0e8e365](https://github.com/nuwax-ai/nuwax/commit/0e8e3651e8a5a34840d2e9ea1a641f0ae32e07eb))
- **conversation:** V2 工具行操作区改为收起态常驻(对齐 V1 单行卡) ([6e1248f](https://github.com/nuwax-ai/nuwax/commit/6e1248f155c2a7a68e77f88da96b20703267fc4d))
- **conversation:** V2 工具调用类型化展开渲染 ([f7def42](https://github.com/nuwax-ai/nuwax/commit/f7def42d3304e0e3e8d3cd540a23d93765eb5c1a))
- **conversation:** V2 样式走查待定项落地——空轮回答提示与运行态图标保留类型语义 ([36579c5](https://github.com/nuwax-ai/nuwax/commit/36579c57c3b5aabf8b2672757faedb4fffaa169e))
- **conversation:** V2 用户输入气泡超限折叠——超 200px 默认收起可点击展开/收起 ([4db77ec](https://github.com/nuwax-ai/nuwax/commit/4db77ecceca2a1d17de4c90b0297b51fb5546cfc))
- **conversation:** V2 真实工具详情紧凑渲染——kind 协议识别 + 专用详情组件 ([94d2983](https://github.com/nuwax-ai/nuwax/commit/94d2983380c7ca9b7f21b6054bebfa90bf8addec))
- **conversation:** V2 过程说明改为直接展示，不再收成轨迹节点 ([d9a3004](https://github.com/nuwax-ai/nuwax/commit/d9a300493afa484e09a95fd963fea13d95ec5b60))
- **conversation:** wire chat entry with runtime line dispatch ([c18c5f8](https://github.com/nuwax-ai/nuwax/commit/c18c5f8611ffc38d8676c9ddc62e58a783b9f165))
- **conversation:** wire remaining entries with runtime line ([d227e61](https://github.com/nuwax-ai/nuwax/commit/d227e6136cb00dc1f7d7e6d46a3f2804af9c3d24))
- **conversation:** 任务型 agent 长输出主动折叠 + 思考按流式位置内联渲染 ([e42ab5a](https://github.com/nuwax-ai/nuwax/commit/e42ab5a2747e1fbb052be49bf815c72f1094583b))
- **conversation:** 任务终态统一「执行过程」折叠——只展示最后一段正文 ([f02a86d](https://github.com/nuwax-ai/nuwax/commit/f02a86de9fd5326cc0223cf2f8b7903ffd4e13ee))
- **conversation:** 会话密度设置(P1-6)——compact/normal/detailed 三档 ([651529f](https://github.com/nuwax-ai/nuwax/commit/651529fd816f4dbb343b696a451135df2fbaaa6e))
- **conversation:** 参数/结果区对齐参考稿——独立滚动+终端卡联动 ([bfab9b6](https://github.com/nuwax-ai/nuwax/commit/bfab9b6ddb1c1a97f0f0c8efa23c6162ad0e0c3e))
- **conversation:** 双线调试开关——mock-chat 会话轨/渲染线 Segmented 与会话详情渲染线切换 ([78ba697](https://github.com/nuwax-ai/nuwax/commit/78ba697df432cd18f8f77242849bcb8c43472c67))
- **conversation:** 发起会话时可选工作目录并记录在会话上（wiki [#17](https://github.com/nuwax-ai/nuwax/issues/17) / 5-b） ([ab5d673](https://github.com/nuwax-ai/nuwax/commit/ab5d673be0eabff0b68ca916800d04de65f8f891))
- **conversation:** 增加会话图标和主题更新功能 ([c01e7de](https://github.com/nuwax-ai/nuwax/commit/c01e7de1b1ce49efa1b2e22140037ccd025767dd))
- **conversation:** 增加会话更新事件处理与同步逻辑 ([1e899d3](https://github.com/nuwax-ai/nuwax/commit/1e899d3be2dd4c262f788148b3e1039ced4b33ce))
- **conversation:** 增加会话状态同步补偿逻辑 ([d396d3d](https://github.com/nuwax-ai/nuwax/commit/d396d3d594e15647cb18a42cdbc2d76e0c6ccebd))
- **conversation:** 增强会话轮询逻辑以处理本地发送 ([210ac66](https://github.com/nuwax-ai/nuwax/commit/210ac66a6a675f4705714ff43dffcf3cfc5e5e85))
- **conversation:** 审批卡内直接渲染 ExitPlanMode 计划文档——不再依赖 PROCESSING 翻译链 ([cacf6f4](https://github.com/nuwax-ai/nuwax/commit/cacf6f44d004867cc0297e2b72a83edb5fc2673d))
- **conversation:** 干预 dock 覆盖式透明遮罩——不再挤开会话布局，接管会话面板交互 ([db0a8b0](https://github.com/nuwax-ai/nuwax/commit/db0a8b034a51bca8f4b6d4a9ef9d37ce3fd6bdb2))
- **conversation:** 干预卡片沉底盖住输入框（bottom sheet）+ diff 预览固定 90px 矮窗 ([a57412b](https://github.com/nuwax-ai/nuwax/commit/a57412b5a939b5299a8e9176dd2c81ca2a21724a))
- **conversation:** 干预遮罩补齐 aria 语义与焦点管理——role=dialog + Tab 循环 + 焦点还原 ([a8c32f0](https://github.com/nuwax-ai/nuwax/commit/a8c32f05c51e3e3027aa01d48379e4d21a24666f))
- **conversation:** 引入事件总线实现会话列表静默刷新与乐观更新 ([f71d233](https://github.com/nuwax-ai/nuwax/commit/f71d23338bf9fcb11fcc5d7669dc086f1453cb6f))
- **conversation:** 思考中改为单行滚动条带——市面通行形态 ([60d80e3](https://github.com/nuwax-ai/nuwax/commit/60d80e344d5238ee34952364706309fc366d666f))
- **conversation:** 思考条带动效优化——去字数统计 + 渐变扫光 + 连续缓动 ([d31d476](https://github.com/nuwax-ai/nuwax/commit/d31d4769c9f782c9c76aa251758813c1d0e4c491))
- **conversation:** 文件树「按路径打开文件」入口 + 本地目录文案键规范修复 ([dc13ebd](https://github.com/nuwax-ai/nuwax/commit/dc13ebda1dc20e53c51e3e8656163d306fb06d9b)), closes [#5](https://github.com/nuwax-ai/nuwax/issues/5)
- **conversation:** 根据 devTargetType 区分会话点击跳转目标 ([652c724](https://github.com/nuwax-ai/nuwax/commit/652c7247d5ad5858f25394ee761b3cb66fdb5ddf))
- **conversation:** 通用工具展开详情内联展示参数/结果 ([455fb69](https://github.com/nuwax-ai/nuwax/commit/455fb69b3f1cf20577688f522a0ba6652e6cf566))
- **create-project:** 实现项目创建后自动会话及云电脑模型选项同步锁定 ([d7bf5fa](https://github.com/nuwax-ai/nuwax/commit/d7bf5facdad84cacb339ca8b13ae56fe4608da73))
- **create-project:** 网页应用 Tab 隐藏 agent_mode 切换并复用编码模型选择器 ([90a1019](https://github.com/nuwax-ai/nuwax/commit/90a101990f1e9beb9cb6d2cda6f6e96f97c945e6))
- **CreateAgent:** 增加智能体类型支持与国际化文本 ([a5307c6](https://github.com/nuwax-ai/nuwax/commit/a5307c6f0fe636168caf24379b51060433ffffd0))
- **CreateHooks:** 优化文本显示方式 ([74db532](https://github.com/nuwax-ai/nuwax/commit/74db5324e482709ac049c12a581ee35e589eb34d))
- **docs:** 新增技能开发 Agent 系统提示词文档 ([c430e6f](https://github.com/nuwax-ai/nuwax/commit/c430e6fbce40de111c3dd13f50928344b02847db))
- **docs:** 新增插件开发 Agent 系统提示词文档 ([b7d876b](https://github.com/nuwax-ai/nuwax/commit/b7d876b80287874a841ad43bb28c4a75fdc749e9))
- **EditAgent:** AgentFlow 编排页精简配置项展示 ([35ec19a](https://github.com/nuwax-ai/nuwax/commit/35ec19a28056ad199f951d974c0953d19c12a632))
- **EditAgent:** 增加文件列表刷新功能的注释，明确刷新方式 ([93dcece](https://github.com/nuwax-ai/nuwax/commit/93dcece5b6b23e68a3abe66e9be7d31253570619))
- **EditAgent:** 移除事件绑定相关功能与样式 ([ee0eb03](https://github.com/nuwax-ai/nuwax/commit/ee0eb037878a2a0cae474c391e63337d8ecc95c9))
- **EditorHeaderRight:** 替换终端按钮图标并优化文件路径头部组件 ([b1294c4](https://github.com/nuwax-ai/nuwax/commit/b1294c42a8b46918529898f4ef9d2d5f8ba6b4b4))
- **EmbeddedConsoleTerminal:** 增加心跳检测功能 ([2774418](https://github.com/nuwax-ai/nuwax/commit/27744183772806f7ad35c292631e5b05e9968388))
- **examples:** 新增 MCP Ask 同标题重复询问演示页 ([2025c1f](https://github.com/nuwax-ai/nuwax/commit/2025c1f5b6eec280c927ca0605ed10523843bc7a))
- **file-preview:** md 预览代码块对齐会话区——语言标签+复制+高亮双链路 ([2e85b8b](https://github.com/nuwax-ai/nuwax/commit/2e85b8b5a083daf26c4539eb587b3cb5ae7535b2))
- **file-preview:** md 预览表格支持复制/下载(对齐会话区表格卡)+ 拉齐文档同步 PC 增量 ([81b1ca0](https://github.com/nuwax-ai/nuwax/commit/81b1ca01fa77923b508b5d5dbeadcaa6edac9bfb))
- **FileManagement:** 优化文件保存逻辑，支持防抖处理和指定文件更新 ([7984706](https://github.com/nuwax-ai/nuwax/commit/7984706b29b4cd54ef8d0b8fff8ba8fb49e80e26))
- **FileManagement:** 增强文件管理功能，支持保存成功后的回调 ([4f44f6c](https://github.com/nuwax-ai/nuwax/commit/4f44f6c8b4119fc160111b7f97178b839a6ed625))
- **FileManagement:** 新增文件树写操作成功回调 ([d8bffea](https://github.com/nuwax-ai/nuwax/commit/d8bffea5794946efb2f5fd401f56d1171375c347))
- **fileManagement:** 移除重命名失败的错误提示 ([6da5a90](https://github.com/nuwax-ai/nuwax/commit/6da5a90ab9b67981cab583ae7ef94b3dcb76df43))
- **FilePreview:** 增加锚点处理功能以支持 Markdown 预览区内的平滑滚动 ([b4b2fef](https://github.com/nuwax-ai/nuwax/commit/b4b2fef272aadcea3f26902e02c37dc625916779))
- **FilePreview:** 增强 HTML 预览功能，优化锚点处理逻辑 ([2e2b1d6](https://github.com/nuwax-ai/nuwax/commit/2e2b1d6af62040a4beac268b70e35dc243ad77de))
- **FileTreeGitSourcePanel:** 优化文件变更处理逻辑 ([40ff517](https://github.com/nuwax-ai/nuwax/commit/40ff517d51c08134b75f5ba67e8039e6942f1911))
- **FileTreePanel:** 增强文件树面板功能，新增工具栏和折叠功能 ([4ebcc14](https://github.com/nuwax-ai/nuwax/commit/4ebcc14e8f4561c079476e1822129fd7055289ed))
- **FileTreePanel:** 增强源代码管理功能，支持 Git 工作空间配置和更改同步 ([b448796](https://github.com/nuwax-ai/nuwax/commit/b448796a94f0ba0a3817d86c6315d82db0cbfd7f))
- **FileTreePanel:** 将会话开发智能体和网页应用中的文件树、git 组件合并归一，并将相关 api、ts 类型、右键菜单等操作一起移入到新的组件 ([5f72395](https://github.com/nuwax-ai/nuwax/commit/5f723959b9f3467c2822a17d0b8d41545f394eee))
- **FileTreePanel:** 新增选中文件夹 ID 支持 ([2f224f9](https://github.com/nuwax-ai/nuwax/commit/2f224f98bfbb53971ad674195e8903939af2e563))
- **FileTreePreviewPanel:** 优化 Git 状态拉取逻辑 ([dafaefb](https://github.com/nuwax-ai/nuwax/commit/dafaefb0d0c4bd55e0c93740d389f1906ac32059))
- **FileTreePreviewPanel:** 优化文件树刷新逻辑 ([a8a1d33](https://github.com/nuwax-ai/nuwax/commit/a8a1d33d7ecbeae344dd385b73968199861277ba))
- **FileTreePreviewPanel:** 优化文件树预览钩子逻辑 ([0b04678](https://github.com/nuwax-ai/nuwax/commit/0b0467809db703b1ac00034ab27fe876d05cd098))
- **FileTreePreviewPanel:** 增强文件树预览面板的 Git 刷新功能 ([6387972](https://github.com/nuwax-ai/nuwax/commit/63879722ae3aad5aa09b282da33d482eef59a05a))
- **FileTreePreviewPanel:** 增强文件树预览面板的 Git 源代码管理功能 ([93b35cc](https://github.com/nuwax-ai/nuwax/commit/93b35cc22640a2cc5aa5214f085060ee47cc6973))
- **FileTreePreviewPanel:** 增强文件树预览面板的文件操作功能 ([faa7162](https://github.com/nuwax-ai/nuwax/commit/faa71622065dcfc23e7842247b16222e0c92d2e4))
- **FileTreePreviewPanel:** 增强文件树预览面板的选中文件处理逻辑 ([b531515](https://github.com/nuwax-ai/nuwax/commit/b53151515d2baa145833de47cb44a6daa9b33a3d))
- **FileTreePreviewPanel:** 新增文件树预览面板及相关功能 ([2347a2c](https://github.com/nuwax-ai/nuwax/commit/2347a2c75018d4c72c0f780cd06e1238eab3e402))
- **FileTreePreviewPanel:** 新增通过 fileProxyUrl 刷新选中文件内容功能 ([df4642f](https://github.com/nuwax-ai/nuwax/commit/df4642f9996a65cb6f3cfae650430b2908723a00))
- **FileTreePreviewPanel:** 更新文件树预览钩子逻辑 ([48d29d5](https://github.com/nuwax-ai/nuwax/commit/48d29d560c0344a98fef90a07d50d9ce379ce67a))
- **FileTreePreviewPanel:** 更新文件树预览面板及相关类型定义 ([73b5bab](https://github.com/nuwax-ai/nuwax/commit/73b5bab2589b4bea2d9155a686525d4a0a1a84c3))
- **FileTreePreviewPanel:** 移除 Git 版本面板相关属性 ([c806475](https://github.com/nuwax-ai/nuwax/commit/c806475ddc34619159284782e1628de19584c5b3))
- **FileTreePreviewPanel:** 重构文件树预览面板样式与逻辑 ([2747dfb](https://github.com/nuwax-ai/nuwax/commit/2747dfb45d6959f820db9bc14c5c7ff0d8956ed3))
- **FileTreePreview:** 新增文件树刷新触发标志，优化文件内容同步逻辑 ([3759862](https://github.com/nuwax-ai/nuwax/commit/3759862e70f1554c585356a2bb94773d96ab51ab))
- **FileTreeViewPanel:** 增加文件预览时关闭版本记录面板的功能 ([c4b76b8](https://github.com/nuwax-ai/nuwax/commit/c4b76b8776b0b6a7af832ef8a2b48d4c7a361bdf))
- **FileTreeView:** 增强 PDF 导出功能 ([4b2edab](https://github.com/nuwax-ai/nuwax/commit/4b2edab3b6148e05fb6c39e4477a287a8490155d))
- **FileTreeView:** 增强文件树组件功能与样式优化 ([72600a1](https://github.com/nuwax-ai/nuwax/commit/72600a1100084c8a414a6937fb6cac01e98f517f))
- **FileTreeView:** 更新文件状态注释和样式优化 ([7a71dd9](https://github.com/nuwax-ai/nuwax/commit/7a71dd9be54e74ab0c89591609492a056bcdc868))
- **FileTreeView:** 移除文件树视图相关组件与样式 ([a68b802](https://github.com/nuwax-ai/nuwax/commit/a68b8022389386163f0e9c6c8280db13e07414e8))
- **FileTree:** 增加 VNC 重连前回调功能 ([6974dac](https://github.com/nuwax-ai/nuwax/commit/6974dac3b6d13af4c695a155acc9317e7a135fd0))
- **fileTree:** 增强文件树组件的类型定义 ([7b715d8](https://github.com/nuwax-ai/nuwax/commit/7b715d891ad3f41d72a3727c37eca5697ad4b2ed))
- **FileTree:** 新增项目导入功能与国际化支持 ([5142ff5](https://github.com/nuwax-ai/nuwax/commit/5142ff5e2278f180a5b295fd51f5fc34d8b6c834))
- **fileTree:** 更新文件上传功能，支持批量上传 ([231ce01](https://github.com/nuwax-ai/nuwax/commit/231ce01cf43cc0c1f96adbff45f6771e3fce478c))
- **fileTree:** 替换 VncDesktopUpdateFileInfo 为 UpdateFileInfo ([0ee323e](https://github.com/nuwax-ai/nuwax/commit/0ee323e3d9152d008f445ccac50ee199226c01a1))
- **flag:** plan 模式 feature flag 休眠——9 月版本暂不放开（PLAN_MODE_ENABLED=false） ([827d1b2](https://github.com/nuwax-ai/nuwax/commit/827d1b2ce8b0603ab450df7b9c9ab25f5d2ae0fc))
- **GitVersionRecordPanel:** 增强 Git 版本记录面板功能，支持文件内容获取 ([39acfab](https://github.com/nuwax-ai/nuwax/commit/39acfab715c635a58a1aa88d4a79afefeb40f7a5))
- **GitVersionRecordPanel:** 新增 Git 版本记录面板，支持展示 Git 提交历史 ([127c3b8](https://github.com/nuwax-ai/nuwax/commit/127c3b8a1d5caadc22f155b228e2673f6fb1a674))
- **GitVersionRecordPanel:** 新增 Git 版本记录面板及相关功能 ([7b2b11b](https://github.com/nuwax-ai/nuwax/commit/7b2b11b34fd5b4489afcc42a705e55c71e83e32f))
- **GitVersionRecordPanel:** 新增回滚功能及确认弹窗 ([2122369](https://github.com/nuwax-ai/nuwax/commit/2122369853bd69affaf6eff1dda2d1249a18b592))
- **GitVersionRecordPanel:** 新增提交列表按日期分组功能 ([c8cb2de](https://github.com/nuwax-ai/nuwax/commit/c8cb2dee46894c7bc677bcd1d85d4be17f00457c))
- **GitVersionRecordPanel:** 新增未提交变更自动提交功能 ([fa72931](https://github.com/nuwax-ai/nuwax/commit/fa729311e5229fd9240b48f0c19297847b70b11b))
- **GitVersionRecordPanel:** 更新 Git 版本记录面板，优化分支管理和搜索功能 ([596273b](https://github.com/nuwax-ai/nuwax/commit/596273b983f5bc6d820044276b187ee107b0237b))
- **GitVersionRecordPanel:** 移除回滚失败的错误提示逻辑 ([e70d629](https://github.com/nuwax-ai/nuwax/commit/e70d6290575be5a473a0b8bf8f9cb023827832b5))
- **home:** 侧栏三 tab 改版与首页主区域调整 ([c322c86](https://github.com/nuwax-ai/nuwax/commit/c322c86d50811e2c16c177c8164ab954a082e716))
- **home:** 侧栏列表行级交互补齐——状态徽标/行内操作/查看更多/项目 mock 交互 ([52d5309](https://github.com/nuwax-ai/nuwax/commit/52d5309694f023b0194cfcc5c0d484220047f1b2))
- **home:** 关闭智能体 Tag 切换回默认时同步清空技能并重新聚焦 ([0e32092](https://github.com/nuwax-ai/nuwax/commit/0e32092110037d343dcf587e50b164f571609d1a))
- **home:** 支持首页任务智能体模式切换与状态控制 ([3c6f01c](https://github.com/nuwax-ai/nuwax/commit/3c6f01cd11c36a26346f2e3e9c6b9f9008503e38))
- **home:** 智能体卡片新增最近会话折叠展示 ([c887dc0](https://github.com/nuwax-ai/nuwax/commit/c887dc08cd635c9dd56aad78e283d07b80e25550))
- **home:** 项目 tab 接入 mock 数据用于交互确认 ([871ec31](https://github.com/nuwax-ai/nuwax/commit/871ec317281361c043058e6fb96cd164c5e6d610))
- **home:** 首页 Agent 模式支持智能体维度缓存并修复时序报错 ([109bc7e](https://github.com/nuwax-ai/nuwax/commit/109bc7eb3e99dbc5cf3ed3240bce94e9473ddb2b))
- **hooks:** 优化多页签会话流式恢复与状态同步 ([85df295](https://github.com/nuwax-ai/nuwax/commit/85df295f0d1a05e335ed6ae100ee6155432283da))
- **hooks:** 优化文件删除逻辑，支持指定文件修改方式 ([5d35fdc](https://github.com/nuwax-ai/nuwax/commit/5d35fdc239cc556ca734f490c32121aa7fa9bb67))
- **hooks:** 移除全局请求错误处理函数，优化订阅逻辑 ([cae4051](https://github.com/nuwax-ai/nuwax/commit/cae4051d8177ac13cae227c105f750853eb57194))
- **hook:** 新增匹配规则配置与国际化文本支持 ([7caa775](https://github.com/nuwax-ai/nuwax/commit/7caa775cb229632e20b46d3ecf874004b842c45f))
- **Hook 管理:** 新增 Hook 配置管理功能 ([63451ef](https://github.com/nuwax-ai/nuwax/commit/63451efa170f9ef50d1ca75940dfa19b0e42e2cf))
- **Hook 管理:** 更新 Hook 事件选项与类型定义 ([32102f4](https://github.com/nuwax-ai/nuwax/commit/32102f4bbdc8906a8d43e14b234cf1a2e383c6a3))
- **Hook 管理:** 更新 Hook 配置与国际化文本 ([f743e1b](https://github.com/nuwax-ai/nuwax/commit/f743e1bbfe110f6710463c9919fc0ce629cea315))
- **i18n:** add 64 AgentFlowNode v2 translation keys for all 5 locales ([3b2467d](https://github.com/nuwax-ai/nuwax/commit/3b2467d7d15e212f6c4477bc7a459d5eb09f8fa3))
- **i18n:** 为推荐管理页面新增对话框提示信息翻译 ([364a40c](https://github.com/nuwax-ai/nuwax/commit/364a40cf1d3fbd3e94aa26ae8b6899af01df9538))
- **i18n:** 为调用审批功能增加提示信息的多语言支持 ([3271ef0](https://github.com/nuwax-ai/nuwax/commit/3271ef0ea2b3600e3941e8b1068c3489375ad9af))
- **i18n:** 增加推荐管理相关的多语言支持 ([eaa1830](https://github.com/nuwax-ai/nuwax/commit/eaa1830daf157bcd4c3b950f9d3e04e3aee5d446))
- **i18n:** 增加补充提示词的多语言支持 ([c26b81f](https://github.com/nuwax-ai/nuwax/commit/c26b81f54312981d6c0f6e315969ca866a698a92))
- **i18n:** 新增“技能与组员”国际化文本支持 ([1c9fea9](https://github.com/nuwax-ai/nuwax/commit/1c9fea954aeabc26656dd7e59a5ea5fb7d9367d2))
- **i18n:** 新增参数更新策略 ([f5ff288](https://github.com/nuwax-ai/nuwax/commit/f5ff288daf1ceb88db15dce6d068493dcf5315a4))
- **i18n:** 新建项目页面中文硬编码国际化支持 ([c5f6d13](https://github.com/nuwax-ai/nuwax/commit/c5f6d137dcade1705e0c7253a47a500ae16513ed))
- **i18n:** 更新多语言文件中的错误提示内容 ([f4cf4fe](https://github.com/nuwax-ai/nuwax/commit/f4cf4fe579f167bc90f83c7bbecf940736534001))
- **i18n:** 更新推荐管理的多语言翻译项 ([80746ba](https://github.com/nuwax-ai/nuwax/commit/80746ba01d52bd7198c474e09b2d96003e5048ec))
- **i18n:** 更新日语和粤语翻译，新增 Git 源代码管理相关文本 ([4d0f2da](https://github.com/nuwax-ai/nuwax/commit/4d0f2da9716ef8dc14965f1f41176a5364962456))
- **i18n:** 更新版本记录提示信息与组件样式 ([89e221a](https://github.com/nuwax-ai/nuwax/commit/89e221a956123fc4ef88d6d5c1aba0487c92bfb1))
- **i18n:** 添加信用兑换描述占位符翻译 ([1e49f98](https://github.com/nuwax-ai/nuwax/commit/1e49f985a3a6c38ae43647495c16d3518c98b629))
- **i18n:** 移除事件绑定相关国际化文本 ([eebac9c](https://github.com/nuwax-ai/nuwax/commit/eebac9c8385d412913d965c44703c74a8e46f13b))
- **i18n:** 补全 ja-JP/zh-HK/zh-TW 缺失翻译 key ([965d50b](https://github.com/nuwax-ai/nuwax/commit/965d50b48bf3349b7a82f41f6e7aaa634d2c0ab9))
- **intervention-demo:** add intervention card demo page ([edd8b50](https://github.com/nuwax-ai/nuwax/commit/edd8b509dfe51091467fc127fb802ffab6cb933b))
- **intervention:** fix demo page auth, add translations, remove option borders ([05455d8](https://github.com/nuwax-ai/nuwax/commit/05455d8f381dbebd0aba5e7cbff04bf75e526b2b))
- layout:false 全屏业务路由自动注入桌面端顶部避让（config 层规则） ([88b86e1](https://github.com/nuwax-ai/nuwax/commit/88b86e11d78d5432e0bd60e424ca8cdfa33c5a12))
- **layouts:** 最近使用列表支持悬浮展示执行中会话 ([e90431d](https://github.com/nuwax-ai/nuwax/commit/e90431d9598291bb2e694342efc0f985e795c022))
- **layouts:** 支持最近使用智能体列表项选中高亮 ([83b34aa](https://github.com/nuwax-ai/nuwax/commit/83b34aa4f85ededc83c50da1251d32768667445f))
- **layouts:** 支持实时更新最近使用智能体的任务执行状态 ([6fe6301](https://github.com/nuwax-ai/nuwax/commit/6fe6301acbf919c9cecb180396788812d79bedd1))
- **layouts:** 新增最近使用列表无滚动条时的自动填充加载逻辑 ([49a6dc8](https://github.com/nuwax-ai/nuwax/commit/49a6dc82fff3b995abfb65850d09ebd5e1a5e301))
- **layouts:** 新增最近使用智能体会话执行状态显示与列表刷新 ([1784801](https://github.com/nuwax-ai/nuwax/commit/1784801b1fbabf320004290303942b21ab6fc012))
- **layouts:** 重构新版会话侧边栏版块并实现样式模块化独立封装 ([3fad839](https://github.com/nuwax-ai/nuwax/commit/3fad83903a98df327cbd4e29eada43587e42363e))
- **layouts:** 首页侧边栏支持最近使用与历史会话 Tab 切换 ([e5daa84](https://github.com/nuwax-ai/nuwax/commit/e5daa842fe183cf77add93d82378805574278305))
- **layout:** 主导航改造——移除一级竖栏，入口合并至会话侧栏 ([db2fbc6](https://github.com/nuwax-ai/nuwax/commit/db2fbc62b75a41c14630cf9142e4c92da8f0bf1d))
- **layout:** 优化新建会话入口的权限显示逻辑与样式对齐 ([e465362](https://github.com/nuwax-ai/nuwax/commit/e4653624cef32b537aa44e813061ed4d25581c5e))
- **layout:** 会话列表右键菜单骨架——置顶/归档/收藏留桩,删除/重命名接线 ([28e1a06](https://github.com/nuwax-ai/nuwax/commit/28e1a060700bec190c0ec9510abd5dccdad8f970))
- **layout:** 会话置顶/归档/收藏本地化落地——菜单全项可用 ([829f590](https://github.com/nuwax-ai/nuwax/commit/829f59017892b4dcbc0dfa93a6a19e691b441e29))
- **layout:** 侧栏对齐需求原型——接口导航行+双列二级菜单+底部栏 ([817136c](https://github.com/nuwax-ai/nuwax/commit/817136ca188209c0c4d6bee5399f6e6ba33751b5))
- **layout:** 历史会话页接入本地置顶/归档/收藏——与主侧栏行为一致 ([26863b0](https://github.com/nuwax-ai/nuwax/commit/26863b002c0d16a46761b38352c86776613e2b87))
- **layout:** 搜索改为命令面板弹窗（⌘K/顶栏搜索触发） ([7d8e5e0](https://github.com/nuwax-ai/nuwax/commit/7d8e5e0b274665b3125631a00ceaa84d7183d54a))
- **layout:** 新增单栏导航样式及相关布局调整 ([8da1872](https://github.com/nuwax-ai/nuwax/commit/8da1872fe24f9527221a38e0c038f95c746b1ff6))
- **layout:** 沉浸式折叠只收二级列并收口折叠策略 ([692f62c](https://github.com/nuwax-ai/nuwax/commit/692f62c8071c7fffaa39d00bff1c99cf92911a2a))
- **layout:** 首页 tab 栏滑动指示条与交互动效 ([3b2bf6b](https://github.com/nuwax-ai/nuwax/commit/3b2bf6b98e9eaee6f7769bf2950f40def3eb960d))
- **login:** 支持邮箱及用户名密码登录 ([86241dd](https://github.com/nuwax-ai/nuwax/commit/86241dd594133047370994f033e448f3aad376fb))
- mac 收起二级菜单时主内容区同步避让 + 收起态推送壳（修 reload 失同步） ([99612e5](https://github.com/nuwax-ai/nuwax/commit/99612e557f664b232542165f4245c458cd0c8633))
- **MarkdownRenderer:** 增加对中文场景下加粗标记的标点处理 ([3165620](https://github.com/nuwax-ai/nuwax/commit/3165620f3425fb114ac0a9e8821cef1a88081513))
- **MarkdownRenderer:** 增强 Markdown 渲染功能，支持反引号包裹的 LaTeX 公式处理 ([6f9cea6](https://github.com/nuwax-ai/nuwax/commit/6f9cea6ec0d0ea724c66cc3ae6aae74bccec51a5))
- **MarkdownRenderer:** 新增 LaTeX 行内代码处理功能，优化 Markdown 渲染效果 ([240534c](https://github.com/nuwax-ai/nuwax/commit/240534c9a20b1ba6869154d16f11c2fcc1a3c357))
- **markdown:** 优化 agent-info 标签渲染逻辑 ([6434664](https://github.com/nuwax-ai/nuwax/commit/64346644b8abbb6d1cbc53020a6671f1bfc14704))
- MCP Ask 表单支持 number/integer 数字输入 ([737c454](https://github.com/nuwax-ai/nuwax/commit/737c454d53d804c9b8b7d0d54c8e925733537af5))
- MCP 创建接入 generate-info 自动生成图标 ([7e1ab1d](https://github.com/nuwax-ai/nuwax/commit/7e1ab1d159f7358e48b319e3c2a3dde94512aa0a))
- **MessageQueue:** intervention 协调队列与 DockPanel 串行展示 ([b73f6ee](https://github.com/nuwax-ai/nuwax/commit/b73f6eed36576d40bf8cda083c20eef74e777a83))
- **MessageQueue:** 优化队列交互与会话状态判定 ([fd63714](https://github.com/nuwax-ai/nuwax/commit/fd63714ce8291b7a981922a867ed7da3876f8d8f))
- **MessageQueue:** 接入多语言文案 ([bb74dcf](https://github.com/nuwax-ai/nuwax/commit/bb74dcfb42c0fbdbe18a272fe20486183ca530c8))
- **MessageQueue:** 支持拖拽排序（[@dnd-kit](https://github.com/dnd-kit)） ([616f226](https://github.com/nuwax-ai/nuwax/commit/616f226515821fdfa4e8fedeedb353c981f47a9f))
- **MessageQueue:** 新增会话活跃期间待发送消息队列 ([eecc81e](https://github.com/nuwax-ai/nuwax/commit/eecc81e24cd84e323a88d0618e6efc62a783a828))
- **MessageQueue:** 用户停止会话时暂停队列，发送新消息后恢复 ([f658c67](https://github.com/nuwax-ai/nuwax/commit/f658c6775c3fa6062f8b96e7cdfa64d3a0fac438))
- **MessageQueue:** 立即发送按钮点击后显示 loading 并防止重复点击 ([3ba2ec7](https://github.com/nuwax-ai/nuwax/commit/3ba2ec7e969645a6e206eec83850a7b7d814c4a6))
- **MessageQueue:** 队列面板支持折叠收起 + 样式修复 ([e677af4](https://github.com/nuwax-ai/nuwax/commit/e677af455f23a27acd67071cf3009a802da19605))
- **MessageQueue:** 队列首次有数据时短暂提示首条操作按钮 ([1c652c0](https://github.com/nuwax-ai/nuwax/commit/1c652c035b98bef1214558cb8c7bc7591f068fb5))
- **mock:** TRACE_HAIRLINE 场景改用真实会话数据回放 ([a7df158](https://github.com/nuwax-ai/nuwax/commit/a7df158756a743a2c4858fb761e21f1691ba52db))
- **mock:** 新增 TRACE_HAIRLINE 场景——hairline 工作轨迹样式演示 ([86cd0aa](https://github.com/nuwax-ai/nuwax/commit/86cd0aa635365be13831a99f1c74fa5172843c1f))
- **mock:** 综合验收画廊 /mock-gallery——多场景并行一次验收 ([5b1f0b4](https://github.com/nuwax-ai/nuwax/commit/5b1f0b4b7f94677fb5d2c2aa97509654643b36e6))
- **modal:** 优化弹窗样式与删除确认功能 ([11f0afa](https://github.com/nuwax-ai/nuwax/commit/11f0afabe527d1e71b6a06702869e0656bd21e0a))
- **ModelSelector:** 优化模型选择器样式 ([c98d54f](https://github.com/nuwax-ai/nuwax/commit/c98d54f7eb27ae766c9d03b1dba3f7728ea04af2))
- **mysubscriptions:** 订阅套餐卡片新增到期时间与状态展示 ([d3a7f57](https://github.com/nuwax-ai/nuwax/commit/d3a7f57588cb4ddc0d85f079393b552c0a43ccac))
- nuwaclaw 壳适配逻辑收敛 nuwaClawBridge（平台判定/避让尺寸统一收口） ([bb8c856](https://github.com/nuwax-ai/nuwax/commit/bb8c85632b244c5649d3d17209d7fca8ccce4706))
- **OpenIframePage:** 优化 iframe 消息处理逻辑 ([3c19679](https://github.com/nuwax-ai/nuwax/commit/3c1967938e80de66fc5c82bf826857b54b6575b1))
- **OpenIframePage:** 增加生态市场页面域名地址支持 ([9ba47c3](https://github.com/nuwax-ai/nuwax/commit/9ba47c33a32a37849b4c42eaf226b3d420314a5a))
- **OpenIframePage:** 增强 iframe 消息处理逻辑 ([186a762](https://github.com/nuwax-ai/nuwax/commit/186a7623fdde2f9e6f582b4edd82af6bf7553af0))
- **openui:** Runtime 支持 ?file_path= 自主拉取（sidecar + 分享页） ([1824586](https://github.com/nuwax-ai/nuwax/commit/18245865384ba26e3f400cf902a86ef15c363298))
- **openui:** sidecar 改走文件树预览并复用 TaskResultRow ([f3be0f2](https://github.com/nuwax-ai/nuwax/commit/f3be0f22a7538df5ebf9cc303677481123fdbaf0))
- **openui:** 分享页支持 .openui.json 预览（无倒计时，按拉取返回处理过期） ([ff83cdf](https://github.com/nuwax-ai/nuwax/commit/ff83cdf99b8c8a6b065fcc8341797400e4bb12f4))
- **OpenUI:** 升级 mcp 0.2.2 并兼容仅有工具 input 的内联渲染 ([9c8f7a9](https://github.com/nuwax-ai/nuwax/commit/9c8f7a993c01644dd830762cdd76c475a412b91d))
- **openui:** 接入后端 RENDER_UI 专用 SSE 事件 ([c7829e1](https://github.com/nuwax-ai/nuwax/commit/c7829e1a0f46b11e779154e42ccc70eebc90d6b4))
- **OpenUI:** 接入本地 Runtime 并支持 Artifact 引用与侧栏预览 ([d589b7e](https://github.com/nuwax-ai/nuwax/commit/d589b7ece65d025f783e5657113e0f083573022a))
- **OpenUI:** 接入紧凑主题并同步 openui-mcp 0.2.3 runtime ([629d144](https://github.com/nuwax-ai/nuwax/commit/629d14450f4d12103bf29b24bfbe1b45d860f814))
- **openui:** 支持 .openui.json 预览/代码切换并完善测试指南 ([a945fc3](https://github.com/nuwax-ai/nuwax/commit/a945fc3387b999fba0e670fe047e80d62a979b13))
- **OpenUI:** 支持会话级 Runtime iframe 内联渲染与校验文案国际化 ([f0544c9](https://github.com/nuwax-ai/nuwax/commit/f0544c9b000fe3636de24bce189819dc8d92468c))
- **openui:** 统一 uni.webview.1.5.5 加载 + OPENUI_ACTION 转发到 App [@message](https://github.com/message) ([7202940](https://github.com/nuwax-ai/nuwax/commit/720294029f3bd88cc0abf42dfd53bbb2c56fdd6c))
- **orders:** 新增设备购买业务类型及订单收货信息弹窗 ([1aefbd3](https://github.com/nuwax-ai/nuwax/commit/1aefbd36b210d17505343be38c41afd2e0cdd6bf))
- page-container 顶部避让 Win/Linux 壳窗口三键（isWinLinuxShell 收口判定） ([3b690a3](https://github.com/nuwax-ai/nuwax/commit/3b690a3d0e3f917213ead8fd81af49cd060309b0))
- **pages:** 插件与技能详情页新增调试会话区域并修复类型报错 ([ae2b7da](https://github.com/nuwax-ai/nuwax/commit/ae2b7daf2b5a18d5d60ee5334d80048bee1a0fb5))
- **pages:** 新增聊天对话结束后自动更新插件配置逻辑 ([e8d3ed6](https://github.com/nuwax-ai/nuwax/commit/e8d3ed648265812507578a6fbffcfc197bbe997e))
- **pages:** 网页应用新增前置 AI 元数据自动生成逻辑 ([89e86c1](https://github.com/nuwax-ai/nuwax/commit/89e86c11889294f55813b58a65eb199cb5ffb918))
- **payments:** 支持商户进件影像上传与文件键值生命周期维护 ([24bc949](https://github.com/nuwax-ai/nuwax/commit/24bc949549676dd1e23496d66d802b546d1cd1dd))
- **pc-client:** 接入 NuwaClawBridge 登录态同步与右键另存图片（过渡） ([435a12f](https://github.com/nuwax-ai/nuwax/commit/435a12f7f2403afb499a6ae7b029232178b74f4c))
- **permission:** 支持未开启积分订阅时开放模型权限与用量统计页面 ([430ff7c](https://github.com/nuwax-ai/nuwax/commit/430ff7cc8e580fc00b473a7face16137d22e1b4a))
- **PersonalSpaceContent:** 增加搜索功能与样式优化 ([ebe7f9f](https://github.com/nuwax-ai/nuwax/commit/ebe7f9fc0a31dc1aa48acd507f113014e47185f8))
- **PersonalSpaceContent:** 增加权限控制以显示创建团队按钮 ([37f178c](https://github.com/nuwax-ai/nuwax/commit/37f178c1fb74d02403b163f39711d2a55cbcb1d0))
- **PersonalSpaceContent:** 新增空态提示逻辑 ([a5516da](https://github.com/nuwax-ai/nuwax/commit/a5516dab6ce3a3ba989e81aeea1f531b9d024406))
- **plan:** ExitPlanMode 审批简化——单「批准」项 + 计划修订输入框 + 批准回写切 plan 前档位 ([5e75706](https://github.com/nuwax-ai/nuwax/commit/5e757064081490e12173ad6df97bbefa9a1f1e89))
- **plugin:** 插件列表跳转支持拼接历史会话并优化隐藏调试会话时的自适应间距 ([219a54f](https://github.com/nuwax-ai/nuwax/commit/219a54f947aea639647c9b1120f4cc00b5e8d654))
- **plugin:** 统一插件调试会话状态管理与回显发信逻辑 ([c7ef18b](https://github.com/nuwax-ai/nuwax/commit/c7ef18b455404be6a50578634791ceb3634f03f8))
- **preview:** 增加 App 下载文件功能支持 ([44c8ffb](https://github.com/nuwax-ai/nuwax/commit/44c8ffb18d99ca6b3a72222e8d02207c9a467361))
- **preview:** 实现根据沙箱服务器 ID 自动锁定电脑选择 ([b6347b0](https://github.com/nuwax-ai/nuwax/commit/b6347b06f72e4b3102b5da5538608871c68cfcdc))
- **preview:** 支持 Markdown 文件预览时动态设置网页标题 ([b8390e2](https://github.com/nuwax-ai/nuwax/commit/b8390e2e88e1ae08e6345989b08f5b611489cbaa))
- **project:** 优化智能体创建中的电脑传递与 Tab 切换逻辑 ([5ac39e8](https://github.com/nuwax-ai/nuwax/commit/5ac39e8a6549dae74e3332f0fe14ee560818ad54))
- **RecommendManage:** 完善推荐管理的多语言支持与页面配置 ([1de8ba7](https://github.com/nuwax-ai/nuwax/commit/1de8ba7af81dee24d31d2999830c8c6e4278017b))
- **RecommendManage:** 新增推荐管理相关的服务和类型定义 ([99ca2bd](https://github.com/nuwax-ai/nuwax/commit/99ca2bd7593e0c56dadd995b333e78393d22d0c7))
- **router:** 增强跳转逻辑，支持传递额外参数 ([db2df3a](https://github.com/nuwax-ai/nuwax/commit/db2df3a4403e2b2ca6c3fd96ad983c0875def06b))
- **SelectTargetFormItem:** 移除不必要的属性以简化组件 ([34a69a3](https://github.com/nuwax-ai/nuwax/commit/34a69a3d27f1533b30d28eeecf944090c2d2e34d))
- **Setting:** 新增系统版本展示面板 ([4c58c92](https://github.com/nuwax-ai/nuwax/commit/4c58c925e6715bdd720840857bac127de0bbc908))
- **shell:** 无菜单详情页同窗沉浸避让——header-area/title-box 退让 + page-container 恒退让 ([b4823ac](https://github.com/nuwax-ai/nuwax/commit/b4823ac44ba3067b5df77cd419c6999a13c10d8d))
- **source-control:** Enhance file change tracking with Git status integration ([e1d1c08](https://github.com/nuwax-ai/nuwax/commit/e1d1c08b163ea1542964dfdede255c8cffad498b))
- **SourceControlPanel:** 优化放弃更改的确认逻辑 ([16cbb2c](https://github.com/nuwax-ai/nuwax/commit/16cbb2ce61b3ef21857b5a0174abdcceb8f4ef73))
- **SourceControlPanel:** 重构文件变更项展示逻辑 ([5d9f203](https://github.com/nuwax-ai/nuwax/commit/5d9f2039a14164aecf956a7fdd65f2b9c7d439ec))
- **SourceControl:** 移除文件保存失败提示逻辑 ([18a7c60](https://github.com/nuwax-ai/nuwax/commit/18a7c60fbe02f701b836b38c9ece6ce74de3949e))
- **SourceControl:** 重构源代码管理逻辑 ([e5426ac](https://github.com/nuwax-ai/nuwax/commit/e5426acbfea4059a4ad31708dd7ca6d62d79ca8f))
- **SourceControl:** 重构源代码管理面板逻辑 ([dce46e9](https://github.com/nuwax-ai/nuwax/commit/dce46e90ae74cad7a27b2665c2cf0809616df81f))
- **space-develop:** 优化智能体开发列表页的点击跳转逻辑 ([73c9402](https://github.com/nuwax-ai/nuwax/commit/73c9402e8c4765ca0c904b6cd73c1bb6b64f4721))
- **space.constants:** 移除不必要的智能体类型常量 ([bbf4e67](https://github.com/nuwax-ai/nuwax/commit/bbf4e671f57e92f0aa3563744e3099617a136a15))
- **SpaceConnector:** 优化连接器卡片与筛选栏布局 ([6da6019](https://github.com/nuwax-ai/nuwax/commit/6da601957034944b0bb9b0df95033b110bdff18a))
- **SpaceConnector:** 实现连接器连接功能并完善新增链路 ([6759579](https://github.com/nuwax-ai/nuwax/commit/6759579019942c45777466c1d98ea950253b67e6))
- **SpaceConnector:** 新增工作空间连接器页面并实现导入功能 ([09fdf59](https://github.com/nuwax-ai/nuwax/commit/09fdf59b5a796c15d901c9db8382f6d77f9d49e9))
- **SpaceCreateProject:** 临时性处理页面应用创建跳转逻辑 ([a741d07](https://github.com/nuwax-ai/nuwax/commit/a741d073202628d67387f5ea35597996d84e4874))
- **spacecreateproject:** 优化创建项目参数传递并完善多类型组件的路由跳转逻辑 ([739da0e](https://github.com/nuwax-ai/nuwax/commit/739da0e979f78579def05d85b1d297642fc8fd69))
- **SpaceCreateProject:** 增强项目创建功能，支持 AI 自动生成技能信息 ([28a3be9](https://github.com/nuwax-ai/nuwax/commit/28a3be957047736d8c465e8450054fe18d714974))
- **SpaceCreateProject:** 引入项目构建策略，优化新建项目流程 ([acbe477](https://github.com/nuwax-ai/nuwax/commit/acbe47776635c4d3e1b5068b888a24da2e5b380b))
- **SpaceCreateProject:** 新建项目对话框按配置显示 agent 模式选择器并透传到会话页 ([223182b](https://github.com/nuwax-ai/nuwax/commit/223182b72cc9a80872dbb7f75e202467135dae58))
- **space:** expose AgentFlow type in UI ([bdce153](https://github.com/nuwax-ai/nuwax/commit/bdce153ca2a25150940355fdbf22ca8810eb16f2))
- **space:** route AgentFlow creation to editor ([0da826c](https://github.com/nuwax-ai/nuwax/commit/0da826c1e701fa3cea4dd58da5717218fc3a2a80))
- **space:** 对接技能转对话式开发接口并联动电脑切换 ([28ce481](https://github.com/nuwax-ai/nuwax/commit/28ce4817bb4304d7dd439ff5f1e47b29f985e9da))
- **space:** 支持技能转为对话式开发 ([7de11c9](https://github.com/nuwax-ai/nuwax/commit/7de11c91977b7caa64b6297d1e07f7a39a2c4fe1))
- **space:** 新增新建项目空间页面及视觉微调与多语言支持 ([7f705b2](https://github.com/nuwax-ai/nuwax/commit/7f705b2d0173df121145ed837d0f22b1f6621276))
- **space:** 添加新的智能体类型和路由支持 ([86dd507](https://github.com/nuwax-ai/nuwax/commit/86dd507a75780a7ff86c2ad472da3a2ee5c3c7a8))
- **square:** 广场技能模板复制后支持自动跳转至开发对话页 ([505ac74](https://github.com/nuwax-ai/nuwax/commit/505ac741d8d62008c2338e37003246d52656b6cf))
- **square:** 支持携带会话 ID 跳转至智能体聊天页面 ([7e870de](https://github.com/nuwax-ai/nuwax/commit/7e870de2087dfbfeaf4516d36647d9e7b502d996))
- **styles:** 调整 CreateVariableModal 组件样式 ([55d9605](https://github.com/nuwax-ai/nuwax/commit/55d9605a9a7d6ba758bfdaab96a6aa56d796a86f))
- support Aliyun Captcha V2 and V3 integration by adding captchaVerifyCallback and result deduplication logic ([40ca8cb](https://github.com/nuwax-ai/nuwax/commit/40ca8cbf74b4d6fcb57d853f6d5d0adc7127c58c))
- support rcoder acp permission approvals ([a21dd5c](https://github.com/nuwax-ai/nuwax/commit/a21dd5c77a7deae13b53663b27da035be2578ed9))
- **system:** 支持在新增和编辑推荐时输入占位提示 placeholder ([d75a952](https://github.com/nuwax-ai/nuwax/commit/d75a95284f5aeb5fd3aabbbc9d787b6ea1172b40))
- **TeamSetting:** 优化成员管理功能，支持动态传递 spaceId ([ea73f4c](https://github.com/nuwax-ai/nuwax/commit/ea73f4cb8f1f1e0fb915bdc6c7669e4f6a0b8121))
- **terminalWsUrl:** 优化 WebSocket 地址构建逻辑 ([dcff83c](https://github.com/nuwax-ai/nuwax/commit/dcff83c55deedff8892d2ee050fd80a5c95f948f))
- **terminalWsUrl:** 优化 WebSocket 地址构建逻辑 ([20c393b](https://github.com/nuwax-ai/nuwax/commit/20c393be571173549b3c7f6922ba74ae55c7e6bc))
- **terminalWsUrl:** 增强 WebSocket 地址构建日志 ([a81a0a1](https://github.com/nuwax-ai/nuwax/commit/a81a0a1e5c7a6ce285e5b2b6dc20754d062a4c59))
- **Terminal:** 优化 xterm 依赖配置与样式导入 ([1b6e7d3](https://github.com/nuwax-ai/nuwax/commit/1b6e7d393470eec4a50fea56ae9621b061bd9305))
- **Terminal:** 优化 xterm 相关依赖与加载逻辑 ([e80a56b](https://github.com/nuwax-ai/nuwax/commit/e80a56be5ea925508cece7680a2bef7ac61ddf55))
- **Terminal:** 优化嵌入式终端样式与连接逻辑 ([68cbf23](https://github.com/nuwax-ai/nuwax/commit/68cbf23eeda37029ce4098c0e2c05a64b4560b3d))
- **Terminal:** 增加对 ttyd 协议的支持 ([ba80887](https://github.com/nuwax-ai/nuwax/commit/ba80887bad3a0c7239e390c109c210fb593b36c6))
- **Terminal:** 增强终端组件的外观和功能 ([02ee942](https://github.com/nuwax-ai/nuwax/commit/02ee9429bd0dd0c2f4dd24b143726a92bec1514a))
- **Terminal:** 新增嵌入式控制台终端组件 ([a2ed493](https://github.com/nuwax-ai/nuwax/commit/a2ed4933984e862b9ca3918efe52aadf326ef645))
- **Terminal:** 新增嵌入式控制台终端组件 ([037ccef](https://github.com/nuwax-ai/nuwax/commit/037ccef28b0e899aa773129e196be5e03c6ae986))
- **Terminal:** 更新 xterm 依赖版本与加载逻辑 ([cbe86a8](https://github.com/nuwax-ai/nuwax/commit/cbe86a8c163cffe14e0b72df8811da78ee9928dc))
- **Terminal:** 更新 xterm 样式导入方式 ([92e2c2f](https://github.com/nuwax-ai/nuwax/commit/92e2c2f38347801edf2b978410fcda543a58d881))
- **Terminal:** 更新 xterm 样式导入方式 ([679770d](https://github.com/nuwax-ai/nuwax/commit/679770da9d623ca71501a532cc236a40bb564d70))
- **Terminal:** 添加 ttyd 流控功能以优化终端输出 ([0923466](https://github.com/nuwax-ai/nuwax/commit/09234662ff3fa58b8f917ef4b4ade00804501f7e))
- **theme:** 女娲主题（女娲蓝+灰白纯色）全端默认——浏览器同步客户端 ([9a4cc1f](https://github.com/nuwax-ai/nuwax/commit/9a4cc1f595a7c1a9b3496dcb7990f02f11ba03dc)), closes [#5147](https://github.com/nuwax-ai/nuwax/issues/5147)
- **UnifiedChatSession:** 引入独立聊天输入组件并优化数据传递 ([3068d55](https://github.com/nuwax-ai/nuwax/commit/3068d558d5db069665258fafd06a45c50040b992))
- **upload:** 更新上传文件大小提示信息 ([2818a7a](https://github.com/nuwax-ai/nuwax/commit/2818a7a531a1c8ef2f8134648fda9e3679808d2f))
- **usePreviewTabs:** 更新默认工作区标签顺序及相关逻辑 ([a272816](https://github.com/nuwax-ai/nuwax/commit/a2728169648c9d02d7feedb2e9535af5c29e1e1e))
- **UserManage:** 新增订阅用户组功能 ([b216060](https://github.com/nuwax-ai/nuwax/commit/b2160604a5b599dfc5bf6e9f52dd1aaa93c68fec))
- **user:** 增加用户状态枚举值和搜索用户信息接口字段 ([3ebbd94](https://github.com/nuwax-ai/nuwax/commit/3ebbd9498e02f244a92e2c6c4de89155f9a303a2))
- **useSourceControl:** 优化 Git 状态拉取逻辑 ([190cc2e](https://github.com/nuwax-ai/nuwax/commit/190cc2ead04187f74b671910c34d32d07815d096))
- **useTerminalWsUrl:** 优化终端 WebSocket 地址生成逻辑 ([a9d3fbb](https://github.com/nuwax-ai/nuwax/commit/a9d3fbb0bbeaa3c2868976097c267decf551120d))
- **version:** 更新应用版本至 1.1.14 ([3379bc7](https://github.com/nuwax-ai/nuwax/commit/3379bc7055d35cd689609099b4b21d85fca4b6c8))
- VNC 预览重连前先 ensurePod + 恢复 keepalive ([c21c4ba](https://github.com/nuwax-ai/nuwax/commit/c21c4ba84369d0b915f5c3ca55376fa719cba100))
- **voice-input:** 优化录音链路性能与转写交互体验 ([f2f90d0](https://github.com/nuwax-ai/nuwax/commit/f2f90d0a7c564a17acceecaaaf3a7dece0cb51fa))
- **voice-input:** 新增语音输入功能模块 ([6f99f54](https://github.com/nuwax-ai/nuwax/commit/6f99f54af0a89149130206895a13fe6e05f90b93))
- **voice-input:** 重构波形时间线动效与录音启动体验 ([0d57f45](https://github.com/nuwax-ai/nuwax/commit/0d57f458909ad48356b613e2add724b108f034b2))
- **Workflow:** restructure layout with fixed left sidebar, MiniMap and search ([2526fcf](https://github.com/nuwax-ai/nuwax/commit/2526fcf7e133f6d78632d0f3005709561a2869d9))
- 一级/二级菜单高亮适配米白主题（替代纯白） ([959b559](https://github.com/nuwax-ai/nuwax/commit/959b559ad1989fb1fc2540ff2d52a7c75de8e09b)), closes [#F3F1](https://github.com/nuwax-ai/nuwax/issues/F3F1) [#FBFAF6](https://github.com/nuwax-ai/nuwax/issues/FBFAF6) [#EAE7](https://github.com/nuwax-ai/nuwax/issues/EAE7) [DE/#E7E4](https://github.com/DE/nuwax/issues/E7E4)
- 为 ChatInputHome 添加标签页支持 ([0ee1e7f](https://github.com/nuwax-ai/nuwax/commit/0ee1e7fe3ba6e702bd68ddb9903e963dac002eb2))
- 为 Hook 设置页面添加工具提示信息 ([cad2fda](https://github.com/nuwax-ai/nuwax/commit/cad2fda68396301dff7c26ab22df4364f903b9f5))
- 为 ConversationAgent 页面添加全屏预览功能及分享弹窗 ([d4d29e3](https://github.com/nuwax-ai/nuwax/commit/d4d29e386eab461e5d903030c71b02e82c67badd))
- 为历史会话页面添加标题左侧插槽及相关样式 ([1d14eed](https://github.com/nuwax-ai/nuwax/commit/1d14eed2f6adcb5a02304347cacd105c108093d1))
- 为登录页面的文本内容在 BasicLayout 中添加可滚动容器 ([8fe7dd1](https://github.com/nuwax-ai/nuwax/commit/8fe7dd18a0c2a8e44a644af593aebc4cb6d9e30e))
- 优化 ConversationAgent 组件的终端控制逻辑 ([1083408](https://github.com/nuwax-ai/nuwax/commit/10834084127c68fc2572f6c8985e50d62e4e97b5))
- 优化 EditAgent 组件的终端面板控制逻辑 ([846625c](https://github.com/nuwax-ai/nuwax/commit/846625ca3b481ee438dc0ef8b8599960426493d0))
- 优化 GitVersionCommitChangesPanel 组件的样式与功能 ([38396e1](https://github.com/nuwax-ai/nuwax/commit/38396e1dbe270423efdc59954106662833cb04ef))
- 优化 ConversationAgent 页面样式，删除不必要的样式文件，调整组件结构以提升可读性 ([490d003](https://github.com/nuwax-ai/nuwax/commit/490d003b668bd6b0016309302aae758a768c5826))
- 优化 ConversationBottomConsole 组件，替换原生按钮为 Ant Design 按钮并调整样式 ([342456e](https://github.com/nuwax-ai/nuwax/commit/342456e29ec3fe8e447dde2bf28345f754350184))
- 优化 FileTreeGitSourcePanel 和 SkillDetail 页面样式，增强文件树视图的适应性 ([6eb38d7](https://github.com/nuwax-ai/nuwax/commit/6eb38d78c3d697386aca298609306ac1ccbd4828))
- 优化创建项目功能与会话面板交互 ([1966d76](https://github.com/nuwax-ai/nuwax/commit/1966d76cd39593e7cd83d0e8fcb08a916ffbd500))
- 优化对话底部控制台和文件树面板样式 ([6961182](https://github.com/nuwax-ai/nuwax/commit/6961182acf92c326da48086b192b18ed333afe01))
- 优化开发权限表单中的数字输入项 ([c122a0d](https://github.com/nuwax-ai/nuwax/commit/c122a0d26ee5a98fd56c62df112ebdf659ca007d))
- 优化文件树预览状态管理与清理逻辑 ([5c0776e](https://github.com/nuwax-ai/nuwax/commit/5c0776ec18d3ee8b73566fc48bf20e12b009f921))
- 优化文件树预览面板的样式和逻辑 ([e917cb7](https://github.com/nuwax-ai/nuwax/commit/e917cb750a252adefb7dc03584dd9e3c0c7cfaaf))
- 优化智能体编排配置策略 ([ed55c4b](https://github.com/nuwax-ai/nuwax/commit/ed55c4b343e1d56df2f2d11fb3e7d1270c5dd7a5))
- 优化添加成员和消息发送模态框的搜索功能 ([8729e73](https://github.com/nuwax-ai/nuwax/commit/8729e739a3ed9b0d39941285da37c1e95eb02c45))
- 优化终端组件的鼠标追踪与布局同步逻辑 ([251917d](https://github.com/nuwax-ai/nuwax/commit/251917dd7b3db0b21eb6f97242b8007e23c887ff))
- 优化终端连接与断连处理逻辑 ([2055c57](https://github.com/nuwax-ai/nuwax/commit/2055c5722299bd8f693b89360d1e7ff8b53613a0))
- 会话框语音输入与底栏集成 ([9a55811](https://github.com/nuwax-ai/nuwax/commit/9a558114a99507cdfba5413a3ab67dafbaacdd8a))
- **会话组件:** 优化终端连接逻辑，增加服务启动判断 ([ef5532d](https://github.com/nuwax-ai/nuwax/commit/ef5532d3f5b6a8aa3734dd063f18692787ba3ed6))
- **会话组件:** 增加输入框禁用控制功能 ([a6e370f](https://github.com/nuwax-ai/nuwax/commit/a6e370f006d296bf10bc619b4225b55be6d6f135))
- 修复侧滑菜单顶部留空的问题 ([c2c0ab8](https://github.com/nuwax-ai/nuwax/commit/c2c0ab878edeccf5b957a9364ecfffdc4c1ffe2a))
- 全屏页（智能体详情/工作流/应用开发/我的电脑/文档）桌面端新开独立窗口 ([27da761](https://github.com/nuwax-ai/nuwax/commit/27da761d1162b9f76dcba4fdc6ff5e700f43f73f))
- 删除 AppDev 页面相关组件及样式文件 ([c1bb822](https://github.com/nuwax-ai/nuwax/commit/c1bb822f5ed4aca144c6b6c179d9b39e8769f3c9))
- 升级 @nuwax-ai/openui-mcp 依赖至 0.2.1，并新增 OpenUI 工具调用判断逻辑 ([3cd10f0](https://github.com/nuwax-ai/nuwax/commit/3cd10f06279664b8216cf01fa8cd0a1fbcfdfb99))
- **图标:** 新增历史会话图标 ([256ccaa](https://github.com/nuwax-ai/nuwax/commit/256ccaa6dd9cdf2b2a2d52c41f38dc23254f7d38))
- **图标:** 新增历史会话图标 ([3777cd8](https://github.com/nuwax-ai/nuwax/commit/3777cd844fa3fc61a7e3883c492715fd6b45ca4b))
- 在 localStorage 中启用针对代理的自动或审核模式持久化，以实现精细的干预设置 ([51f2635](https://github.com/nuwax-ai/nuwax/commit/51f263593ffa92b3ae694e6d225ecc6886b73f8d))
- 在“ToolCallProcess”中实现“DiffViewItem”组件，以便显示文件差异。 ([0fb94a1](https://github.com/nuwax-ai/nuwax/commit/0fb94a1139ce77ea14389d3ad02e95c0444ea2c0))
- 在 OpenIframePage 页面中添加侧边栏展开按钮及相关逻辑 ([f2ab01a](https://github.com/nuwax-ai/nuwax/commit/f2ab01a9e1de9b05ba3856301d8098cd73cf4c95))
- 在开发权限表单中优化数字输入项的精度设置 ([5a6f3ac](https://github.com/nuwax-ai/nuwax/commit/5a6f3acdeec355a71217ff3ea92006509774cf8f))
- 在我的订阅页面中添加标题左侧插槽和样式 ([5582b2e](https://github.com/nuwax-ai/nuwax/commit/5582b2ef216225e6b6026063e3dc8fc76803b37d))
- 在技能详情视图中添加文件树刷新功能 ([b9ae7da](https://github.com/nuwax-ai/nuwax/commit/b9ae7da409df8a25065941166b561104e20c7de1))
- 在提示框组件中添加输入验证和字符限制反馈功能 ([d08ac9c](https://github.com/nuwax-ai/nuwax/commit/d08ac9c1ece7eb88771219a2ae2ae5b2badfdd2b))
- 增加 Git 列表刷新功能的禁用状态支持 ([7c271f7](https://github.com/nuwax-ai/nuwax/commit/7c271f7d6fe9f7965682e729a10a8360c1ea9a5e))
- 增加全栈应用相关国际化支持 ([0164ef5](https://github.com/nuwax-ai/nuwax/commit/0164ef5d81086b07e6b0270d5ae10e3df6375876))
- 增加刷新文件列表接口到静默请求列表 ([6e78e15](https://github.com/nuwax-ai/nuwax/commit/6e78e15cc342fef9d193ad8430f95516cd07321a))
- 增加常规项目相关国际化支持 ([a65f32e](https://github.com/nuwax-ai/nuwax/commit/a65f32ebda81c8a7b4625ab4741f805b549969fe))
- 增加应用内 iframe 菜单支持与刷新逻辑 ([fba3915](https://github.com/nuwax-ai/nuwax/commit/fba3915e4a84fd22f81ecd6887c668b2be46725c))
- 增加撤销/重做功能及光标位置管理 ([6f00865](https://github.com/nuwax-ai/nuwax/commit/6f008653b52b8c24e4bf6dadf0ad4886aaf2a96c))
- 增加文件树视图的只读模式支持 ([8c1ad9b](https://github.com/nuwax-ai/nuwax/commit/8c1ad9b9f4bc95f99c28a266017a16093a3ad68a))
- 增加文件树预览面板和对话底部控制台的功能 ([1c69156](https://github.com/nuwax-ai/nuwax/commit/1c6915698808a7fd9419862b67f013428cb3ee98))
- 增加智能体子类型筛选功能 ([94b1c8a](https://github.com/nuwax-ai/nuwax/commit/94b1c8af35eba5e87b1cf1cc40500a1477a1fcc2))
- 增加独立会话操作项和优化菜单过滤逻辑 ([d39dec8](https://github.com/nuwax-ai/nuwax/commit/d39dec850eb20ed221046100cfd2b8f68f0ad0c5))
- 增加终端连接状态管理 ([c887e4b](https://github.com/nuwax-ai/nuwax/commit/c887e4b9a4c4f08192ba7381daeb3216112da59f))
- 增加聊天功能的注释说明 ([85acafb](https://github.com/nuwax-ai/nuwax/commit/85acafbcfa37c4fd17766517b66ec0ba5e5169d2))
- 增强 applyAcpPermissionSseEvent 函数以支持 PROCESSING 请求权限事件 ([97a9050](https://github.com/nuwax-ai/nuwax/commit/97a9050ce6bb1b446460e114a5201df59e50e95e))
- 增强 ConversationBottomConsole 组件的容器管理与错误处理 ([097fa36](https://github.com/nuwax-ai/nuwax/commit/097fa3678a6ff02cb718afc1a22d0243993cfc14))
- 增强 Git 文件预览与差异选择功能 ([2fb053d](https://github.com/nuwax-ai/nuwax/commit/2fb053da151b1fabd68c15f5b387f71558a90349))
- 增强文件树预览逻辑与状态管理 ([6c782b4](https://github.com/nuwax-ai/nuwax/commit/6c782b46298ae4c3d31d57e12938d654b3c80d93))
- 增强文件树预览面板的文件选择逻辑 ([d9c596e](https://github.com/nuwax-ai/nuwax/commit/d9c596ee9fa439403d1ca09dcb3dbc5b3ed3a629))
- 增强文件树预览面板的版本控制支持 ([a02111c](https://github.com/nuwax-ai/nuwax/commit/a02111cfcf0bcaa37341b56cbc3b38c503942a77))
- 增强终端重连功能与命令提示符处理 ([f597f40](https://github.com/nuwax-ai/nuwax/commit/f597f40f9a42492699b3d9f4cc73506d59e6331e))
- 增强终端面板功能与状态管理 ([bac52c5](https://github.com/nuwax-ai/nuwax/commit/bac52c5d840a636b46f085a0d49a9020907e281c))
- 增强聊天会话滚动逻辑 ([d2cf875](https://github.com/nuwax-ai/nuwax/commit/d2cf8756677479110f7e374a3c8e49c0d0b243e8))
- 增强菜单路径处理逻辑 ([6dfa907](https://github.com/nuwax-ai/nuwax/commit/6dfa90791307307d476f543d7c5820f19c534df7))
- 处理智能体详情页无法切换自动或审核模式 ([668b739](https://github.com/nuwax-ai/nuwax/commit/668b7397f8c1af77b8efeb129b6bf6092829a1ad))
- 女娲主题换中性浅灰基调（rgb(243,244,246)）+ 弱化菜单高亮 ([7f8d93c](https://github.com/nuwax-ai/nuwax/commit/7f8d93c80c1de1f16cc834854df8c92d28591eef))
- 女娲主题注册进主题切换维度 + nuwaclaw 桌面端主机命令与布局门控 ([a150647](https://github.com/nuwax-ai/nuwax/commit/a150647b1c5afc7f5baf785bf0f88d9303116f3b)), closes [#EFF1F6](https://github.com/nuwax-ai/nuwax/issues/EFF1F6) [#E5E8](https://github.com/nuwax-ai/nuwax/issues/E5E8) [#E9EBF1](https://github.com/nuwax-ai/nuwax/issues/E9EBF1) [#C9](https://github.com/nuwax-ai/nuwax/issues/C9)
- 女娲主题状态经桥推送 nuwaclaw 壳（原生 UI 统一米白） ([efa051d](https://github.com/nuwax-ai/nuwax/commit/efa051d613fbdaaa2ea4e939456b773073eaa13e))
- 实现可复用的 TabsList 组件，并重构 SpaceNewProject 中的 PromptBox 布局 ([0f624f2](https://github.com/nuwax-ai/nuwax/commit/0f624f2d1f4da80d659d90ff9f047342f1244371))
- 实现持久化的焦点管理以及干预卡片的键盘快捷键 ([89f09ac](https://github.com/nuwax-ai/nuwax/commit/89f09acfdc7616614f43ae8b1df99a2b00b19eaa))
- 实现支持行级变更统计的 Markdown 差异查看器 ([710e4bb](https://github.com/nuwax-ai/nuwax/commit/710e4bb55a887d8cc1d7d8e4b3fd2839d85834fc))
- 实现组件状态缓存，并优化 NewHomeSection 导航的重新加载逻辑 ([32ce241](https://github.com/nuwax-ai/nuwax/commit/32ce24160f276ddfa85df88425b7ef3993c124e8))
- **对话代理:** 增加顶部预览 Tab 切换功能 ([d578ae9](https://github.com/nuwax-ai/nuwax/commit/d578ae98a33560064af7f2ffa2b600e21d70c7ac))
- **对话代理:** 增强文件预览与版本控制的刷新逻辑 ([40673e5](https://github.com/nuwax-ai/nuwax/commit/40673e51d6116aa204954d1787e0ec275773b866))
- **对话代理:** 增强版本控制功能的逻辑处理 ([7e79cc1](https://github.com/nuwax-ai/nuwax/commit/7e79cc126e78ec0907bb6ba230110eb1de7ef0d7))
- 将运行模式切换从 Segmented 改为 Dropdown，与模型选择器样式对齐 ([d6e21d2](https://github.com/nuwax-ai/nuwax/commit/d6e21d25ebff07c67986a35261b41b7fe8aeb134))
- 待发送队列首条消息常驻显示操作按钮区 ([1a478a6](https://github.com/nuwax-ai/nuwax/commit/1a478a6555e9e23d30168b06afb514ced1d9738e))
- 接入 generate-info 自动生成资源图标 ([17f16bc](https://github.com/nuwax-ai/nuwax/commit/17f16bc6db5850339c64c5701aa32015be629fa4))
- **推荐管理:** 优化推荐添加弹窗逻辑 ([7a478b5](https://github.com/nuwax-ai/nuwax/commit/7a478b51c98f61107cc0c4b4965d0063fb325f88))
- **推荐管理:** 优化推荐管理组件，支持目标类型 Tab 切换 ([bbef964](https://github.com/nuwax-ai/nuwax/commit/bbef964f0dd6af436fd307815ed3ecd670312452))
- **推荐管理:** 优化推荐表单和列表页面功能 ([d3bc2c9](https://github.com/nuwax-ai/nuwax/commit/d3bc2c963d281b20b67575c0b64742f7e13aa813))
- **推荐管理:** 新增推荐添加弹窗组件及样式 ([9b8b2f8](https://github.com/nuwax-ai/nuwax/commit/9b8b2f8d00fc92688144a1ea840b838773884365))
- **推荐管理:** 新增推荐管理图标及相关常量 ([312058c](https://github.com/nuwax-ai/nuwax/commit/312058c3006b175bfa99c22e8a59e98525c1c436))
- **推荐管理:** 添加多语言支持及智能体选择功能 ([fb496e3](https://github.com/nuwax-ai/nuwax/commit/fb496e3a4302d69c8833fe121f9fe46b292d1884))
- 支持对话中渲染 OpenUI Artifact ([aa70c8e](https://github.com/nuwax-ai/nuwax/commit/aa70c8e34d2fb94e89767020ef0b45c0a665eac8))
- 收敛 NuwaClawBridge 接入层并新增 nuwaclaw 桌面专属主题 ([713be30](https://github.com/nuwax-ai/nuwax/commit/713be3023dab36a057d266ab2d0c9bb5b2d9c55c)), closes [#2563](https://github.com/nuwax-ai/nuwax/issues/2563)
- 收起态悬浮二级菜单顶部避让 nuwaclaw 工具栏（同 shellAvoid.TOP） ([8a54e19](https://github.com/nuwax-ai/nuwax/commit/8a54e19b897e65c9dfacb76d935254702d328f65))
- **文件导入导出:** 优化文件下载逻辑 ([115db32](https://github.com/nuwax-ai/nuwax/commit/115db328eabea7b8cdfe7f406f7b03c31131df88))
- **文件树预览:** 优化 Git 状态启用逻辑 ([0da097d](https://github.com/nuwax-ai/nuwax/commit/0da097d0404807cd4f5e108574bbdcf10e50958d))
- **文件树预览:** 优化文件树加载与显示逻辑 ([bd52851](https://github.com/nuwax-ai/nuwax/commit/bd528517b25ff2553a78ca6446f13dc9ee6d6301))
- **文件树预览:** 增加对不支持预览文件类型的处理 ([c65af84](https://github.com/nuwax-ai/nuwax/commit/c65af84b82a1021824a003e9e7d6524197d6a9fa))
- **文件树预览:** 增加选中文件 ID 的支持 ([b83aba4](https://github.com/nuwax-ai/nuwax/commit/b83aba40815d70555bd1d33d8b61a820a321920c))
- **文件预览:** 优化文件预览逻辑与自动选择功能 ([b719193](https://github.com/nuwax-ai/nuwax/commit/b7191938121da247557c9ccfed76810b6fd71fda))
- 新增 KaTeX 支持，优化 Markdown 预览功能 ([390790f](https://github.com/nuwax-ai/nuwax/commit/390790f4d7299858326e8a614b5e8db0d4781fee))
- 新增会话交互处理及渲染示例页 ([94a710b](https://github.com/nuwax-ai/nuwax/commit/94a710b2294110db0abbfc476a588c85c62bf984))
- 新增工作流知识库写入节点并支持拖入时选择知识库 ([165a88c](https://github.com/nuwax-ai/nuwax/commit/165a88cb981cc57d05ca66d19a1e8ea4d9139c5c))
- 新增技能详情组件及相关页面 ([51de93c](https://github.com/nuwax-ai/nuwax/commit/51de93c25ad88cec2f1cd4d9169c582eed3faa1e))
- 新增智能体电脑存储上限和网页应用存储上限功能 ([327d67e](https://github.com/nuwax-ai/nuwax/commit/327d67ee1140cd9a62be3b0c8fc279266ee38ad3))
- 新增终端 WebSocket 地址生成 Hook 及相关功能 ([db01652](https://github.com/nuwax-ai/nuwax/commit/db01652500aec6465bf783c231c35c69111c9b45))
- 新增项目依赖安装功能 ([0205b19](https://github.com/nuwax-ai/nuwax/commit/0205b1977798b82343665f3c3f8bf933e9678eb7))
- 新建场景接入 GuardedFormModal 提交防重 ([86cb7d6](https://github.com/nuwax-ai/nuwax/commit/86cb7d60bd253faa5de6b775c8bd152cc65a2450))
- **智能体配置:** 新增判断 AgentGroup 子类型的功能 ([fd0f4b9](https://github.com/nuwax-ai/nuwax/commit/fd0f4b922ac2d5bda09f244b66679c9cda6abfa2))
- **智能体配置:** 新增组员配置功能 ([fd6ba8b](https://github.com/nuwax-ai/nuwax/commit/fd6ba8bf783aa04664cdbed119fcef1039447ca8))
- 更新 AgentFlow 编排策略以支持设备智能体 ([86d9add](https://github.com/nuwax-ai/nuwax/commit/86d9add8d6790b1cb0040d01e76d7dfd854bd3bf))
- 更新 beSilentRequestList 函数以支持会话详情请求的静默处理 ([3358a76](https://github.com/nuwax-ai/nuwax/commit/3358a76cae3a3c369aae2146422b91cdcbea97ad))
- 更新 ChangeFileGitDiffView 组件的引用路径 ([bff8856](https://github.com/nuwax-ai/nuwax/commit/bff885632007c16fda7bfefb1ee9e221852e8119))
- 更新 ConversationBottomConsole 组件的 conversationId 注释 ([8dce592](https://github.com/nuwax-ai/nuwax/commit/8dce592fe046183a17165d2c2cb267ae8a244495))
- 更新全栈应用与常规项目的国际化支持 ([a8e0fba](https://github.com/nuwax-ai/nuwax/commit/a8e0fbafa5f77787c9c81c825ed2eda41fc1ae1d))
- 更新回滚功能使用 git revert 命令 ([12f030a](https://github.com/nuwax-ai/nuwax/commit/12f030a35d6f9f48f470fb1dbea745549db3349c))
- 更新头像上传组件支持 SVG 格式 ([be2cbbc](https://github.com/nuwax-ai/nuwax/commit/be2cbbc816bf88fc992ad8cf5adec546d0e0234f))
- 更新样式变量，优化表格和标签样式 ([70bf082](https://github.com/nuwax-ai/nuwax/commit/70bf0820a13b8cab83a0fb1ed257b452f4b0fd45))
- 更新网页构建资源并重新生成生产文件，将 AcpPermissionCard 标题更新为在可用时显示原始的 bash 命令 ([c562348](https://github.com/nuwax-ai/nuwax/commit/c56234848eaab2d45a5e92b37b168e17ca4e0c14))
- 更新项目创建策略以支持计算机 ID ([f3f9404](https://github.com/nuwax-ai/nuwax/commit/f3f940472490547f91de3a8d7f5636a4a2d0da20))
- 桌面端主内容区顶部避让 nuwaclaw 工具栏（二级页面返回栏统一让位） ([ef37352](https://github.com/nuwax-ai/nuwax/commit/ef37352ee9d11e5a1f60f61004438c4a09a84f77))
- 桌面端推送二级菜单存在性（壳工具栏按页显隐收起按钮） ([5a1f5f5](https://github.com/nuwax-ai/nuwax/commit/5a1f5f57e24212df3ab8d51f8d4f8dd8dd9eeb91))
- 添加 agentMode 状态，并将其作为属性传递给主页组件 ([1305639](https://github.com/nuwax-ai/nuwax/commit/1305639e236178156587f8059f97bb84483970e6))
- 添加数据源管理注释说明 ([756b81f](https://github.com/nuwax-ai/nuwax/commit/756b81f3305c7e39d57ab31cf472b98547b2a992))
- 添加自动发送初始化功能 ([353f3c0](https://github.com/nuwax-ai/nuwax/commit/353f3c003356e54791436c6eb2d482700d08b566))
- 添加验证以防止用户名登录时包含空格，并更新本地化文件 ([36af944](https://github.com/nuwax-ai/nuwax/commit/36af9449f20833325ecb7967ae98f8caaa6c3c69))
- **生态市场:** 移除生态市场相关组件和常量 ([76f0e35](https://github.com/nuwax-ai/nuwax/commit/76f0e351efd6110c38173bc36d2e094a09f949bb))
- 移除 prompt-kit-editor 依赖，统一使用 TiptapVariableInput 组件 ([011a73a](https://github.com/nuwax-ai/nuwax/commit/011a73acb5b21c19f5de25a468c4645408d08bfd))
- 移除文件重命名状态及相关提示 ([3426fc5](https://github.com/nuwax-ai/nuwax/commit/3426fc5b48b75c9bbd914bde8393b5543580f18e))
- **空间操作:** 增加更多操作项并优化显示逻辑 ([422a22d](https://github.com/nuwax-ai/nuwax/commit/422a22df4a264ced9854671b9777bf35b3bb86e4))
- **组件优化:** 替换终端图标并调整选项卡激活状态逻辑 ([dc69830](https://github.com/nuwax-ai/nuwax/commit/dc69830252df7552720f08bd0e1868aa2bfe26b6))
- 调整 PluginTryRunModal 组件样式及移除无用代码 ([0cdbfc6](https://github.com/nuwax-ai/nuwax/commit/0cdbfc6f369d2ce38776a17c1e5a6e617ccaaa29))
- **路由管理:** 新增历史会话路由 ([8f81b13](https://github.com/nuwax-ai/nuwax/commit/8f81b13687d6aef039b6130d8d2775dcf90f01e7))
- 通过 ChatInputHome 中的 ref 实现 focus 方法，以启用推荐选项的聚焦功能 ([aa31599](https://github.com/nuwax-ai/nuwax/commit/aa315998db995ca65b2d4b80062c57e5be58bb06))
- 通过事件总线监听器在聊天完成时更新会话任务状态 ([941d23b](https://github.com/nuwax-ai/nuwax/commit/941d23ba115fe867ba378fa1df21dfb6ff494705))
- 重构沙盒日志功能，优化数据处理逻辑 ([b13a47a](https://github.com/nuwax-ai/nuwax/commit/b13a47a11a5acfc172512c8988a7a651db6d1e6f))

## [1.1.0] - 2026-03-06

### ✨ 新功能

- 广场（Square）：增强滚动加载与自动填充逻辑，支持更多内容流畅加载。
- 空间板块（SpaceSection）：增强滚动加载与自动填充逻辑，优化长列表浏览体验。
- 生态 MCP（EcosystemMcp）：增强滚动加载与自动填充逻辑，提升生态市场内容加载能力。
- 知识库原始片段（RawSegmentInfo）：增强自动加载与编辑功能，便于文档片段管理。
- 更多操作菜单（MoreActionsMenu）：新增重启功能图标并更新相关常量，便于开发环境快捷操作。

### 🐛 Bug 修复

- 空间知识库（SpaceKnowledge）：修复页码更新逻辑并优化文档加载体验。
- 知识库原始片段（RawSegmentInfo）：修复页码更新逻辑以正确加载数据。
- 数据权限弹窗（DataPermissionModal）：修复页码更新逻辑以提升数据加载体验。
- 空间板块（SpaceSection）：修复滚动加载逻辑以正确更新页码。
- 生态 MCP（EcosystemMcp）：修复滚动加载逻辑以正确更新页码。

### ♻️ 重构

- 广场（Square）：优化滚动加载逻辑，提升代码可维护性。
- 菜单列表项、页面预览 iframe、菜单布局（MenuListItem, PagePreviewIframe, MenusLayout）：优化组件逻辑与样式。
- 布局与动态菜单（Layout, DynamicMenusLayout）：移除已注释的动态菜单相关代码以简化布局。
- 动态菜单、空间板块、空间开发、应用项（DynamicMenusLayout, SpaceSection, SpaceDevelop, ApplicationItem）：注释掉开发收藏相关逻辑以简化代码。

### 🎨 样式优化

- 空间开发（SpaceDevelop）：更新主容器样式以优化响应式布局。

## [1.0.8] - 2026-02-02

### ✨ 新功能

- feat(Chat, PreviewAndDebug): add setIsMoreMessage to manage message loading state
- feat(CreateModel): 新增或编辑模型时，新增最大上下文长度字段
- feat(historyConversation): 添加历史会话页面关闭按钮

### 🐛 Bug 修复

- 修复 SSE 连接关闭逻辑，确保连接关闭时正确标记中止状态
- 修复会话停止逻辑，确保 requestId 为空时也能停止会话
- 修复清空会话后对话设置未重置问题
- 修复页面切换时 SSE 连接未中断问题
- 修复代码规范问题（ESLint）

### ♻️ 重构

- 恢复 v1.0.8-alpha 代码版本
- 移除 ChatArea 组件中冗余的 handleAddToChat 函数，简化代码结构
- 重构 SSE 连接逻辑，分离工作流与会话的 SSE 连接

### 🎨 样式优化

- style(EditAgent): Comment out mask property in PreviewAndDebug for improved visibility in WeChat
- style: update AgentModelSetting layout and logic
- style: update SystemTipsWord layout
- 将"远程桌面"统一更名为"智能体电脑"

### 🔧 构建/工具

- 更新 .gitignore 文件，添加 .agent 以排除相关文件
- 清理测试文件和示例文件

### 📚 文档

- 更新项目文档

## [1.0.7] - 2026-01-14

### ✨ 新功能

- 新增远程桌面分享功能，支持生成分享链接和设置过期时间
- 新增文件树面板展开/折叠和固定功能，提升用户交互体验
- 新增 VNC 远程桌面预览连接状态显示和自动重连机制
- 新增空闲检测功能和警告弹窗，支持用户长时间无操作时自动断开连接
- 新增加载更多历史消息功能，支持会话消息分页查询
- 新增任务智能体模式切换功能
- 新增文件操作提示框（上传、下载、导出、导入），增强用户反馈
- 新增文件预览支持更多格式（SVG、JSON、Office 文档等）
- 新增子智能体配置功能（SubAgentConfig）
- 新增技能变量支持和工具分类功能
- 新增会话状态更新事件监听，任务状态变化时 UI 及时更新
- 新增未保存更改检查功能，防止用户在未保存的情况下进行重要操作

### 🐛 Bug 修复

- 修复 SSE 连接关闭逻辑，确保连接关闭时正确标记中止状态
- 修复会话停止逻辑，确保 requestId 为空时也能停止会话
- 修复清空会话后对话设置未重置问题
- 修复页面切换时 SSE 连接未中断问题
- 修复导出文件名解码问题，支持特殊字符
- 修复文件预览组件类型切换时的闪动问题
- 修复会话结束后文件树刷新逻辑
- 修复任务记录跳转使用错误的空间 ID
- 修复空消息渲染问题，过滤掉空消息
- 修复 Select 组件选项匹配不上时的显示问题

### ♻️ 重构

- 重构 AppDev 文件树面板和聊天区域组件结构
- 重构 FileTreeView 组件，优化文件选择逻辑和视图模式切换
- 重构 SSE 连接逻辑，分离工作流与会话的 SSE 连接
- 重构 VncPreview 组件，优化连接检查和重试机制
- 优化工作流 v3 版本的表单值合并逻辑和节点数据获取逻辑
- 优化最近使用和会话记录查询逻辑
- 统一提示信息中的称谓为"你"以提升用户亲和力

### 🎨 样式优化

- 新增滚动条自动隐藏样式，仅在悬停时显示
- 优化文件树顶部样式和搜索视图高度
- 优化聊天页面布局，支持动态调整左侧宽度
- 优化空状态组件图标和加载动画样式
- 将"远程桌面"统一更名为"智能体电脑"

### 📚 文档

- 新增 TiptapVariableInput 组件文档
- 新增变量引用规则文档
- 新增试运行逻辑分析文档

## [1.0.6] - 2026-01-05

### ✨ 新功能

- 新增 VNC 远程桌面预览功能，长任务智能体支持远程桌面操作
- 重构工作流 v3 版本，新增变量聚合节点（VariableAggregation）组件
- 新增是否支持 Design 设计模式配置开关
- 增强日志处理逻辑，支持检测最新日志块中的错误
- 为文件树视图添加加载遮罩层，优化加载状态指示
- 添加自定义滚动条样式，仅在悬停时显示滚动条

### 🐛 Bug 修复

- 修复智能体编排页同步开场白内容及预置问题列表逻辑
- 修复插件参数对 Object 和 Array 类型子级删除逻辑
- 修复 Design 模式下内容编辑删除 bug
- 修复 VariableAggregation 目录命名规范（统一大写 V）
- 修复 nodeItem 组件导入路径问题
- 修复页面预览 iframe 不必要的页面重载问题

### ♻️ 重构

- 移除不必要的 onConfirmUpdateEventQuestions 属性
- 优化 nodeItem 样式，简化输入框样式设置
- 增强 DesignViewer 组件的内容更新和聊天功能
- 统一跳转 URL 子包处理逻辑

### 📚 文档

- 添加 DesignViewer 设计模式开发指南
- 添加查找替换规则文档
- 更新开发指南，添加 Vite 插件预注入说明和常见问题

## [1.0.5] - 2025-12-08

### ✨ 新功能

- 新增 DesignViewer 设计模式组件，支持 Tailwind CSS 样式编辑和实时预览
- 增强 TiptapVariableInput：支持变量输入、Markdown 语法、可编辑变量节点、自定义标签保护
- 添加项目导出、聊天任务取消、变量建议外部关闭、多行智能样式替换

### 🐛 Bug 修复

- 修复文件上传/导入加载状态管理、useAppDevServer 支持 devServerUrl 为 null
- 修复 PagePreviewIframe 文档处理、智能体引导问题、聊天滚动检测逻辑
- 修复设计模式状态管理，迁移到 appDevDesign 模型

### ♻️ 重构

- 重构 TiptapVariableInput 实现自包含变量树，移除 VariableInferenceInput
- 统一变量转换方法到工具库，提取滚动检测到独立 Hook
- 优化 DesignViewer 模块化，升级 TiptapVariableInput 到 React 18 API
- 清理调试日志和未使用代码

### ⚡️ 性能优化

- 优化 TiptapVariableInput 光标位置和滚动保持，使用 useCallback 优化 EditAgent

## [1.0.3] - 2025-11-24

### ✨ 新功能

- 同步老仓库最新代码，添加微信小程序支持、封面图片上传、MCP 智能体支持
- 新增 TiptapVariableInput 组件，支持 @ 提及和变量自动补全
- 添加项目 ID 支持、版本更新检查、回到首页悬浮图标
- 重构 useAppDevServer 和 useDevLogs 钩子，使用 umi 的 useRequest 进行轮询

### 🐛 Bug 修复

- 修复封面图片源类型导入、图片加载错误处理、AttachFile 组件 mimeType 容错
- 修复 useAppDevServer keepAlive 多项目并发问题
- 修复 PagePreviewIframe 页面刷新逻辑、小程序跳转路径、AppDev 取消任务错误

### ♻️ 重构

- 使用枚举替代字符串常量，优化微信小程序消息发送逻辑
- 优化 TiptapVariableInput 和 ExpandTextArea 组件
- 清理 AppDev 调试日志（移除 80+ 条）

### 🧪 测试

- 新增 TiptapVariableInputTest 测试页面

## [1.0.2] - 2025-11-17

### 🔧 构建/工具

- 添加 esbuild 依赖并在配置中实现 dev-monitor.js 的复制与压缩功能
- 更新 dev-monitor.js 版本号至 1.0.2、1.0.3、1.0.4

### ✨ 新功能

- 同步老仓库最新代码
- 添加微信小程序支持功能，注入 JS-SDK 并监听 DOM 变化以发送消息
- 添加封面图片上传功能，更新相关样式和逻辑，增强页面编辑和创建功能
- 更新预览组件逻辑，添加封面图片源类型判断，优化截图处理
- 更新 PageCard 组件，替换 icon 属性为 coverImg，优化样式过渡效果，移除不再使用的 PageDevelopCardItem 组件
- MCP 添加智能体支持，更新相关组件和常量，优化图标处理逻辑
- 添加创建智能体功能，更新 Created 组件和服务接口以支持智能体类型
- 添加 streamableHttp 类型支持，更新样式以增强组件可视化效果
- 添加项目 ID 支持以区分不同项目的最近使用记录，在 ChatArea、ChatInputHome 和 MentionSelector 组件中引入 projectId 属性

### 🐛 Bug 修复

- 修复封面图片源类型导入路径，确保正确引用
- 添加图片加载错误处理逻辑，确保组件在图片加载失败时使用默认图片
- 修复 useAppDevServer 中 keepAlive 可能同时运行多个不同 projectId 的问题，引入 useParams 从 URL 获取最新的 projectId，确保同一时间只有当前 URL projectId 的 keepAlive 在运行
- 优化封面图片来源设置逻辑，确保用户未上传图片时不设置来源
- 更新 Created 组件的 checkTag 属性，从 Plugin 修改为 Workflow，以确保正确的组件类型匹配
- 修复 AttachFile 组件中对 mimeType 的容错处理，确保在后端返回空值时不导致错误
- 延迟发送微信小程序消息，确保 DOM 变化监听稳定性
- 添加错误发送防抖逻辑，优化错误消息发送至父窗口的稳定性
- 更新 Created 组件中的 agentItem 标签，将 label 从 '当前空间智能体' 修改为 '全部'，新增 '当前空间智能体' 选项

### ⚡️ 性能优化

- 优化微信小程序消息发送逻辑，简化代码结构并增强 DOM 变化监听功能

### ♻️ 重构

- 使用枚举替代字符串常量，增强代码可读性和可维护性，添加错误处理逻辑
- 移除同步登录状态功能的实现，简化代码结构
- 将最近使用的文件和数据源存储从 localStorage 更改为 sessionStorage，提高数据的即时性
- 注释掉 setupMutationObserver 函数以简化错误监控逻辑，保留相关逻辑以便未来可能的恢复
- 注释掉资源加载错误处理逻辑，简化错误监控代码
- 重构 useAppDevServer 和 useDevLogs 钩子以使用 umi 的 useRequest 进行轮询，简化定时器管理，优化状态管理，提升代码可读性和维护性

## [1.0.1] - 2025-11-10

### 📝 文档

- 更新 README 文档内容和结构
- 更新 nuwax-cli 版本信息

### 🔧 构建/工具

- 新增项目开发规则文档
- 优化构建配置和依赖管理
- 更新依赖版本（prompt-kit-editor、simple-edit-markdown、ds-markdown 等）
- 优化 Husky 和 Git 钩子配置
- 清理未使用的文件和依赖

### ✨ 新功能

- 为 MCP 管理添加官方服务与自定义服务分类
- 为生态市场添加 MCP 模块和分类筛选功能
- 为智能体添加设置展开扩展页面区域与隐藏聊天区域切换
- 为页面开发中的聊天会话框新增复制粘贴图片功能
- 为输入框添加复制粘贴功能
- 为预置引导问题添加图标和字数限制
- 为创建分享添加组件弹窗优化样式以及添加 loading 和空状态
- 临时会话手机端添加 clear 刷子功能
- 优化 AppDev 页面逻辑和 UI 状态处理

### 🐛 Bug 修复

- 修复 MCP 搜索以及滚动加载问题
- 修复会话框向下滑动时无法鼠标滚动的问题
- 修复事件绑定与预置问题设置必填参数校验
- 优化会话主题闪现问题
- 移除调试日志输出

### ⚡️ 性能优化

- 优化代码逻辑和组件性能
- 优化 loading 效果
- 优化 iframe 内部导出添加新的 sandbox 值
- 为智能体组件设置卡片添加 placeholder
- 优化会话处理卡片和智能体编排交互

### ♻️ 重构

- 重构 AppDev 页面开发日志查看器，从悬浮式改为内嵌式
- 重构页面开发聊天框关于数据源切换
- 重构页面开发输入框组件
- 重构广场组件和生态市场模板逻辑
- 重构智能体开发卡片和数据表

## [1.0.0] - 2025-11-01

### ✨ 新功能

- 智能体平台前端项目初始版本发布
- 基于 React 18 + UmiJS Max + Ant Design 的智能体平台前端项目
- 提供智能体开发、管理和使用的完整解决方案
- 集成先进的 AI Agent 系统，支持文件管理、代码编辑、实时预览和 AI 助手聊天功能
- AppDev Web IDE：集成开发环境，支持文件管理、代码编辑和实时预览
- AI 助手聊天：基于新的 OpenAPI 规范的实时 AI 对话功能，支持流式响应和工具调用
- 工作空间管理：项目文件树管理、文件上传和版本控制
- 知识库管理：智能体知识库的创建和维护
- 组件库管理：可复用组件的管理和发布
- MCP 服务管理：Model Context Protocol 服务集成
- 生态系统管理：插件、模板和服务的生态系统
- 动态主题背景切换：支持 8 种预设背景图片，实时切换，状态持久化

### 🎨 技术栈

- **前端框架**: React 18 + TypeScript 5.0
- **UI 组件库**: Ant Design 5.4 + ProComponents
- **代码编辑器**: Monaco Editor 0.53.0
- **图形引擎**: AntV X6 2.18.1
- **框架工具**: UmiJS Max 4.x
- **状态管理**: UmiJS 内置 model
- **样式方案**: CSS Modules + Less
- **包管理**: pnpm 10.17.1
- **SSE 通信**: @microsoft/fetch-event-source 2.0.1

[1.0.0]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.0
[1.0.1]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.1
[1.0.2]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.2
[1.0.3]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.3
[1.0.5]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.5
[1.0.6]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.6
[1.0.7]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.7
[1.0.8]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.8
[1.1.0]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.1.0

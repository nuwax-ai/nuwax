# 路由与 spaceId 方案调研：全栈应用 / 智能体开发 / 技能开发

> 调研日期：2026-09-21 ｜ 分支：feat-dong.0930 ｜ 性质：方案调研设计，**未拍板、未改任何代码**
>
> 三个问题：
> 1. 针对全栈应用项目 / 智能体开发 / 技能开发的路由设计是否合理？
> 2. 路由是否应该带 spaceId？
> 3. 是否应该和 home/chat 统一？
>
> 结论速览：**总体合理；spaceId 保留但语义定为「实体归属的冗余携带、实体回读优先」；不与 home/chat 统一路由**，现行「/home/chat 通用入口 + devTargetType 分发 redirect」的桥是正确形态。论证与证据见 §4–§6，可选收敛项见 §7（均不动手，待拍板）。**URL 体系提案（完整版 + 简版短链，针对 /home/chat 双段参数反直觉问题）见 §9；定义/命名不合理及修改建议清单见 §10。**

---

## 1. 术语与壳形态（以 style3 为基准——未来主推风格）

- **工作台域**：开发页（EditAgent / AppDev / AppDevPro / ConversationAgent / 工作流等），路由定义在 `src/routes/index.ts:98-138`，统一 `layout:false + wrappers:['@/wrappers/immersiveShellAvoid']`。
- **常驻壳**：挂在根路由 `@/layouts`（SidebarShell 侧栏）下的普通页面。
- **会话域**：以会话（conversation）为主体消费者的页面，URL 不含 spaceId，空间归属由后端反查。
- **两域的桥**：按会话数据 `devTargetType / devTargetId / devSpaceId` 把会话分发到对应工作台/会话页的跳转逻辑。

**壳形态的真相：由策略层决定，不由路由结构决定。** 壳的唯一分流策略是 `getSidebarShellLayoutPolicy`（`src/layouts/fullscreenWorkbenchPaths.ts:45-62`，消费点 `layouts/index.tsx:24-50`），按「是否工作台路径 × 是否 style3 桌面」产出三联动值：

| 策略值 | style3 桌面（主推） | 经典风格 / 移动端 |
|---|---|---|
| `variant` | 工作台页仍为 `'page'`：与主站共用 page-container，**同一侧栏实例跨跳转存活**（不重挂、不重新初始化） | 工作台页 `'bare'` 裸全屏（历史形态） |
| `suppressSecondMenu` | 工作台页抑制二级菜单列 | 同左 |
| `immersiveMarginTop` | 仅非工作台页做沉浸壳顶部避让 | 同左 |

**结论：style3 下壳形态实际只有一种——单栏、常驻左侧的侧栏 + page-container。原先的「全屏」场景（工作台页组）在 style3 下同样放在 page-container 里，不换壳，只是同一壳内的两项配置差异：「二级菜单列抑制 + 不做沉浸壳顶部避让」**。「工作台 = 无侧栏全屏 IDE」的印象来自经典/移动端的 bare 形态（`variant:'bare'` 仅在 `onFullscreenWorkbench && !style3Desktop` 时返回，fullscreenWorkbenchPaths.ts:58），不是未来形态。后文凡论及壳差异（§4、§6）均按此基准。

另一条**隐式契约**：工作台页集合由 `FULLSCREEN_WORKBENCH_PATH_PATTERNS`（fullscreenWorkbenchPaths.ts:9-16）路径正则维护，与 routes/index.ts 的「全屏工作台页组」构成双列表、靠注释约定同步——新增工作台路由必须同步注册正则，漏注册即壳形态错（见 §8-5）。

## 2. 现状路由清单

以下每行定义均在 `src/routes/index.ts` 逐条核实。「参数位置」列标注身份参数（会话 id / 业务实体 id）落在 path 还是 query。「壳形态」列沿用历史名「全屏工作台」，但按 §1 的 style3 基准理解：**style3 下所有页面同为单栏常驻壳（page-container + 常驻左侧侧栏），列值只表示该页是否属于工作台策略组**——决定二级菜单列抑制、沉浸避让关闭两项配置，以及经典/移动端才有的 bare 全屏。

### 2.1 全栈应用域

| 路由 | 页面 | 参数位置 | 壳形态 | 定义行 |
|---|---|---|---|---|
| `/space/:spaceId/userapp-project` | 全栈应用列表 UserAppProject | path | 常驻壳 | routes:80 |
| `/space/:spaceId/app-project-detail/:appId` | 应用详情 AppProjectDetail | path | 常驻壳 | routes:95 |
| `/space/:spaceId/app-dev/:projectId` | 网页应用 IDE **AppDev** | path（**不带会话**） | 全屏工作台 | routes:116 |
| `/space/:spaceId/app-pro/:appId/:conversationId` | 全栈应用 IDE **AppDevPro** | path（全身份进 path） | 全屏工作台 | routes:122 |
| `/space/:spaceId/app-dev-design/:projectId` | 应用设计 AppDevDesign | path | 全屏工作台 | routes:128（全仓无导航入口，见 §8） |
| `/user-app/:appId` | 全栈应用卡片入口（左会话+右 iframe） | path（**无 spaceId**） | 常驻壳 | routes:50 |

AppDevPro 路由有全仓唯一一套 build/parse 单源工具 `src/utils/appProRoute.ts`（`buildAppProRoute` :37 / `parseAppProRoute` :16 / `buildAppProRedirectPrefix` :46 / 删除会话后回详情 :54）。

### 2.2 智能体开发域

| 路由 | 页面 | 参数位置 | 壳形态 | 定义行 |
|---|---|---|---|---|
| `/space/:spaceId/develop` | 智能体列表 SpaceDevelop | path | 常驻壳 | routes:52 |
| `/space/:spaceId/agent/:agentId` | 编排画布 **EditAgent** | path | 全屏工作台 | routes:110 |
| `/space/:spaceId/agent-dev` | 对话式开发 **ConversationAgent** | path 仅 spaceId；**agentId+conversationId 在 query** | 全屏工作台 | routes:134 |
| `/agent/:agentId` | 智能体详情 AgentDetails | path（**无 spaceId**） | 常驻壳 | routes:48 |

EditAgent 额外 query：`hideBack`（`EditAgent/index.tsx:351`）；审核/已发布场景 window.open 追加 `?applyId=` / `?publishId=`（`PublishAudit/index.tsx:68`、`PublishedManage/index.tsx:59`）。

### 2.3 技能开发域

| 路由 | 页面 | 参数位置 | 壳形态 | 定义行 |
|---|---|---|---|---|
| `/space/:spaceId/skill-manage` | 技能列表+创建 SpaceSkillManage（CreateSkill 为子组件） | path | 常驻壳 | routes:141 |
| `/space/:spaceId/skill-details/:skillId` | 表单式开发 SkillDetails | path | 常驻壳 | routes:155 |
| `/space/:spaceId/skill-details-conversation/:skillId` | 对话式开发 SkillDetailsConversation | skillId 在 path；**conversationId 在 query** | 常驻壳 | routes:169 |
| `/space/:spaceId/apply/skill-details/:skillId` | 审核中详情 | path + `?applyId=` | 常驻壳 | routes:160 |
| `/space/:spaceId/published/skill-details/:skillId` | 已发布详情 | path + `?publishId=` | 常驻壳 | routes:165 |
| `/space/publish/skill/:skillId`、`/square/publish/skill/:skillId` | 广场技能详情 | path（**字面量 `space`/`square` 前缀，非 :spaceId**） | 常驻壳 | routes:264 / routes:279 |

### 2.4 插件域（同属「会话宿主」，一并纳入）

| 路由 | 页面 | 参数位置 | 壳形态 | 定义行 |
|---|---|---|---|---|
| `/space/:spaceId/plugin` | 插件列表 | path | 常驻壳 | routes:176 |
| `/space/:spaceId/plugin/:pluginId` | 插件详情 SpacePluginTool | path | 常驻壳 | routes:235 |
| `/space/:spaceId/plugin/:pluginId/cloud-tool` | 云工具会话 SpacePluginCloudTool | path；**conversationId 在 query** | 常驻壳 | routes:239 |

### 2.5 会话域（对照基准）

| 路由 | 页面 | 参数位置 | 壳形态 | 定义行 |
|---|---|---|---|---|
| `/home/chat/:id/:agentId` | Chat（UnifiedChatSession 宿主） | path，**URL 无 spaceId** | 常驻壳 | routes:46 |
| `/app/chat/:agentId/:id` | Chat 的 OpenApp 内嵌形态 | path，**参数序与上行相反** | `/app` 壳 | routes:698 |

会话域 spaceId 的获得方式：`useModel('conversationInfo')` → `apiAgentConversation` `GET /api/agent/conversation/{id}`（`services/agentConfig.ts:296`），回包自带 `devSpaceId / devTargetType / devTargetId`（`types/interfaces/conversationInfo.ts:465-481`）——**空间的权威来源是后端随会话回传，前端不猜**。

## 3. 跳转关系

### 3.1 关系图

```
①会话点击（侧栏 useHomeSectionData:562 / 搜索弹窗 SidebarSearchModal:246 /
   历史页 conversationRoute.ts / Chat 页兜底 —— 4 处同款分发逻辑）
    ├─ devTargetType=Agent    → /space/{devSpaceId}/agent-dev?agentId={devTargetId}&conversationId={id}
    ├─ devTargetType=PageApp  → /space/{devSpaceId}/app-dev/{devTargetId}
    ├─ devTargetType=UserApp  → /space/{devSpaceId}/app-pro/{appId}/{conversationId}   ← buildAppProRoute 单源
    └─ 其余（常规项目/普通会话）→ /home/chat/{conversationId}/{agentId}                ← 不需要 spaceId

②创建项目落点（projectCreateStrategy.ts:48-75）
    NormalProject → /home/chat/{cid}/{agentId}                    ← 唯一不进 /space/ 的类型
    Agent         → /space/{sid}/agent-dev?agentId&conversationId
    Agent(Flow)   → /space/{sid}/agent/{agentId}                  ← 编排画布
    PageApp       → /space/{sid}/app-dev/{projectId}（初始任务走 React context，不走 URL）
    UserApp       → redirectUrl 前缀 + conversationId = /space/{sid}/app-pro/{appId}/{cid}
    Skill         → /space/{sid}/skill-details-conversation/{skillId}?conversationId=
    Plugin        → /space/{sid}/plugin/{pluginId}/cloud-tool?conversationId=

③/home/chat 直开兜底（Chat/index.tsx:541-561，仅独立路由页启用 enableDevTargetRedirect）
    /home/chat/{id} 加载会话详情 → 回包带 devTargetType/devSpaceId/devTargetId
    → 齐备则 history.replace 归位 ① 中对应的工作台路由

④列表卡片 → 开发页（非会话路径）
    智能体列表 SpaceDevelop:354 → AgentFlow/无会话走 /agent/{agentId} 编排；有 devAgentConversationId 走 agent-dev?query
    技能列表 SpaceSkillManage:82 → 有 devAgentConversationId 走 -conversation?query；无走 skill-details
    项目管理 openProject（type.ts:68-78）→ UserApp 有会话走 app-pro；无会话走 app-project-detail

⑤返回落点
    EditAgent → /space/{sid}/develop ｜ AppDev → /space/{sid}/page-develop
    AppDevPro → app-project-detail 或 project-manage ｜ Skill 两页 → skill-manage
```

### 3.2 spaceId 的五种来源

| # | 来源 | 典型场景 |
|---|---|---|
| ① | 页面 `useParams(':spaceId')` | 各工作台/管理页自身（如 `AppDevPro/index.tsx:153-160`） |
| ② | 会话/项目**数据行**的 `devSpaceId` / `project.spaceId` | 会话点击分发（§3.1①）、首页项目上框（`homeSendPlan.ts:228-240` → `buildAppProRedirectPrefix`） |
| ③ | 复制/迁移到目标空间弹窗的 `targetSpaceId` | `jumpToAgent`（`utils/router.ts:123`）、`jumpToPlugin` 等调用方 |
| ④ | 创建流程的当前空间 | `projectCreateStrategy` 入参（`Home/index.tsx:409` `getSpaceId()` 兜底） |
| ⑤ | 实体回读兜底 | `AppDevProHeaderBrand.tsx:82-96` `spaceId ?? userAppInfo?.spaceId`，两者皆无则 `history.back()` |

### 3.3 列表侧已跨空间化（去 spaceId 查询）

- 侧栏项目面板：`ProjectPanel/index.tsx:302-304` 注释定调「不传 spaceId:拉该用户全部空间的项目(跨空间口径)」。
- 搜索弹窗项目 tab：`SidebarSearchModal/sources.ts:176-196` 同口径；任务 tab 同为跨空间。
- 历史会话页项目 tab：`HistoryConversationList/ProjectList/index.tsx:128-148` 同口径。
- 对应服务层：`apiUserProjectPageQuery` 的 queryFilter 中 spaceId 为 `Partial` 可选（`types/interfaces/userProject.ts:62-78`），不传即全量；`apiRepoSearch` 注释明「不传 spaceId 即跨全部空间」。

即：**列表数据已经「跨空间」，点击跳转所需的 spaceId 一律来自数据行而非全局当前空间**。

## 4. 评估一：总体是否合理——合理

双轨结构忠实反映了两域对 spaceId 的真实数据依赖差异，不是历史包袱：

- **工作台页是空间作用域的资源编辑器**。EditAgent 的模型列表走 `/api/model/list/space/{spaceId}`（`services/modelConfig.ts:49`）、订阅定价/发布/更新智能体接口必带 spaceId（`EditAgent/index.tsx:1183/1503-1521`）、AgentFlow 画布按空间隔离资源；AppDev 同样按空间拉模型（`hooks/useAppDevModelSelector.ts:41`）；技能列表 `apiSkillList({ spaceId })`（`services/library.ts:163`）。URL 带 spaceId 让这些页面挂载即可并行拉资源，不需要先等「实体详情 → 反查归属」的请求瀑布。
- **会话域后端本来就按 conversationId 全局键控**。会话创建参数 `ConversationCreateParams` 无 spaceId（`types/interfaces/conversationInfo.ts:215-245`）、会话详情/列表接口也不含；归属由回包 `devSpaceId` 反查。`/home/chat` 不带 spaceId 是如实建模。
- **「统一」在组件层已经完成，壳的趋同在 style3 下也已基本完成**。UnifiedChatSession 被 Chat / ConversationAgent 会话面板 / EditAgent 预览调试 / 插件 / 技能五入口复用（见 AGENTS.md「会话」节）；而在主推的 style3 下，工作台页与 home/chat 本就共用同一副壳骨架（§1：同侧栏实例 + page 容器，差异仅二级列抑制与沉浸避让）。**因此「路由统一 = 壳统一」在 style3 基准下既不成立也不需要**——壳的一致由 fullscreenWorkbenchPaths 策略层按路径实现，与路由结构无关；路由统一买不到任何壳增益，只会丢掉双轴 URL 语义（见姊妹篇《双轴信息架构》P4）。真正按双轨建模、不可借路由合并消解的是**跳转契约**：身份参数结构、会话分发逻辑、侧栏选中策略（`sidebarSelectionPolicy.ts:21-58`）、工作台返回链与历史栈底种子（`shouldSeedWorkbenchHistoryBase`）。
- **跨空间化方向反向验证了结构自洽**（§3.3）：数据行带 spaceId、URL 呈现 spaceId，这条链没有断点。

## 5. 评估二：是否应该带 spaceId——应该，但语义要定为「实体冗余携带」

### 5.1 spaceId 在工作台 URL 里是承重的

1. **免反查瀑布**：挂载即查空间资源（模型/技能/组件列表）。
2. **深链自包含**：`/space/3/app-pro/5/123` 可直接打开，无需先加载会话详情。
3. **返回导航前缀**：工作台返回列表/详情页都要拼 `/space/{spaceId}/...`（§3.1⑤）。
4. **目录同步事件身份键**：`ProjectRef = { projectId, projectType, spaceId? }`，身份守卫要求「spaceId 匹配，缺一条都会串页/跨空间误伤」（`docs/project-conversation-sync.md:40-41,136,187`；`AppDevPro/index.tsx:238-248`）。

### 5.2 但存在双事实源漂移风险（当前已在打补丁）

- URL 里的 spaceId 与实体真实归属**可能不一致**（过期链接、手拼 URL、跨空间数据）。现码证据：`AppDevProHeaderBrand.tsx:82-96` 已用 `spaceId ?? userAppInfo?.spaceId` 兜底；`CreateUserApp/index.tsx:151-153` 更新分支同样「详情回读优先、路由兜底」。
- 缺失时静默传染：`Number(undefined) = NaN`。AppDev 模型列表 `if (!spaceId) return` 静默空转（`useAppDevModelSelector.ts:36`）；全仓只有 `SkillDetails/hooks/useSkillFiles.ts:309-312` 一处对缺失 spaceId 显式 `message.error`。

### 5.3 定调

**保留 spaceId，语义定为「实体归属的冗余携带、实体回读优先」**：

- 拼 URL 的入口一律从数据行取 spaceId（§3.2②），禁取全局当前空间——已是现状，应立约固化。
- 页面加载实体详情后 reconcile 一次，以后端归属为准；把 AppDevProHeaderBrand 式兜底升级为统一模式。
- spaceId 缺失必须显式守卫/报错，禁 NaN 静默传染。

## 6. 评估三：是否应该和 home/chat 统一——不统一

- **不需要**：§4 已论证会话组件层统一（UnifiedChatSession 五入口）+ 壳差异是设计意图。
- **已经存在更便宜的统一形态**：`/home/chat` 是事实上的通用入口——`enableDevTargetRedirect`（`Chat/index.tsx:541-561`）在直开会话详情后按 `devTargetType + devSpaceId` redirect 归位对应工作台。这正是「统一入口 → 分发」的正确实现，代价只是一次会话详情请求。
- **不建议**把工作台改成 /home/chat 的变体（同路由前缀渲染 IDE）。style3 下「同壳」已经由策略层达成（§1），无需借路由合并；真正按双轨建模且不可丢的是跳转契约：身份参数结构、分发逻辑、侧栏选中策略（`sidebarSelectionPolicy.ts:21-58` 显式枚举两类承载路由）、工作台返回链与历史栈底种子（`shouldSeedWorkbenchHistoryBase`，fullscreenWorkbenchPaths.ts:27-30）——推翻成本远超收益。

## 7. 可选收敛项（待拍板清单，均未动手）

> 注：本节五项已合并进 §9.5 配套改造点优先级清单，此处保留原始明细。

| # | 项 | 说明 | 影响面 |
|---|---|---|---|
| 1 | 会话分发逻辑 4→1 单源化 | `conversationRoute.ts` 已是纯函数（注释自认「复刻 useHomeSectionData」）；让 `useHomeSectionData.ts:562-583`、`SidebarSearchModal/index.tsx:246-265`、`Chat/index.tsx:541-561` 三处改为消费它 | 触达会话路径，须跑 `test:conversation` |
| 2 | appProRoute 式单源推广 | 给 agent-dev / skill-details-conversation / cloud-tool 各配 build/parse 工具，替换散拼字符串 | 低风险纯重构 |
| 3 | spaceId reconcile 模式化 | §5.3 定调的统一模式（实体回读优先 + NaN 守卫） | 各工作台页逐个落 |
| 4 | 参数风格立约 | 新增工作台路由：身份参数进 path + 配套 build/parse 单源；可缺省视图状态进 query。存量 agent-dev 等不强制改 | 约定性，零代码 |
| 5 | /app/chat 参数序对齐 | `/app/chat/:agentId/:id` 与 `/home/chat/:id/:agentId` 相反，新路由前对齐或至少文档标注 | 涉及 OpenApp 链路，需走查 |

## 8. 已知病灶与疑点（调研顺带发现，未修）

1. **分发逻辑 4 处同款拷贝**：§3.1① 所列，靠人肉同步（`conversationRoute.ts:4-6` 注释自认）。
2. **`CreateNewTeam/index.tsx:111`**：模板串疑似多一个 `}`（跳 `/space/${spaceId}/develop})`）。
3. **`/space/:spaceId/app-dev-design/:projectId`**（routes:128）全仓无导航入口，预留页还是死链待确认。
4. **`docs/engineering-conventions.md` 无路由章节**：本调研所立的约定（§5.3、§7-4）拍板后应补入。
5. **路由表与壳正则双列表**：新增工作台路由须同步注册 `FULLSCREEN_WORKBENCH_PATH_PATTERNS`（fullscreenWorkbenchPaths.ts:9-16），目前靠 routes/index.ts 注释约定同步，易漏——漏注册的后果是 style3 下壳形态错（不抑制二级列/侧栏策略不对）且工作台历史栈底种子缺失（裸 back 栈首无路可退）。

## 9. 建议改造点：URL 体系提案（完整版 + 简版短链）

> 应「在文档最后给出建议改造点」要求补充（2026-09-21）。本节为提案，未拍板、未实施。

### 9.1 反直觉问题的定位

1. **匿名双段 + 顺序无语义**：`/home/chat/:id/:agentId` 是两段裸数字（`/home/chat/123/456`），不看路由定义无法分辨哪段是什么；「会话在前、智能体在后」的顺序也与「先选智能体、再进会话」的心智层级相反。
2. **参数命名不自述**：路由定义用 `:id` 而非 `:conversationId`（`/app/chat/:agentId/:id` 同病），URL 与路由代码都不自描述。
3. **agentId 冗余**：conversationId 是会话唯一主键，agentId 可由会话详情反查（`ConversationInfo.agentId` 在回包里；分发函数对 `devSpaceId` 已是这么用的）。两段并列制造「双主键」错觉，才有了顺序之争。
4. **同域反序实锤**：`/app/chat/:agentId/:id` 与主路由参数序相反（routes:698 vs routes:46）——同一产品两套顺序，心智负担真实存在。

**URL 里带 agentId 的真实动因（须保留的能力）**：`ChatCore` 挂载期即并行消费 agentId——`queryAgentSubscriptionPlans(agentId)`（Chat/index.tsx:245）、按 `[id, agentId]` 键控的数据加载（:807-810）；`ChatPage` 直供 `Number(params.agentId)`（:2184-2198）。若完全去掉，智能体详情/订阅查询要等会话详情先回来（串行瀑布）。因此提案是**降位而非删除**：path 砍掉、query 保留预取提示。

### 9.2 提案：双层 URL 体系

| 层 | 定位 | 用途 |
|---|---|---|
| **完整版（canonical）** | path 只放主键、参数全名自述、query 放可缺省提示 | 地址栏常态形态、开发调试、书签 |
| **简版（短链）** | 单主键、全域通用、解析后 redirect 到完整版 | 外链分享、通知、跨系统跳转、只知会话 id 的入口 |

设计原则：**顺序问题靠「减少 path 参数」消灭，不靠约定顺序**——只有一段，就没有顺序可错。参数名问题靠「全名自述」消灭：path 段与 query 一律驼峰全名（`:conversationId`，禁 `:id`）。

### 9.3 完整版定义（提案）

| 域 | 完整版（提案） | 与现状差异 |
|---|---|---|
| 会话 | `/home/chat/{conversationId}?agentId={agentId}` | path 砍掉 agentId 段，降为可选 query 预取提示（权威值以后端反查为准）；`:id` 更名 `:conversationId` |
| 全栈应用 IDE | `/space/{spaceId}/app-pro/{appId}/{conversationId}` | 现状即完整版，不动 |
| 网页应用 IDE | `/space/{spaceId}/app-dev/{projectId}` | 现状不动 |
| 智能体编排 | `/space/{spaceId}/agent/{agentId}` | 现状不动 |
| 对话式智能体 | `/space/{spaceId}/agent-dev?agentId={agentId}&conversationId={conversationId}` | 形态不动；立约固化 query 驼峰全名 |
| 技能对话式 | `/space/{spaceId}/skill-details-conversation/{skillId}?conversationId={conversationId}` | 形态不动 |
| 智能体详情 | `/agent/{agentId}` | 现状不动（本就无 spaceId，天然简版） |
| 全栈应用卡片 | `/user-app/{appId}` | 现状不动（同上） |

会话路由两种取舍：

- **推荐：单主键 + query 提示**（上表）。消灭顺序问题，同时保留「会话详情 / 智能体详情并行拉取」（§9.1 动因）。query 带名自述，`?agentId=` 是提示不是主键——缺失时页面回退为反查，多一跳但不坏。
- 备选：`/home/chat/{agentId}/{conversationId}`（层级序，直观但保留冗余段）——不推荐：双段顺序问题只是换了个答案，且 agentId 依旧冗余。

### 9.4 简版（短链）定义（提案）

- **新增 `/c/{conversationId}`：会话万能短链**。解析逻辑 = 现有 `enableDevTargetRedirect`（Chat/index.tsx:541-561）的前置化：查会话详情 → 按 `devTargetType/devSpaceId/devTargetId` redirect 到对应完整版（Agent→agent-dev、PageApp→app-dev、UserApp→app-pro、其余→/home/chat）。
- **天然简版盘点**（已存在，无 spaceId、实体自解析）：`/agent/{agentId}`（routes:48）、`/user-app/{appId}`（routes:50）。
- **可选压缩**：对外分享用 `/c/{base62(conversationId)}` 求短；内部跳转直接数字即可。
- **边界**：内部高频跳转**不走短链**（多一跳 redirect），仍直达完整版；短链服务外链/通知/分享，以及「只知会话 id」的入口——替代现在拿假 agentId 拼 `/home/chat/{id}/{agentId}` 的做法。
- **收益**：外链永不被路由重构破坏（重构只改短链解析的 redirect 表）；短链成为两域之间的唯一官方桥，4 处分发拷贝的收敛有了自然落点。

### 9.5 配套改造点（合并 §7 收敛项，按优先级）

| 序 | 改造点 | 优先级 | 说明 |
|---|---|---|---|
| 1 | 会话路由单主键化 + `:id`→`:conversationId` 更名 | 高（提案核心） | 旧双段路由保留 redirect wrapper 兼容 |
| 2 | `/c/{conversationId}` 短链 | 高 | enableDevTargetRedirect 前置化；4 处分发逻辑顺带收敛为单源（原 §7-1） |
| 3 | `/app/chat/:agentId/:id` 参数序对齐 | 中 | 改为 `/app/chat/:conversationId` 或直接消费 `/c/`；OpenApp 链路需走查（原 §7-5） |
| 4 | 路由参数名立约 | 中（零代码） | path 全名禁 `:id`、query 驼峰全名、身份进 path 可缺省进 query（原 §7-4） |
| 5 | appProRoute 式 build/parse 推广 | 中 | agent-dev / skill-conv / cloud-tool 拼接单源化（原 §7-2） |
| 6 | spaceId reconcile 模式化 | 中 | 实体回读优先 + NaN 显式守卫（原 §7-3、§5.3） |
| 7 | 病灶顺手修 | 低 | CreateNewTeam:111 typo、app-dev-design 入口定性（原 §8） |

### 9.6 迁移路径（分阶段）

1. **阶段一（无破坏）**：新增 `/c/` 短链与 `/home/chat/:conversationId` 新形态并存；旧双段路由加 redirect wrapper。
2. **阶段二（切内部入口）**：`useConversation` / `conversationRoute` / `useHomeSectionData` / `SidebarSearchModal` 等内部拼 URL 切到新形态（分发逻辑此时收敛单源）；`/app/chat` 对齐。
3. **阶段三（清理）**：观察一个版本后移除旧 redirect；外链（通知/分享）统一切 `/c/`。

### 9.7 待确认问题

- 后端会话详情是否**全场景**回 agentId（尤其新建会话首条消息前的窗口期）——决定 query 提示缺失时反查兜底是否总是可行。
- ChatCore 消费 agentId 的完整清单面（§9.1 已核三处：订阅查询、键控加载、defaultAgentDetail 比对；实施前需全量过一遍 `agentId` 引用）。
- `/c/` 短链的鉴权与分享语义（登录后可见，还是带分享令牌可匿名）。
- 桌面端 nuwax-client webview 与 nuwax-mobile 是否有对旧 URL 形态的硬编码依赖（跨端改动面）。

## 10. 定义/命名不合理及修改建议清单

> 2026-09-21 追加。逐条均已核实原文（含本轮新实证：CreateNewTeam:111 typo 原文、ChatCore 跨页消费）。「性质」列：**改名** = 改路由/参数定义需兼容迁移；**约定** = 零代码立约；**重构** = 非破坏代码收敛；**修 bug** = 一行级修复。

### G1 参数命名与位置

| # | 现状定义 | 问题 | 修改建议 | 性质 |
|---|---|---|---|---|
| 1 | `/home/chat/:id/:agentId`（routes:46） | `:id` 不自述；双匿名段顺序无语义 | 更名 `:conversationId`；agentId 降为 query 提示（§9.3 提案） | 改名 |
| 2 | `/app/chat/:agentId/:id`（routes:698） | 同上 + 参数序与主路由相反 | `/app/chat/:conversationId` 或直接消费 `/c/`（§9.5-3） | 改名 |
| 3 | `/space/:spaceId/:agentId/log`（routes:172） | 匿名 `:agentId` 挤在 spaceId 后、无域前缀，与其他 `/space/:spaceId/<slug>` 模式同形竞争，可读性差 | `/space/:spaceId/agent/:agentId/log` | 改名 |
| 4 | `Number(params.id/agentId/spaceId)` 无守卫（Chat:2189-2190、AppDevPro:153-160 等） | NaN 静默传染（§5.2） | 统一路由参数解析工具：非法值显式报错或 redirect，禁裸 `Number()` | 重构 |
| 5 | agent-dev 的 query `agentId` 实收 `devTargetId`（conversationRoute.ts:19 传的是 `devTargetId`） | 名与义有偏差（Agent 类型二者同值所以未爆雷） | 单源 builder 收口时统一口径并注释语义=「开发目标智能体」；长期可更名 `devTargetId` | 约定→改名 |

### G2 路由段（slug）命名

| # | 现状定义 | 问题 | 修改建议 | 性质 |
|---|---|---|---|---|
| 6 | 全栈应用域五前缀混用：`app-dev`(PageApp 网页应用)/`app-pro`(UserApp 全栈应用)/`app-dev-design`/`app-project-detail`(详情)/`userapp-project`(列表) | 「app/app-pro/userapp」三系并存；列表 `userapp-project` 与详情 `app-project-detail` 前缀不配对；slug 与 devTargetType 映射只能靠人脑记 | 短期：立 devTargetType↔slug 映射表并代码化（见 #13）；长期：统一 `<entity>-list`/`<entity>-detail` 配对命名 | 约定→改名 |
| 7 | 对话式开发两套后缀：`agent-dev`（智能体）vs `skill-details-conversation`（技能） | 同一概念（对话式开发）两种后缀 | 立约统一后缀（`-dev` 或 `-conversation` 二选一），新路由照办、存量不强制 | 约定 |
| 8 | `develop`(智能体列表) vs `agent-dev`(对话式开发) vs `agent`(编排) | `develop` 语义过泛，三者易混 | 词汇表立约：列表 `-list`/`-manage`、编排 `agent`、对话式统一后缀（P7）；`develop` 存量保留但文档标注 | 约定 |
| 9 | `/space/publish/skill|plugin|workflow/:id`（routes:254-281） | 字面量 `publish` 出现在 `:spaceId` 位置，与 `/space/:spaceId/...` 模式同形——按位置解析 spaceId 的代码与未来新增路由都易误伤 | 迁出 `/space/` 前缀（如 `/square/space-publish/...`），存量 redirect | 改名 |
| 10 | 路由 `name` 字段仅 /more-page、/system 使用 | 业务路由无唯一标识可供埋点/菜单/文档引用 | 立约新路由必填 kebab-case `name` 作路由唯一标识，存量不强制 | 约定 |

### G3 生命周期态路由定义

| # | 现状定义 | 问题 | 修改建议 | 性质 |
|---|---|---|---|---|
| 11 | 技能审核/发布用专属前缀 `apply/skill-details`、`published/skill-details`（routes:158-167）；智能体审核/发布用同开发页 query `?applyId=`/`?publishId=`（PublishAudit:68、PublishedManage:59） | 同一生命周期概念两种承载约定 | 立约统一（推荐只读态专属前缀方案=技能款，或全部 query 方案），新增产物类型照办 | 约定 |

### G4 跳转/构造契约

| # | 现状定义 | 问题 | 修改建议 | 性质 |
|---|---|---|---|---|
| 12 | 会话分发逻辑 4 处同款拷贝（§3.1①） | 「devTargetType→路由」的定义未单源化 | 全部消费 `resolveConversationRoute`（§9.5-2） | 重构 |
| 13 | agent-dev/skill-conv/cloud-tool 路由散拼字符串 | 无 build/parse 单源，映射关系（#6）只活在拼接处 | appProRoute 式 builder + `devTargetType→builder` 映射表（§9.5-5） | 重构 |
| 14 | 导航双轨：`jumpTo` 工具与裸 `history.push` 拼串并存 | 同一 URL 拼法多处开花 | 收敛到 router.ts 工具层，新代码禁裸 push 拼 `/space/` URL | 重构 |

### G5 组件定义与归属

| # | 现状定义 | 问题 | 修改建议 | 性质 |
|---|---|---|---|---|
| 15 | `ChatCore` 定义在页面层 `src/pages/Chat/index.tsx:106-138`，被跨页消费（`SkillDetailsConversation/index.tsx:3`：`import { ChatCore } from '@/pages/Chat'`） | 页面层互相消费，违反「会话模块页面层只消费 `features/conversation/react/*`」分层约定（AGENTS.md） | ChatCore 下沉 `features/conversation/react`（会话路径改动，须跑 `test:conversation`） | 重构 |
| 16 | `CreateNewTeam/index.tsx:111`：`history.push(\`/space/${spaceId}/develop}\`)` | 模板串多一个 `}`（已核实原文），兜底跳转落到非法路径 | 删多余的 `}`（本轮不修，待拍板批次顺手） | 修 bug |

### 保留项（现状合理、勿动）

- 路由 slug 全小写 kebab-case 风格一致。
- query 参数驼峰全名（`conversationId`/`agentId`/`applyId`/`publishId`）自述性好，作为立约范本。
- 消费态路由不带 spaceId（`/agent/:agentId`、`/user-app/:appId`）符合双轴 P3（姊妹篇 §4）。
- `app-pro` 配套 build/parse 单源（`appProRoute.ts`）是全仓范本，推广而非修改。

## 11. 附录：关键代码索引

| 主题 | 位置 |
|---|---|
| 路由表 | `src/routes/index.ts:36-299`（全屏工作台组 98-138）、:660-706（独立壳） |
| app-pro 路由单源 | `src/utils/appProRoute.ts` |
| 会话分发纯函数 | `src/components/business-component/HistoryConversationList/ProjectList/conversationRoute.ts:13-28` |
| 侧栏会话点击分发 | `src/layouts/DynamicMenusLayout/NewHomeSection/useHomeSectionData.ts:562-583` |
| 搜索弹窗分发 | `src/layouts/DynamicMenusLayout/SidebarSearchModal/index.tsx:246-265` |
| Chat 直开兜底 redirect | `src/pages/Chat/index.tsx:541-561`（`enableDevTargetRedirect` 2184-2198） |
| ChatCore 参数与 agentId 挂载期消费 | `src/pages/Chat/index.tsx:106-138`（ChatCoreProps）、:245（订阅查询）、:807-810（[id, agentId] 键控加载）、:2184-2198（ChatPage 直供 params.id/params.agentId）；跨页消费方 `src/pages/SkillDetailsConversation/index.tsx:3` |
| 创建项目落点 | `src/pages/SpaceCreateProject/utils/projectCreateStrategy.ts:48-75` |
| 会话创建与跳转 | `src/hooks/useConversation.ts:95-153`（attach 走 history state；redirectUrl 前缀拼 id） |
| 首页项目上框 | `src/utils/homeSendPlan.ts:228-253`（redirectUrl = buildAppProRedirectPrefix） |
| 会话详情反查空间 | `src/models/conversationInfo.ts:944-965` → `services/agentConfig.ts:296`；字段定义 `types/interfaces/conversationInfo.ts:465-481` |
| 侧栏选中策略（两类承载路由） | `src/layouts/DynamicMenusLayout/sidebarSelectionPolicy.ts:21-58` |
| 跨空间列表口径 | `ProjectPanel/index.tsx:302-326`、`SidebarSearchModal/sources.ts:152-196`、`HistoryConversationList/ProjectList/index.tsx:128-148` |
| 目录同步事件身份键 | `docs/project-conversation-sync.md:40-41,136,187` |
| 空间资源接口（按 spaceId） | `services/modelConfig.ts:49`、`services/library.ts:110-170`、`services/agentConfig.ts:228-252` |
| spaceId 显式守卫唯一例 | `src/pages/SkillDetails/hooks/useSkillFiles.ts:309-312` |
| 壳形态策略（style3 基准） | `src/layouts/fullscreenWorkbenchPaths.ts:9-16`（工作台路径正则）、:27-30（`shouldSeedWorkbenchHistoryBase` 栈底种子）、:45-62（`getSidebarShellLayoutPolicy` 三联动值）；消费点 `src/layouts/index.tsx:24-50` |

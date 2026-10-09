# 双轴信息架构：空间产物 × 用户日常 —— 路由与 URL 体系的高维定调

> 调研日期：2026-09-21 ｜ 姊妹篇：[routing-spaceid-design-review.md](./routing-spaceid-design-review.md)（下称《路由调研》）｜ 性质：方案调研设计，**未拍板、未改任何代码**
>
> 《路由调研》回答了「现状路由是否合理、怎么收敛」；本篇再往上一层，回答「**为什么天然是两套、上层模型是什么**」，并给出新页面/新路由的判定法。两篇结论互相验证：本篇为《路由调研》的双轨结构、spaceId 语义、完整版/简版 URL 提案提供产品层解释。

---

## 1. 双轴模型

「工作空间下的项目产物 vs 用户维度下的日常」——这个划分不是设计出来的，是产品对象自带的属性，且已经在代码的四个层面留下投影。

### 1.1 产物轴（工作空间维度）

全栈应用、智能体、技能、插件、工作流——**「做出来的东西」**。

| 特征 | 说明 | 代码实证 |
|---|---|---|
| 归属 | 必属一个空间，spaceId 是 schema 的一部分 | 创建类接口必带 spaceId（`apiProjectCreate`/`apiAgentAdd`/`apiSkillImport`，见《路由调研》§5.1） |
| 生命周期 | 创建→开发→审核→发布→消费 | 技能的 `apply/`、`published/` 路由前缀、广场路由（routes:158-167、251-281） |
| 协作/权限 | 空间是权限与计价边界 | 团队、资源定价、订阅设置都在 `/space/:spaceId` 下（routes:200-214、233） |
| 稳定性 | 存量（stock）：变化慢、可沉淀、可交易 | 广场 = 产物的公共交易层 |

### 1.2 日常轴（用户维度）

会话、任务、最近使用、置顶收藏——**「正在进行的事」**。

| 特征 | 说明 | 代码实证 |
|---|---|---|
| 归属 | 属于用户活动流，天然跨空间 | 会话创建/详情接口无 spaceId（`ConversationCreateParams`）；任务/项目列表跨空间全量 |
| 生命周期 | 流（flow）：按时间衰减、有历史 | 最近/历史会话按 modified 序、历史会话页 |
| 权限 | 跟随用户身份，无需空间上下文即可访问 | conversationId 全局键控，`devSpaceId` 反查 |
| 组织方式 | 按时间/项目锚点/置顶组织，不按空间组织 | home 分组、项目/会话置顶与收藏 |

## 2. 双轴在代码里的四个投影

### 2.1 接口层（最早分裂）

产物接口按 spaceId 查询、创建必带（模型/技能/组件列表均 `/api/.../space/{spaceId}`）；会话接口 conversationId 键控、全链路无 spaceId。详见《路由调研》§5.1。

### 2.2 路由层

`/space/:spaceId/**` = 产物轴地址；`/home/**`（及消费态路由，见 2.4）= 日常轴地址。路由双轨不是历史包袱，是双轴 IA 的忠实投影。

### 2.3 列表层：用户轴查询产物轴

侧栏/搜索弹窗/历史页的项目列表已改跨空间全量（`ProjectPanel/index.tsx:302-326`、`SidebarSearchModal/sources.ts:152-196`）——用户要的是「**我的**项目」而不是「某空间的项目」。此时 spaceId 发生了语义降位：**从「查询上下文」（过滤条件）退化为「数据行属性」**（点击时构造产物地址用）。这是日常轴视角对产物列表的渗透，方向是自洽的。

### 2.4 同一产物的双地址：开发态 vs 消费态

双轴视角澄清的第一个「疑似不一致」——为什么有的路由带 spaceId 有的不带：

| 产物 | 开发态（产物轴，带 spaceId） | 消费态（用户轴，无 spaceId） |
|---|---|---|
| 智能体 | `/space/{spaceId}/agent/{agentId}`（EditAgent IDE，routes:110） | `/agent/{agentId}`（AgentDetails，routes:48；广场技能「使用」的跳转目标 `Square/index.tsx:187-191`） |
| 全栈应用 | `/space/{spaceId}/app-pro/{appId}/{conversationId}`（AppDevPro IDE，routes:122） | `/user-app/{appId}`（左会话+右 iframe 卡片入口，routes:50） |
| 技能 | `/space/{spaceId}/skill-details/{skillId}`（routes:155） | 广场 `/square/publish/skill/{skillId}`（routes:279）、专家技能连接器 `/expert-skill-connector/skill`（routes:292） |
| 插件 | `/space/{spaceId}/plugin/{pluginId}`（routes:235） | `/square/publish/plugin/{pluginId}`（routes:269） |

**解释**：开发是空间内协作行为（要空间资源：模型、组件、沙箱、定价），地址必须落在空间里；消费是用户行为（用户用自己的会话消费产物），不需要进入作者的空间，地址落在用户轴。所以「带不带 spaceId」不是不一致，而是**开发态/消费态之别——判定标准是行为属于哪根轴**。

## 3. 项目 = 两轴的交点

项目（project）是唯一的天然混合体：产物侧（在空间创建、绑沙箱/模型）+ 日常侧（会话挂在项目上、项目是上框/置顶的锚点）。

当前路由对项目会话的分流（`devTargetType` 分发，《路由调研》§3.1①）实际是按「产物性/日常性」分流：

- `NormalProject` → `/home/chat`：日常性强（组织会话），产物性弱 → 日常轴；
- `UserApp/PageApp/Agent/Skill/Plugin` 开发 → 工作台路由：产物性强（会话即开发过程）→ 产物轴。

**`devTargetType` 就是「这个项目的会话属于哪根轴」的形式化字段。**

两轴互通已有三类 handoff（都不靠路由合并）：

1. **日常轴唤起产物轴**：首页项目上框（`homeSendPlan.ts:228-253` 的 redirectUrl）、广场智能体上框（usePinnedAgentHandoff 通道）；
2. **产物轴产生日常**：工作台里创建的会话回流侧栏/历史/任务列表（跨空间列表承接）；
3. **日常轴归位产物轴**：`/home/chat` 直开兜底 redirect（`enableDevTargetRedirect`）、提案中的 `/c/{conversationId}` 短链。

## 4. 设计原则（由双轴推出）

| # | 原则 | 说明 |
|---|---|---|
| P1 | **地址即归属** | 产物 URL 必带 spaceId（归属是地址的一部分）；活动 URL 只带活动主键 conversationId，归属是反查属性 |
| P2 | **属性非上下文** | 用户轴查询产物轴时，spaceId 是数据行属性；只有用户显式在空间内浏览时才是查询上下文（过滤条件） |
| P3 | **消费态不带空间** | 产物被使用时的地址在用户轴（`/agent/`、`/user-app/`）；开发态才进 `/space/` |
| P4 | **互通靠 handoff 不靠合并** | 两轴各自演化，通过上框/召唤/短链/redirect 桥接；不把两轴路由揉进一个前缀 |
| P5 | **短链是日常轴万能键** | `/c/{conversationId}`（《路由调研》§9.4）从活动主键解析产物上下文（devTargetType/devSpaceId）后路由到承载页——「日常带着产物上下文走」的形式化 |
| P6 | **生命周期态是产物地址的前缀投影** | `apply/`、`published/`、`/square` 切前缀、实体 id 稳定；生命周期流转不改主键 |
| P7 | **路由词汇表分轴** | 产物轴动词：develop/create/manage/publish/audit；日常轴动词：chat/home/history/recent。出现 `/home/develop` 这类混轴词是要警惕的信号 |

## 5. 用双轴复验《路由调研》三结论

1. **是否合理 → 合理**：路由双轨是双轴 IA 的忠实投影（§2 的四层投影）。
2. **是否带 spaceId → 不是单选题，是「哪根轴」判定题**：产物轴必带（P1/P3），日常轴不带；同一产物的开发态带、消费态不带（§2.4）。
3. **是否与 home/chat 统一 → 不统一**：两轴不该合并；需要的「统一」发生在组件层（UnifiedChatSession 五入口，已完成）与桥层（`/c/` 短链 + handoff，提案中）——而不是路由层。

## 6. 新页面/新路由判定法（三问 + 决策树）

设计任何新页面/新路由之前问：

- **Q1 页面主体是产物还是活动？**（产物 → 落 `/space/:spaceId`；活动 → 落 `/home`）
- **Q2 用户不带空间上下文时应能到达吗？**（是 → 消费态/日常轴地址，无 spaceId）
- **Q3 URL 里最长寿的主键是什么？**（产物 = 实体 id + 归属 spaceId；活动 = conversationId）

```
主体是「做出来的东西」？
 ├─ 是 → 行为是开发/管理？
 │        ├─ 是 → /space/{spaceId}/...（产物轴；身份参数进 path，
 │        │        配套 build/parse 单源，《路由调研》§7-2/§9.5-5）
 │        └─ 否（被用户使用/消费）→ 用户轴消费态地址（无 spaceId）
 └─ 否（「正在进行的事」）→ /home/...（日常轴，conversationId 主键，
          agentId 走 query 提示；需直达承载页时用 /c/{conversationId} 短链）
```

## 7. 演进猜想（供讨论，非承诺）

1. **「我的产物」聚合页**：跨空间管理自己参与的全部产物——列表跨空间化（§2.3）已经为此铺路；届时它属于日常轴查询产物轴的强化形态，仍适用 P2。
2. **移动端 = 日常轴优先**：nuwax-mobile 以碎片时间消费/查看会话任务为主，桌面端偏产物轴（开发）。PC ↔ mobile 路由参数对照应优先对齐**消费态地址与短链**，而非开发态地址。
3. **分享语义二分**：分享**产物**（广场/消费态地址，权限跟产物发布态）vs 分享**会话**（`/c/` 短链，权限跟会话参与者）——两类分享的权限模型天然不同，URL 体系应显式区分。
4. **首页分工显式化**：home 已是日常轴首页（召唤专家/我的项目/任务）；空间域页面继续做产物轴管理。两轴各自的「首页」明确后，P7 词汇表更易执行。

## 8. 与《路由调研》的关系 & 补充代码索引

- 本篇**不改**《路由调研》的任何结论，只提供上层解释与判定法；两文档共同作为路由设计的讨论基线。
- 证据复用：《路由调研》§2 路由清单、§3 跳转关系、§5 spaceId 语义、§9 URL 体系提案。
- 本篇补充索引：

| 主题 | 位置 |
|---|---|
| 消费态智能体入口 | `src/routes/index.ts:48`（/agent/:agentId）；广场「使用」跳转 `Square/index.tsx:187-191` |
| 消费态全栈应用 | `src/routes/index.ts:50`（/user-app/:appId，注释「女娲应用-全栈应用卡片入口」） |
| 生命周期路由前缀 | `src/routes/index.ts:158-167`（apply/published skill）、:251-281（广场族） |
| 空间内广场视图 | `src/routes/index.ts:230`（/space/:spaceId/space-square） |
| 消费态聚合框架页 | `src/routes/index.ts:282-298`（/expert-skill-connector/*，无 spaceId） |
| 跨空间任务/项目列表 | `SidebarSearchModal/sources.ts:152-196`、`ProjectPanel/index.tsx:302-326` |
| 上框/召唤 handoff | `src/utils/homeSendPlan.ts:228-253`；usePinnedAgentHandoff（广场智能体上框通道） |
| devTargetType 分流 | `conversationRoute.ts:13-28` 及 4 处同款（《路由调研》§3.1①） |

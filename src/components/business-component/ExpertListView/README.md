# ExpertListView — 独立专家列表组件

数据与交互内聚的专家列表通用组件：按场景拉取接口、滚动分页、付费拦截门（选择前置，含内聚的统一专家卡订阅弹窗），提供 **grid（两栏卡片，默认）/ list（单栏横排行）** 两种布局变体，功能完全一致。

组件只负责「列表」本身；tab 切换、搜索框、分类 pill 等宿主 UI 不在内。

## 功能边界

**内聚（组件内自闭环）：**

- 四场景接口调用与参数组装（见下表）、关键字 300ms 防抖、分页竞态丢弃、触底追加、首屏补拉、加载/空态；
- 付费拦截门：选择前先判定（免费/已订阅/租户未开启订阅直通；付费未订阅先按 `GET /agent/:id` 复核，复核已订阅回写放行并带 `subscribed: true`，仍待订阅则弹出内聚的统一专家卡弹窗 `ExpertSummonCard`（含 Modal 壳，卡内自拉套餐/订阅下单），**不触发 onSelect**——卡内「召唤专家」复核放行后才回调（带 `subscribed: true`）；
- 「最近召唤」条目的相对时间展示（`formatTimeAgo`）。

**外置（宿主负责）：**

- 场景/tab 切换、搜索框与分类 pill 的 UI；
- 选中后的业务（召唤、插 chip 等）——经 `onSelect` 回调；
- 「最近召唤」页签显隐与清空回落（宿主自行拉取记录判定）。

## Props

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | `'used' \| 'system' \| 'team' \| 'search'` | 必填 | 数据场景（与 `keyword` 正交，任意场景都可带搜索） |
| `variant` | `'grid' \| 'list'` | `'grid'` | 布局变体 |
| `keyword` | `string` | — | 搜索关键字（受控传入，组件内防抖） |
| `category` | `string` | — | 系统广场内容分类（仅 `system` 生效，空=全部） |
| `spaceId` | `number` | — | 团队空间·具体空间 ID |
| `spaceIds` | `number[]` | — | 团队空间「全部」聚合的空间 ID 列表；需要聚合而未传时组件自拉空间列表兜底 |
| `onSelect` | `(item: ExpertListItem) => void` | 必填 | 选中回调（付费拦截通过后才触发） |
| `pageSize` | `number` | `20` | 服务端分页每页数量（used 视图即拉取条数） |
| `className` | `string` | — | 根容器（滚动容器）类名 |

> 组件根节点即滚动容器（`flex: 1; overflow-y: auto`），自身不带内边距—— 间距由使用方经 `className` 决定；宿主需提供确定高度的父容器。

## 场景与接口对照

| type | 接口 | 请求参数 |
| --- | --- | --- |
| `used` | `GET /api/user/agent/used/list/{size}` | `{ size: pageSize, type: 'Agent' }` 全量数组；`keyword` 客户端过滤；条目 `targetId=agentId`、`usedTime=modified` |
| `system` | `POST /api/published/agent/list` | `{ page, pageSize, category, kw?, targetType: 'Agent', targetSubType: 'ChatBot' }`（专家口径，排除网页应用） |
| `team` | 同上 | `{ ..., category: 'Agent', justReturnSpaceData: true }` + `spaceId` 或 `spaceIds`（都未传则组件自拉空间列表聚合） |
| `search` | 同上 | `{ page, pageSize, category: '', kw?, spaceId: -1 }`（spaceId 组件内写死） |

## 使用案例

### 1. 系统广场（内容分类 + 搜索）

```tsx
<ExpertListView
  type="system"
  category={activeCategory}
  keyword={keyword}
  onSelect={(item) => summonExpert(item)}
/>
```

### 2. 团队空间

```tsx
// 具体空间
<ExpertListView type="team" spaceId={spaceId} onSelect={onSelect} />

// 「全部」聚合：外部已拉空间字典直接传 ID 列表（推荐）
<ExpertListView type="team" spaceIds={allSpaceIds} onSelect={onSelect} />

// 未传 spaceIds：组件自拉空间列表兜底
<ExpertListView type="team" onSelect={onSelect} />
```

### 3. 最近召唤

```tsx
<ExpertListView type="used" keyword={keyword} onSelect={onSelect} />
// 条目带 usedTime,卡片右上角展示相对时间
```

### 4. 搜索场景（固定 spaceId=-1，不对外暴露）

```tsx
<ExpertListView type="search" keyword={keyword} onSelect={onSelect} />
```

### 5. 单栏列表变体（紧凑行，无边线 + 悬停灰底）

```tsx
<ExpertListView type="system" variant="list" onSelect={onSelect} />
```

### 6. onSelect 语义（付费拦截）

```tsx
// 回调仅在以下情况触发，可直接信任：
// - 免费专家
// - 已订阅专家
// - 付费未订阅但详情复核出已订阅（item.subscribed === true 随行带出）
// - 统一专家卡内「召唤专家」放行（subscribed === true）
// - 租户未开启订阅（enableSubscription === 0）
// 付费未订阅且复核仍待订阅：组件内弹统一专家卡，不触发回调。
const handleSelect = (item: ExpertListItem) => {
  summonExpert({
    targetId: item.targetId ?? item.rawId,
    name: item.name,
    subscribed: item.subscribed,
  });
};
```

## 与能力弹窗的关系

`CapabilityModal` 的专家维度**已接入本组件**：弹窗保留类型导航/数据源 tab（含「最近召唤」页签显隐与清空回落，经自有 `useAgentUsedList` 判定）/ 搜索框/分类 pill，列表区渲染 `<ExpertListView type={usedView ? 'used' : source} keyword category spaceId spaceIds onSelect />`。专家的付费拦截（详情复核 + 统一专家卡弹窗）已内聚在组件内，弹窗侧的对应实现（handleSelect 专家分支/专家卡 Modal 壳/CapabilityCard 专家分支/数据层专家适配器）均已移除。

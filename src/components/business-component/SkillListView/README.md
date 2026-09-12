# SkillListView — 独立技能列表组件

数据与交互内聚的技能列表通用组件：按场景拉取接口、滚动分页、启用开关闭环、付费拦截门（选择前置），提供 **grid（两栏卡片，默认）/ list（单栏横排行）** 两种布局变体，功能完全一致。

组件只负责「列表」本身；tab 切换、搜索框、分类 pill 等宿主 UI 不在内。

## 功能边界

**内聚（组件内自闭环）：**

- 四场景接口调用与参数组装（见下表）、关键字 300ms 防抖、分页竞态丢弃、触底追加、首屏补拉、加载/空态；
- 启用/取消启用：`skillEnable / skillUnEnable`（按 `targetId` 寻址）、开关 loading 防重复、就地回写；「我启用的」视图成功后整体重拉同步增减；
- 付费拦截门：选择前先判定（免费/已订阅/租户未开启订阅直通；付费未订阅先按 `GET /published/skill/:id` 复核，复核已订阅回写放行并带 `subscribed: true`，仍待订阅则弹出内聚的 Skill 套餐订阅弹窗， **不触发 onSelect**，订阅完成支付回流后重选即放行）。

**外置（宿主负责）：**

- 场景/tab 切换、搜索框与分类 pill 的 UI；
- 选中后的业务（插 chip、关闭弹窗等）——经 `onSelect` 回调；
- 「我启用的」清空后的回落（如隐藏 tab、切回系统广场）。

## Props

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | `'enabled' \| 'system' \| 'team' \| 'search'` | 必填 | 数据场景（与 `keyword` 正交，任意场景都可带搜索） |
| `variant` | `'grid' \| 'list'` | `'grid'` | 布局变体 |
| `keyword` | `string` | — | 搜索关键字（受控传入，组件内防抖） |
| `category` | `string` | — | 系统广场内容分类（仅 `system` 生效，空=全部） |
| `spaceId` | `number` | — | 团队空间·具体空间 ID |
| `spaceIds` | `number[]` | — | 团队空间「全部」聚合的空间 ID 列表；需要聚合而未传时组件自拉空间列表兜底 |
| `onSelect` | `(item: SkillListItem) => void` | 必填 | 选中回调（付费拦截通过后才触发） |
| `onEnabledChange` | `(item, enabled) => void` | — | 启用/取消启用成功通知 |
| `pageSize` | `number` | `20` | 服务端分页每页数量 |
| `className` | `string` | — | 根容器（滚动容器）类名 |

> 组件根节点即滚动容器（`flex: 1; overflow-y: auto`），宿主需提供确定高度的父容器（如 flex 列布局）。

## 场景与接口对照

| type | 接口 | 请求参数 |
| --- | --- | --- |
| `system` | `POST /api/published/skill/list` | `{ page, pageSize, category, kw? }` |
| `team` | 同上 | `{ page, pageSize, kw?, category: 'Skill', justReturnSpaceData: true }` + `spaceId` 或 `spaceIds`（都未传则组件自拉空间列表聚合） |
| `enabled` | `POST /api/published/skill/enable/list` | 空 body 全量数组；`keyword` 客户端过滤；条目一律 `enabled: true` |
| `search` | `POST /api/published/skill/list` | `{ page, pageSize, category: '', kw?, spaceId: -1 }`（spaceId 组件内写死） |

## 使用案例

### 1. 系统广场（内容分类 + 搜索）

```tsx
const [keyword, setKeyword] = useState('');

<SkillListView
  type="system"
  category={activeCategory} // 内容分类 pill 选中值，空串/不传=全部
  keyword={keyword} // 搜索框受控值，组件内防抖
  onSelect={(item) => insertSkillChip(item)} // 付费拦截通过后才到这
/>;
```

### 2. 团队空间

```tsx
// 2a. 具体空间
<SkillListView type="team" spaceId={spaceId} onSelect={onSelect} />

// 2b. 「全部」聚合：外部已拉空间字典，直接传 ID 列表（推荐，省一次请求）
<SkillListView type="team" spaceIds={allSpaceIds} onSelect={onSelect} />

// 2c. 「全部」聚合：不传 spaceIds，组件自拉空间列表兜底
<SkillListView type="team" onSelect={onSelect} />
```

### 3. 我启用的

```tsx
<SkillListView
  type="enabled"
  keyword={keyword} // 客户端过滤（名称/描述）
  onSelect={onSelect}
  onEnabledChange={(item, enabled) => {
    // 取消启用最后一项后列表为空：宿主凭此决定隐藏「我启用的」tab/回落
  }}
/>
```

### 4. 搜索场景（固定 spaceId=-1，不对外暴露）

```tsx
<SkillListView
  type="search"
  variant="list"
  keyword={keyword} // 可传可不传
  onSelect={onSelect}
/>
```

### 5. 单栏列表变体（紧凑行）

```tsx
<SkillListView type="system" variant="list" onSelect={onSelect} />
```

### 6. onSelect 语义（付费拦截）

```tsx
// 回调仅在以下情况触发，可直接信任：
// - 免费技能
// - 已订阅技能
// - 付费未订阅但详情复核出已订阅（此时回传 item.subscribed === true，
//   下游插入 chip 等链路可据此免二次拦截）
// - 租户未开启订阅（enableSubscription === 0）
// 付费未订阅且复核仍待订阅：组件内弹套餐订阅弹窗，不触发回调。
const handleSelect = (item: SkillListItem) => {
  insertSkillChip({
    kind: 'skill',
    targetId: item.targetId ?? item.rawId,
    name: item.name,
    paymentRequired: item.paymentRequired,
    subscribed: item.subscribed,
  });
};
```

## 与能力弹窗的关系

`CapabilityModal` 的技能维度**已接入本组件**：弹窗保留类型导航/数据源 tab（含「我启用的」页签显隐与清空回落）/搜索框/分类 pill，列表区渲染 `<SkillListView type={enabledView ? 'enabled' : source} keyword category spaceId spaceIds onSelect onEnabledChange />`。技能的启用开关与付费拦截（详情复核 + Skill 套餐订阅弹窗）已内聚在组件内，弹窗侧的对应实现（useSubscription/套餐弹窗/开关状态/CapabilityCard 技能分支/数据层技能适配器）均已移除；`onEnabledChange` 回调驱动弹窗侧重拉「我启用的」以同步页签可见性。

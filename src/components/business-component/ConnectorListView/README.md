# ConnectorListView — 独立连接器列表组件

数据与连接流程内聚的连接器列表通用组件：按场景拉取接口、滚动分页、连接/断开全流程（共享 `useConnectorConnect`：oauth2 授权窗 / 扫码设备码 / 凭据弹窗 / 断开寻址，两个子弹窗随组件渲染），提供 **grid（两栏卡片，默认）/ list（单栏横排行）** 两种布局变体，功能完全一致。

**无选中交互**——纯连接管理列表；连接态变更经 `onConnectedChange` 通知宿主同步派生数据（如「已连接」页签显隐）。

## 功能边界

**内聚（组件内自闭环）：**

- 四场景接口调用与参数组装（见下表）、关键字 300ms 防抖、分页竞态丢弃、触底追加、首屏补拉、加载/空态；
- 连接/断开全流程：开关切换按 `connected` 分流（未连接 →`handleConnect` 按 authType 走 oauth2 授权窗 / 扫码 / 凭据弹窗；已连接 →`handleDisconnect` 按 service 寻址连接 ID），成功后就地回写开关 + `onConnectedChange` 通知；凭据弹窗（`ConnectorConnectModal`）与扫码弹窗（`ConnectorDeviceAuthModal`）随组件渲染；
- 卡片交互：开关旁常驻「已连接/未连接」状态标（圆点+文字），已连接 hover 时「断开」按钮等宽盖住状态标（不挤开开关）。

**外置（宿主负责）：**

- 场景/tab 切换、搜索框与分类 pill 的 UI；
- 「已连接」页签显隐与清空回落（宿主自行拉取 `connected=true` 判定， `onConnectedChange` 时重拉同步）。

## Props

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | `'connected' \| 'system' \| 'team' \| 'search'` | 必填 | 数据场景（与 `keyword` 正交） |
| `variant` | `'grid' \| 'list'` | `'grid'` | 布局变体（grid 卡总高 70px，与技能/专家卡等高） |
| `keyword` | `string` | — | 搜索关键字（受控传入，组件内防抖） |
| `category` | `string` | — | 系统广场内容分类（仅 `system` 生效，空=全部） |
| `spaceId` | `number` | — | 团队空间·具体空间 ID；不传=scope=space 服务端聚合全部空间 |
| `onConnectedChange` | `(item, connected) => void` | — | 连接/断开成功通知 |
| `pageSize` | `number` | `20` | 服务端分页每页数量（connected 视图忽略） |
| `className` | `string` | — | 根容器（滚动容器）类名 |

> 组件根节点即滚动容器（`flex: 1; overflow-y: auto`），自身不带内边距—— 间距由使用方经 `className` 决定；宿主需提供确定高度的父容器。

## 场景与接口对照

| type | 接口 | 请求参数 |
| --- | --- | --- |
| `connected` | `GET /api/connector/providers` | `{ connected: 'true' }` 全量（兼容裸数组/records 双壳）；`keyword` 客户端过滤 |
| `system` | 同上 | `{ pageNum, pageSize, scope: 'official', category?, keyword? }` 服务端分页 |
| `team` | 同上 | `{ pageNum, pageSize, keyword?, spaceId }`；未传 spaceId → `{ scope: 'space' }` 服务端聚合全部空间 |
| `search` | 同上 | `{ pageNum, pageSize, keyword? }` 纯关键字搜索（不带 scope/spaceId）服务端分页 |

> 分页判定：该接口无总页数字段，按「本页取满」判定还有下一页。

## 使用案例

### 1. 系统广场（内容分类 + 搜索）

```tsx
<ConnectorListView
  type="system"
  category={activeCategory}
  keyword={keyword}
  onConnectedChange={syncConnectedTab}
/>
```

### 2. 团队空间

```tsx
// 具体空间
<ConnectorListView type="team" spaceId={spaceId} onConnectedChange={sync} />

// 「全部」聚合：不传 spaceId，服务端 scope=space 聚合（无需空间列表）
<ConnectorListView type="team" onConnectedChange={sync} />
```

### 3. 已连接

```tsx
<ConnectorListView
  type="connected"
  keyword={keyword}
  onConnectedChange={sync}
/>
// 宿主侧 onConnectedChange 时重拉自己的 connected=true 数据，
// 驱动「已连接」页签显隐与清空回落
```

### 4. 搜索场景（纯关键字，不带 scope/spaceId）

```tsx
<ConnectorListView type="search" keyword={keyword} onConnectedChange={sync} />
```

### 5. 单栏列表变体（紧凑行，无边线 + 悬停灰底）

```tsx
<ConnectorListView type="system" variant="list" onConnectedChange={sync} />
```

## 与能力弹窗的关系

`CapabilityModal` 的连接器维度**已接入本组件**：弹窗保留类型导航/数据源 tab（含「已连接」页签显隐与清空回落，经自有 `useConnectedConnectors` 判定）/搜索框/分类 pill，列表区渲染 `<ConnectorListView type={connectedView ? 'connected' : source} keyword category spaceId onConnectedChange />`。连接/断开全流程（共享 hook + 凭据/扫码子弹窗）已内聚在组件内，弹窗侧的对应实现（useConnectorConnect 引用/两个子弹窗/ CapabilityCard 连接器分支/数据层连接器适配器）均已移除。

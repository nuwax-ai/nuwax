# KnowledgeListView — 独立资料库列表组件

数据内聚的资料库列表通用组件：按场景拉取接口、关键字防抖 + 客户端过滤、内存切片分页、横向紧凑资料卡渲染。资料无付费拦截，选中经 `onSelect` 直调（整行点击即选中；grid 变体另有悬停「选择」按钮，list 变体不渲染——紧凑场景整行可点已覆盖）。

## 功能边界

**内聚（组件内自闭环）：**

- 两场景接口调用与参数组装（见下表）、关键字 300ms 防抖 + 客户端过滤（名称/描述）、内存切片模拟滚动加载（单次全量拉取后切片，翻页不再发请求）、触底追加、首屏补拉、加载/空态；
- 横向资料卡：资料库同款线性文件图标（`RepoFileIcon` 复刻 nuwax-repo-web 资料库的 `docIconFor` 体系——pageType/扩展名 → 类型专属图形与配色，未识别回落默认文档蓝；外层 40px 圆角方 tinted 底,与技能/连接器网格卡方形口径一致,区别于专家圆形）+ 名称 + 右端相对时间胶囊（仅 recent）+ 悬停「选择」按钮（仅 grid：时间胶囊淡出让位、按钮右端对齐覆盖，不展示文档类型文本；list 不渲染）。

**外置（宿主负责）：**

- 空间 pill 行（含「最近访问」pill 显隐与清空回落）、搜索框 UI；
- 选中后的业务（插 doc chip 等）——经 `onSelect` 回调。

## Props

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | `'recent' \| 'space'` | 必填 | 数据场景 |
| `variant` | `'grid' \| 'list'` | `'grid'` | 布局变体（grid 两列 / list 单列横排资料行） |
| `keyword` | `string` | — | 搜索关键字（受控传入，组件内防抖 + 客户端过滤） |
| `spaceId` | `number` | — | **space 场景必传**（repo 树接口 spaceId 必传，未传挂起不加载） |
| `onSelect` | `(item) => void` | 必填 | 选中回调（直调，无付费门） |
| `pageSize` | `number` | `20` | 内存切片步长 |
| `className` | `string` | — | 根容器（滚动容器）类名 |

> 组件根节点即滚动容器（`flex: 1; overflow-y: auto`），自身不带内边距—— 间距由使用方经 `className` 决定；宿主需提供确定高度的父容器。

## 场景与接口对照

| type | 接口 | 请求参数 |
| --- | --- | --- |
| `recent` | `GET /api/repo/pages/recently-accessed` | `{ from: 0, size: pageSize }` 全量数组；条目带 `usedTime = time`（相对时间胶囊） |
| `space` | `GET /api/repo/space-tree` | `{ spaceId }` **必传**；全量树先序平铺（目录分组顺序）→ 客户端过滤 → 内存切片 |

> 无 search 场景（资料库无对应检索接口）。

## 使用案例

### 1. 指定空间（repo 页面树）

```tsx
<KnowledgeListView
  type="space"
  spaceId={spaceId} // 必传；空间 pill 选中值
  keyword={keyword}
  onSelect={(item) => insertDocChip(item)}
/>
```

### 2. 最近访问

```tsx
<KnowledgeListView type="recent" keyword={keyword} onSelect={onSelect} />
// 条目带 usedTime,卡片右端展示相对时间胶囊
```

### 3. 单列变体

```tsx
<KnowledgeListView
  type="space"
  spaceId={spaceId}
  variant="list"
  onSelect={onSelect}
/>
```

### 4. onSelect 语义

```tsx
// 直调无拦截；回传 slugId/pageType（chip 插入链路随 selectedDocs 发送）
const handleSelect = (item: KnowledgeListItem) => {
  insertDocChip({
    kind: 'doc',
    slugId: String(item.slugId ?? ''),
    name: item.name,
    pageType: item.pageType,
  });
};
```

## 与能力弹窗的关系

`CapabilityModal` 的资料库维度**已接入本组件**：弹窗保留类型导航/空间 pill 行（含「最近访问」pill 显隐与清空回落，经自有 `useRecentRepoPages` 判定）/搜索框，列表区渲染 `<KnowledgeListView type={recentView ? 'recent' : 'space'} keyword spaceId onSelect />`。至此四个维度全部组件化（SkillListView / ExpertListView / ConnectorListView / KnowledgeListView），弹窗侧的自实现列表（CapabilityCard、 useCapabilityResources 适配器、滚动分页容器）与原生列表键盘分支均已删除，键盘导航统一走内嵌卡片 DOM 代理。

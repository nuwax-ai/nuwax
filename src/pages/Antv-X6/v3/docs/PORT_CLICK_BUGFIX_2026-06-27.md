# AgentFlow 端口点击 Bug 修复记录

> 日期：2026-06-27  
> 分支：`feat/dong-2026.6.18`  
> 涉及文件：3 处修改

---

## 问题描述

在 AgentFlow 画布中快捷添加节点（点击 port 弹出选择框后选择节点类型）时，出现两个 bug：

1. **连线往回穿**：从 RouteDecision 节点的输出 port 添加新节点后，连线不是从右往左正确连出，而是往左绕回新节点背后
2. **in port 不弹框**：点击 RouteDecision（及所有节点）的输入 port，不弹出快捷添加节点的选择框

---

## 根本原因分析

### Bug 1：连线往回穿

**表层原因**：新节点被放置在错误位置（偏左约 300px），导致连线为了连接两端而弯回去。

**深层原因（双重）**：

**① `parseEndpoint` 的子串误判（主因）**

`workflowV3.tsx` 的 `createEdge` 里有个 `parseEndpoint` 函数，用 `includes('in') || includes('out')` 检测 endpoint 字符串是否已带有 port 后缀：

```javascript
// 旧逻辑 —— 有缺陷
const isLoop = endpoint.includes('in') || endpoint.includes('out');
const port = isLoop ? endpoint : `${endpoint}-${type}`;
```

`handleSpecialPortConnection` 在调用 `graphCreateNewEdge` 前会先剥掉 portId 末尾的 `-out`，期望 `parseEndpoint` 再补回来：

```
portId = "123-route-abc123-out"
→ stripped = "123-route-abc123"    ← 传给 graphCreateNewEdge
→ parseEndpoint 检测 includes('out')
→ "route" 中恰好含子串 "out" → isLoop = true → port = "123-route-abc123"  ✗（没有补回 -out）
```

X6 找不到 port `"123-route-abc123"`，回退到从节点**中心**出发连边，导致连线往回穿。

对比：Condition 节点的端口后缀 `"condition"` 不含 `"out"` 子串 → `isLoop = false` → 正常补 `-out`，所以 Condition 没有此问题。

**② `calculateNodePosition` 坐标系误判（次因）**

`calculateNodePosition` 返回的是图本地坐标（通过 `graph.clientToLocal()` 得到），但 `_doAddNode` 用 `e.x >= containerRect.left` 来判断是否是客户端坐标，图本地坐标值（如 520）恰好落在容器屏幕范围（300–1500）内，被误判为客户端坐标并再做一次 `clientToGraph` 转换，节点最终偏左约 300px。

### Bug 2：in port 不弹框

`graph.tsx` 监听 `node:port:click` 来触发弹框。该事件依赖原生 click 事件打到 SVG port 圆点。但 React shape 节点的 `<foreignObject>` HTML 内容覆盖了 `in` port（左侧）区域，原生 click 被 HTML 拦截，未到达 SVG 圆点，`node:port:click` 不触发。

`node:magnet:click` 则不同，它在 `onMouseUp` 阶段由 X6 内部直接触发（不依赖原生 click 穿透），对所有 port 均可靠。

---

## 修改内容

### 1. `workflowV3.tsx` — 修复 `parseEndpoint`

**改前：**

```javascript
const isLoop = endpoint.includes('in') || endpoint.includes('out');
const isNotGraent = endpoint.includes('-');
return {
  cell: isLoop || isNotGraent ? endpoint.split('-')[0] : endpoint,
  port: isLoop ? endpoint : `${endpoint}-${type}`,
};
```

**改后：**

```javascript
const hasPortSuffix = endpoint.endsWith('-in') || endpoint.endsWith('-out');
const hasHyphen = endpoint.includes('-');
return {
  cell: hasHyphen ? endpoint.split('-')[0] : endpoint,
  port: hasPortSuffix ? endpoint : `${endpoint}-${type}`,
};
```

**逻辑**：只看结尾是否是 `-in`/`-out`，不做子串匹配，消除 "route"/"input"/"output" 等单词意外命中的可能。

### 2. `useNodeOperations.ts` — 直接传完整 portId

`handleSpecialPortConnection` 和 `handleExceptionPortConnection` 原来会先剥掉 `-out` 再传给 `graphCreateNewEdge`，现在直接传完整 portId：

```javascript
// 改前
const sourcePortId = portId.split('-').slice(0, -1).join('-');
graphRef.current?.graphCreateNewEdge(sourcePortId, String(newNodeId), isLoop);

// 改后
graphRef.current?.graphCreateNewEdge(portId, String(newNodeId), isLoop);
```

配合修复后的 `parseEndpoint`（`endsWith` 检测），完整 portId 会被直接使用，不再需要「先剥再补」的绕行。

### 3. `graphV3.ts` — 修复坐标系

`calculateNodePosition` 末尾统一转为客户端坐标再返回，让 `_doAddNode` 能可靠识别并正确处理：

```javascript
// 改前：直接返回图本地坐标
return position;

// 改后：转为客户端坐标
const clientPos = graph.localToClient(position.x, position.y);
return { x: clientPos.x, y: clientPos.y };
```

### 4. `graph.tsx` — 改用 `node:magnet:click`

```javascript
// 改前
graph.on('node:port:click', ({ node, port, e }) => {
  createNodeAndEdge(graph, e, node.getData(), port as string);
});

// 改后
graph.on('node:magnet:click', ({ node, magnet, e }) => {
  // 向上遍历找到带 port 属性的祖先元素
  let port: string | null = null;
  let el: Element | null = magnet;
  while (el) {
    const p = el.getAttribute('port');
    if (p) { port = p; break; }
    el = el.parentElement;
  }
  if (!port) return;
  createNodeAndEdge(graph, e, node.getData(), port);
});
```

---

## 副作用（正向）

修复前，RouteDecision 边的 `edge.getSourcePortId()` 返回的是错误的 port ID（缺 `-out`），导致 `parseEdgeBranch` 里提取 uuid 的正则也无法命中，路由分支边**颜色一直是默认蓝色**而不是配置的品牌色。修复后颜色逻辑同步恢复正常。

---

## 覆盖验证

所有通过 `parseEndpoint` 的 source/target 格式：

| 来源 | 格式 | `endsWith` 结果 | 最终 port |
| --- | --- | --- | --- |
| 普通节点 | `"{nodeId}"` | 否 → 补后缀 | `"{nodeId}-out"` ✓ |
| Loop in/out | `"{id}-in"` / `"{id}-out"` | 是 → 原样 | ✓ |
| Condition/IntentRec/QA | `"{nodeId}-{uuid}"` | 否 → 补 | `"{nodeId}-{uuid}-out"` ✓ |
| RouteDecision default | `"{nodeId}-route-default-out"` | 是 → 原样 | ✓ |
| RouteDecision route | `"{nodeId}-route-{uuid}-out"` | 是 → 原样 | ✓ |
| exception | `"{nodeId}-exception-out"` | 是 → 原样 | ✓ |
| HumanInteraction options | `"{nodeId}-hitl-option-{uuid}-out"` | 是 → 原样 | ✓ |

---

## 追加修复：HumanInteraction options 分支连线（同日跟进）

`getEdges`（graphV3.ts）原本对 HumanInteraction 节点走通用 `nextNodeIds` 路径，而 options 分支的连接关系存储在 `nc.options[i].nextNodeIds`（每个选项独立），导致**重新加载时 options 分支连线全部丢失**。

### 修改内容（graphV3.ts）

**① `handleAgentFlowEdges` 新增 HumanInteraction 分支：**

```javascript
if (node.type === NodeTypeEnum.HumanInteraction) {
  const options: any[] = getHitlOptions(nc); // 读 nc.options || nc.askConfig?.options
  options.forEach((opt: any) => {
    const optIds: number[] = opt.nextNodeIds || [];
    optIds.forEach((id) => {
      edges.push({
        source: `${node.id}-hitl-option-${opt.uuid}-out`,
        target: id.toString(),
        zIndex: z,
      });
    });
  });
}
```

**② `getEdges` dispatch 新增 HumanInteraction 路由（并重构 else-if 链）：**

```javascript
if (node.type === NodeTypeEnum.HumanInteraction &&
    isHitlOptionsBranchMode(node.nodeConfig as any)) {
  const hitlEdges = handleAgentFlowEdges(node, isLoopNode);
  // options 有内容时返回各选项连线；
  // options 为空（节点刚创建、尚未配置）时回落到 nextNodeIds 路径。
  if (hitlEdges.length > 0) return hitlEdges;
}
if (node.nextNodeIds && node.nextNodeIds.length > 0) { ... }
```

原 else-if 链被拆成独立 if + 早返回，以支持 HumanInteraction options 为空时的自然回落。

---

## 追加修复：RouteDecision 作为「新插入节点」的出边（边中插入 / in 端口上游新建）

### 问题描述

不同于前面「点击 RouteDecision 输出端口往下加节点」，这里是反向场景——**RouteDecision 本身是新节点**，需要连出一条边到下游：

1. **边中快捷插入**：hover 一条边 A→B → 点 `+` → 选 RouteDecision，预期 A→B 变成 A→RouteDecision→B。
2. **in 端口上游新建**：点某节点 B 的输入端口 → 选 RouteDecision，预期 RouteDecision→B。

两种场景下 RouteDecision 的**输出 port（右）都出现回转（左）连线**，且**刷新后该输出 port 没有连线**。

### 根本原因（两层）

两条路径都进 `handleNodeCreationSuccess`（useNodeOperations.ts），按 `portId` 分发后，最终由连接函数处理「新节点 → 下游」这条出边：

- 边中插入 → `handleTargetNodeConnection`
- in 端口上游新建 → `handleInputPortConnection`

**第一层：走错分支 → 回转连线。** 两者都用 `isConditionalNode(type)` 判断是否走分支端口，而该函数**只覆盖 Condition / IntentRecognition / QA**，不含 RouteDecision：

```typescript
const isConditionalNode = (nodeType) =>
  [
    NodeTypeEnum.Condition,
    NodeTypeEnum.IntentRecognition,
    NodeTypeEnum.QA,
  ].includes(nodeType);
```

于是 RouteDecision 落到普通分支 `handleNormalNodeConnection`，画出指向不存在的 `{id}-out` 端口，X6 回退到节点中心 → **回转连线**。

**第二层：写错字段 → 刷新丢失（关键，对照 IntentRecognition 才看清）。**

- **IntentRecognition 为什么没问题**：它命中 `isConditionalNode` → `handleConditionalNodeConnection` → `QuicklyCreateEdgeConditionConfig`，把下游写进 **`intentConfigs[0].nextNodeIds`**，并以 `{id}-{uuid}-out` 建边。`intentConfigs` 端到端持久化（save 的 `computeConnections` 从边重建、load 原样保留 nodeConfig、表单 `hydrateIntentConfigs` 兜底）→ 刷新不丢。
- **RouteDecision 的坑**：RouteDecision 有两套兜底表达——`defaultNextNodeIds`（灰色 `route-default-out` 端口）与 `intentConfigs` 末尾的「其他意图」分支（橙色端口）。第一版修复误用了 `defaultNextNodeIds`，但该字段**不在后端 IntentRecognition 的 nodeConfig schema 里**，save 虽写入（经 handler 的 `updateConnection`）、前端 `prepareNodeForBackendSerialize` 也未剥离，但后端不回传 → **刷新后丢失**。验证：`defaultNextNodeIds` 在 load/proxy 代码中零引用，仅 `getEdges` 渲染时读，故「灰色端口连上又消失」。

### 修改内容（useNodeOperations.ts）

**① 新增 `handleRouteDecisionOutgoingConnection`**：连到 `intentConfigs[0]` 的真实路由端口（与 IntentRecognition 对齐同一持久化机制），写入 `intentConfigs[0].nextNodeIds`：

```javascript
const handleRouteDecisionOutgoingConnection = async ({
  newNode,
  targetNode,
  isLoop,
}) => {
  const firstBranch = newNode.nodeConfig?.intentConfigs?.[0];
  if (!firstBranch?.uuid) return; // createDefaultIntentConfig 保证至少一条
  // 端口用 RouteDecision 专属格式 {id}-route-{uuid}-out（IntentRecognition 是 {id}-{uuid}-out）
  const sourcePortId = `${newNode.id}-route-${firstBranch.uuid}-out`;
  // 写入 intentConfigs[0].nextNodeIds（持久化、刷新不丢）
  const params = handleSpecialNodesNextIndex(
    newNode,
    sourcePortId,
    targetNode.id,
  );
  const isSuccess = await changeNode({ nodeData: params }, noop);
  if (isSuccess) {
    graphCreateNewEdge(sourcePortId, String(targetNode.id), isLoop);
  }
};
```

> 端口格式不能直接复用 `QuicklyCreateEdgeConditionConfig`：RouteDecision 端口带 `route-` 前缀（`{id}-route-{uuid}-out`），而该函数生成的是 `{id}-{uuid}-out`，会再次命中不了端口 → 回转连线。

**② 两条出边路径前置 RouteDecision 分支**：

```javascript
// handleTargetNodeConnection（边中插入）
if (newNode.type === NodeTypeEnum.RouteDecision) {
  await handleRouteDecisionOutgoingConnection({ newNode, targetNode, isLoop });
} else if (isConditionalNode(newNode.type) && !isQaTextMode) { ... }
else { ... }  // 普通节点

// handleInputPortConnection（in 端口上游新建）
if (newNode.type === NodeTypeEnum.RouteDecision) {
  await handleRouteDecisionOutgoingConnection({ newNode, targetNode: sourceNode, isLoop });
  return;
}
```

### 端口为何建边时已存在（无死循环）

RouteDecision 的**路由端口**（`route-{uuid}-out`）对每条 `intentConfigs` 都会渲染（不像 `route-default-out` 需 `defaultNextNodeIds` 非空才条件渲染）。新节点经 `graphAddNode` 时 `generatePorts` 已按默认配置 `[NORMAL, OTHER]` 生成 2 个路由端口，故 `graphCreateNewEdge` 时端口已存在；且 `changeNode → graphUpdateNode → generatePorts` 对 RouteDecision 同步重生端口（∈ `EXCEPTION_NODES_TYPE`，`needUpdateNodes` 为 true），双保险。

### 验证

- v3 全量测试通过（含 routeDecision、portLayout）。
- `useNodeOperations.ts` 无类型错误。
- 端口 ID `{id}-route-{uuid}-out` 复用本文档「覆盖验证」表中 `endsWith('-out')` 判定，`parseEndpoint` 原样保留 → 命中真实路由端口。
- 连接写入 `intentConfigs`（而非 `defaultNextNodeIds`）→ 刷新后保留，与 IntentRecognition 行为一致。
- 与前文「点击 RouteDecision 输出端口往下加节点」是**互补**的不同路径：前者 RouteDecision 是 source、后者 RouteDecision 是 newly inserted node。

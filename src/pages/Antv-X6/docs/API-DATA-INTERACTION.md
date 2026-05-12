# V1 后端 API 数据交互文档

本文档详细描述 V1 版本工作流编辑器与后端的数据交互逻辑，包括节点/连线的增删改、属性更新、变量引用获取等。

**导航**: [📚 文档索引](./README.md) | [⬆️ 主文档](../V1-FEATURES.md)

**相关文档**:

- [节点数据结构](./NODE-DATA-STRUCTURES.md) - 节点数据模型定义
- [X6 连线](./X6-EDGES.md) - 连线的前端实现
- [事件处理](./X6-EVENTS.md) - 触发 API 调用的事件

---

## 目录

- [1. API 服务概览](#1-api-服务概览)
- [2. 节点操作](#2-节点操作)
- [3. 连线操作](#3-连线操作)
- [4. 节点属性更新](#4-节点属性更新)
- [5. 变量引用获取](#5-变量引用获取)
- [6. 节点位置/大小更新](#6-节点位置大小更新)
- [7. 工作流初始化与重置](#7-工作流初始化与重置)

---

## 1. API 服务概览

### 1.1 服务文件结构

```
src/services/
├── workflow.ts       # 工作流主要 API（节点增删、连线、详情获取等）
├── modifyNode.ts     # 节点属性更新 API（按节点类型路由）
```

### 1.2 主要接口列表

| 接口函数 | HTTP 方法 | 路径 | 功能 |
| --- | --- | --- | --- |
| `getDetails` | GET | `/api/workflow/{id}` | 获取工作流详情 |
| `apiAddNode` | POST | `/api/workflow/node/add` | 添加节点 |
| `apiDeleteNode` | POST | `/api/workflow/node/delete/{id}` | 删除节点 |
| `apiCopyNode` | POST | `/api/workflow/node/copy/{id}` | 复制节点 |
| `apiAddEdge` | POST | `/api/workflow/node/{sourceId}/nextIds/update` | 更新连线（添加/删除） |
| `getOutputArgs` | GET | `/api/workflow/node/previous/{id}` | 获取上级节点输出参数（变量引用） |
| `getNodeConfig` | GET | `/api/workflow/node/{id}` | 获取节点详细配置 |
| `modifyNode` | POST | `/api/workflow/node/{type}/update` | 更新节点属性（按类型） |
| `validWorkflow` | GET | `/api/workflow/valid/{id}` | 校验工作流配置完整性 |
| `publishWorkflow` | POST | `/api/workflow/publish` | 发布工作流 |

---

## 2. 节点操作

### 2.1 添加节点

**服务函数**: `apiAddNode` (`src/services/workflow.ts:133`)

```typescript
interface IAddNode {
  workflowId: number;           // 工作流 ID
  type: string;                 // 节点类型 (NodeTypeEnum)
  loopNodeId?: number;          // 循环节点 ID（如果是循环内部节点）
  typeId?: number;              // 关联的组件 ID（插件/知识库等）
  extension?: {                 // 位置和尺寸信息
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  nodeConfigDto?: {             // 节点配置
    knowledgeBaseConfigs?: {...}[];  // 知识库配置
    toolName?: string;          // MCP 工具名
    mcpId?: number;             // MCP ID
  };
}

// 调用
const response = await apiAddNode(params);
// 返回 AddNodeResponse
```

**返回数据结构** (`AddNodeResponse`):

```typescript
interface AddNodeResponse {
  id: number; // 节点 ID
  name: string; // 节点名称
  type: NodeTypeEnum; // 节点类型
  description: string;
  nodeConfig: NodeConfig; // 节点配置（包含 extension）
  nextNodeIds: number[] | null; // 下游节点 ID 列表
  preNodes: number[] | null; // 上游节点列表
  loopNodeId?: number; // 所属循环节点 ID
  innerStartNodeId?: number; // 循环内部起始节点 ID
  innerEndNodeId?: number; // 循环内部结束节点 ID
  innerNodes?: ChildNode[]; // 循环内部子节点列表
  icon: string;
  created: string;
  modified: string;
  // ...
}
```

**前端处理流程** (`index.tsx` - `addNode` 函数):

```typescript
const addNode = async (child: Partial<ChildNode>, dragEvent: GraphRect) => {
  // 1. 组装请求参数
  let _params = { ...child, workflowId, extension: dragEvent };

  // 2. 计算节点尺寸（特殊节点需要固定尺寸）
  const { width, height } = getNodeSize({ data: _params, ... });

  // 3. 处理循环内部节点
  if (foldWrapItem.type === NodeTypeEnum.Loop || foldWrapItem.loopNodeId) {
    _params.loopNodeId = foldWrapItem.loopNodeId || foldWrapItem.id;
  }

  // 4. 调用 API
  const _res = await service.apiAddNode({ nodeConfigDto, ...rest });

  // 5. 处理成功响应
  if (_res.code === Constant.success) {
    await handleNodeCreationSuccess(_res.data, child);
  }
};
```

### 2.2 删除节点

**服务函数**: `apiDeleteNode` (`src/services/workflow.ts:141`)

```typescript
// API 调用
await apiDeleteNode(nodeId); // nodeId: string | number
```

**前端处理流程** (`index.tsx` - `deleteNode` 函数):

```typescript
const deleteNode = async (id: number | string, node?: ChildNode) => {
  // 1. 关闭抽屉，重置状态
  setVisible(false);
  preventGetReference.current = Number(id);
  setFoldWrapItem({ id: 0, ... });

  // 2. 调用 API
  const _res = await service.apiDeleteNode(id);

  // 3. 前端同步删除
  if (_res.code === Constant.success) {
    graphRef.current?.graphDeleteNode(String(id));
    changeUpdateTime();

    // 4. 循环节点特殊处理
    if (node?.type === 'Loop') {
      changeDrawer(null);
    } else if (node?.loopNodeId) {
      getNodeConfig(node.loopNodeId);  // 刷新父节点配置
    }
  }
};
```

### 2.3 复制节点

**服务函数**: `apiCopyNode` (`src/services/workflow.ts:136`)

```typescript
// API 调用
const response = await apiCopyNode(nodeId); // 返回新节点数据
```

**前端处理流程** (`index.tsx` - `copyNode` 函数):

```typescript
const copyNode = async (child: ChildNode) => {
  const _res = await service.apiCopyNode(child.id.toString());

  if (_res.code === Constant.success) {
    // 1. 构建新节点数据（位置偏移 32px）
    const _newNode = {
      ..._res.data,
      shape: getShape(_res.data.type),
      nodeConfig: {
        ..._res.data.nodeConfig,
        extension: {
          x: (resExtension.x || 0) + 32,
          y: (resExtension.y || 0) + 32,
        },
      },
    };

    // 2. 添加到画布
    graphRef.current?.graphAddNode(extension, _newNode);

    // 3. 同步后端
    changeNode({ nodeData: newNode });

    // 4. 选中新节点
    graphRef.current?.graphSelectNode(String(_res.data.id));
  }
};
```

---

## 3. 连线操作

### 3.1 连线数据模型

V1 版本的连线通过节点的 `nextNodeIds` 属性管理，而非独立的边数据。

```typescript
interface ChildNode {
  id: number;
  nextNodeIds: number[] | null; // 下游节点 ID 列表
  // ...
}
```

### 3.2 添加/删除连线

**服务函数**: `apiAddEdge` (`src/services/workflow.ts:148`)

```typescript
interface IAddEdge {
  nodeId: number[]; // 更新后的 nextNodeIds 完整列表
  sourceId: number; // 源节点 ID
}

// API 实际调用
await request(`/api/workflow/node/${sourceId}/nextIds/update`, {
  method: 'POST',
  data: nodeId, // number[] - 完整的 nextNodeIds 列表
});
```

**前端处理逻辑** (`src/utils/updateEdge.ts`):

```typescript
export const updateNodeEdges = async ({
  type, // UpdateEdgeType.created | UpdateEdgeType.deleted
  targetId, // 目标节点 ID
  sourceNode, // 源节点数据
  graphUpdateNode,
  graphDeleteEdge,
  callback,
}: UpdateNodeEdgesParams) => {
  // 1. 获取当前 nextNodeIds
  const _nextNodeIds = sourceNode.nextNodeIds || [];
  const beforeNextNodeIds = cloneDeep(_nextNodeIds);

  // 2. 根据操作类型修改列表
  let _params = { nodeId: [..._nextNodeIds], sourceId: sourceNode.id };

  if (type === UpdateEdgeType.created) {
    if (!_nextNodeIds.includes(Number(targetId))) {
      _params.nodeId.push(Number(targetId));
    }
  } else if (type === UpdateEdgeType.deleted) {
    _params.nodeId = _params.nodeId.filter((id) => id !== Number(targetId));
  }

  // 3. 乐观更新前端
  graphUpdateNode(String(sourceNode.id), {
    ...sourceNode,
    nextNodeIds: [..._params.nodeId],
  });

  // 4. 调用 API
  const _res = await service.apiAddEdge(_params);

  // 5. 失败回滚
  if (_res.code !== Constant.success) {
    graphUpdateNode(String(sourceNode.id), {
      ...sourceNode,
      nextNodeIds: beforeNextNodeIds,
    });
    if (type === UpdateEdgeType.created) {
      graphDeleteEdge(String(edgeId));
    }
    return false;
  }

  return _params.nodeId; // 返回更新后的 nextNodeIds
};
```

### 3.3 特殊节点连线处理

#### 条件分支/意图识别/问答节点

这些节点的连线信息存储在 `nodeConfig` 的子配置中：

```typescript
// 条件分支节点
nodeConfig.conditionBranchConfigs[].nextNodeIds

// 意图识别节点
nodeConfig.intentConfigs[].nextNodeIds

// 问答节点（选择类型）
nodeConfig.options[].nextNodeIds
```

**处理函数** (`src/utils/workflow.tsx` - `handleSpecialNodesNextIndex`):

```typescript
const handleSpecialNodesNextIndex = (
  sourceNode: ChildNode,
  portId: string,
  newNodeId: number,
  targetNode?: ChildNode,
) => {
  const params = cloneDeep(sourceNode);
  const targetNodeId = targetNode?.id;

  // 根据节点类型获取配置字段
  const configField =
    sourceNode.type === NodeTypeEnum.Condition
      ? 'conditionBranchConfigs'
      : sourceNode.type === NodeTypeEnum.IntentRecognition
      ? 'intentConfigs'
      : 'options';

  // 更新对应分支的 nextNodeIds
  for (let item of params.nodeConfig[configField]) {
    if (portId.includes(item.uuid)) {
      if (!item.nextNodeIds) item.nextNodeIds = [];
      if (!item.nextNodeIds.includes(newNodeId)) {
        item.nextNodeIds.push(newNodeId);
      }
      // 如果有目标节点，移除旧的连接
      if (targetNodeId) {
        item.nextNodeIds = item.nextNodeIds.filter((id) => id !== targetNodeId);
      }
    }
  }

  return params;
};
```

#### 异常处理节点连线

异常处理节点的连线存储在 `exceptionHandleConfig`:

```typescript
nodeConfig.exceptionHandleConfig.exceptionHandleNodeIds: number[]
```

**处理函数** (`src/utils/workflow.tsx` - `handleExceptionNodesNextIndex`):

```typescript
const handleExceptionNodesNextIndex = ({
  sourceNode,
  id, // 新节点 ID
  targetNodeId, // 目标节点 ID（可选）
}) => {
  const params = cloneDeep(sourceNode);
  const { exceptionHandleNodeIds = [] } =
    params.nodeConfig?.exceptionHandleConfig || {};

  // 添加新节点 ID
  if (!exceptionHandleNodeIds.includes(id)) {
    exceptionHandleNodeIds.push(id);
  }

  // 移除目标节点 ID（如果存在）
  if (targetNodeId) {
    exceptionHandleNodeIds = exceptionHandleNodeIds.filter(
      (nodeId) => nodeId !== targetNodeId,
    );
  }

  params.nodeConfig.exceptionHandleConfig = {
    ...params.nodeConfig.exceptionHandleConfig,
    exceptionHandleNodeIds,
  };

  return params;
};
```

#### 循环节点连线

循环节点与内部子节点的连接使用特殊字段：

```typescript
interface ChildNode {
  // 循环节点特有字段
  innerStartNodeId?: number; // 内部起始节点 ID
  innerEndNodeId?: number; // 内部结束节点 ID
  innerNodes?: ChildNode[]; // 内部子节点列表
}
```

**处理函数** (`src/utils/graph.ts` - `handleLoopEdge`):

```typescript
export function handleLoopEdge(sourceNode: ChildNode, targetNode: ChildNode) {
  if (sourceNode.type === 'Loop') {
    // Loop -> 内部子节点：设置 innerStartNodeId
    if (targetNode.loopNodeId === sourceNode.id) {
      return { ...sourceNode, innerStartNodeId: targetNode.id };
    }
  }

  if (targetNode.type === 'Loop') {
    // 内部子节点 -> Loop：设置 innerEndNodeId
    if (sourceNode.loopNodeId === targetNode.id) {
      return { ...targetNode, innerEndNodeId: sourceNode.id };
    }
  }

  return false;
}
```

---

## 4. 节点属性更新

### 4.1 按节点类型路由

**服务函数**: `modifyNode` (`src/services/modifyNode.ts`)

```typescript
// 节点类型到 API 路径的映射
const UrlList = {
  Knowledge: '/api/workflow/node/knowledge/update',
  HTTPRequest: '/api/workflow/node/http/update',
  QA: '/api/workflow/node/qa/update',
  Code: '/api/workflow/node/code/update',
  Plugin: '/api/workflow/node/plugin/update',
  IntentRecognition: '/api/workflow/node/intent/update',
  LLM: '/api/workflow/node/llm/update',
  Variable: '/api/workflow/node/variable/update',
  Loop: '/api/workflow/node/loop/update',
  LoopBreak: '/api/workflow/node/loop/update',
  LoopContinue: '/api/workflow/node/loop/update',
  LoopStart: '/api/workflow/node/update',
  LoopEnd: '/api/workflow/node/update',
  Start: '/api/workflow/node/update',
  End: '/api/workflow/node/end/update',
  Condition: '/api/workflow/node/condition/update',
  TextProcessing: '/api/workflow/node/text/update',
  TableDataAdd: '/api/workflow/node/tableDataAdd/update',
  TableDataUpdate: '/api/workflow/node/tableDataUpdate/update',
  TableDataDelete: '/api/workflow/node/tableDataDelete/update',
  TableDataQuery: '/api/workflow/node/tableDataQuery/update',
  TableSQL: '/api/workflow/node/tableCustomSql/update',
  MCP: '/api/workflow/node/mcp/update',
  // ...
};

// 调用函数
export async function modifyNode(params: IUpdateLLMNode, type: UrlListType) {
  return request(UrlList[type], { method: 'POST', data: params });
}
```

### 4.2 更新请求参数

```typescript
interface IUpdateLLMNode {
  nodeId: number | string; // 节点 ID
  name: string; // 节点名称
  description: string; // 节点描述
  nodeConfig: NodeConfig; // 节点配置
  innerStartNodeId?: number; // 循环内部起始节点（Loop 节点）
  innerEndNodeId?: number; // 循环内部结束节点（Loop 节点）
}
```

### 4.3 前端更新流程

**核心函数**: `apiUpdateNode` (`src/utils/updateNode.ts`)

```typescript
export const apiUpdateNode = async (params: ChildNode) => {
  const _params = { ...params, nodeId: params.id };
  return await service.modifyNode(_params, params.type as UrlListType);
};
```

**主页面调用** (`index.tsx` - `changeNode` 函数):

```typescript
const changeNode = async (
  { nodeData, update, targetNodeId }: ChangeNodeProps,
  callback = () => getReference(drawerForm.id),
): Promise<boolean> => {
  let params = cloneDeep(nodeData);

  // 1. 处理仅位置更新的情况
  if (update === NodeUpdateEnum.moved) {
    if (nodeData.id === drawerForm.id) {
      const values = nodeDrawerRef.current?.getFormValues();
      params.nodeConfig = { ...nodeData.nodeConfig, ...values };
    }
  }

  // 2. 先更新前端画布
  graphRef.current?.graphUpdateNode(String(params.id), params);

  // 3. 调用 API
  const _res = await apiUpdateNode(params);

  if (_res.code === Constant.success) {
    changeUpdateTime();

    // 4. 更新抽屉表单
    if (params.id === drawerForm.id) {
      setFoldWrapItem(params);
    }

    // 5. 刷新变量引用
    callback();
    return true;
  }
  return false;
};
```

### 4.4 表单自动保存

**防抖保存机制** (`index.tsx`):

```typescript
// 节流处理表单值变化
const throttledHandleGraphUpdate = useThrottledCallback(
  (changedValues, fullFormValues) => {
    setIsModified(false);
    handleGraphUpdateByFormData(changedValues, fullFormValues);
    setIsModified(true);
  },
  500, // 500ms 节流延迟
  { leading: true, trailing: true },
);

// 监听修改状态并保存
useModifiedSaveUpdate({
  run: async () => {
    return await onSaveWorkflow(drawerForm);
  },
  doNext: () => setIsModified(false),
});
```

---

## 5. 变量引用获取

### 5.1 获取上级节点输出参数

**服务函数**: `getOutputArgs` (`src/services/workflow.ts:163`)

```typescript
// API 调用
const response = await getOutputArgs(nodeId);
// 返回 NodePreviousAndArgMap
```

**返回数据结构**:

```typescript
interface NodePreviousAndArgMap {
  previousNodes: ChildNode[]; // 上游节点列表
  innerPreviousNodes: ChildNode[]; // 循环内部上游节点
  argMap: {
    // 参数映射
    [nodeId: string]: {
      inputArgs: InputAndOutConfig[];
      outputArgs: InputAndOutConfig[];
    };
  };
}
```

### 5.2 前端使用

**获取引用** (`index.tsx` - `getReference` 函数):

```typescript
const getReference = async (id: number): Promise<boolean> => {
  if (id === FoldFormIdEnum.empty || preventGetReference.current === id) {
    return false;
  }

  const _res = await service.getOutputArgs(id);

  if (_res.code === Constant.success) {
    if (_res.data?.previousNodes?.length) {
      setReferenceList(_res.data);
    } else {
      setReferenceList({
        previousNodes: [],
        innerPreviousNodes: [],
        argMap: {},
      });
    }
  }
  return _res.code === Constant.success;
};
```

### 5.3 节点关系路径查找

**工具函数** (`src/utils/updateNode.ts`):

```typescript
// 查找从起始节点到目标节点的所有路径
export const getNodeRelation = async (
  nodes: ChildNode[],
  startNodeId: number,
  targetNodeId: number,
): Promise<number[][]> => {
  const nodeMap = new Map(nodes.map((n) => [Number(n.id), n]));
  return findAllPaths(nodeMap, startNodeId, targetNodeId);
};

// 带参数收集的路径查找
export const getNodeRelationWithArgs = (
  nodes: ChildNode[],
  startNodeId: number,
  targetNodeId: number,
): { title: string; inputArgs: any[]; outputArgs: any[] }[][] => {
  const nodeMap = new Map(nodes.map((n) => [Number(n.id), n]));
  return findAllPathsAndCollectArgs(nodeMap, startNodeId, targetNodeId);
};
```

---

## 6. 节点位置/大小更新

### 6.1 位置更新触发

**画布事件** (`src/pages/Antv-X6/component/graph.tsx`):

```typescript
graph.on('node:moved', ({ node }) => {
  const { x, y } = node.getPosition();
  const data = node.getData();

  // 更新 extension 位置信息
  data.nodeConfig.extension = {
    ...data.nodeConfig.extension,
    x,
    y,
  };

  // 处理循环内部节点
  if (data.loopNodeId) {
    const parentNode = graph.getCellById(data.loopNodeId);
    const _size = parentNode.getSize();
    const _position = parentNode.getPosition();

    // 更新父节点尺寸和位置
    const parent = parentNode.getData();
    parent.nodeConfig.extension = {
      width: _size.width,
      height: _size.height,
      x: _position.x,
      y: _position.y,
    };

    changeCondition({ nodeData: parent, update: NodeUpdateEnum.moved });
  }

  // 普通节点位置更新
  changeCondition({ nodeData: data, update: NodeUpdateEnum.moved });
});
```

### 6.2 循环节点尺寸联动

**自动调整父节点尺寸** (`src/utils/graph.ts` - `adjustParentSize`):

```typescript
export const adjustParentSize = (parentNode: Node | Cell) => {
  const childrenNodes = parentNode.getChildren() || [];
  if (childrenNodes.length === 0) return;

  // 计算子节点包围盒
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;
  const padding = 40;

  childrenNodes.forEach((childNode) => {
    if (Node.isNode(childNode)) {
      const bbox = childNode.getBBox();
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
    }
  });

  // 应用最小尺寸限制
  const MIN_WIDTH = 600;
  const MIN_HEIGHT = 240;
  const newWidth = Math.max(maxX - minX + padding * 2, MIN_WIDTH);
  const newHeight = Math.max(maxY - minY + padding * 2, MIN_HEIGHT);

  // 更新父节点
  parentNode.prop(
    {
      position: { x: centerX - newWidth / 2, y: centerY - newHeight / 2 },
      size: { width: newWidth, height: newHeight },
    },
    { skipParentHandler: true },
  );
};
```

### 6.3 节点尺寸计算

**工具函数** (`src/utils/updateNode.ts` - `getWidthAndHeight`):

```typescript
export const getWidthAndHeight = (node: ChildNode) => {
  const { type, nodeConfig } = node;
  const extension = nodeConfig?.extension || {};

  // 获取默认尺寸
  const { defaultWidth, defaultHeight } =
    DEFAULT_NODE_CONFIG_MAP[type] || DEFAULT_NODE_CONFIG_MAP.default;

  // 异常处理节点额外高度
  const hasExceptionHandle = EXCEPTION_NODES_TYPE.includes(type);
  const extraHeight = hasExceptionHandle ? 32 : 0;

  // 特殊节点处理
  if (
    [
      NodeTypeEnum.QA,
      NodeTypeEnum.Condition,
      NodeTypeEnum.IntentRecognition,
    ].includes(type)
  ) {
    return {
      width: defaultWidth,
      height: (extension.height || defaultHeight) + extraHeight,
    };
  }

  if (type === NodeTypeEnum.Loop) {
    return {
      width: Math.max(extension.width || 0, defaultWidth),
      height: (extension.height || defaultHeight) + extraHeight,
    };
  }

  return { width: defaultWidth, height: defaultHeight + extraHeight };
};
```

---

## 7. 工作流初始化与重置

### 7.1 获取工作流详情

**服务函数**: `getDetails` (`src/services/workflow.ts:109`)

```typescript
// API 调用
const response = await getDetails(workflowId);
```

**返回数据结构** (`IgetDetails`):

```typescript
interface IgetDetails {
  id: number;
  name: string;
  description: string;
  icon: string;
  creator: CreatorInfo;
  created: string;
  modified: string;
  publishStatus: string;
  publishDate?: string;
  spaceId: number;
  startNode: ChildNode; // 开始节点
  endNode: ChildNode; // 结束节点
  nodes: ChildNode[]; // 所有节点列表
  inputArgs: InputAndOutConfig[]; // 工作流输入参数
  outputArgs: InputAndOutConfig[]; // 工作流输出参数
  extension: { size?: number }; // 扩展信息
  permissions?: PermissionsEnum[]; // 权限列表
}
```

### 7.2 初始化流程

**主页面初始化** (`index.tsx` - `getDetails` 函数):

```typescript
const getDetails = async () => {
  try {
    // 1. 获取工作流详情
    const _res = await service.getDetails(workflowId);

    // 2. 设置基础信息
    setInfo(_res.data);
    setSpaceId(_res.data.spaceId);

    // 3. 构建边列表
    const _nodeList = _res.data.nodes;
    const _edgeList = getEdges(_nodeList);

    // 4. 更新画布数据
    setGraphParams({ edgeList: _edgeList, nodeList: _nodeList });
  } catch (error) {
    console.error('Failed to fetch graph data:', error);
  }
};
```

### 7.3 边列表构建

**工具函数** (`src/utils/workflow.tsx` - `getEdges`):

```typescript
export const getEdges = (nodeList: ChildNode[], includeLoop = true): Edge[] => {
  const edges: Edge[] = [];

  nodeList.forEach((node) => {
    const { id, nextNodeIds, type } = node;

    // 普通节点的 nextNodeIds
    if (nextNodeIds?.length) {
      nextNodeIds.forEach((targetId) => {
        edges.push({
          source: String(id),
          target: String(targetId),
          zIndex: node.loopNodeId ? 15 : 1,
        });
      });
    }

    // 条件/意图/问答节点的分支连线
    if (type === NodeTypeEnum.Condition) {
      node.nodeConfig.conditionBranchConfigs?.forEach((branch) => {
        branch.nextNodeIds?.forEach((targetId) => {
          edges.push({
            source: `${id}-${branch.uuid}-out`,
            target: String(targetId),
          });
        });
      });
    }
    // ... 类似处理 IntentRecognition, QA

    // 异常处理节点连线
    const exceptionNodeIds =
      node.nodeConfig?.exceptionHandleConfig?.exceptionHandleNodeIds;
    if (exceptionNodeIds?.length) {
      exceptionNodeIds.forEach((targetId) => {
        edges.push({
          source: `${id}-exception-out`,
          target: String(targetId),
        });
      });
    }

    // 循环节点内部连线
    if (type === NodeTypeEnum.Loop && includeLoop) {
      if (node.innerStartNodeId) {
        edges.push({
          source: `${id}-in`,
          target: String(node.innerStartNodeId),
        });
      }
      if (node.innerEndNodeId) {
        edges.push({
          source: String(node.innerEndNodeId),
          target: `${id}-out`,
        });
      }
    }
  });

  return edges;
};
```

### 7.4 画布重置

**GraphContainer 方法** (`src/pages/Antv-X6/graphContainer.tsx`):

```typescript
// 重置运行结果
const graphResetRunResult = () => {
  if (!graphRef.current) return;
  const nodes = graphRef.current.getNodes();
  nodes.forEach((node: Node) => {
    node.updateData({ runResults: [] });
  });
};

// 刷新画布
const handleRefreshGraph = async () => {
  setGraphParams({ nodeList: [], edgeList: [] });
  await getDetails();
};
```

### 7.5 组件卸载清理

```typescript
useEffect(() => {
  getDetails();

  return () => {
    // 保存未提交的修改
    setIsModified((prev) => {
      if (prev === true) {
        onSaveWorkflow(drawerForm);
      }
      return false;
    });

    setVisible(false);
    setTestRun(false);
    clearWorkflow();
  };
}, []);
```

---

## 8. 数据流向图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户操作                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    X6 画布事件处理                                │
│   - node:moved (位置变化)                                         │
│   - edge:connected (连线创建)                                     │
│   - node:mousedown (节点选中)                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  index.tsx 业务逻辑层                             │
│   - addNode() / deleteNode() / copyNode()                        │
│   - changeNode() / nodeChangeEdge()                              │
│   - getReference() / getNodeConfig()                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    工具函数层                                     │
│   src/utils/                                                      │
│   - updateEdge.ts (连线操作)                                      │
│   - updateNode.ts (节点更新)                                      │
│   - workflow.tsx (边构建、特殊节点处理)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    服务层 (API 调用)                              │
│   src/services/                                                   │
│   - workflow.ts (节点/连线 CRUD)                                  │
│   - modifyNode.ts (节点属性更新)                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       后端 API                                    │
│   /api/workflow/...                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. 关键特性总结

| 特性             | 实现方式                                         |
| ---------------- | ------------------------------------------------ |
| **乐观更新**     | 先更新前端画布，API 失败后回滚                   |
| **按类型路由**   | 节点属性更新根据 `type` 路由到不同 API           |
| **边数据模型**   | 通过 `nextNodeIds` 管理，非独立边表              |
| **特殊节点连线** | 条件/意图/问答节点使用分支配置中的 `nextNodeIds` |
| **循环节点联动** | 子节点移动时自动调整父节点尺寸和位置             |
| **自动保存**     | 表单修改后节流触发，500ms 延迟                   |
| **变量引用**     | 通过 `getOutputArgs` 获取上游节点输出参数        |

---

**导航**: [📚 文档索引](./README.md) | [⬆️ 主文档](../V1-FEATURES.md)

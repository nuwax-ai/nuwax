# V2 工作流编辑器功能实现文档

> 本文档描述 V2 工作流编辑器已实现的功能点及技术细节

## 架构概述

### 设计目标

1. **前端数据驱动** - 所有数据操作在前端完成，后端仅负责持久化
2. **独立于 V1** - 完全独立实现，不依赖 V1 任何代码
3. **全量更新** - 编辑时全量保存，而非增量保存单个节点/连线
4. **支持撤销/重做** - 基于 X6 history 和前端数据快照
5. **运行动画** - 支持节点运行状态可视化

### 目录结构

```
src/pages/Antv-X6/v2/
├── indexV2.tsx              # 主入口组件
├── indexV2.less             # 主样式
├── types/
│   └── index.ts             # 类型定义
├── constants/
│   ├── index.ts             # 常量定义
│   └── stencilConfigV2.ts   # 节点模板配置
├── hooks/
│   └── useWorkflowDataV2.ts # 数据管理 Hook
├── services/
│   └── workflowV2.ts        # API 服务
├── utils/
│   ├── graphV2.ts           # 图形工具函数
│   ├── variableReferenceV2.ts # 变量引用计算
│   ├── workflowValidatorV2.ts # 工作流校验
│   └── nodeAnimationV2.ts   # 节点动画
└── components/
    ├── GraphContainerV2.tsx # 图形容器
    ├── GraphV2.tsx          # 图形初始化
    ├── EventHandlersV2.tsx  # 事件处理
    ├── registerCustomNodesV2.tsx # 自定义节点注册
    ├── common/              # 通用组件
    ├── drawer/              # 抽屉面板
    ├── layout/              # 布局组件
    ├── modal/               # 弹窗组件
    ├── error/               # 错误展示
    └── version/             # 版本管理
```

---

## 一、数据管理 (useWorkflowDataV2)

### 1.1 核心数据结构

```typescript
interface WorkflowDataV2 {
  nodeList: ChildNodeV2[]; // 节点列表（前端唯一数据源）
  edgeList: EdgeV2[]; // 边列表（从 nodeList.nextNodeIds 派生）
  lastSavedVersion: string; // 最后保存版本
  isDirty: boolean; // 是否有未保存的修改
}
```

### 1.2 节点操作

| 方法                          | 功能     | 实现                     |
| ----------------------------- | -------- | ------------------------ |
| `addNode(node)`               | 添加节点 | 更新 nodeList，记录历史  |
| `updateNode(nodeId, updates)` | 更新节点 | 合并更新，记录历史       |
| `deleteNode(nodeId)`          | 删除节点 | 同时删除关联边，记录历史 |
| `getNodeById(nodeId)`         | 获取节点 | 从 nodeList 查找         |

### 1.3 边操作

| 方法 | 功能 | 实现 |
| --- | --- | --- |
| `addEdge(edge)` | 添加边 | 更新 edgeList 和源节点 nextNodeIds |
| `deleteEdge(source, target)` | 删除边 | 更新 edgeList 和源节点 nextNodeIds |
| `getEdgesByNodeId(nodeId)` | 获取相关边 | 过滤 source/target |

### 1.4 批量操作

```typescript
batchUpdate({
  nodes?: { id: number; updates: Partial<ChildNodeV2> }[];
  addEdges?: EdgeV2[];
  deleteEdges?: { source: string; target: string }[];
})
```

### 1.5 历史记录

- 基于数据快照实现撤销/重做
- 最大 50 步历史记录
- 每次操作记录 before/after 状态

### 1.6 自动保存

```typescript
const AUTO_SAVE_CONFIG_V2 = {
  enabled: false, // 当前已禁用，待后端接口
  debounceTime: 1000, // 防抖时间
  throttleTime: 5000, // 节流时间
  maxRetries: 3, // 最大重试次数
  retryDelay: 1000, // 重试延迟
};
```

---

## 二、变量引用查找 (variableReferenceV2)

> 实现说明 + 规则细节；对应回归验证请查看《REGRESSION_CHECKLIST.md》

> 规则详见 [VARIABLE_REFERENCE_RULES.md](./VARIABLE_REFERENCE_RULES.md)

### 2.1 核心算法

**目标**: 根据连线关系，计算当前节点可引用的所有上游节点输出变量。完整规则与测试要点参考《VARIABLE_REFERENCE_RULES.md》（与后端 Java 版对齐），涵盖异常分支、条件/意图/问答分支、循环展开、系统变量、Variable isSuccess、排序等。

**实现**:

1. 根据 `nextNodeIds` 构建反向邻接表
2. 从当前节点 BFS 遍历找到所有前驱节点
3. 收集所有前驱节点的 `outputArgs`

```typescript
// 反向图构建
function buildReverseGraph(nodes: ChildNodeV2[]): Map<number, number[]> {
  // A.nextNodeIds = [B] 表示 A → B
  // 反向后：reverseGraph[B] = [A]
  nodes.forEach((node) => {
    node.nextNodeIds?.forEach((nextId) => {
      reverseGraph.get(nextId)?.push(node.id);
    });
  });
}

// BFS 查找所有前驱
function findAllPredecessors(nodeId, reverseGraph): number[] {
  // 从 nodeId 出发，沿反向边遍历
}
```

### 2.2 返回数据结构

```typescript
interface NodePreviousAndArgMapV2 {
  previousNodes: PreviousListV2[]; // 上游节点列表
  innerPreviousNodes: PreviousListV2[]; // 循环内部上游节点
  argMap: ArgMapV2; // 扁平化参数映射 (key → arg)
}
```

### 2.3 使用方式

```typescript
// indexV2.tsx
const referenceData = selectedNode
  ? calculateNodePreviousArgs(selectedNode.id, workflowData)
  : undefined;

// 传递给节点配置面板
<NodeDrawerV2 referenceData={referenceData} />;
```

### 2.4 变量选择器 (VariableSelectorV2)

**功能**:

- 展示可引用的上游节点变量
- 支持数据类型过滤 (`filterType` prop)
- 支持循环内部引用 (`isLoop` prop)
- 树形展示嵌套参数
- 规则对应《VARIABLE*REFERENCE_RULES.md》：展示 Start 入参 + `SYS*\*`系统变量（含空间/工作流/租户/用户等）、循环节点 INDEX 与`<name>\_item` 展开、Variable 节点 isSuccess。

---

## 三、图形容器 (GraphContainerV2)

### 3.1 暴露方法 (ref)

| 方法                                      | 功能           |
| ----------------------------------------- | -------------- |
| `getCurrentViewPort()`                    | 获取当前视口   |
| `graphAddNode(position, node)`            | 添加节点到画布 |
| `graphUpdateNode(nodeId, newData)`        | 更新画布节点   |
| `graphDeleteNode(nodeId)`                 | 删除画布节点   |
| `graphSelectNode(nodeId)`                 | 选中节点       |
| `graphCreateNewEdge(source, target, ...)` | 创建边         |
| `graphDeleteEdge(edgeId)`                 | 删除边         |
| `graphChangeZoom(zoom)`                   | 设置缩放       |
| `graphChangeZoomToFit()`                  | 适应视图       |
| `drawGraph()`                             | 重绘图形       |
| `canUndo() / canRedo()`                   | 撤销/重做状态  |
| `undo() / redo()`                         | 执行撤销/重做  |

### 3.2 事件处理

- 节点点击 → 打开配置面板
- 空白点击 → 关闭配置面板
- 节点移动 → 更新位置数据
- 连线创建/删除 → 更新 nextNodeIds

---

## 四、节点配置面板

### 4.1 面板架构

```
NodeDrawerV2
├── 节点名称编辑
├── 节点描述
├── 操作菜单 (复制/删除/试运行)
└── NodePanelV2 (根据节点类型渲染)
    ├── StartNodePanelV2
    ├── EndNodePanelV2
    ├── LLMNodePanelV2
    ├── CodeNodePanelV2
    ├── HTTPNodePanelV2
    ├── ConditionNodePanelV2
    ├── ...
    └── DefaultNodePanelV2
```

### 4.2 已实现节点类型

| 节点类型 | 面板组件 | 主要配置项 |
| --- | --- | --- |
| Start | StartNodePanelV2 | 输入参数 |
| End | EndNodePanelV2 | 返回类型、输出变量/内容 |
| LLM | LLMNodePanelV2 | 模型选择、系统/用户提示词、输入输出 |
| Code | CodeNodePanelV2 | 输入参数、代码编辑器、输出参数 |
| HTTPRequest | HTTPNodePanelV2 | 方法、URL、Headers/Query/Body |
| Condition | ConditionNodePanelV2 | 条件分支配置 |
| IntentRecognition | IntentNodePanelV2 | 模型、意图列表、补充提示词 |
| QA | QANodePanelV2 | 问题、回答类型、选项 |
| Loop | LoopNodePanelV2 | 循环类型、次数/数组、循环变量 |
| Variable | VariableNodePanelV2 | 设置/获取变量 |
| TextProcessing | TextProcessingNodePanelV2 | 拼接/分割配置 |
| DocumentExtraction | DocumentExtractionNodePanelV2 | 文档输入输出 |
| Knowledge | KnowledgeNodePanelV2 | 知识库选择、搜索策略 |
| Plugin | PluginNodePanelV2 | 插件选择、参数配置 |
| Workflow | WorkflowNodePanelV2 | 工作流选择 |
| Table\* | TableNodePanelV2 | 数据表操作 |

### 4.3 通用组件

| 组件               | 功能                |
| ------------------ | ------------------- |
| VariableSelectorV2 | 变量引用选择器      |
| PromptEditorV2     | 提示词编辑器        |
| CodeEditorV2       | 代码编辑器 (Monaco) |
| InputArgsEditorV2  | 输入参数编辑器      |
| OutputArgsEditorV2 | 输出参数编辑器      |
| KeyValueEditorV2   | 键值对编辑器        |
| ConditionEditorV2  | 条件表达式编辑器    |

---

## 五、API 服务 (workflowServiceV2)

### 5.1 接口列表

| 接口           | 方法 | 路径                                     | 状态      |
| -------------- | ---- | ---------------------------------------- | --------- |
| 获取工作流详情 | GET  | `/api/workflow/{id}`                     | ✅        |
| 全量保存       | POST | `/api/workflow/v2/save`                  | 🚧 待后端 |
| 验证工作流     | GET  | `/api/workflow/valid/{id}`               | ✅        |
| 发布工作流     | POST | `/api/workflow/publish`                  | ✅        |
| 获取版本历史   | GET  | `/api/workflow/config/history/list/{id}` | ✅        |
| 还原版本       | POST | `/api/workflow/restore/{historyId}`      | ✅        |

### 5.2 全量保存数据结构

```typescript
// 请求
interface SaveWorkflowRequestV2 {
  workflowId: number;
  nodes: ChildNodeV2[]; // 全量节点数据
}

// 响应
interface SaveWorkflowResponseV2 {
  success: boolean;
  message?: string;
  version?: string;
  nodeIdMapping?: { [tempId: number]: number };
}
```

---

## 六、常量配置

### 6.1 节点类型枚举

```typescript
enum NodeTypeEnumV2 {
  Start,
  End,
  LLM,
  Code,
  HTTPRequest,
  Condition,
  IntentRecognition,
  QA,
  Loop,
  LoopBreak,
  LoopContinue,
  Variable,
  TextProcessing,
  DocumentExtraction,
  Knowledge,
  Plugin,
  Workflow,
  Output,
  MCP,
  TableDataAdd,
  TableDataDelete,
  TableDataUpdate,
  TableDataQuery,
  TableSQL,
}
```

### 6.2 图形配置

```typescript
const GRAPH_CONFIG_V2 = {
  grid: { visible: true, type: 'dot', size: 22 },
  background: { color: '#f2f2f2' },
  mousewheel: { enabled: true, minScale: 0.2, maxScale: 3 },
  connecting: { allowBlank: false, allowLoop: false, snap: { radius: 22 } },
};
```

### 6.3 历史记录配置

```typescript
const HISTORY_CONFIG_V2 = {
  enabled: true,
  stackSize: 50,
};
```

---

## 七、边配置对齐 V1

### 7.1 路由器配置

| 场景             | 路由器      | 说明                         |
| ---------------- | ----------- | ---------------------------- |
| 初始化批量添加边 | `orth`      | 避免回折问题，简单直接的路径 |
| 拖拽创建边       | `manhattan` | 提供更好的路径规划体验       |
| 边连接完成后     | `manhattan` | 保持一致性                   |

### 7.2 端口 ID 格式（与 V1 对齐）

| 节点类型 | 端口 ID 格式               | 边 sourcePort 格式         |
| -------- | -------------------------- | -------------------------- |
| 普通节点 | `${node.id}-out`           | `${node.id}-out`           |
| 条件分支 | `${node.id}-${uuid}-out`   | `${node.id}-${uuid}-out`   |
| 意图识别 | `${node.id}-${uuid}-out`   | `${node.id}-${uuid}-out`   |
| 问答选项 | `${node.id}-${uuid}-out`   | `${node.id}-${uuid}-out`   |
| 异常处理 | `${node.id}-exception-out` | `${node.id}-exception-out` |

### 7.3 边连接完成后处理

```typescript
// 边连接完成事件处理（与 V1 保持一致）
graph.on('edge:connected', ({ isNew, edge }) => {
  setEdgeStyle(edge); // 设置边样式

  if (isNew) {
    // 异常端口连线 → edge.toFront()
    // 循环节点连线 → edge.toFront()
    // 普通节点连线 → setTimeout 设置 zIndex
    //   - 循环内节点：zIndex = 15
    //   - 普通节点：zIndex = 1
  }
});
```

### 7.4 节点更新时的边联动

```typescript
// graphUpdateNode 处理端口变化
const graphUpdateNode = (nodeId, newData) => {
  // 1. 获取旧端口列表
  // 2. 生成新端口配置
  // 3. 找出被删除的端口
  // 4. 删除与被删除端口相关的边
  // 5. 更新端口配置和节点数据
};
```

---

## 八、待实现功能

| 功能                 | 优先级 | 状态 | 备注                        |
| -------------------- | ------ | ---- | --------------------------- |
| 全量保存接口对接     | P0     | 🚧   | 待后端接口                  |
| 试运行/发布/版本联调 | P0     | ✅   | 使用 V1 接口                |
| 节点校验增强         | P1     | ✅   | 条件分支校验已补            |
| 边配置对齐 V1        | P1     | ✅   | 路由器、端口 ID、边联动     |
| 运行动画             | P2     | 🚧   | nodeAnimationV2.ts 框架已有 |
| 变量聚合节点         | P2     | ❌   | 新功能                      |

---

## 更新日志

### 2025-12-10

- **边配置对齐 V1**
  - 初始化批量添加边使用 `orth` 路由器，避免回折
  - 拖拽/交互时使用 `manhattan` 路由器
  - sourcePort 格式对齐：`${node.id}-${uuid}-out`、`${node.id}-exception-out`
  - 边连接完成后添加 `toFront()` 和 `zIndex` 设置
- **节点更新端口联动**
  - 特殊节点（条件分支、意图识别、问答选项）选项变更时端口联动
  - 删除端口时自动删除关联边
  - 异常处理配置变化时端口显示/隐藏联动
  - 循环内节点更新时父节点大小调整

### 2025-12-09

- 新增右键菜单（复制/粘贴/删除），Start/End 保护
- 插件/工作流/MCP 节点支持发布库选择，自动透传入出参
- 知识库节点接入发布库选择，保留搜索/召回配置
- 数据库节点支持发布库数据表选择，透传字段，SQL 生成弹窗
- 条件分支校验增强（比较符/参数必填规则）
- 系统变量补充空间/工作流/租户标识

### 2025-12-08

- 初始化 V2 架构
- 实现数据管理 Hook (useWorkflowDataV2)
- 实现变量引用查找 (variableReferenceV2)
- 实现变量选择器 UI (VariableSelectorV2)
- 完成大部分节点配置面板
- 定义全量保存接口

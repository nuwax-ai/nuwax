# 节点间连线配置实现分析

本文档详细分析 Antv-X6 项目中节点间连线配置的实现机制，涵盖 V1 和 V2 两个版本的实现方式。

## 目录

- [1. 连线配置架构概览](#1-连线配置架构概览)
- [2. 边的基础配置](#2-边的基础配置)
- [3. 连接器配置](#3-连接器配置)
- [4. 连接验证机制](#4-连接验证机制)
- [5. 端口配置与连线规则](#5-端口配置与连线规则)
- [6. 边的创建流程](#6-边的创建流程)
- [7. 边的样式管理](#7-边的样式管理)
- [8. V1 vs V2 实现对比](#8-v1-vs-v2-实现对比)

---

## 1. 连线配置架构概览

### 1.1 核心组件

节点间连线配置主要由以下几个部分组成：

```
┌─────────────────────────────────────────────────────────┐
│                    连线配置架构                         │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                     │
        ▼                   ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  边类型配置   │    │  连接器配置   │    │  验证规则     │
│ Edge.config  │    │ Connector    │    │ Validation   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                     │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  端口配置     │
                    │ Ports Config │
                    └──────────────┘
```

### 1.2 配置层次

1. **全局边配置**：定义所有边的默认样式和行为
2. **连接器配置**：定义连线的路径算法（曼哈顿、曲线等）
3. **连接验证**：定义哪些节点/端口可以连接
4. **端口配置**：定义节点的输入/输出端口位置和规则

---

## 2. 边的基础配置

### 2.1 V2 版本实现

**文件位置**: `src/pages/Antv-X6/v2/components/GraphV2.tsx:73-97`

```typescript
// 配置并注册边类型
Edge.config({
  markup: [
    { tagName: 'path', selector: 'wrap' }, // 包裹路径（扩大点击区域）
    { tagName: 'path', selector: 'line' }, // 实际显示的线条
  ],
  connector: { name: 'curveConnectorV2' }, // 使用自定义曲线连接器
  attrs: {
    wrap: {
      connection: true,
      strokeWidth: 10, // 较宽的点击区域
      strokeLinejoin: 'round',
      cursor: 'pointer',
      pointerEvents: 'none',
    },
    line: {
      connection: true,
      strokeWidth: 1, // 实际线条宽度
      pointerEvents: 'none',
      targetMarker: {
        name: 'classic', // 经典箭头
        size: 6,
      },
    },
  },
});
```

**关键配置说明**：

- **markup**: 定义边的 DOM 结构，包含两个路径：
  - `wrap`: 用于扩大点击区域，提升交互体验
  - `line`: 实际显示的连线
- **connector**: 指定连接器类型（见第 3 节）
- **attrs**: 定义边的样式属性

### 2.2 画布连接配置

**文件位置**: `src/pages/Antv-X6/v2/components/GraphV2.tsx:105-172`

```typescript
connecting: {
  ...GRAPH_CONFIG_V2.connecting,  // 基础配置
  router: 'manhattan',           // 曼哈顿路径（直角转弯）
  connector: 'curveConnectorV2', // 自定义曲线连接器
  connectionPoint: 'anchor',    // 连接点类型
  createEdge() {
    // 创建临时边（拖拽时显示）
    return new Shape.Edge({
      attrs: {
        line: {
          strokeDasharray: '5 5',  // 虚线
          strokeWidth: 1,
          targetMarker: null,       // 初始无箭头
          zIndex: 1,
          style: {
            animation: 'ant-line 30s infinite linear',  // 蚂蚁线动画
          },
        },
      },
    });
  },
  validateConnection({ sourceMagnet, targetMagnet, sourceCell, targetCell }) {
    // 连接验证逻辑（见第4节）
  },
}
```

**基础配置** (`GRAPH_CONFIG_V2.connecting`):

```typescript
// 文件位置: src/pages/Antv-X6/v2/constants/index.ts:345-356
connecting: {
  allowBlank: false,    // 禁止连接到空白区域
  allowMulti: true,     // 允许多条边连接同一端口
  allowNode: false,     // 禁止直接连接到节点
  allowLoop: false,     // 禁止自连接
  allowEdge: false,     // 禁止连接到边
  highlight: true,      // 高亮有效连接点
  snap: {
    radius: 22,         // 吸附半径
    anchor: 'bbox',     // 基于包围盒计算距离
  },
}
```

---

## 3. 连接器配置

### 3.1 自定义曲线连接器

连接器定义了连线的路径算法。项目使用自定义的曲线连接器。

**V2 版本实现**:

```typescript
// 文件位置: src/pages/Antv-X6/v2/components/registerCustomNodesV2.tsx
import { Path } from '@antv/x6';

/**
 * 注册自定义曲线连接器
 */
export function registerCustomConnectorV2() {
  Graph.registerConnector(
    'curveConnectorV2',
    (sourcePoint, targetPoint) => {
      const path = new Path();
      path.appendSegment(Path.createSegment('M', sourcePoint.x, sourcePoint.y));
      path.appendSegment(
        Path.createSegment(
          'C',
          sourcePoint.x + 100,
          sourcePoint.y,
          targetPoint.x - 100,
          targetPoint.y,
          targetPoint.x,
          targetPoint.y,
        ),
      );
      return path.serialize();
    },
    true,
  );
}
```

**连接器类型**：

- **manhattan**: 曼哈顿路径（直角转弯），通过 `router: 'manhattan'` 配置
- **curveConnectorV2**: 自定义曲线连接器，使用贝塞尔曲线

---

## 4. 连接验证机制

### 4.1 画布级验证

**文件位置**: `src/pages/Antv-X6/v2/components/GraphV2.tsx:125-171`

```typescript
validateConnection({
  sourceMagnet,    // 源端口 DOM 元素
  targetMagnet,   // 目标端口 DOM 元素
  sourceCell,     // 源节点
  targetCell,     // 目标节点
}) {
  // 1. 基础验证：空值检查
  if (!sourceMagnet || !targetMagnet || !sourceCell || !targetCell) {
    return false;
  }

  // 2. 防止自连接
  if (sourceCell === targetCell) {
    return false;
  }

  // 3. 获取端口组信息
  const sourcePortGroup = sourceMagnet.getAttribute('port-group') || '';
  const targetPortGroup = targetMagnet.getAttribute('port-group') || '';

  // 4. 获取节点数据
  const sourceData = sourceCell.getData() as ChildNodeV2;
  const targetData = targetCell.getData() as ChildNodeV2;

  // 5. 循环节点特殊处理
  const isSourceLoop = sourceData?.type === NodeTypeEnumV2.Loop;
  const isTargetLoop = targetData?.type === NodeTypeEnumV2.Loop;

  if (isSourceLoop || isTargetLoop) {
    return true; // 循环节点有特殊规则，允许连接
  }

  // 6. 普通节点：只允许 out/special/exception -> in
  if (
    (sourcePortGroup === PortGroupEnumV2.out ||
     sourcePortGroup === PortGroupEnumV2.special ||
     sourcePortGroup === PortGroupEnumV2.exception) &&
    targetPortGroup === PortGroupEnumV2.in
  ) {
    return true;
  }

  return false;
}
```

### 4.2 端口组类型

**文件位置**: `src/pages/Antv-X6/v2/types/index.ts`

```typescript
enum PortGroupEnumV2 {
  in = 'in', // 输入端口（左侧）
  out = 'out', // 输出端口（右侧）
  special = 'special', // 特殊端口（条件分支等）
  exception = 'exception', // 异常处理端口
}
```

### 4.3 连接规则总结

| 源端口类型  | 目标端口类型 | 是否允许 | 说明                 |
| ----------- | ------------ | -------- | -------------------- |
| `out`       | `in`         | ✅       | 标准连接             |
| `special`   | `in`         | ✅       | 条件分支等特殊节点   |
| `exception` | `in`         | ✅       | 异常处理连接         |
| `in`        | `in`         | ❌       | 输入端口不能作为源   |
| `out`       | `out`        | ❌       | 输出端口不能作为目标 |
| Loop 节点   | 任意         | ✅       | 循环节点有特殊规则   |
| 相同节点    | 相同节点     | ❌       | 禁止自连接           |

---

## 5. 端口配置与连线规则

### 5.1 端口组配置

**文件位置**: `src/pages/Antv-X6/v2/utils/graphV2.ts:108-150`

```typescript
function generatePortGroupConfig(node: ChildNodeV2): PortsConfigV2['groups'] {
  const isLoopNode = node.type === NodeTypeEnumV2.Loop;
  const isFixedPortNode = FIXED_PORT_NODES.includes(node.type);

  return {
    [PortGroupEnumV2.in]: {
      position: { name: 'left' },
      attrs: {
        circle: {
          /* ... */
        },
      },
      connectable: {
        source: isLoopNode, // Loop 节点的 in 端口可作为 source
        target: true, // 所有节点的 in 端口可作为 target
      },
    },
    [PortGroupEnumV2.out]: {
      position: { name: isFixedPortNode ? 'right' : 'absolute' },
      attrs: {
        circle: {
          /* ... */
        },
      },
      connectable: {
        source: true, // 所有节点的 out 端口可作为 source
        target: isLoopNode, // Loop 节点的 out 端口可作为 target
      },
    },
    [PortGroupEnumV2.special]: {
      position: { name: 'absolute' },
      attrs: {
        circle: {
          /* ... */
        },
      },
      connectable: {
        source: true,
        target: isLoopNode,
      },
    },
    [PortGroupEnumV2.exception]: {
      position: { name: 'absolute' },
      attrs: {
        circle: {
          /* ... */
        },
      },
      connectable: {
        source: true,
        target: isLoopNode,
      },
    },
  };
}
```

### 5.2 端口生成逻辑

**文件位置**: `src/pages/Antv-X6/v2/utils/graphV2.ts:294-402`

不同类型的节点有不同的端口配置：

```typescript
export function generatePorts(node: ChildNodeV2): PortsConfigV2 {
  switch (node.type) {
    case NodeTypeEnumV2.Start:
      // 开始节点：只有输出端口
      inputPorts = [];
      outputPorts = [generate({ group: PortGroupEnumV2.out, idSuffix: 'out' })];
      break;

    case NodeTypeEnumV2.End:
      // 结束节点：只有输入端口
      inputPorts = [generate({ group: PortGroupEnumV2.in, idSuffix: 'in' })];
      outputPorts = [];
      break;

    case NodeTypeEnumV2.Condition:
    case NodeTypeEnumV2.IntentRecognition:
      // 条件/意图节点：每个分支一个输出端口
      const configs = node.nodeConfig?.conditionBranchConfigs || [];
      outputPorts = configs.map((item, index) =>
        generate({
          group: PortGroupEnumV2.special,
          idSuffix: `${item.uuid || index}-out`,
          // ... 位置计算
        }),
      );
      break;

    case NodeTypeEnumV2.QA:
      // 问答节点：根据回答类型生成端口
      if (type === AnswerTypeEnumV2.SELECT) {
        // 选项回答：每个选项一个端口
        outputPorts = (configs || []).map((item, index) =>
          generate({
            group: PortGroupEnumV2.special,
            idSuffix: `${item.uuid || index}-out`,
          }),
        );
      } else {
        // 直接回答：单个输出端口
        outputPorts = [
          generate({ group: PortGroupEnumV2.out, idSuffix: 'out' }),
        ];
      }
      break;

    default:
      // 普通节点：一个输入端口 + 一个输出端口
      inputPorts = [generate({ group: PortGroupEnumV2.in, idSuffix: 'in' })];
      outputPorts = [generate({ group: PortGroupEnumV2.out, idSuffix: 'out' })];
      break;
  }

  // 处理异常端口
  outputPorts = handleExceptionOutputPort(node, outputPorts, generate);

  return {
    groups: generatePortGroupConfig(node),
    items: [...inputPorts, ...outputPorts],
  };
}
```

---

## 6. 边的创建流程

### 6.1 拖拽创建边

当用户从一个端口拖拽到另一个端口时：

```
用户操作
  │
  ├─> 1. 开始拖拽：触发 createEdge() 创建临时边
  │
  ├─> 2. 拖拽过程：临时边跟随鼠标移动
  │
  ├─> 3. 接近端口：触发 validateConnection() 验证
  │
  ├─> 4. 连接成功：触发 edge:connected 事件
  │
  └─> 5. 创建完成：调用 onEdgeAdd 回调
```

**事件处理** (`GraphV2.tsx:272-288`):

```typescript
graph.on('edge:connected', ({ isNew, edge }) => {
  if (!isNew) return;

  const sourceCell = edge.getSourceCell();
  const targetCell = edge.getTargetCell();

  if (sourceCell && targetCell) {
    const newEdge: EdgeV2 = {
      source: sourceCell.id,
      target: targetCell.id,
      sourcePort: edge.getSourcePortId() || undefined,
      targetPort: edge.getTargetPortId() || undefined,
      zIndex: 1,
    };
    onEdgeAdd(newEdge); // 通知父组件
  }
});
```

### 6.2 程序化创建边

**文件位置**: `src/pages/Antv-X6/v2/utils/graphV2.ts:468-499`

```typescript
export function createEdgeData(edge: EdgeV2): any {
  const edgeConfig: any = {
    zIndex: edge.zIndex || 1,
    attrs: {
      line: {
        stroke: '#5147FF',
        strokeWidth: 1,
        targetMarker: {
          name: 'classic',
          size: 6,
        },
      },
    },
    router: 'manhattan',
  };

  // 处理 source - 指定节点和端口
  if (edge.sourcePort) {
    edgeConfig.source = { cell: edge.source, port: edge.sourcePort };
  } else {
    edgeConfig.source = edge.source;
  }

  // 处理 target - 指定节点和端口
  if (edge.targetPort) {
    edgeConfig.target = { cell: edge.target, port: edge.targetPort };
  } else {
    edgeConfig.target = edge.target;
  }

  return edgeConfig;
}
```

**使用示例** (`GraphContainerV2.tsx:275-295`):

```typescript
const graphCreateNewEdge = useCallback(
  (
    source: string,
    target: string,
    isLoop?: boolean,
    sourcePort?: string,
    targetPort?: string,
  ) => {
    if (!graphRef.current) return;

    const edgeData = createEdgeData({
      source,
      target,
      sourcePort: sourcePort || `${source}-out`,
      targetPort: targetPort || `${target}-in`,
      zIndex: isLoop ? 25 : 1,
    });
    graphRef.current.addEdge(edgeData);
  },
  [],
);
```

### 6.3 从节点数据提取边

**文件位置**: `src/pages/Antv-X6/v2/utils/graphV2.ts:507-635`

```typescript
export function extractEdgesFromNodes(nodes: ChildNodeV2[]): EdgeV2[] {
  const edges: EdgeV2[] = [];

  nodes.forEach((node) => {
    // 1. 普通节点的 nextNodeIds
    if (node.nextNodeIds && node.nextNodeIds.length > 0) {
      node.nextNodeIds.forEach((targetId) => {
        edges.push({
          source: node.id.toString(),
          target: targetId.toString(),
          sourcePort: `${node.id}-out`,
          targetPort: `${targetId}-in`,
          zIndex: node.loopNodeId ? 25 : 1,
        });
      });
    }

    // 2. 条件分支节点
    if (node.type === NodeTypeEnumV2.Condition) {
      node.nodeConfig?.conditionBranchConfigs?.forEach((branch) => {
        branch.nextNodeIds?.forEach((targetId) => {
          edges.push({
            source: node.id.toString(),
            target: targetId.toString(),
            sourcePort: `${branch.uuid}-out`, // 使用分支 UUID
            targetPort: `${targetId}-in`,
            zIndex: node.loopNodeId ? 25 : 1,
          });
        });
      });
    }

    // 3. 异常处理节点
    if (node.nodeConfig?.exceptionHandleConfig?.exceptionHandleNodeIds) {
      node.nodeConfig.exceptionHandleConfig.exceptionHandleNodeIds.forEach(
        (targetId) => {
          edges.push({
            source: node.id.toString(),
            target: targetId.toString(),
            sourcePort: `${node.id}-exception`, // 异常端口
            targetPort: `${targetId}-in`,
            zIndex: 1,
          });
        },
      );
    }
  });

  return edges;
}
```

---

## 7. 边的样式管理

### 7.1 默认样式

```typescript
// 文件位置: src/pages/Antv-X6/v2/constants/index.ts:297-301
export const DEFAULT_EDGE_STYLE_V2 = {
  strokeWidth: 1,
  stroke: '#5147FF', // 紫色
  strokeDasharray: '',
};
```

### 7.2 选中样式

```typescript
// 文件位置: src/pages/Antv-X6/v2/components/GraphV2.tsx:518-526
graph.on('edge:click', ({ edge }) => {
  edge.attr('line/stroke', '#37D0FF'); // 选中时变蓝色
  onClickBlank();
});

graph.on('edge:unselected', ({ edge }) => {
  edge.attr('line/stroke', '#5147FF'); // 恢复默认紫色
});
```

### 7.3 层级管理

```typescript
// 普通边层级
edge.prop('zIndex', 1);

// 循环内部边层级（更高，显示在上层）
edge.prop('zIndex', 25);
```

### 7.4 箭头管理

箭头显示规则：

- 默认：所有边都有箭头
- 特殊情况：同一目标端口的最后一条边显示箭头，其他隐藏
- LoopEnd -> _ 和 _ -> LoopStart 不显示箭头

---

## 8. V1 vs V2 实现对比

### 8.1 配置方式

| 特性 | V1 | V2 |
| --- | --- | --- |
| 边配置 | `Edge.config()` | `Edge.config()` |
| 连接器 | `curveConnector` | `curveConnectorV2` |
| 验证逻辑 | 更复杂，包含业务验证 | 简化，主要做基础验证 |
| 端口配置 | `generatePorts()` | `generatePorts()` |
| **端口组 magnetRadius** | **50** (在 `generatePortGroupConfig` 中) | **30** (在 `generatePortGroupConfig` 中) |
| **端口项 magnetRadius** | **30** (在 `generatePortConfig` 中) | **30** (在 `generatePortConfig` 中) |

### 8.2 验证机制

**V1 版本** (`docs/X6-EDGES.md`):

- 画布级验证：基础规则检查
- 业务级验证：`validateConnect()` 函数，包含循环节点、特殊节点等复杂逻辑
- 双重验证：连接时验证 + 连接后验证

**V2 版本** (`components/GraphV2.tsx`):

- 画布级验证：简化验证，主要检查端口类型
- 业务验证：移到上层组件处理
- 单一验证：主要在连接时验证

### 8.3 边创建

**V1**:

```typescript
// 更复杂的边创建逻辑，包含多种特殊情况处理
const createEdge = (edge: Edge) => {
  // 处理 source/target 格式转换
  // 设置样式和层级
  // 处理循环节点等特殊情况
};
```

**V2**:

```typescript
// 更简洁的边创建函数
export function createEdgeData(edge: EdgeV2): any {
  // 统一处理 source/target 格式
  // 设置默认样式
  // 返回标准配置对象
}
```

### 8.4 代码组织

**V1**:

- 验证逻辑分散在多个文件
- 边创建和验证耦合较紧
- 包含大量业务逻辑

**V2**:

- 验证逻辑集中在 `GraphV2.tsx`
- 边创建工具函数独立在 `graphV2.ts`
- 业务逻辑上移到容器组件

---

## 9. 关键实现要点总结

### 9.1 连线配置的核心要素

1. **边类型配置** (`Edge.config`): 定义边的默认样式和结构
2. **连接器** (`connector`): 定义连线的路径算法
3. **路由算法** (`router`): 定义连线的路径规划（曼哈顿、曲线等）
4. **连接验证** (`validateConnection`): 定义连接规则
5. **端口配置** (`ports`): 定义节点的输入/输出端口

### 9.2 连接规则

- **标准连接**: `out` → `in`
- **特殊连接**: `special` → `in`（条件分支等）
- **异常连接**: `exception` → `in`
- **循环节点**: 有特殊规则，允许双向连接

### 9.3 边的生命周期

```
创建 → 验证 → 连接 → 样式设置 → 事件触发 → 数据同步
```

### 9.4 最佳实践

1. **分离关注点**: 画布级验证 vs 业务级验证
2. **统一数据格式**: 使用标准化的边数据结构
3. **样式管理**: 集中管理边的样式配置
4. **事件处理**: 通过事件回调通知上层组件

---

## 10. 相关文件索引

| 文件路径                             | 说明               |
| ------------------------------------ | ------------------ |
| `v2/components/GraphV2.tsx`          | 图形初始化和边配置 |
| `v2/utils/graphV2.ts`                | 边创建工具函数     |
| `v2/constants/index.ts`              | 边样式常量         |
| `v2/components/GraphContainerV2.tsx` | 边创建和删除操作   |
| `docs/X6-EDGES.md`                   | V1 版本边实现文档  |
| `docs/X6-PORTS.md`                   | 端口配置文档       |

---

**文档生成时间**: 2025-01-XX  
**适用版本**: V1 & V2  
**维护者**: 开发团队

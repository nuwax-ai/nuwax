# X6 连线（Edges）实现文档

本文档详细描述 V1 版本工作流编辑器中连线的配置、创建、验证和交互逻辑。

**导航**: [📚 文档索引](./README.md) | [⬆️ 主文档](../V1-FEATURES.md)

**相关文档**:

- [连接桩配置](./X6-PORTS.md) - 边的起点和终点端口配置
- [事件处理](./X6-EVENTS.md) - 边相关的事件处理
- [API 数据交互](./API-DATA-INTERACTION.md) - 边数据的后端同步

---

## 目录

- [1. 边配置概览](#1-边配置概览)
- [2. 自定义连接器](#2-自定义连接器)
- [3. 边创建逻辑](#3-边创建逻辑)
- [4. 边验证规则](#4-边验证规则)
- [5. 边事件处理](#5-边事件处理)
- [6. 边样式管理](#6-边样式管理)

---

## 1. 边配置概览

### 1.1 边的 Markup 结构

**文件**: `src/pages/Antv-X6/component/graph.tsx:74-90`

```typescript
Edge.config({
  markup: [
    {
      tagName: 'path',
      selector: 'wrap', // 包裹路径（用于扩大点击区域）
    },
    {
      tagName: 'path',
      selector: 'line', // 实际显示的线条
    },
  ],
  connector: { name: 'curveConnector' }, // 使用自定义曲线连接器
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

### 1.2 画布连接配置

**文件**: `src/pages/Antv-X6/component/graph.tsx:150-180`

```typescript
connecting: {
  router: 'manhattan',        // 曼哈顿路径（直角转弯）
  connector: 'curveConnector', // 自定义曲线连接器
  connectionPoint: 'anchor',  // 连接点类型
  allowBlank: false,          // 禁止连接到空白区域
  allowMulti: true,           // 允许多条边连接同一端口
  allowNode: false,           // 禁止直接连接到节点
  allowLoop: false,           // 禁止自连接
  allowEdge: false,           // 禁止连接到边
  highlight: true,            // 高亮有效连接点
  snap: {
    radius: 22,               // 吸附半径
    anchor: 'bbox',           // 基于包围盒计算距离
  },

  // 创建边的工厂函数
  createEdge() {
    return new Shape.Edge({
      attrs: {
        line: {
          strokeDasharray: '5 5',  // 虚线（拖拽时）
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

  // 连接验证函数
  validateConnection({ sourceMagnet, targetMagnet, sourceCell, targetCell }) {
    // 详见边验证规则章节
  },
}
```

---

## 2. 自定义连接器

### 2.1 曲线连接器实现

**文件**: `src/pages/Antv-X6/component/registerCustomNodes.tsx`

```typescript
import { Path } from '@antv/x6';

/**
 * 创建自定义曲线路径
 * @param sourcePoint 源点坐标
 * @param targetPoint 目标点坐标
 * @returns 路径字符串
 */
export const createCurvePath = (
  sourcePoint: { x: number; y: number },
  targetPoint: { x: number; y: number },
) => {
  const pathData = `
    M ${sourcePoint.x} ${sourcePoint.y}
    C ${sourcePoint.x + 100} ${sourcePoint.y}
      ${targetPoint.x - 100} ${targetPoint.y}
      ${targetPoint.x} ${targetPoint.y}
  `;
  return Path.normalize(pathData);
};
```

### 2.2 连接器注册

**文件**: `src/pages/Antv-X6/component/graph.tsx:70`

```typescript
// 注册自定义连接器
Graph.registerConnector('curveConnector', createCurvePath, true);
```

---

## 3. 边创建逻辑

### 3.1 拖拽创建边

当用户从一个端口拖拽到另一个端口时，X6 自动调用 `createEdge` 创建临时边，并通过 `validateConnection` 验证连接有效性。

### 3.2 通过连接桩/边创建节点并连线

**核心函数**: `createNodeAndEdge` (`graph.tsx:103-145`)

```typescript
const createNodeAndEdge = (
  graph: Graph,
  event: any,
  sourceNode: ChildNode, // 源节点
  portId: string, // 源端口 ID
  targetNode?: ChildNode, // 目标节点（边上创建时存在）
  edgeId?: string, // 边 ID（边上创建时存在）
) => {
  // 1. 计算弹窗位置
  const targetRect = event.target.getBoundingClientRect();
  const centerX = targetRect.left + targetRect.width / 2;
  const centerY = targetRect.top + targetRect.height / 2;

  const position = graph.clientToLocal({ x: centerX, y: centerY });

  // 2. 定义节点拖入回调
  const dragChild = (child: StencilChildNode) => {
    createNodeByPortOrEdge({
      child,
      sourceNode,
      portId,
      position,
      targetNode,
      edgeId,
    });
  };

  // 3. 显示节点选择弹窗
  const isInLoop = !!(sourceNode?.loopNodeId || false);
  Modal.confirm({
    content: <StencilContent dragChild={dragChild} isLoop={isInLoop} />,
    footer: null,
    maskClosable: true,
    // ...
  });
};
```

### 3.3 程序化创建边

**GraphContainer 方法**: `graphCreateNewEdge` (`graphContainer.tsx:148-157`)

```typescript
const graphCreateNewEdge = (
  source: string,
  target: string,
  isLoop?: boolean,
) => {
  const edge = createEdge({
    source,
    target,
    zIndex: isLoop ? 25 : 1,
  });
  graphRef.current.addEdge(edge);
};
```

**边创建工具函数**: `createEdge` (`src/utils/workflow.tsx`)

```typescript
export const createEdge = (edge: Edge) => {
  const { source, target, zIndex = 1 } = edge;

  return {
    source:
      typeof source === 'string'
        ? { cell: source.split('-')[0], port: source }
        : source,
    target:
      typeof target === 'string'
        ? { cell: target.split('-')[0], port: target }
        : target,
    router: 'manhattan',
    connector: 'curveConnector',
    zIndex,
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
  };
};
```

---

## 4. 边验证规则

### 4.1 画布级验证

**文件**: `src/pages/Antv-X6/component/graph.tsx:183-260`

```typescript
validateConnection({
  sourceMagnet,
  targetMagnet,
  sourceCell,
  targetCell,
}) {
  // 1. 空值检查
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
  const sourcePortId = sourceMagnet.getAttribute('port');
  const targetPortId = targetMagnet.getAttribute('port');

  if (!sourcePortId || !targetPortId) {
    return false;
  }

  // 4. 检查重复边
  const existingEdges = graph.getEdges();
  const isDuplicateEdge = existingEdges.some((edge) => {
    const edgeSource = edge.getSource();
    const edgeTarget = edge.getTarget();
    return (
      edgeSource.cell === sourceCell.id &&
      edgeSource.port === sourcePortId &&
      edgeTarget.cell === targetCell.id &&
      edgeTarget.port === targetPortId
    );
  });
  if (isDuplicateEdge) return false;

  // 5. LoopBreak 节点只能连接 LoopEnd
  const targetNode = targetCell.getData();
  const sourceNode = sourceCell.getData();
  if (sourceNode.type === NodeTypeEnum.LoopBreak &&
      targetNode.type !== NodeTypeEnum.LoopEnd) {
    return false;
  }

  // 6. 非 Loop 节点的连接限制
  const isLoopNode = (cell) => cell.getData()?.type === 'Loop';

  if (!isLoopNode(sourceCell) && !isLoopNode(targetCell)) {
    // 只允许 out/special/exception -> in 的连接
    if ((sourcePortGroup === PortGroupEnum.out ||
         sourcePortGroup === PortGroupEnum.special ||
         sourcePortGroup === PortGroupEnum.exception) &&
        targetPortGroup === PortGroupEnum.in) {
      return true;
    }
    return false;
  }

  // 7. Loop 节点的 in/out 端口可双向连接
  if (isLoopNode(sourceCell) || isLoopNode(targetCell)) {
    return true;
  }

  return true;
}
```

### 4.2 业务级验证

**文件**: `src/utils/graph.ts` - `validateConnect`

```typescript
export const validateConnect = (
  edge: Edge,
  allEdges: Edge[],
): string | boolean => {
  const sourceCellId = edge.getSourceCellId();
  const targetNodeId = edge.getTargetCellId();
  const sourcePort = edge.getSourcePortId() || '';
  const targetPort = edge.getTargetPortId() || '';
  const sourceNode = edge.getSourceNode()?.getData();
  const targetNode = edge.getTargetNode()?.getData();

  const isLoopNode = sourceNode.type === 'Loop' || targetNode.type === 'Loop';

  // 1. 检查重复边
  if (
    hasDuplicateEdge(
      allEdges,
      sourceCellId,
      targetNodeId,
      sourcePort,
      targetPort,
      edge.id,
    )
  ) {
    return '不能创建重复的边';
  }

  // 2. Loop 节点逻辑
  if (isLoopNode) {
    // 禁止连接外部节点
    if (
      (sourceNode.type === 'Loop' &&
        !targetNode.loopNodeId &&
        sourcePort.includes('in')) ||
      (targetNode.type === 'Loop' &&
        !sourceNode.loopNodeId &&
        targetPort.includes('out'))
    ) {
      return '不能连接外部的节点';
    }

    // 验证循环内部节点连接
    const result = _validateLoopInnerNode(sourceNode, targetNode);
    if (result !== false) return result;
  }

  // 3. 非 Loop 节点的 in 端口不能作为源
  if (sourceNode.type !== 'Loop' && sourcePort?.includes('in')) {
    return '';
  }

  // 4. 端口方向检查
  if (sourcePort?.includes('left') || targetPort?.includes('right')) {
    return '';
  }

  // 5. 循环内部节点不能连接外部
  const currentLoopNodeId = sourceNode.loopNodeId || targetNode.loopNodeId;
  if (currentLoopNodeId) {
    if (
      !isValidLoopConnection(sourceNode, currentLoopNodeId) ||
      !isValidLoopConnection(targetNode, currentLoopNodeId)
    ) {
      return '不能连接外部节点';
    }
  }

  return false; // false 表示验证通过
};
```

### 4.3 循环内部节点验证

```typescript
const _validateLoopInnerNode = (
  sourceNode: ChildNode,
  targetNode: ChildNode,
): string | boolean => {
  if (targetNode.type === 'Loop') {
    // 条件分支类节点不能作为循环出口
    const invalidSourceTypes = ['IntentRecognition', 'Condition', 'QA'];
    if (invalidSourceTypes.includes(sourceNode.type) && sourceNode.loopNodeId) {
      return '条件分支，意图识别，问答不能作为循环的出口连接节点';
    }

    // 检查是否已有内部结束节点连接
    if (sourceNode.loopNodeId === targetNode.id) {
      if (targetNode.innerEndNodeId && targetNode.innerEndNodeId !== -1) {
        return '当前已有对子节点连接循环的出口，请先删除该连线';
      }
    }
  }

  if (sourceNode.type === 'Loop') {
    // 检查是否已有内部起始节点连接
    if (targetNode.loopNodeId === sourceNode.id) {
      if (sourceNode.innerStartNodeId && sourceNode.innerStartNodeId !== -1) {
        return '当前循环已有对子节点的连线，请先删除该连线';
      }
    }
  }

  return false;
};
```

---

## 5. 边事件处理

### 5.1 边连接完成

**文件**: `src/pages/Antv-X6/component/graph.tsx:528-610`

```typescript
graph.on('edge:connected', ({ isNew, edge }) => {
  changePortSize();
  edge.setRouter('manhattan');

  if (!isNew) return;

  const sourceNode = edge.getSourceNode()?.getData();
  const targetNode = edge.getTargetNode()?.getData();
  const sourcePort = edge.getSourcePortId();
  const targetPort = edge.getTargetPortId();

  // 1. 验证连接
  const result = validateConnect(edge, graph.getEdges());
  if (result !== false) {
    edge.remove();
    if (result && typeof result === 'string') {
      message.warning(result);
    }
    return;
  }

  // 2. 处理异常端口连接
  const isException = _handleExceptionItemEdgeAdd(edge, (newNodeParams) => {
    changeNodeConfigWithRefresh({ nodeData: newNodeParams, targetNodeId });
    graph.addEdge(edge);
    setEdgeAttributes(edge);
    updateEdgeArrows(graph);
  });
  if (isException) return;

  // 3. 处理循环节点连接
  if (sourceNode.type === 'Loop' || targetNode.type === 'Loop') {
    const _params = handleLoopEdge(sourceNode, targetNode);
    if (_params) {
      changeNodeConfigWithRefresh({ nodeData: _params, targetNodeId });
      graph.addEdge(edge);
      setEdgeAttributes(edge);
      return;
    }
  }

  // 4. 处理特殊节点（条件/意图/问答）
  if (
    sourceNode.type === NodeTypeEnum.Condition ||
    sourceNode.type === NodeTypeEnum.IntentRecognition ||
    (sourceNode.type === NodeTypeEnum.QA &&
      sourceNode.nodeConfig.answerType === AnswerTypeEnum.SELECT)
  ) {
    const _params = handleSpecialNodeTypes(sourceNode, targetNode, sourcePort);
    changeNodeConfigWithRefresh({ nodeData: _params, targetNodeId });
  } else {
    // 5. 普通节点连接
    changeEdgeConfigWithRefresh({
      type: UpdateEdgeType.created,
      targetId: targetNodeId,
      sourceNode,
      id: edge.id,
    });
  }

  // 6. 设置边样式
  graph.addEdge(edge);
  setEdgeAttributes(edge);

  // 7. 更新层级和箭头
  setTimeout(() => {
    if (sourceNode.loopNodeId || targetNode.loopNodeId) {
      edge.prop('zIndex', 15);
    } else {
      edge.prop('zIndex', 1);
    }
    updateEdgeArrows(graph);
  }, 0);
});
```

### 5.2 边鼠标悬停

**添加边上的加号按钮**: `graph.tsx:427-475`

```typescript
graph.on('edge:mouseenter', ({ edge }) => {
  const sourceNode = edge.getSourceCell()?.getData();
  const targetNode = edge.getTargetCell()?.getData();

  // 跳过循环内部边
  if (
    (sourceNode.type === 'Loop' && targetNode.loopNodeId) ||
    (sourceNode.loopNodeId && targetNode?.type === 'Loop')
  ) {
    return;
  }

  // 添加按钮工具
  edge.addTools([
    {
      name: 'button',
      args: {
        markup: [
          {
            tagName: 'circle',
            selector: 'button',
            attrs: {
              r: 8,
              stroke: '#5147FF',
              strokeWidth: 1,
              fill: '#5147FF',
              cursor: 'pointer',
            },
          },
          {
            tagName: 'image',
            selector: 'icon',
            attrs: {
              href: PlusIcon,
              width: 10,
              height: 10,
              x: -5,
              y: -5,
              pointerEvents: 'none',
            },
          },
        ],
        distance: '50%', // 按钮位于边中点
        offset: { x: 0, y: 0 },
        onClick({ e }) {
          const source = edge.getSourceCell()?.getData();
          const target = edge.getTargetCell()?.getData();
          const sourcePort = edge.getSourcePortId();

          createNodeAndEdge(graph, e, source, sourcePort, target, edge.id);
          onClickBlank?.();
          graph.cleanSelection();
        },
      },
    },
  ]);
});

graph.on('edge:mouseleave', ({ edge }) => {
  edge.removeTools();
});
```

### 5.3 边选中/取消选中

```typescript
// 边选中 - 改变颜色
graph.on('edge:click', ({ edge }) => {
  edge.attr('line/stroke', '#37D0FF'); // 选中时变蓝色
  onClickBlank?.();
});

// 边取消选中 - 恢复颜色
graph.on('edge:unselected', ({ edge }) => {
  edge.attr('line/stroke', '#5147FF'); // 恢复默认紫色
});

// 边鼠标按下
graph.on('edge:mousedown', () => {
  graph.cleanSelection();
  onClickBlank?.();
});
```

### 5.4 边删除

**文件**: `src/pages/Antv-X6/component/eventHandlers.tsx:77-140`

```typescript
graph.bindKey(['delete', 'backspace'], () => {
  const cells = graph.getSelectedCells();
  if (!cells.length) return false;

  const _cell = cells[0];

  if (_cell.isEdge()) {
    const sourceNode = _cell.getSourceNode()?.getData();
    const targetNode = _cell.getTargetNode()?.getData();
    const _targetNodeId = _cell.getTargetNode()?.id;

    // 1. 检查是否可删除（循环内部边不可删除）
    if (!isEdgeDeletable(sourceNode, targetNode)) {
      message.warning('不能删除循环节点连线');
      return;
    }

    // 2. 处理异常端口边删除
    const isException = _handleExceptionItemEdgeRemove(_cell, (params) => {
      graph.removeCells([_cell]);
      changeNodeConfigWithRefresh({ nodeData: params, targetNodeId });
    });
    if (isException) return;

    // 3. 处理循环节点边删除
    if (sourceNode.type === 'Loop' || targetNode.type === 'Loop') {
      if (
        sourceNode.type === 'Loop' &&
        targetNode.loopNodeId === sourceNode.id
      ) {
        sourceNode.innerStartNodeId = -1;
        changeNodeConfigWithRefresh({ nodeData: sourceNode, targetNodeId });
        graph.removeCells([_cell]);
        return;
      }
      if (
        targetNode.type === 'Loop' &&
        sourceNode.loopNodeId === targetNode.id
      ) {
        targetNode.innerEndNodeId = -1;
        changeNodeConfigWithRefresh({ nodeData: targetNode, targetNodeId });
        graph.removeCells([_cell]);
        return;
      }
    }

    // 4. 处理特殊节点边删除
    if (
      [
        NodeTypeEnum.Condition,
        NodeTypeEnum.IntentRecognition,
        NodeTypeEnum.QA,
      ].includes(sourceNode.type)
    ) {
      handleSpecialNodeEdge(cells);
    } else {
      // 5. 普通边删除
      changeEdgeConfigWithRefresh({
        type: UpdateEdgeType.deleted,
        targetId: _targetNodeId,
        sourceNode,
        id: '0',
      });
    }
  }

  graph.removeCells(cells);
  return false;
});
```

---

## 6. 边样式管理

### 6.1 设置边属性

**文件**: `src/utils/graph.ts:29-38`

```typescript
export function setEdgeAttributes(edge: Edge) {
  edge.attr({
    line: {
      strokeDasharray: '', // 移除虚线
      stroke: '#5147FF', // 设置颜色
      strokeWidth: 1, // 设置宽度
    },
  });
}
```

### 6.2 更新边箭头

**文件**: `src/utils/graph.ts:92-120`

```typescript
const ARROW_CONFIG = {
  name: 'classic',
  size: 6,
  fill: '#5147FF',
  stroke: '#5147FF',
};

export const updateEdgeArrows = (graph: Graph) => {
  // 按目标端口分组边
  const portMap = new Map<string, Edge[]>();

  graph.getEdges().forEach((edge) => {
    const targetNode = edge.getTargetNode();
    const targetPort = edge.getTargetPortId();

    if (targetNode && targetPort) {
      const key = `${targetNode.id}-${targetPort}`;
      const edges = portMap.get(key) || [];
      edges.push(edge);
      portMap.set(key, edges);
    }
  });

  // 只有最后一条边显示箭头
  portMap.forEach((edges) => {
    const sortedEdges = edges.sort((a, b) => a.id.localeCompare(b.id));
    sortedEdges.forEach((edge, index) => {
      const isLast = index === sortedEdges.length - 1;

      // LoopEnd -> * 和 * -> LoopStart 不显示箭头
      const sourceNode = edge.getSourceNode();
      const targetNode = edge.getTargetNode();
      if (
        sourceNode?.getData?.()?.type === 'LoopEnd' ||
        targetNode?.getData?.()?.type === 'LoopStart'
      ) {
        edge.attr('line/targetMarker', null);
        return;
      }

      edge.attr('line/targetMarker', isLast ? ARROW_CONFIG : null);
    });
  });
};
```

### 6.3 边层级管理

```typescript
// 普通边层级
edge.prop('zIndex', 1);

// 循环内部边层级
edge.prop('zIndex', 15);

// 边上创建节点时的临时边层级
edge.prop('zIndex', 25);
```

---

## 7. 边数据流向总结

```
┌─────────────────────────────────────────────────────────────────┐
│                    用户拖拽创建连线                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  validateConnection (画布级)                      │
│   - 空值检查、自连接检查、重复边检查                                │
│   - 端口方向验证、Loop 节点特殊处理                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  edge:connected 事件                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  validateConnect (业务级)                         │
│   - 循环节点内外连接验证                                           │
│   - 重复边检查（含端口）                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
                    ▼         ▼         ▼
            ┌───────────┐ ┌───────┐ ┌───────────┐
            │ 异常端口  │ │ 循环  │ │ 特殊节点  │
            │ 处理      │ │ 节点  │ │ (条件等) │
            └───────────┘ └───────┘ └───────────┘
                    │         │         │
                    └─────────┼─────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  更新节点 nodeConfig / nextNodeIds                │
│                  调用后端 API 同步                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  setEdgeAttributes + updateEdgeArrows            │
│                  设置边样式和箭头                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**导航**: [📚 文档索引](./README.md) | [⬆️ 主文档](../V1-FEATURES.md)

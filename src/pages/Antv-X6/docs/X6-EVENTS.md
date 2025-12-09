# X6 事件处理文档

本文档详细描述 V1 版本工作流编辑器中画布、节点、端口、边的事件处理逻辑。

**导航**: [📚 文档索引](./README.md) | [⬆️ 主文档](../V1-FEATURES.md)

**相关文档**:
- [X6 自定义节点](./X6-CUSTOM-NODES.md) - 节点组件实现
- [连接桩配置](./X6-PORTS.md) - 端口配置和交互
- [X6 连线](./X6-EDGES.md) - 边的事件处理
- [API 数据交互](./API-DATA-INTERACTION.md) - 事件触发的后端同步

---

## 目录

- [1. 画布事件](#1-画布事件)
- [2. 节点事件](#2-节点事件)
- [3. 端口事件](#3-端口事件)
- [4. 边事件](#4-边事件)
- [5. 键盘快捷键](#5-键盘快捷键)
- [6. 插件配置](#6-插件配置)

---

## 1. 画布事件

### 1.1 画布初始化

**文件**: `src/pages/Antv-X6/component/graph.tsx`

```typescript
const graph = new Graph({
  container: graphContainer,
  
  // 网格配置
  grid: {
    visible: true,
    type: 'dot',
    size: 22,
    args: { color: '#606060', thickness: 1 },
  },
  
  // 自动调整大小
  autoResize: true,
  
  // 允许拖拽画布
  panning: true,
  
  // 鼠标滚轮缩放
  mousewheel: {
    enabled: true,
    zoomAtMousePosition: true,
    minScale: 0.2,
    maxScale: 3,
    modifiers: ['ctrl', 'meta'],  // 需要按住 Ctrl/Cmd
  },
  
  // 背景色
  background: { color: '#f2f2f2' },
  
  // 高亮配置
  highlighting: {
    magnetAdsorbed: {
      name: 'stroke',
      args: {
        attrs: {
          fill: '#5147FF',
          stroke: '#5147FF',
        },
      },
    },
  },
  
  // 节点移动控制
  interacting: {
    nodeMovable(view) {
      const node = view.cell;
      const { enableMove } = node.getData();
      return enableMove;
    },
  },
});
```

### 1.2 点击空白区域

**文件**: `graph.tsx:498-505`

```typescript
graph.on('blank:click', () => {
  // 1. 取消所有选中
  const cells = graph.getSelectedCells();
  graph.unselect(cells);
  graph.cleanSelection();
  
  // 2. 关闭右侧抽屉
  onClickBlank?.();
});
```

### 1.3 画布缩放

```typescript
graph.on('scale', ({ sx }) => {
  changeZoom(sx);  // 更新缩放比例状态
});
```

### 1.4 缩放控制

**GraphContainer 方法**:

```typescript
// 设置指定缩放比例
const graphChangeZoom = (val: number) => {
  graphRef.current?.zoomTo(Number(val));
};

// 缩放适配（显示全部内容）
const graphChangeZoomToFit = () => {
  graphRef.current?.zoomToFit({
    padding: {
      top: 128 + 18,
      left: 18,
      right: 18,
      bottom: 18,
    },
    maxScale: 1,
    minScale: 0.2,
    preserveAspectRatio: true,
    useCellGeometry: true,
  });
};
```

---

## 2. 节点事件

### 2.1 节点鼠标进入/离开

**文件**: `graph.tsx:357-393`

```typescript
// 鼠标进入节点 - 放大端口
graph.on('node:mouseenter', ({ node }) => {
  const currentPorts = node.getPorts();
  const portStatusList = { in: 'active', out: 'active' };
  
  // LoopStart 的 in 端口保持 normal
  if (node.getData()?.type === 'LoopStart') {
    portStatusList.in = 'normal';
  }
  // LoopEnd 的 out 端口保持 normal
  if (node.getData()?.type === 'LoopEnd') {
    portStatusList.out = 'normal';
  }
  
  // 更新端口样式
  const updatedPorts = currentPorts.map((port) => {
    return handlePortConfig(
      port,
      portStatusList[port.group || 'in'],
      port.attrs?.circle?.fill
    );
  });
  node.prop('ports/items', updatedPorts);
});

// 鼠标离开节点 - 缩小端口
graph.on('node:mouseleave', ({ node }) => {
  const ports = node.getPorts();
  const updatedPorts = ports.map((port) =>
    handlePortConfig(port, 'normal', port.attrs?.circle?.fill)
  );
  node.prop('ports/items', updatedPorts);
});
```

**端口配置处理函数**:

```typescript
const handlePortConfig = (
  port: PortConfig,
  portStatus: 'normal' | 'active' = 'active',
  color?: string,
): PortConfig => {
  const baseConfig = {
    ...port,
    attrs: {
      ...port.attrs,
      circle: {
        ...port.attrs?.circle,
        stroke: color || '#5147FF',
        fill: color || '#5147FF',
      },
    },
  };
  
  return {
    normal: {
      ...baseConfig,
      attrs: {
        ...baseConfig.attrs,
        circle: { ...baseConfig.attrs.circle, r: 3 },  // 小圆点
        icon: { width: 0, height: 0, opacity: 0 },     // 隐藏图标
      },
    },
    active: {
      ...baseConfig,
      attrs: {
        ...baseConfig.attrs,
        circle: { ...baseConfig.attrs.circle, r: 8 },  // 大圆点
        icon: { width: 10, height: 10, x: -5, y: -5, opacity: 1 },  // 显示图标
      },
    },
  }[portStatus];
};
```

### 2.2 节点选中

**文件**: `graph.tsx:519-535`

```typescript
graph.on('node:selected', ({ node }) => {
  // 1. 更新层级
  changeZIndex(node);
  
  const data = node.getData();
  
  // 2. 如果是聚焦状态（通过 runResult 聚焦），不打开属性面板
  if (data.isFocus) {
    return;
  }
  
  // 3. 打开右侧属性面板
  const newData = { ...data, id: node.id };
  changeDrawer(newData);
});
```

### 2.3 节点鼠标按下

**文件**: `graph.tsx:540-552`

```typescript
graph.on('node:mousedown', ({ node }) => {
  const data = node.getData();
  
  // 如果之前是聚焦状态，需要重新打开属性面板
  if (data.isFocus) {
    node.updateData({ isFocus: false });
    graph.cleanSelection();
    graph.select(node);
    return;
  }
});
```

### 2.4 节点移动

**文件**: `graph.tsx:439-497`

```typescript
graph.on('node:moved', ({ node, e }) => {
  e.stopPropagation();
  
  const { x, y } = node.getPosition();
  const data = node.getData();
  
  // 1. 更新节点位置到 extension
  data.nodeConfig.extension = {
    ...data.nodeConfig.extension,
    x, y,
  };
  
  // 2. 处理循环内部节点
  if (data.loopNodeId) {
    const parentNode = graph.getCellById(data.loopNodeId);
    const _position = parentNode.getPosition();
    const _size = parentNode.getSize();
    
    // 更新子节点位置
    const children = parentNode.getChildren();
    children?.forEach((item) => {
      if (item.isNode()) {
        const childData = item.getData();
        if (childData.id === data.id) {
          childData.nodeConfig.extension = { x, y };
          changeCondition({ nodeData: childData, update: NodeUpdateEnum.moved });
        }
      }
    });
    
    // 更新父节点尺寸和位置
    const parent = parentNode.getData();
    parent.nodeConfig.extension = {
      width: _size.width,
      height: _size.height,
      x: _position.x,
      y: _position.y,
    };
    parent.innerNodes = children?.filter(i => i.isNode()).map(i => i.getData());
    changeCondition({ nodeData: parent, update: NodeUpdateEnum.moved });
    return;
  }
  
  // 3. 处理循环节点本身
  if (data.type === NodeTypeEnum.Loop) {
    const children = node.getChildren();
    const innerNodes = data.innerNodes || [];
    
    // 同步更新所有子节点位置
    children?.forEach((item) => {
      if (item.isNode()) {
        const position = item.getPosition();
        const childData = item.getData();
        childData.nodeConfig.extension = { x: position.x, y: position.y };
        
        // 更新 innerNodes 列表
        const index = innerNodes.findIndex(n => n.id === childData.id);
        if (index === -1) {
          innerNodes.push(childData);
        } else {
          innerNodes[index] = childData;
        }
      }
    });
    
    data.innerNodes = innerNodes;
    const _size = node.getSize();
    data.nodeConfig.extension = {
      x, y,
      width: _size.width,
      height: _size.height,
    };
    changeCondition({ nodeData: data, update: NodeUpdateEnum.moved });
    return;
  }
  
  // 4. 普通节点
  changeCondition({ nodeData: data, update: NodeUpdateEnum.moved });
  changeZIndex(node);
});
```

### 2.5 节点位置变化

**文件**: `graph.tsx:615-640`

```typescript
graph.on('node:change:position', ({ node }) => {
  // 非 Loop 节点置顶
  if (node.getData().type !== 'Loop') {
    node.toFront();
  }
  
  // 调整父节点尺寸
  let parentNode = node.getParent();
  const data = node.getData();
  
  if (!parentNode && data.loopNodeId) {
    const cell = graph.getCellById(data.loopNodeId);
    if (cell?.isNode()) {
      parentNode = cell;
      adjustParentSize(parentNode);
    }
  }
  
  if (parentNode?.isNode() && parentNode.getData()?.type === 'Loop') {
    adjustParentSize(parentNode);
  }
});
```

### 2.6 节点尺寸变化

```typescript
graph.on('node:change:size', ({ node }) => {
  const children = node.getChildren();
  if (children?.length) {
    node.prop('originSize', node.getSize());
  }
});
```

### 2.7 节点单击/双击

**文件**: `src/utils/graph.ts` - `registerNodeClickAndDblclick`

```typescript
export const registerNodeClickAndDblclick = ({
  graph,
  changeZIndex,
}) => {
  // 单击
  graph.on('node:click', ({ node }) => {
    setTimeout(() => {
      // 如果是双击触发的，跳过
      if (node.prop('__click_type__') === 'dblclick') {
        node.prop('__click_type__', null);
        return;
      }
      
      // 如果不是最高层级，更新层级
      if (!isHighestNodeZIndex(node)) {
        changeZIndex(node);
      }
    }, 0);
  });
  
  // 双击
  graph.on('node:dblclick', ({ node, e: { target } }) => {
    const isHighest = isHighestNodeZIndex(node);
    
    // 查找可编辑标题元素
    const editableTitleEl = findElementClassName(target, 'node-editable-title-text');
    if (!editableTitleEl) return;
    
    if (!isHighest) {
      // 先提升层级，再触发编辑
      node.prop('__click_type__', 'dblclick');
      changeZIndex(node);
      setTimeout(() => {
        if (!node.prop('__click_flag__')) {
          node.prop('__click_flag__', true);
          graph.trigger('node:dblclick', {
            node,
            e: { target: document.querySelector(`[data-id="${node.getData().id}"]`) },
          });
        }
      }, 0);
    } else {
      // 直接触发标题编辑
      node.prop('__click_type__', null);
      node.prop('__click_flag__', null);
      editableTitleEl.dispatchEvent(new Event('onEditTitle'));
    }
  });
};
```

### 2.8 节点数据变化

```typescript
graph.on('node:change:data', (...args) => {
  console.log('node:change:data', args);
});

// 自定义保存事件
graph.on('node:custom:save', ({ data, payload }) => {
  onSaveNode(data, payload);
});
```

### 2.9 节点层级管理

**文件**: `graph.tsx:282-316`

```typescript
const changeZIndex = (node?: Node) => {
  const nodes = graph.getNodes();
  
  // 1. 重置所有节点层级
  nodes.forEach((n) => {
    n.prop('zIndex', 4);
  });
  
  // 2. Loop 节点设置为 5，其子节点设置为 8
  const loopNodes = nodes.filter((item) => item.getData().type === 'Loop');
  loopNodes.forEach((loopNode) => {
    loopNode.prop('zIndex', 5);
    loopNode.getChildren()?.forEach((child) => {
      child.prop('zIndex', 8);
    });
  });
  
  // 3. 选中节点特殊处理
  if (node) {
    const data = node.getData();
    if (data.type === 'Loop') {
      // Loop 节点选中：内部边 15，子节点 20，自身 10
      node.getChildren()?.forEach((child) => {
        child.prop('zIndex', child.isEdge() ? 15 : 20);
      });
      node.prop('zIndex', 10);
    } else {
      // 普通节点选中：层级 99
      node.prop('zIndex', 99);
    }
  }
};
```

---

## 3. 端口事件

### 3.1 端口点击

**文件**: `graph.tsx:395-414`

```typescript
graph.on('node:port:click', ({ node, port, e }) => {
  const isLoopNode = node.getData()?.loopNodeId;
  
  if (isLoopNode) {
    const isIn = port?.includes('in');
    const parentNode = node.getParent()?.getData();
    
    // 检查是否是循环的开始/结束节点
    const isStartNode = node.getData()?.id === parentNode.innerStartNodeId;
    const isEndNode = node.getData()?.id === parentNode.innerEndNodeId;
    
    // 开始节点的 in 端口和结束节点的 out 端口不能快捷添加
    if ((isStartNode && isIn) || (isEndNode && !isIn)) {
      message.warning('循环节点的开始和结束节点不能快捷添加其他节点');
      return;
    }
  }
  
  // 创建节点选择弹窗
  createNodeAndEdge(graph, e, node.getData(), port);
  
  // 选中当前节点
  graph.select(node);
});
```

### 3.2 端口尺寸重置

```typescript
const changePortSize = () => {
  graph.getNodes().forEach((node) => {
    const ports = node.getPorts();
    const updatedPorts = ports.map((p) => ({
      ...p,
      attrs: {
        ...p.attrs,
        circle: { r: 3 },           // 重置为小圆点
        pointerEvents: 'all',
        event: 'mouseenter',
      },
    }));
    node.prop('ports/items', updatedPorts);
  });
};
```

---

## 4. 边事件

### 4.1 边鼠标进入

**文件**: `graph.tsx:417-437`

```typescript
graph.on('edge:mouseenter', ({ edge }) => {
  const sourceNode = edge.getSourceCell()?.getData();
  const targetNode = edge.getTargetCell()?.getData();
  
  // 跳过循环内部边
  if ((sourceNode.type === 'Loop' && targetNode.loopNodeId) ||
      (sourceNode.loopNodeId && targetNode?.type === 'Loop')) {
    return;
  }
  
  // 添加边中点按钮
  edge.addTools([{
    name: 'button',
    args: {
      markup: [
        { tagName: 'circle', attrs: { r: 8, fill: '#5147FF', ... } },
        { tagName: 'image', attrs: { href: PlusIcon, ... } },
      ],
      distance: '50%',
      onClick({ e }) {
        // 创建节点并连线
        createNodeAndEdge(graph, e, source, sourcePort, target, edge.id);
        onClickBlank?.();
        graph.cleanSelection();
      },
    },
  }]);
});
```

### 4.2 边鼠标离开

```typescript
graph.on('edge:mouseleave', ({ edge }) => {
  edge.removeTools();  // 移除按钮工具
});
```

### 4.3 边点击

```typescript
graph.on('edge:click', ({ edge }) => {
  edge.attr('line/stroke', '#37D0FF');  // 选中时变蓝色
  onClickBlank?.();  // 关闭属性面板
});
```

### 4.4 边取消选中

```typescript
graph.on('edge:unselected', ({ edge }) => {
  edge.attr('line/stroke', '#5147FF');  // 恢复紫色
});
```

### 4.5 边鼠标按下

```typescript
graph.on('edge:mousedown', () => {
  graph.cleanSelection();
  onClickBlank?.();
});
```

### 4.6 边移除

```typescript
graph.on('edge:removed', () => {
  changePortSize();        // 重置端口尺寸
  updateEdgeArrows(graph); // 更新箭头显示
});
```

### 4.7 边连接完成

**详见 [X6-EDGES.md](./X6-EDGES.md) 第 5.1 节**

---

## 5. 键盘快捷键

### 5.1 快捷键绑定

**文件**: `src/pages/Antv-X6/component/eventHandlers.tsx`

```typescript
const bindEventHandlers = ({
  graph,
  changeEdgeConfigWithRefresh,
  copyNode,
  changeNodeConfigWithRefresh,
  removeNode,
  modal,
  message,
}: BindEventHandlers) => {
  
  // 复制: Ctrl/Cmd + C
  graph.bindKey(['meta+c', 'ctrl+c'], () => {
    const cells = graph.getSelectedCells();
    if (cells.length) {
      graph.copy(cells);
    }
    return false;
  });
  
  // 粘贴: Ctrl/Cmd + V
  graph.bindKey(['meta+v', 'ctrl+v'], () => {
    if (!graph.isClipboardEmpty()) {
      const cells = graph.getSelectedCells();
      if (cells?.length > 0) {
        const node = cells[0].getData();
        
        // 禁止粘贴的节点类型
        const forbiddenTypes = [
          NodeTypeEnum.LoopStart,
          NodeTypeEnum.LoopEnd,
          NodeTypeEnum.Loop,
          NodeTypeEnum.Start,
          NodeTypeEnum.End,
        ];
        
        if (forbiddenTypes.includes(node.type)) {
          message.error(`不能粘贴${node.type === NodeTypeEnum.Start ? '开始' : 
                         node.type === NodeTypeEnum.End ? '结束' : '循环'}节点`);
          return;
        }
        
        copyNode(node);
      }
      graph.cleanSelection();
    }
    return false;
  });
  
  // 删除: Delete / Backspace
  graph.bindKey(['delete', 'backspace'], () => {
    const cells = graph.getSelectedCells();
    if (!cells.length) return false;
    
    const _cell = cells[0];
    
    if (_cell.isEdge()) {
      // 删除边 - 详见 eventHandlers.tsx
      handleEdgeDeletion(_cell, ...);
    } else {
      // 删除节点
      const nodeData = _cell.getData();
      
      // 禁止删除的节点类型
      if (isResistNodeType.includes(nodeData.type)) {
        message.warning('不能删除开始节点和结束节点');
        return;
      }
      
      // 循环节点删除确认
      if (nodeData.loopNodeId || nodeData.type === NodeTypeEnum.Loop) {
        if (nodeData.type === NodeTypeEnum.Loop) {
          modal.confirm({
            title: '确定要删除循环节点吗？',
            okText: '确认',
            cancelText: '取消',
            onOk: () => {
              removeNode(_cell.id, nodeData);
              graph.removeCells(cells);
            },
          });
          return;
        }
        removeNode(_cell.id, nodeData);
      } else {
        removeNode(_cell.id);
      }
    }
    
    graph.removeCells(cells);
    return false;
  });
  
  // 返回清理函数
  return () => {
    // 清理工作
  };
};
```

### 5.2 不可删除的节点类型

```typescript
const isResistNodeType = [
  NodeTypeEnum.Start,      // 开始节点
  NodeTypeEnum.End,        // 结束节点
  NodeTypeEnum.LoopStart,  // 循环开始节点
  NodeTypeEnum.LoopEnd,    // 循环结束节点
];
```

---

## 6. 插件配置

### 6.1 使用的插件

**文件**: `graph.tsx:318-330`

```typescript
graph
  .use(new Snapline())    // 对齐辅助线
  .use(new Keyboard())    // 键盘快捷键
  .use(new Clipboard())   // 剪贴板（复制/粘贴）
  .use(new History())     // 历史记录（撤销/重做）
  .use(new Selection())   // 节点选择
```

### 6.2 Snapline 插件

自动对齐辅助线，当拖拽节点接近其他节点的边缘或中心时显示对齐线。

### 6.3 Keyboard 插件

提供快捷键绑定能力，支持 `graph.bindKey()` 方法。

### 6.4 Clipboard 插件

提供剪贴板功能：
- `graph.copy(cells)` - 复制单元格
- `graph.isClipboardEmpty()` - 检查剪贴板是否为空
- `graph.paste()` - 粘贴

### 6.5 History 插件

提供撤销/重做功能：
- `graph.canUndo()` - 是否可撤销
- `graph.undo()` - 撤销
- `graph.canRedo()` - 是否可重做
- `graph.redo()` - 重做

**注意**: V1 版本中撤销功能被注释掉了：

```typescript
// graph.bindKey(['meta+z', 'ctrl+z'], () => {
//   if (graph.canUndo()) {
//     graph.undo();
//   }
//   return false;
// });
```

### 6.6 Selection 插件

提供节点选择功能：
- `graph.select(node)` - 选中节点
- `graph.unselect(cells)` - 取消选中
- `graph.getSelectedCells()` - 获取选中的单元格
- `graph.cleanSelection()` - 清除选择

---

## 7. 事件流向图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户交互                                   │
│   (点击、拖拽、键盘输入、滚轮缩放)                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ┌───────────┐       ┌───────────┐       ┌───────────┐
    │  画布事件  │       │  节点事件  │       │  边事件   │
    │ blank:*   │       │ node:*    │       │ edge:*    │
    │ scale     │       │ port:*    │       │           │
    └───────────┘       └───────────┘       └───────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    graph.tsx 事件处理                            │
│   - 更新 UI 状态（端口样式、层级、选中状态）                        │
│   - 调用业务回调（changeDrawer, changeCondition 等）               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   index.tsx 业务逻辑                             │
│   - 调用 API 同步后端                                             │
│   - 更新 React 状态                                               │
│   - 管理抽屉/弹窗等 UI                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. 关键回调函数

| 回调函数 | 触发时机 | 作用 |
|---------|---------|------|
| `changeDrawer` | 节点选中 | 打开/更新右侧属性面板 |
| `changeCondition` | 节点属性/位置变化 | 更新节点配置并同步后端 |
| `changeEdgeConfigWithRefresh` | 边创建/删除 | 更新连线并同步后端 |
| `changeNodeConfigWithRefresh` | 特殊节点连线 | 更新节点配置并刷新 |
| `changeZoom` | 画布缩放 | 更新缩放比例状态 |
| `createNodeByPortOrEdge` | 端口/边上创建节点 | 创建新节点并连线 |
| `onSaveNode` | 节点保存 | 保存节点名称等属性 |
| `onClickBlank` | 点击空白/边 | 关闭属性面板 |
| `copyNode` | 粘贴节点 | 复制节点 |
| `removeNode` | 删除节点 | 删除节点并同步后端 |

---

**导航**: [📚 文档索引](./README.md) | [⬆️ 主文档](../V1-FEATURES.md)

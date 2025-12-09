# X6 连接桩 (Ports) 实现文档

> 本文档详细描述了 V1 版本中 AntV X6 连接桩的配置和实现方式。

**导航**: [📚 文档索引](./README.md) | [⬆️ 主文档](../V1-FEATURES.md)

**相关文档**:
- [X6 自定义节点](./X6-CUSTOM-NODES.md) - 节点的视觉渲染实现
- [X6 连线](./X6-EDGES.md) - 连接桩之间的连线逻辑
- [事件处理](./X6-EVENTS.md) - 端口相关的事件处理

---

## 目录

- [连接桩概述](#连接桩概述)
- [连接桩组配置](#连接桩组配置)
- [连接桩生成](#连接桩生成)
- [特殊节点连接桩](#特殊节点连接桩)
- [异常处理连接桩](#异常处理连接桩)
- [连接桩交互](#连接桩交互)

---

## 连接桩概述

### 连接桩组类型

```typescript
enum PortGroupEnum {
  in = 'in',           // 输入端口（左侧）
  out = 'out',         // 输出端口（右侧）
  special = 'special', // 特殊端口（条件分支等）
  exception = 'exception', // 异常处理端口
}
```

### 连接桩配置接口

```typescript
interface outputOrInputPortConfig {
  id: string;              // 端口唯一标识
  group: PortGroupEnum;    // 端口组
  zIndex: number;          // 层级
  magnet: boolean;         // 是否为磁吸点
  markup: Markup[];        // DOM 结构
  attrs: {
    circle: object;        // 圆形样式
    icon: object;          // 图标样式
    hoverCircle: object;   // 悬停区域样式
  };
  args: {
    x: number;             // X 坐标
    y: number;             // Y 坐标
    offsetY: number;       // Y 偏移
    offsetX: number;       // X 偏移
  };
}

interface PortsConfig {
  groups: object;                    // 端口组配置
  items: outputOrInputPortConfig[];  // 端口项数组
}
```

---

## 连接桩组配置

**文件位置**: `src/utils/graph.ts`

### 生成端口组配置

```typescript
export const generatePortGroupConfig = (basePortSize: number, data: ChildNode) => {
  const fixedPortNode = [
    NodeTypeEnum.Loop,
    NodeTypeEnum.LoopStart,
    NodeTypeEnum.LoopEnd,
    NodeTypeEnum.Start,
    NodeTypeEnum.End,
  ].includes(data.type);
  
  const magnetRadius = 50;
  const isLoopNode = data.type === NodeTypeEnum.Loop;
  
  return {
    // 输入端口组
    in: {
      position: 'left',
      attrs: {
        circle: { r: basePortSize, magnet: true, magnetRadius },
      },
      connectable: {
        source: isLoopNode,  // Loop 节点的 in 端口允许作为 source
        target: true,        // 非 Loop 节点的 in 端口只能作为 target
      },
    },
    
    // 输出端口组
    out: {
      position: {
        name: fixedPortNode ? 'right' : 'absolute',
      },
      attrs: { 
        circle: { r: basePortSize, magnet: true, magnetRadius } 
      },
      connectable: {
        source: true,
        target: isLoopNode,
      },
    },
    
    // 特殊端口组（条件分支等）
    special: {
      position: { name: 'absolute' },
      attrs: { 
        circle: { r: basePortSize, magnet: true, magnetRadius } 
      },
      connectable: {
        source: true,
        target: isLoopNode,
      },
    },
    
    // 异常处理端口组
    exception: {
      position: { name: 'absolute' },
      attrs: { 
        circle: { r: basePortSize, magnet: true, magnetRadius } 
      },
      connectable: {
        source: true,
        target: isLoopNode,
      },
    },
  };
};
```

---

## 连接桩生成

**文件位置**: `src/utils/workflow.tsx`

### 核心生成函数

```typescript
export const generatePorts = (data: ChildNode): PortsConfig => {
  const basePortSize = 3;
  const defaultNodeHeaderHeight = DEFAULT_NODE_CONFIG_MAP.default.defaultHeight;
  const defaultNodeHeaderWidth = getWidthAndHeight(data).width;
  
  // 端口配置生成器
  const generatePortConfig = ({
    group,
    idSuffix,
    color = PORT_COLOR,
    yHeight = (defaultNodeHeaderHeight - 1) / 2 + 1,
    xWidth = idSuffix === 'in' ? 0 : defaultNodeHeaderWidth,
    offsetY = defaultNodeHeaderHeight - NODE_BOTTOM_PADDING_AND_BORDER,
    offsetX = xWidth,
  }: PortConfig): outputOrInputPortConfig => {
    return {
      group,
      markup: [
        {
          tagName: 'circle',
          selector: 'circle',
          attrs: { magnet: true, pointerEvents: 'auto' },
        },
        {
          tagName: 'image',
          selector: 'icon',
          attrs: { magnet: false },
        },
        {
          tagName: 'circle',
          selector: 'hoverCircle',
          attrs: {
            r: basePortSize + 10,
            opacity: 0,
            pointerEvents: 'visiblePainted',
            zIndex: -1,
            magnet: false,
          },
        },
      ],
      id: `${data.id}-${idSuffix}`,
      zIndex: 99,
      magnet: true,
      attrs: {
        circle: {
          r: basePortSize,
          magnet: true,
          stroke: color,
          fill: color,
          magnetRadius: 30,
          zIndex: 2,
        },
        icon: {
          xlinkHref: PlusIcon,
          magnet: false,
          width: 0,
          height: 0,
          fill: '#fff',
          zIndex: -2,
          pointerEvents: 'none',
          opacity: 0,
        },
      },
      args: {
        x: xWidth,
        y: yHeight,
        offsetY,
        offsetX,
      },
    };
  };

  let inputPorts = [];
  let outputPorts = [];
  
  // 根据节点类型生成不同的端口配置
  switch (data.type) {
    case NodeTypeEnum.Start:
      inputPorts = [];
      outputPorts = [generatePortConfig({ group: PortGroupEnum.out, idSuffix: 'out' })];
      break;
      
    case NodeTypeEnum.End:
      inputPorts = [generatePortConfig({ group: PortGroupEnum.in, idSuffix: 'in' })];
      outputPorts = [];
      break;
      
    // ... 其他节点类型
    
    default:
      inputPorts = [generatePortConfig({ group: PortGroupEnum.in, idSuffix: 'in' })];
      outputPorts = [generatePortConfig({ group: PortGroupEnum.out, idSuffix: 'out' })];
      break;
  }
  
  // 处理异常输出端口
  outputPorts = _handleExceptionOutputPort(data, outputPorts, generatePortConfig);
  
  return {
    groups: generatePortGroupConfig(basePortSize, data),
    items: [...inputPorts, ...outputPorts],
  };
};
```

---

## 特殊节点连接桩

### 条件分支节点 (Condition)

每个条件分支对应一个输出端口：

```typescript
case NodeTypeEnum.Condition:
case NodeTypeEnum.IntentRecognition: {
  const configs = data.nodeConfig?.conditionBranchConfigs || 
                  data.nodeConfig.intentConfigs || [];
  const baseY = defaultNodeHeaderHeight;
  const itemHeight = data.type === NodeTypeEnum.Condition ? 32 : 24;
  const step = data.type === NodeTypeEnum.Condition ? 16 : 12;
  
  inputPorts = [
    generatePortConfig({ group: PortGroupEnum.in, idSuffix: 'in' }),
  ];
  
  outputPorts = configs.map((item, index) => ({
    ...generatePortConfig({
      group: PortGroupEnum.special,
      idSuffix: `${item.uuid || index}-out`,
      yHeight: baseY + (index + 1) * itemHeight - step,
      xWidth: getWidthAndHeight(data).width,
      offsetY: baseY + (index + 1) * itemHeight,
    }),
  }));
  break;
}
```

### 问答节点 (QA)

根据回答类型生成不同的端口：

```typescript
case NodeTypeEnum.QA: {
  const type = data.nodeConfig.answerType;
  const configs = data.nodeConfig?.options;
  const itemHeight = 24;
  const step = 12;
  let baseY = defaultNodeHeaderHeight;
  
  if (type === AnswerTypeEnum.SELECT) {
    // 选项回答模式：每个选项一个端口
    baseY += itemHeight * 3;
    outputPorts = (configs || []).map((item, index) => ({
      ...generatePortConfig({
        group: PortGroupEnum.special,
        idSuffix: `${item.uuid || index}-out`,
        yHeight: baseY + (index + 1) * itemHeight - step,
        xWidth: getWidthAndHeight(data).width,
        offsetY: baseY + (index + 1) * itemHeight,
      }),
    }));
  } else {
    // 直接回答模式：单个输出端口
    baseY += itemHeight * 2;
    outputPorts = [
      generatePortConfig({
        group: PortGroupEnum.out,
        idSuffix: 'out',
        yHeight: baseY + itemHeight - step,
        xWidth: getWidthAndHeight(data).width,
        offsetY: baseY + itemHeight,
      }),
    ];
  }
  break;
}
```

### 循环节点 (Loop)

循环节点的 in/out 端口可以双向连接：

```typescript
// Loop 节点的端口配置
connectable: {
  source: isLoopNode,  // Loop 的 in 端口可作为 source
  target: true,
}

// 循环内部连线
// Loop -> LoopStart: Loop 的 in 端口连接到 LoopStart 的 in 端口
// LoopEnd -> Loop: LoopEnd 的 out 端口连接到 Loop 的 out 端口
```

---

## 异常处理连接桩

### 异常端口判断

```typescript
export const showExceptionHandle = (node: ChildNode): boolean => {
  return EXCEPTION_NODES_TYPE.includes(node.type);
};

export const showExceptionPort = (
  node: ChildNode,
  protGroup: PortGroupEnum | string,
): boolean => {
  return (
    showExceptionHandle(node) &&
    node.nodeConfig?.exceptionHandleConfig?.exceptionHandleType === 
      ExceptionHandleTypeEnum.EXECUTE_EXCEPTION_FLOW &&
    protGroup === PortGroupEnum.exception
  );
};
```

### 异常端口生成

```typescript
const EXCEPTION_PORT_COLOR = '#e67e22';

const _handleExceptionOutputPort = (
  data: ChildNode,
  outputPorts: outputOrInputPortConfig[],
  generatePortConfig: Function,
): outputOrInputPortConfig[] => {
  const xWidth = getWidthAndHeight(data).width;
  const baseY = outputPorts[outputPorts.length - 1]?.args?.offsetY;
  const itemHeight = 24;
  
  if (showExceptionPort(data, PortGroupEnum.exception)) {
    // 添加异常端口
    return [
      ...outputPorts,
      generatePortConfig({
        group: PortGroupEnum.exception,
        idSuffix: `exception-out`,
        yHeight: baseY + NODE_BOTTOM_PADDING + itemHeight / 2,
        offsetY: baseY + itemHeight + NODE_BOTTOM_PADDING_AND_BORDER,
        xWidth,
        color: EXCEPTION_PORT_COLOR,
      }),
    ];
  } else if (showExceptionHandle(data) && outputPorts.length >= 1) {
    // 调整现有端口位置以容纳异常处理项
    outputPorts[outputPorts.length - 1].args.offsetY = 
      baseY + itemHeight + NODE_BOTTOM_PADDING_AND_BORDER;
    return outputPorts;
  }
  
  return outputPorts;
};
```

---

## 连接桩交互

**文件位置**: `src/pages/Antv-X6/component/graph.tsx`

### 鼠标进入节点

```typescript
graph.on('node:mouseenter', ({ node }) => {
  const currentPorts = node.getPorts();
  const portStatusList: Record<string, PortStatus> = {
    in: 'active',
    out: 'active',
  };
  
  // LoopStart 节点的 in 端口保持正常状态
  if (node.getData()?.type === 'LoopStart') {
    portStatusList.in = 'normal';
  }
  // LoopEnd 节点的 out 端口保持正常状态
  if (node.getData()?.type === 'LoopEnd') {
    portStatusList.out = 'normal';
  }
  
  // 更新端口样式
  const updatedPorts = currentPorts.map((port) => {
    return handlePortConfig(
      port as PortConfig,
      portStatusList[port.group || 'in'],
      port.attrs?.circle?.fill as string,
    );
  });
  node.prop('ports/items', updatedPorts);
});
```

### 端口样式切换

```typescript
const handlePortConfig = (
  port: PortConfig,
  portStatus: PortStatus = 'active',
  color?: string,
): PortConfig => {
  const baseConfig = {
    ...port,
    attrs: {
      ...port.attrs,
      circle: {
        ...(port.attrs?.circle || {}),
        stroke: color || '#5147FF',
        fill: color || '#5147FF',
      },
    },
  };

  const configs = {
    normal: {
      ...baseConfig,
      attrs: {
        ...baseConfig.attrs,
        circle: { ...baseConfig.attrs.circle, r: 3 },
        icon: { width: 0, height: 0, opacity: 0 },
        hoverCircle: { pointerEvents: 'visiblePainted' },
      },
    },
    active: {
      ...baseConfig,
      attrs: {
        ...baseConfig.attrs,
        circle: { ...baseConfig.attrs.circle, r: 8 },
        icon: { width: 10, height: 10, x: -5, y: -5, opacity: 1 },
        hoverCircle: { pointerEvents: 'none' },
      },
    },
  };

  return configs[portStatus];
};
```

### 端口点击事件

```typescript
graph.on('node:port:click', ({ node, port, e }) => {
  const isLoopNode = node.getData()?.loopNodeId;
  
  if (isLoopNode) {
    const isIn = port?.includes('in');
    const parentNode = node.getParent()?.getData();
    const isStartNode = node.getData()?.id === parentNode.innerStartNodeId;
    const isEndNode = node.getData()?.id === parentNode.innerEndNodeId;

    // 循环节点的开始和结束节点不能快捷添加其他节点
    if ((isStartNode && isIn) || (isEndNode && !isIn)) {
      message.warning('循环节点的开始和结束节点不能快捷添加其他节点');
      return;
    }
  }
  
  // 弹出节点选择菜单
  createNodeAndEdge(graph, e, node.getData(), port as string);
  graph.select(node);
});
```

### 鼠标离开节点

```typescript
graph.on('node:mouseleave', ({ node }) => {
  const ports = node.getPorts();
  const updatedPorts = ports.map((port) =>
    handlePortConfig(port as PortConfig, 'normal', port.attrs?.circle?.fill as string),
  );
  node.prop('ports/items', updatedPorts);
});
```

---

## 端口 ID 命名规范

| 端口类型 | ID 格式 | 示例 |
|---------|---------|------|
| 输入端口 | `{nodeId}-in` | `123-in` |
| 输出端口 | `{nodeId}-out` | `123-out` |
| 条件分支端口 | `{nodeId}-{uuid}-out` | `123-abc-def-out` |
| 异常处理端口 | `{nodeId}-exception-out` | `123-exception-out` |

---

## 相关文件索引

| 文件路径 | 说明 |
|---------|------|
| `src/utils/workflow.tsx` | 端口生成核心逻辑 |
| `src/utils/graph.ts` | 端口组配置和验证逻辑 |
| `src/pages/Antv-X6/component/graph.tsx` | 端口交互事件处理 |
| `src/types/interfaces/node.ts` | 端口类型定义 |
| `src/types/enums/node.ts` | 端口组枚举定义 |

---

**导航**: [📚 文档索引](./README.md) | [⬆️ 主文档](../V1-FEATURES.md)

*文档生成时间: 2024-12*
*用于 V2 重构参照*

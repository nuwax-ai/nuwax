# X6 自定义节点实现文档

> 本文档详细描述了 V1 版本中 AntV X6 自定义节点的实现方式。

**导航**: [📚 文档索引](./README.md) | [⬆️ 主文档](../V1-FEATURES.md)

**相关文档**:
- [节点数据结构](./NODE-DATA-STRUCTURES.md) - 节点的数据模型定义
- [连接桩配置](./X6-PORTS.md) - 节点端口的配置和交互
- [事件处理](./X6-EVENTS.md) - 节点相关的事件处理

---

## 目录

- [节点类型概述](#节点类型概述)
- [节点注册](#节点注册)
- [GeneralNode 通用节点](#generalnode-通用节点)
- [LoopNode 循环节点](#loopnode-循环节点)
- [特殊节点渲染](#特殊节点渲染)
- [节点样式配置](#节点样式配置)
- [节点尺寸计算](#节点尺寸计算)

---

## 节点类型概述

V1 版本使用 `@antv/x6-react-shape` 实现 React 组件作为自定义节点。共定义了两种节点形状：

| 形状枚举 | 说明 | 使用场景 |
|---------|------|---------|
| `NodeShapeEnum.General` | 通用节点 | 大部分节点类型 |
| `NodeShapeEnum.Loop` | 循环节点 | Loop 类型节点（支持嵌套子节点） |

```typescript
enum NodeShapeEnum {
  General = 'general-Node',
  Loop = 'loop-node',
}
```

---

## 节点注册

**文件位置**: `src/pages/Antv-X6/component/registerCustomNodes.tsx`

### 注册函数

```typescript
import { register } from '@antv/x6-react-shape';

export function registerCustomNodes() {
  // 注册通用节点
  register({
    shape: NodeShapeEnum.General,
    component: GeneralNode,
  });
  
  // 注册循环节点（支持调整大小和拖拽）
  register({
    shape: NodeShapeEnum.Loop,
    component: LoopNode,
    resizable: true,
    draggable: true,
  });
}
```

### 注册时机

在 `GraphContainer` 组件初始化时调用：

```typescript
// graphContainer.tsx
const GraphContainer = forwardRef((props, ref) => {
  registerCustomNodes(); // 注册自定义节点
  // ...
});
```

---

## GeneralNode 通用节点

### 组件结构

```tsx
export const GeneralNode: React.FC<NodeProps> = (props) => {
  const { node, graph } = props;
  const data = node.getData<ChildNode>();
  
  return (
    <>
      <div className={`general-node ${selected ? 'selected-general-node' : ''}`}>
        {/* 节点头部 */}
        <div className="general-node-header" style={{ background: gradientBackground }}>
          <div className="general-node-header-image">
            {returnImg(data.type)}
          </div>
          <EditableTitle
            value={editValue}
            onSave={handleSave}
            disabled={canNotEditNode}
          />
        </div>
        
        {/* 条件分支节点内容 */}
        {data.type === NodeTypeEnum.Condition && <ConditionNode data={data} />}
        
        {/* 问答节点内容 */}
        {data.type === NodeTypeEnum.QA && <QANode data={data} />}
        
        {/* 意图识别节点内容 */}
        {data.type === NodeTypeEnum.IntentRecognition && <IntentRecognitionNode data={data} />}
        
        {/* 异常处理展示 */}
        {showException && <ExceptionHandle data={data.nodeConfig.exceptionHandleConfig} />}
      </div>
      
      {/* 运行结果展示 */}
      {showRunResult && <NodeRunResult data={runResults} />}
    </>
  );
};
```

### 节点选中状态

使用自定义 Hook 管理选中状态：

```typescript
const selected = useNodeSelection({ graph, nodeId: data?.id });
```

### 可编辑标题

```typescript
// 禁止编辑的节点类型
const DISABLE_EDIT_NODE_TYPES = [
  NodeTypeEnum.LoopStart,
  NodeTypeEnum.LoopEnd,
  NodeTypeEnum.Start,
  NodeTypeEnum.End,
];

const handleSave = (saveValue: string): boolean => {
  setEditValue(saveValue);
  graph.trigger('node:custom:save', {
    data: node.getData<ChildNode>(),
    payload: { name: saveValue },
  });
  return true;
};
```

### 节点移动控制

编辑标题时禁止移动节点：

```typescript
const handleEditingStatusChange = (val: boolean) => {
  node.setData({ enableMove: !val });
};
```

---

## LoopNode 循环节点

### 组件结构

```tsx
export const LoopNode: React.FC<NodeProps> = ({ node, graph }) => {
  const data = node.getData<ChildNode>();
  const selected = useNodeSelection({ graph, nodeId: data?.id });
  
  return (
    <>
      <div
        className={`loop-node-style general-node ${selected ? 'selected-general-node' : ''}`}
        style={{ background: gradientBackground }}
      >
        <div className="loop-node-title-style dis-left">
          <ICON_WORKFLOW_LOOP style={{ marginRight: '6px' }} />
          <EditableTitle
            value={editValue}
            onSave={handleSave}
          />
        </div>
        <div className="loop-node-content" />
      </div>
      {showRunResult && <NodeRunResult data={runResults} />}
    </>
  );
};
```

### 循环节点特性

- 支持调整大小 (`resizable: true`)
- 支持嵌套子节点
- 子节点通过 `node.addChild()` 添加
- 自动调整大小以包含所有子节点

---

## 特殊节点渲染

### ConditionNode (条件分支节点)

```tsx
const ConditionNode: React.FC<{ data: ChildNode }> = ({ data }) => {
  const conditionBranchConfigs = data.nodeConfig.conditionBranchConfigs;

  return (
    <div className="condition-node-content-style">
      {conditionBranchConfigs?.map((item) => (
        <div key={item.uuid} className="condition-item-style">
          <span className="condition-title-sytle">
            {branchTypeMap[item.branchType]}
          </span>
          <div className="condition-node-left-input">
            {item.conditionArgs[0]?.firstArg?.name}
          </div>
          <span className="condition-node-compare-type">
            {compareTypeMap[item.conditionArgs[0]?.compareType]}
          </span>
          <div className="condition-node-right-input">
            {item.conditionArgs[0]?.secondArg?.name || item.conditionArgs[0]?.secondArg?.bindValue}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### QANode (问答节点)

```tsx
const QANode: React.FC<{ data: ChildNode }> = ({ data }) => {
  const { inputArgs, question, answerType, options } = data.nodeConfig;
  
  return (
    <div className="qa-node-content-style">
      {/* 输入参数 */}
      <div className="dis-left">
        <span className="qa-title-style">输入</span>
        {inputArgs?.slice(0, 2).map((item, index) => (
          <Tag key={index}>{item.name}</Tag>
        ))}
      </div>
      
      {/* 提问内容 */}
      <div className="dis-left">
        <span className="qa-title-style">提问内容</span>
        <span>{question || '未配置提问内容'}</span>
      </div>
      
      {/* 问答类型 */}
      <div className="dis-left">
        <span className="qa-title-style">问答类型</span>
        <span>{answerTypeMap[answerType]}</span>
      </div>
      
      {/* 选项（选项回答模式） */}
      {answerType === AnswerTypeEnum.SELECT && options?.map((item, index) => (
        <div key={item.uuid} className="dis-left">
          <Tag>{optionsMap[index]}</Tag>
          <span>{item.content || '未配置内容'}</span>
        </div>
      ))}
    </div>
  );
};
```

### IntentRecognitionNode (意图识别节点)

```tsx
const IntentRecognitionNode: React.FC<{ data: ChildNode }> = ({ data }) => {
  const intentConfigs = data.nodeConfig.intentConfigs;
  
  return (
    <div className="qa-node-content-style">
      {intentConfigs?.map((item, index) => (
        <div className="dis-left" key={index}>
          <span className="qa-title-style">选项{index + 1}</span>
          <span>{item.intent || '未配置意图'}</span>
        </div>
      ))}
    </div>
  );
};
```

---

## 节点样式配置

### 背景色配置

**文件位置**: `src/utils/workflow.tsx`

```typescript
export const returnBackgroundColor = (type: NodeTypeEnum): string => {
  switch (type) {
    case NodeTypeEnum.Start:
    case NodeTypeEnum.End:
      return '#EEEEFF';
    case NodeTypeEnum.Code:
    case NodeTypeEnum.Loop:
    case NodeTypeEnum.Condition:
      return '#ebf9f9';
    case NodeTypeEnum.Knowledge:
    case NodeTypeEnum.Variable:
    case NodeTypeEnum.MCP:
      return '#FFF0DF';
    case NodeTypeEnum.QA:
    case NodeTypeEnum.HTTPRequest:
      return '#fef9eb';
    case NodeTypeEnum.LLM:
      return '#E9EBED';
    case NodeTypeEnum.Plugin:
      return '#E7E1FF';
    case NodeTypeEnum.Workflow:
      return '#D0FFDB';
    default:
      return '#EEEEFF';
  }
};
```

### 图标配置

```typescript
export const returnImg = (type: NodeTypeEnum): React.ReactNode => {
  switch (type) {
    case NodeTypeEnum.Start:
    case NodeTypeEnum.LoopStart:
      return <ICON_START />;
    case NodeTypeEnum.End:
    case NodeTypeEnum.LoopEnd:
      return <ICON_END />;
    case NodeTypeEnum.LLM:
      return <ICON_WORKFLOW_LLM />;
    case NodeTypeEnum.Knowledge:
      return <ICON_WORKFLOW_KNOWLEDGE_BASE />;
    case NodeTypeEnum.Condition:
      return <ICON_WORKFLOW_CONDITION />;
    // ... 其他节点类型
    default:
      return <ICON_NEW_AGENT />;
  }
};
```

### 渐变背景

节点头部使用渐变背景：

```typescript
const gradientBackground = `linear-gradient(to bottom, ${returnBackgroundColor(data.type)} 0%, white 100%)`;
```

---

## 节点尺寸计算

### 默认尺寸配置

**文件位置**: `src/constants/node.constants.ts`

```typescript
export const DEFAULT_NODE_CONFIG_MAP = {
  default: {
    defaultWidth: 300,
    defaultHeight: 42,
  },
  [NodeTypeEnum.Loop]: {
    defaultWidth: 600,
    defaultHeight: 240,
  },
  [NodeTypeEnum.Condition]: {
    defaultWidth: 360,
    defaultHeight: 42,
  },
  // ... 其他节点类型
};
```

### 动态尺寸计算

**文件位置**: `src/utils/updateNode.ts`

```typescript
export const getWidthAndHeight = (node: ChildNode) => {
  const { type, nodeConfig } = node;
  const extension = nodeConfig?.extension || {};
  const { defaultWidth, defaultHeight } = DEFAULT_NODE_CONFIG_MAP[type] || DEFAULT_NODE_CONFIG_MAP.default;
  
  // 异常处理项高度
  const hasExceptionHandleItem = EXCEPTION_NODES_TYPE.includes(type);
  const exceptionHandleItemHeight = 32;
  const extraHeight = hasExceptionHandleItem ? exceptionHandleItemHeight : 0;
  
  // 特殊节点（QA、Condition、IntentRecognition）
  if ([NodeTypeEnum.QA, NodeTypeEnum.Condition, NodeTypeEnum.IntentRecognition].includes(type)) {
    return {
      width: defaultWidth,
      height: (extension.height || defaultHeight) + extraHeight,
    };
  }
  
  // 循环节点
  if (type === NodeTypeEnum.Loop) {
    return {
      width: extension.width > defaultWidth ? extension.width : defaultWidth,
      height: (extension.height || defaultHeight) + extraHeight,
    };
  }
  
  // 通用节点
  return {
    width: defaultWidth,
    height: defaultHeight + extraHeight,
  };
};
```

### 节点尺寸更新

```typescript
export const getNodeSize = ({ data, ports, type }: GraphNodeSizeGetParams): GraphNodeSize => {
  const { width: defaultWidth, height: defaultHeight } = getWidthAndHeight(data);
  const isLoopNode = data.type === NodeTypeEnum.Loop;
  
  // 根据端口位置计算高度
  const offsetY = ports[ports.length - 1]?.args?.offsetY || defaultHeight - NODE_BOTTOM_PADDING_AND_BORDER;
  const nodeHeight = isLoopNode ? defaultHeight : offsetY + NODE_BOTTOM_PADDING_AND_BORDER;
  
  return {
    type,
    width: defaultWidth,
    height: nodeHeight,
  };
};
```

---

## 运行结果展示

### NodeRunResult 组件

```tsx
const NodeRunResult: React.FC<{ data: RunResultItem[] }> = ({ data }) => {
  const time = (data?.reduce((acc, item) => {
    return acc + ((item?.options?.endTime || 0) - (item?.options?.startTime || 0));
  }, 0) / 1000).toFixed(3);
  
  const success = data.every(item => item?.status === RunResultStatusEnum.FINISHED);
  const isExecuting = data.some(item => 
    item?.status === RunResultStatusEnum.EXECUTING ||
    item?.status === RunResultStatusEnum.STOP_WAIT_ANSWER
  );
  
  return (
    <RunResult
      success={success}
      title={genRunResultTitle()}
      loading={isExecuting}
      time={`${time}s`}
      inputParams={innerData[current - 1]?.options?.input || {}}
      outputResult={innerData[current - 1]?.options?.data || {}}
    />
  );
};
```

---

## 相关文件索引

| 文件路径 | 说明 |
|---------|------|
| `src/pages/Antv-X6/component/registerCustomNodes.tsx` | 自定义节点注册和组件定义 |
| `src/pages/Antv-X6/component/runResult.tsx` | 运行结果展示组件 |
| `src/utils/workflow.tsx` | 节点样式和图标配置 |
| `src/utils/updateNode.ts` | 节点尺寸计算 |
| `src/constants/node.constants.ts` | 节点默认配置常量 |
| `src/constants/images.constants.ts` | 节点图标定义 |

---

**导航**: [📚 文档索引](./README.md) | [⬆️ 主文档](../V1-FEATURES.md)

*文档生成时间: 2024-12*
*用于 V2 重构参照*

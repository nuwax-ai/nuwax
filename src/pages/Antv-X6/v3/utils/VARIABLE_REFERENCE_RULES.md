# Variable Reference Calculation Rules (V3)

## 概述

`variableReferenceV3.ts` 实现前端变量引用计算逻辑，用于：

1. 根据节点间的连线关系，计算每个节点可用的上级节点输出参数
2. 支持嵌套对象和数组的子属性访问
3. 支持从 `nextNodeIds` 和 `edgeList` 两种方式获取连线关系
4. 替代后端 `getOutputArgs` 接口，解决前后端数据不同步问题

---

## 核心数据结构

### PreviousList（上级节点）

```typescript
interface PreviousList {
  id: number; // 节点ID
  name: string; // 节点名称
  type: NodeTypeEnum; // 节点类型
  icon: string | number;
  outputArgs: InputAndOutConfig[]; // 可引用的输出参数
  loopNodeId?: number; // 所属循环节点ID（可选）
  sort?: number; // 排序
}
```

### NodePreviousAndArgMap（返回结果）

```typescript
interface NodePreviousAndArgMap {
  previousNodes: PreviousList[]; // 外部上级节点列表
  innerPreviousNodes: PreviousList[]; // 循环内部上级节点列表（仅 Loop 节点有）
  argMap: ArgMap; // 变量键到参数定义的映射
}
```

---

## 节点前驱计算规则

### 基本规则

1. **只计算"逻辑上的过去节点"**

   - 排除当前节点自身
   - 排除逻辑上的"未来节点"（正向可达的节点）
   - 避免循环引用导致的死循环

2. **跳过的特殊节点类型**

   - `LoopStart`：循环内部起始节点
   - `LoopEnd`：循环内部结束节点

3. **跳过的循环相关节点**

   - 当前节点在循环内时，跳过其所属的 Loop 节点（由专门逻辑处理）
   - 属于其他循环的内部节点
   - 如果当前节点是 Loop，跳过自己的内部节点

4. **循环内同级节点隔离**

   - 在循环内部，节点只能引用逻辑上有连线关系的前驱节点
   - **严禁**引用同级但无连线关系的节点（即便它们都在同一个循环内）

   **示例说明 (Example):**

   **场景 A: 完整循环内结构**

   ```
   开始 -> 循环 -> 结束
             │
             └─ 循环内部:
                LoopStart -> 知识库_2 -> 知识库 -> LoopEnd
                          \                    /
                           -> 文本处理 -> 问答 -> 变量 -> LoopEnd
                          \                          /
                           -> 大模型 ───────────────> LoopEnd
   ```

   **当前节点: 问答** | 可用引用 | 原因 | |---------|------| | ✅ 文本处理 | 直接前驱 (LoopStart -> 文本处理 -> 问答) | | ✅ 循环 | Loop 节点提供 INDEX, variableArgs | | ✅ 开始 | Loop 的外部前驱 | | ❌ 知识库\_2 | 同级分支，无连线关系 | | ❌ 知识库 | 同级分支，无连线关系 | | ❌ 大模型 | 同级分支，无连线关系 |

5. **循环迭代边跳过规则**

   为实现同级节点隔离，图遍历时需跳过循环迭代控制边：

   - **正向遍历 (futureNodes)**：跳过 `Loop → LoopStart` 边
     - 避免循环体内节点被错误标记为"未来节点"
   - **反向遍历 (predecessors)**：跳过 `Loop ← LoopEnd` 边
     - 避免通过迭代控制边到达循环内其他分支

   **实现位置**：`getForwardReachableNodes()` 和 `findAllPredecessors()`

6. **循环节点 (Loop) 输出配置**

   当 Loop 节点自身配置输出变量时，需要看到所有连通的内部节点：

   - 从 LoopEnd 开始反向遍历收集所有前驱
   - 过滤掉 LoopStart/LoopEnd，保留有效业务节点
   - 若 BFS 找不到节点，回退到遍历所有 innerNodes（兼容新节点场景）

   **实现位置**：`calculateNodePreviousArgs()` 中 `currentNode.type === NodeTypeEnum.Loop` 分支

---

## 场景规则

### 场景 1: 普通节点（不在循环内）

```
Start → Variable → LLM
```

**当前节点：LLM**

| 数据                 | 内容            |
| -------------------- | --------------- |
| `previousNodes`      | Start, Variable |
| `innerPreviousNodes` | [] (空)         |

**规则：**

- 收集所有逻辑上的前驱节点
- Start 节点包含 `inputArgs` 和 `systemVariables`
- Variable 节点包含 `isSuccess` 输出

---

### 场景 2: 节点在循环内部

```
Start → Variable → Loop
                    ├── LoopStart → Variable_2 → LoopEnd
                    └── → End
```

**当前节点：Variable_2（在 Loop 内）**

| 数据                 | 内容                                           |
| -------------------- | ---------------------------------------------- |
| `previousNodes`      | Start, Variable, Loop (含 INDEX、variableArgs) |
| `innerPreviousNodes` | [] (空)                                        |

**规则：**

1. **外部前驱**：包含 Loop 节点的外部前驱（Start、Variable）
2. **Loop 变量**：
   - `INDEX`：数组索引（键格式：`{loopId}-input.INDEX`）
   - `variableArgs`：循环变量（键格式：`{loopId}-var.{uuid}`）
   - `_item`：数组元素（键格式：`{loopId}-input.{name}_item`）
3. **innerPreviousNodes 为空**：只有 Loop 节点自身才有 innerPreviousNodes

---

### 场景 3: 当前节点是 Loop 节点

```
Start → Variable → Loop → End
                    ├── LoopStart → Variable_2 → LoopEnd
```

**当前节点：Loop**

| 数据                 | 内容                               |
| -------------------- | ---------------------------------- |
| `previousNodes`      | Start, Variable                    |
| `innerPreviousNodes` | Variable_2, Loop (仅 variableArgs) |

**规则：**

1. **previousNodes**：只包含外部前驱节点

   - 跳过自己的内部节点（由 innerPreviousNodes 处理）

2. **innerPreviousNodes**（用于配置 Loop 输出）：

   - 从 LoopEnd 递归收集所有内部前驱节点
   - 过滤：只保留 `loopNodeId === currentNode.id` 的节点
   - 排除 LoopStart 和 LoopEnd

3. **内部节点类型转换**：

   - `dataType` 转换为 `Array_` 前缀（如 `String` → `Array_String`）
   - 保留 `originDataType` 记录原始类型

4. **Loop 自身变量**：
   - 只添加 `variableArgs`（键格式：`{loopId}-var.{uuid}`）
   - **不添加 INDEX**（INDEX 是给循环内部节点用的）

---

## Key 格式规则

### 标准节点

```
{nodeId}.{argName}
{nodeId}.{argName}.{subArgName}
```

示例：

- `10239.input` - 节点 10239 的 input 参数
- `10239.USER_NAME` - 节点 10239 的 USER_NAME 系统变量

### Loop 节点特殊格式

| 变量类型 | Key 格式                     | 示例                      |
| -------- | ---------------------------- | ------------------------- |
| INDEX    | `{loopId}-input.INDEX`       | `10240-input.INDEX`       |
| 数组元素 | `{loopId}-input.{name}_item` | `10240-input.input_item`  |
| 循环变量 | `{loopId}-var.{uuid}`        | `10240-var.abc123-def456` |

---

## 排序规则

节点按执行流顺序排序：

1. 从 Start 节点开始 DFS 遍历
2. 记录每个节点的访问顺序
3. 按访问顺序排序 `previousNodes` 和 `innerPreviousNodes`

---

## 测试用例

| 场景 | 当前节点 | previousNodes | innerPreviousNodes |
| --- | --- | --- | --- |
| 普通流 | LLM | Start, Variable | [] |
| 循环内节点 | Variable_2 (in Loop) | Start, Variable, Loop (含 INDEX) | [] |
| Loop 节点 | Loop | Start, Variable | Variable_2, Loop (仅 variableArgs) |
| LoopEnd 节点 | LoopEnd (in Loop) | Start, Variable, Variable_2, Loop | [] |

---

## 核心函数

### `calculateNodePreviousArgs(nodeId, workflowData)`

主入口函数，返回 `NodePreviousAndArgMap`。

**处理流程：**

1. 构建节点映射和图索引
2. 计算"未来节点"集合
3. 查找所有前驱节点
4. **过滤规则**：
   - 跳过 LoopStart/LoopEnd
   - 跳过循环相关节点
5. 处理循环内节点的特殊逻辑
6. 处理 Loop 节点的 innerPreviousNodes
7. 按执行顺序排序

### `getNodeOutputArgs(node, systemVariables)`

获取节点的输出参数：

| 节点类型 | 输出内容                       |
| -------- | ------------------------------ |
| Start    | inputArgs + systemVariables    |
| Loop     | outputArgs（注意：不含 INDEX） |
| Variable | outputArgs + `isSuccess`       |
| 其他     | outputArgs                     |

### `prefixOutputArgsKeys(nodeIdOrPrefix, args)`

为参数添加节点 ID 前缀的 key。

### `flattenArgsToMap(nodeIdOrPrefix, args)`

递归展开参数到 argMap，支持嵌套的 subArgs。

---

## 与后端对齐

本实现与后端 Java 代码 `PreviousDto generatePreviousNodes()` 保持一致：

- Line 105-110: 循环内节点的外部前驱处理
- Line 112-138: Loop 节点的 innerPreviousNodes 处理
- Line 140-167: Loop 的 variableArgs 处理（不含 INDEX）
- Line 168-237: 循环内节点的 INDEX 和 variableArgs 处理
- Line 315-328: 透过 LoopStart 获取外部前驱

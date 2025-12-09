## 变量引用计算规则（V2 前端实现，对齐后端 Java）

### 连线范围

- 基础：`nextNodeIds` 反向建图（过滤自环 `loopNodeId`）。
- 条件：`Condition.conditionBranchConfigs[].nextNodeIds`。
- 意图：`IntentRecognition.intentConfigs[].nextNodeIds`。
- 问答：`QA.options[].nextNodeIds`。
- 异常：当 `exceptionHandleConfig.exceptionHandleType === EXECUTE_EXCEPTION_FLOW` 时，将 `exceptionHandleNodeIds` 视为连线。

### 可引用输出的来源

- **Start 节点**：`inputArgs` 视为输出（并可与自身 `outputArgs` 合并）。当前前端未额外追加系统变量（后端有 `SYS_*`，需时可补）。
- **Variable 节点**：`configType === SET_VARIABLE` 自动补充布尔输出 `isSuccess`。
- **循环节点附加输出**（当前节点处于循环内部时，同时对外可见）：
  - 数组输入（Reference 且类型以 `Array_` 开头）展开元素输出：`<name>_item`，元素类型为去掉 `Array_` 后的类型，`subArgs` 继承元素结构。
  - 追加系统变量 `INDEX`（整数，表示数组索引）。
  - `variableArgs` 也暴露；若引用其他输出则继承其 `subArgs`。
- 所有输出（含子参数 `subArgs`/`children`）按路径展开到 `argMap`，键格式：`<nodeId>.<a>[.<b>...]`。

### 排序规则

- 以 Start 为起点的拓扑顺序，距离 Start 近的排前；同一层按节点 id 升序。

### 不同于后端的已知点

- Start 系统变量 `SYS_*` 目前未前端补充（后端会补）。如需一致，可在 Start 输出中追加系统变量列表。

### 手工测试要点

1. **异常分支**：A 有异常流指向 B，B 的可引用变量应包含 A 输出。
2. **循环数组**：循环绑定 `arr:Array_Object`，循环内节点可见 `arr_item` 与 `INDEX`。
3. **变量节点**：`SET_VARIABLE` 下游可见 `isSuccess:Boolean`。
4. **Start 入参**：任一下游节点可见 Start 的入参。
5. **分支连线**：条件 / 意图 / 问答分支的下游节点可见来源节点输出。
6. **排序**：并行路径 Start→A→C 与 Start→B→C，C 的可引用列表 A 在前、B 在后（若同层按 id）。

### 示例（可直接用于测试/查找）

- **异常分支**

  - 构造：LLM 节点 A，`exceptionHandleType=EXECUTE_EXCEPTION_FLOW`，`exceptionHandleNodeIds=[B]`。
  - 预期：节点 B 的可引用变量包含 A 的 `outputArgs`。

- **循环数组展开**

  - 构造：Loop 节点 L，`inputArgs=[{name:'arr', dataType:'Array_Object', bindValue:'S.arr'}]`，内部节点 N。
  - 预期：N 的可引用变量含 `L.arr_item`（元素类型 Object，继承子结构）与 `L.INDEX`（Integer）。

- **Variable 设置成功**

  - 构造：Variable 节点 V，`configType='SET_VARIABLE'`。
  - 预期：下游节点可见 `V.isSuccess:Boolean`。

- **Start 入参暴露**

  - 构造：Start 输入 `userInput:String`。
  - 预期：任一下游节点可见 `Start.userInput`。

- **条件 / 意图 / 问答分支**

  - 构造：Condition C 的分支指向 X，IntentRecognition I 的分支指向 Y，QA Q 的某选项指向 Z。
  - 预期：X/Y/Z 都能引用各自来源节点的输出。

- **排序校验**
  - 构造：Start→A→C，Start→B→C。
  - 预期：C 的引用列表中节点顺序 A 在前、B 在后（同层按 id）。

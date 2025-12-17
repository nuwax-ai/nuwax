# V3 测试方案

> 基于 V3-FEATURE-CHECKLIST.md 制定的测试策略，按测试类型分类功能验证方法。

## 测试类型说明

| 类型 | 标识 | 适用场景 | 工具/方法 |
| --- | --- | --- | --- |
| **单元测试** | 🧪 | 纯函数、工具类、数据转换 | Jest / Vitest |
| **示例数据测试** | 📊 | 数据结构、API Mock、状态管理 | Mock Data + Snapshot |
| **手动验证** | 👆 | UI 交互、视觉效果、E2E 流程 | 浏览器手动操作 |
| **关键输出验证** | 📝 | 需检查中间结果/console/网络请求 | DevTools + 日志 |

---

## 一、核心架构 - 单元测试 🧪

> 以下模块可编写单元测试，无需 UI 渲染

### 1.1 workflowProxyV3 数据代理

| 测试项 | 测试方法 | 预期结果 |
| --- | --- | --- |
| `addNode` | 传入节点数据 → 验证内部 Map | 节点正确添加到 nodesMap |
| `updateNode` | 更新节点 → 验证 nodeConfig 变更 | 配置正确更新 |
| `deleteNode` | 删除节点 → 验证 Map 移除 | 节点被删除 + 关联边清理 |
| `addEdge` / `deleteEdge` | 边增删 → 验证 nextNodeIds | 边数据正确维护 |
| `buildFullConfig` | 调用构建 → 验证输出结构 | 符合后端 API 格式 |
| `syncFromGraph` | 传入 X6 节点列表 → 同步 | X6 状态正确同步到 Proxy |

```typescript
// 示例测试
describe('workflowProxyV3', () => {
  it('should add node correctly', () => {
    const proxy = new WorkflowProxy();
    proxy.addNode({ id: 1, type: 'LLM', ... });
    expect(proxy.getNode(1)).toBeDefined();
  });
});
```

### 1.2 WorkflowSaveService 保存服务

| 测试项 | 测试方法 | 预期结果 |
| --- | --- | --- |
| `extractEdges` | 传入 Mock Graph → 验证边提取 | 正确提取所有边 |
| `computeConnections` | 传入边列表 → 计算 nextNodeIds | nextNodeIds 正确计算 |
| `buildSavePayload` | 构建保存载荷 | 符合 `/api/workflow/save` 格式 |

### 1.3 变量引用计算

| 测试项 | 文件 | 测试方法 |
| --- | --- | --- |
| 上游节点查找 | `variableReferenceV3.ts` | 传入节点拓扑 → 验证 previousNodes |
| 嵌套属性解析 | - | 传入 JSON 结构 → 验证属性路径 |
| 循环内变量 | - | 传入循环节点 → 验证 innerPreviousNodes |

---

## 二、Hooks - 示例数据测试 📊

> 需要 Mock 数据但不需要完整 UI

### 2.1 useWorkflowLifecycle

| 测试项       | Mock 数据       | 验证点                     |
| ------------ | --------------- | -------------------------- |
| 初始化加载   | 工作流详情 JSON | `workflowProxy` 正确初始化 |
| 加载失败处理 | API 返回 error  | 错误提示显示               |

### 2.2 useWorkflowPersistence

| 测试项       | Mock 数据    | 验证点                |
| ------------ | ------------ | --------------------- |
| 保存触发     | 节点配置变更 | `saveWorkflow` 被调用 |
| 保存失败重试 | API 返回 500 | 重试逻辑执行          |

### 2.3 useAutoSave

| 测试项       | Mock 数据 | 验证点         |
| ------------ | --------- | -------------- |
| 防抖触发     | 连续变更  | 只触发一次保存 |
| 自动保存间隔 | 时间流逝  | 定时保存执行   |

---

## 三、UI 交互 - 手动验证 👆

> 需要在浏览器中手动操作验证

### 3.1 画布操作

| 功能     | 操作步骤           | 预期结果     |
| -------- | ------------------ | ------------ |
| 画布拖拽 | 按住空白区域拖动   | 画布平移     |
| 缩放     | 滚轮/点击 +/- 按钮 | 缩放比例变化 |
| 适应视图 | 点击适应按钮       | 所有节点可见 |

### 3.2 节点操作

| 功能     | 操作步骤          | 预期结果                    |
| -------- | ----------------- | --------------------------- |
| 添加节点 | 从侧边栏拖拽/点击 | 节点出现在画布              |
| 选中节点 | 单击节点          | 边框高亮 + 属性面板打开     |
| 删除节点 | 选中 → Delete 键  | 节点消失 + 确认框(循环节点) |
| 复制粘贴 | Ctrl+C → Ctrl+V   | 新节点出现                  |
| 节点移动 | 拖拽节点          | 位置变化 + 连线跟随         |

### 3.3 连线操作

| 功能     | 操作步骤                | 预期结果          |
| -------- | ----------------------- | ----------------- |
| 创建连线 | 从输出端口拖到输入端口  | 连线建立          |
| 删除连线 | 选中连线 → Delete       | 连线消失          |
| 端口添加 | 点击端口 → 选择节点类型 | 新节点 + 自动连线 |

### 3.4 属性面板

| 功能      | 操作步骤          | 预期结果           |
| --------- | ----------------- | ------------------ |
| 打开/关闭 | 点击节点 / 点击 X | 面板显示/隐藏      |
| 配置修改  | 修改表单值        | isModified 变 true |
| 保存触发  | 失焦/点击保存     | 网络请求发出       |

---

## 四、关键输出验证 📝

> 需要检查 console 日志或网络请求

### 4.1 保存逻辑验证流程

```
操作: 修改 LLM 节点的技能列表 → 添加一个插件

验证步骤:
1. 打开 DevTools → Network
2. 添加技能 → 关闭弹窗
3. 检查网络请求:
   - URL: /api/workflow/save
   - Method: POST
   - Payload: 包含更新后的 skillComponentConfigs

预期 Console 输出:
[V3 Proxy] 节点更新成功: {nodeId} {nodeName}
[onSaveWorkflow] 节点类型: LLM
```

### 4.2 变量引用验证流程

```
操作: 在大模型节点引用开始节点的变量

验证步骤:
1. 打开变量选择器
2. 检查下拉列表显示:
   - 开始节点的输入参数
   - 格式: "节点名.变量名"
3. 选中变量 → 检查表单值

预期 Console 输出:
[ReferenceList] previousNodes: [...]
[ReferenceList] argMap: {...}
```

### 4.3 撤销/重做验证流程

```
操作: 添加节点 → 撤销 → 重做

验证步骤:
1. 添加一个代码节点
2. Ctrl+Z 撤销
3. 检查: 节点消失
4. Ctrl+Shift+Z 重做
5. 检查: 节点恢复

预期行为:
- X6 History 栈正确维护
- 画布与 Proxy 数据一致
```

### 4.4 全量保存数据验证

```
操作: 创建完整工作流 → 保存 → 刷新 → 验证回显

验证步骤:
1. 创建: 开始 → LLM(带技能) → 条件分支 → 结束
2. 点击保存
3. 刷新页面
4. 验证:
   - 节点位置一致
   - 连线关系正确
   - 节点配置完整(技能列表/条件分支)

检查 Payload:
{
  nodes: [...],
  edges: [...],  // 包含 nextNodeIds
  workflowId: xxx
}
```

---

## 五、节点类型专项验证

### 5.1 需重点验证的节点

| 节点类型                | 验证重点                | 测试类型 |
| ----------------------- | ----------------------- | -------- |
| **LLM**                 | 技能列表 CRUD + 保存    | 👆 + 📝  |
| **Knowledge**           | 知识库列表 CRUD + 保存  | 👆 + 📝  |
| **Condition**           | 分支增删 + 端口联动     | 👆       |
| **IntentRecognition**   | 意图增删 + 端口联动     | 👆       |
| **QA**                  | 选项增删 + 端口联动     | 👆       |
| **Loop**                | 循环类型切换 + 内部节点 | 👆       |
| **VariableAggregation** | 分组配置 + 输出映射     | 👆 + 📝  |
| **Database**            | 表选择 + SQL 生成       | 👆       |

### 5.2 通用节点验证

| 测试项       | 适用节点                | 验证方法            |
| ------------ | ----------------------- | ------------------- |
| 输入参数配置 | 所有带 inputArgs        | 添加/删除/修改参数  |
| 输出参数配置 | 所有带 outputArgs       | 添加/删除/修改参数  |
| 异常处理配置 | LLM/Knowledge/Plugin/DB | 切换类型 + 端口联动 |
| 变量引用     | 所有带引用的输入框      | 选择变量 + 保存验证 |

---

## 六、测试优先级

### P0 - 必须通过 (上线阻塞)

- [ ] 🧪 workflowProxyV3 核心方法
- [ ] 👆 节点增删改 + 保存
- [ ] 👆 连线增删 + 保存
- [ ] 📝 保存 Payload 格式正确

### P1 - 应该通过 (核心体验)

- [ ] 👆 LLM/Knowledge 技能列表
- [ ] 👆 条件/意图/问答 端口联动
- [ ] 👆 撤销/重做
- [ ] 👆 变量引用选择器

### P2 - 可以延后 (增强体验)

- [ ] 👆 快捷键完整性
- [ ] 👆 版本历史
- [ ] 🧪 边缘情况单元测试

---

## 七、示例数据准备

### 7.1 测试工作流 JSON

```json
{
  "workflowId": 12345,
  "nodes": [
    { "id": 1, "type": "Start", "name": "开始", "x": 100, "y": 200 },
    {
      "id": 2,
      "type": "LLM",
      "name": "大模型",
      "x": 300,
      "y": 200,
      "nodeConfig": {
        "modelId": "gpt-4",
        "skillComponentConfigs": [{ "typeId": 1, "name": "插件1" }]
      }
    },
    { "id": 3, "type": "End", "name": "结束", "x": 500, "y": 200 }
  ],
  "edges": [
    { "source": 1, "target": 2 },
    { "source": 2, "target": 3 }
  ]
}
```

### 7.2 Mock API 响应

```typescript
// /api/workflow/detail
const mockDetail = {
  code: 0,
  data: {
    /* 测试工作流 JSON */
  },
};

// /api/workflow/save
const mockSave = {
  code: 0,
  message: 'success',
};
```

---

_最后更新: 2025-12-17_

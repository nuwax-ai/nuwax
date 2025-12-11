# V3 工作流重构完成报告

## 概述

本次重构基于 V1 代码创建 V3 版本，核心目标是**解决 V1 前后端数据不同步问题**。通过引入统一数据代理层，将零散的后端接口调用改为前端组装全量数据后统一更新。

---

## 完成内容

### 1. 目录结构创建

创建了完整的 `v3/` 目录结构，包含 33 个文件：

```
src/pages/Antv-X6/v3/
├── indexV3.tsx              # 主入口（已重构）
├── indexV3.less
├── GraphContainerV3.tsx
├── ControlPanelV3.tsx
├── HeaderV3.tsx
├── ErrorListV3.tsx
├── ParamsV3.tsx
├── typeV3.ts
├── component/               # 21 个组件文件
├── services/
│   └── workflowProxyV3.ts   # 数据代理层 ⭐
├── hooks/
│   └── useWorkflowDataV3.ts # 数据管理 Hook ⭐
├── types/
│   └── index.ts             # 类型定义
└── utils/
    └── variableReferenceV3.ts # 变量引用计算 ⭐
```

---

### 2. 配置入口修改

#### config.ts

新增 V3 切换支持：

- `getUseV3()` - 获取是否使用 V3
- `enableV3()` / `disableV3()` - 切换方法
- V3 优先级高于 V2

#### index.tsx

修改主入口支持 V1/V2/V3 三版本切换：

```typescript
const WorkflowEntry: React.FC = () => {
  if (WORKFLOW_CONFIG.useV3) {
    return <WorkflowV3 />;
  }
  if (WORKFLOW_CONFIG.useV2) {
    return <WorkflowV2 />;
  }
  return <Workflow />;
};
```

---

### 3. 数据代理层实现

#### workflowProxyV3.ts

核心代理服务，统一管理所有节点/边操作：

| 方法                    | 功能                 |
| ----------------------- | -------------------- |
| `initialize()`          | 初始化工作流数据     |
| `updateNode()`          | 更新节点             |
| `addNode()`             | 添加节点             |
| `deleteNode()`          | 删除节点             |
| `updateNodePosition()`  | 更新节点位置         |
| `addEdge()`             | 添加边               |
| `deleteEdge()`          | 删除边               |
| `getFullWorkflowData()` | 获取全量数据         |
| `hasPendingChanges()`   | 检查是否有待发送更改 |

---

### 4. 核心方法重构

#### `getReference` 方法

**改动前**：调用后端 `service.getOutputArgs(id)` 接口

**改动后**：使用前端 `calculateNodePreviousArgs()` 计算

```typescript
// V3: 使用前端计算代替后端接口调用
const workflowData = {
  nodeList: graphParams.nodeList,
  edgeList: graphParams.edgeList,
};
const result = calculateNodePreviousArgs(id, workflowData);
setReferenceList(result);
```

#### `changeNode` 方法

**改动前**：调用后端 `apiUpdateNode(params)` 接口

**改动后**：使用代理层 `workflowProxy.updateNode(params)`

```typescript
// V3: 使用代理层更新数据，不调用后端接口
const proxyResult = workflowProxy.updateNode(params);
if (proxyResult.success) {
  changeUpdateTime();
  // ... 后续逻辑
}
```

#### `autoSaveNodeConfig` 方法

同样改为使用代理层更新数据。

---

### 5. 变量引用计算迁移

从 V2 迁移 `variableReferenceV2.ts` 和类型定义，支持：

- 根据节点连线关系计算可用上级参数
- 支持嵌套对象和数组子属性访问
- 支持循环节点内部变量

---

## 切换方法

### URL 参数（推荐测试用）

```
?v3=true    # 启用 V3
?v2=true    # 启用 V2
```

### localStorage（持久化）

```javascript
// 启用 V3
window.__workflowConfig.enableV3();

// 禁用 V3，回到 V1
window.__workflowConfig.disableV3();
```

### 控制台方法

```javascript
window.__workflowConfig.getCurrentVersion(); // 查看当前版本
window.__workflowConfig.config; // 查看配置
```

---

## 待跟进事项

> **重要**：后端全量更新接口 ready 后，需要：
>
> 1. 在 `workflowProxyV3.ts` 中实现 `syncToBackend()` 方法
> 2. 设置 `workflowProxy.setBackendReady(true)`
> 3. 添加失败重试机制

### 可选优化

- [ ] 添加 localStorage 持久化防止数据丢失
- [ ] 实现防抖批量更新
- [ ] 添加离线缓存和数据恢复机制
- [ ] 完善边操作代理（`nodeChangeEdge` 方法）

---

## 文件变更清单

### 新增文件

- `v3/services/workflowProxyV3.ts` - 数据代理层
- `v3/hooks/useWorkflowDataV3.ts` - 数据管理 Hook
- `v3/utils/variableReferenceV3.ts` - 变量引用计算
- `v3/types/index.ts` - 类型定义

### 修改文件

- `config.ts` - 新增 V3 切换配置
- `index.tsx` - 新增 V3 入口切换
- `v3/indexV3.tsx` - 重构核心方法使用代理层

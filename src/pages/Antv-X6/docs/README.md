# V1 工作流编辑器技术文档索引

> 本目录包含 V1 版本工作流编辑器的完整技术文档，作为 V2 重构的参照标准。

## 文档导航

```
V1-FEATURES.md (主文档)
    │
    ├── docs/
    │   ├── README.md (本文件 - 文档索引)
    │   │
    │   ├── 【数据层】
    │   │   └── NODE-DATA-STRUCTURES.md ──── 节点数据结构
    │   │
    │   ├── 【视图层 - X6 画布】
    │   │   ├── X6-CUSTOM-NODES.md ──────── 自定义节点渲染
    │   │   ├── X6-PORTS.md ─────────────── 连接桩配置
    │   │   ├── X6-EDGES.md ─────────────── 连线实现
    │   │   └── X6-EVENTS.md ────────────── 事件处理
    │   │
    │   └── 【服务层】
    │       └── API-DATA-INTERACTION.md ─── 后端 API 交互
```

---

## 快速导航

### 按功能模块

| 功能 | 相关文档 | 说明 |
|-----|---------|------|
| **节点类型与配置** | [NODE-DATA-STRUCTURES.md](./NODE-DATA-STRUCTURES.md) | 17+ 种节点类型的 TypeScript 接口定义 |
| **节点渲染** | [X6-CUSTOM-NODES.md](./X6-CUSTOM-NODES.md) | GeneralNode/LoopNode 组件实现 |
| **连接桩** | [X6-PORTS.md](./X6-PORTS.md) | 端口配置、生成、交互 |
| **连线** | [X6-EDGES.md](./X6-EDGES.md) | 边创建、验证、事件处理 |
| **画布交互** | [X6-EVENTS.md](./X6-EVENTS.md) | 节点/边/画布事件、快捷键 |
| **后端同步** | [API-DATA-INTERACTION.md](./API-DATA-INTERACTION.md) | CRUD 操作、数据流向 |

### 按开发场景

| 场景 | 推荐阅读顺序 |
|-----|-------------|
| **了解整体架构** | [V1-FEATURES.md](../V1-FEATURES.md) → 本文档 → 各子文档 |
| **新增节点类型** | [NODE-DATA-STRUCTURES.md](./NODE-DATA-STRUCTURES.md) → [X6-CUSTOM-NODES.md](./X6-CUSTOM-NODES.md) → [X6-PORTS.md](./X6-PORTS.md) |
| **修改连线逻辑** | [X6-EDGES.md](./X6-EDGES.md) → [X6-PORTS.md](./X6-PORTS.md) → [API-DATA-INTERACTION.md](./API-DATA-INTERACTION.md) |
| **处理用户交互** | [X6-EVENTS.md](./X6-EVENTS.md) → [X6-EDGES.md](./X6-EDGES.md) |
| **对接后端接口** | [API-DATA-INTERACTION.md](./API-DATA-INTERACTION.md) → [NODE-DATA-STRUCTURES.md](./NODE-DATA-STRUCTURES.md) |

---

## 文档详情

### 1. 节点数据结构 (`NODE-DATA-STRUCTURES.md`)

**核心内容**:
- `ChildNode` 节点基础接口
- `NodeConfig` 节点配置接口
- 各节点类型专属字段（LLM、Condition、Loop 等）
- 表单字段到 NodeConfig 的映射关系

**关联文档**:
- → [X6-CUSTOM-NODES.md](./X6-CUSTOM-NODES.md): 节点数据如何渲染
- → [API-DATA-INTERACTION.md](./API-DATA-INTERACTION.md): 节点数据如何持久化

---

### 2. X6 自定义节点 (`X6-CUSTOM-NODES.md`)

**核心内容**:
- `registerCustomNodes()` 节点注册
- `GeneralNode` 通用节点组件
- `LoopNode` 循环节点组件
- 节点样式（背景色、图标、渐变）
- 节点尺寸计算逻辑

**关联文档**:
- ← [NODE-DATA-STRUCTURES.md](./NODE-DATA-STRUCTURES.md): 节点数据来源
- → [X6-PORTS.md](./X6-PORTS.md): 节点的连接桩配置
- → [X6-EVENTS.md](./X6-EVENTS.md): 节点事件处理

---

### 3. X6 连接桩 (`X6-PORTS.md`)

**核心内容**:
- `PortGroupEnum` 端口组类型（in/out/special/exception）
- `generatePortGroupConfig()` 端口组配置生成
- `generatePorts()` 端口生成逻辑
- 特殊节点端口（Condition/QA/IntentRecognition）
- 异常处理端口

**关联文档**:
- ← [X6-CUSTOM-NODES.md](./X6-CUSTOM-NODES.md): 端口依附的节点
- → [X6-EDGES.md](./X6-EDGES.md): 端口如何连线
- → [X6-EVENTS.md](./X6-EVENTS.md): 端口交互事件

---

### 4. X6 连线 (`X6-EDGES.md`)

**核心内容**:
- 边 Markup 结构和样式
- `curveConnector` 自定义曲线连接器
- 边创建逻辑（拖拽/端口点击/边上添加）
- 边验证规则（画布级/业务级）
- 边事件处理

**关联文档**:
- ← [X6-PORTS.md](./X6-PORTS.md): 连线的起止端口
- → [X6-EVENTS.md](./X6-EVENTS.md): 边相关事件
- → [API-DATA-INTERACTION.md](./API-DATA-INTERACTION.md): 连线数据同步

---

### 5. X6 事件处理 (`X6-EVENTS.md`)

**核心内容**:
- 画布事件（缩放、空白点击）
- 节点事件（选中、移动、双击编辑）
- 端口事件（悬停放大、点击添加）
- 边事件（悬停按钮、选中高亮）
- 键盘快捷键（复制/粘贴/删除）
- X6 插件配置

**关联文档**:
- ← [X6-CUSTOM-NODES.md](./X6-CUSTOM-NODES.md): 节点事件目标
- ← [X6-PORTS.md](./X6-PORTS.md): 端口事件目标
- ← [X6-EDGES.md](./X6-EDGES.md): 边事件目标
- → [API-DATA-INTERACTION.md](./API-DATA-INTERACTION.md): 事件触发的 API 调用

---

### 6. 后端 API 交互 (`API-DATA-INTERACTION.md`)

**核心内容**:
- API 服务文件结构
- 节点 CRUD 操作（添加/删除/复制/更新）
- 连线操作（nextNodeIds 管理）
- 变量引用获取
- 节点位置/尺寸同步
- 工作流初始化与重置

**关联文档**:
- ← [NODE-DATA-STRUCTURES.md](./NODE-DATA-STRUCTURES.md): 请求/响应数据结构
- ← [X6-EVENTS.md](./X6-EVENTS.md): 触发 API 的事件
- ← [X6-EDGES.md](./X6-EDGES.md): 连线数据同步

---

## 文档关系图

```
                    ┌─────────────────────────┐
                    │   V1-FEATURES.md        │
                    │   (主文档 - 功能概览)     │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │ NODE-DATA-STRUCTURES  │   │  API-DATA-INTERACTION │
    │    (数据结构定义)       │   │     (后端 API 交互)    │
    └───────────┬───────────┘   └───────────┬───────────┘
                │                           │
                │    ┌──────────────────────┘
                │    │
                ▼    ▼
    ┌───────────────────────┐
    │   X6-CUSTOM-NODES     │
    │    (节点渲染组件)       │
    └───────────┬───────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌───────────────┐ ┌───────────────┐
│   X6-PORTS    │ │   X6-EDGES    │
│  (连接桩配置)  │ │   (连线实现)   │
└───────┬───────┘ └───────┬───────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
        ┌───────────────┐
        │   X6-EVENTS   │
        │  (事件处理)    │
        └───────────────┘
```

---

## 核心源文件索引

| 文件路径 | 关联文档 | 说明 |
|---------|---------|------|
| `src/types/interfaces/node.ts` | NODE-DATA-STRUCTURES | 节点类型定义 |
| `src/types/interfaces/graph.ts` | NODE-DATA-STRUCTURES | 图相关类型 |
| `src/pages/Antv-X6/component/registerCustomNodes.tsx` | X6-CUSTOM-NODES | 节点注册 |
| `src/pages/Antv-X6/component/graph.tsx` | X6-EVENTS, X6-EDGES | 画布初始化和事件 |
| `src/pages/Antv-X6/component/eventHandlers.tsx` | X6-EVENTS | 快捷键绑定 |
| `src/pages/Antv-X6/graphContainer.tsx` | X6-CUSTOM-NODES, API | GraphContainer 组件 |
| `src/utils/workflow.tsx` | X6-PORTS, X6-EDGES | 端口/边生成工具 |
| `src/utils/graph.ts` | X6-PORTS, X6-EDGES | 图工具函数 |
| `src/services/workflow.ts` | API-DATA-INTERACTION | 工作流 API |
| `src/services/modifyNode.ts` | API-DATA-INTERACTION | 节点更新 API |

---

*返回主文档: [V1-FEATURES.md](../V1-FEATURES.md)*

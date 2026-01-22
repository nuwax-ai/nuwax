# V3 工作流编辑器重构策略

## 目标

在 **不破坏现有业务逻辑** 的前提下，解耦业务逻辑与 UI 渲染，显著降低 `indexV3.tsx` (目前 >2500 行) 的复杂度，提升代码可维护性和可测试性。

## 架构分层设计

我们采用 **渐进式分层** 策略，将代码分为三层：

### 1. UI 组件层 (Presentation Layer)

_职责：纯粹的页面渲染和用户交互，不包含复杂业务逻辑状态。_

- **`components/layout/`**: 页面级布局组件
  - `Layout.tsx`: 整体布局容器
  - `Sidebar.tsx`: 左侧算子列表 (从 `stencil.tsx` 重构)
  - `Header.tsx`: 顶部工具栏 (优化现有 `HeaderV3.tsx`)
  - `ControlPanel.tsx`: 底部控制器 (优化现有 `ControlPanelV3.tsx`)
- **`components/panels/`**: 功能面板
  - `PropertyPanel.tsx`: 右侧属性配置面板 (重构 `NodePanelDrawerV3`)
- **`components/graph/`**: 画布相关
  - `GraphContainer.tsx`: 画布容器封装 (不仅是 Wrapper，包含 X6 初始化)

### 2. 业务逻辑层 (Application Logic Layer)

_职责：通过 Custom Hooks 封装业务流程，连接 UI 与数据层。这是重构的重点。_

- **`hooks/useWorkflowLifecycle.ts`**: 初始化、加载详情、销毁。
- **`hooks/useGraphInteraction.ts`**: 画布事件监听 (点击、缩放、拖拽)。
- **`hooks/useNodeOperations.ts`**: 节点增删改查业务逻辑 (核心)。
- **`hooks/useEdgeOperations.ts`**: 连线管理业务逻辑。
- **`hooks/useWorkflowPersistence.ts`**: 保存、自动保存、版本控制逻辑。

### 3. 基础设施层 (Infrastructure Layer)

_职责：数据结构定义、API 通信、底层引擎封装。_

- **`services/WorkflowProxy.ts`**: (现有) 数据代理与缓存，单一数据源管理。
- **`services/WorkflowSaveService.ts`**: (现有) 保存载荷构建与脏检查。
- **`types/`**: 类型定义 (需按领域拆分: `node.ts`, `edge.ts`, `graph.ts`)。
- **`utils/`**: 纯函数工具库 (无状态)。

---

## 渐进式执行计划 (Roadmap)

为了降低风险，建议按以下顺序执行：

### 阶段一：文件归类与目录重组 (Low Risk)

_目标：物理上分离文件，不修改代码内容。_

1.  创建上述目录结构。
2.  将 `component/` 下散乱的文件按职责移动到新目录。
3.  拆分 `types/index.ts` 为多个小文件，利用 `export *` 保持兼容。

### 阶段二：逻辑提取 (Hooks Extraction) (Medium Risk)

_目标：给 `indexV3.tsx` 瘦身，逻辑下沉。_

1.  **提取 `useWorkflowLifecycle`**: 将 `getDetails`, `useEffect` (加载逻辑) 移出。
2.  **提取 `useWorkflowPersistence`**: 将 `saveFullWorkflow`, `autoSaveNodeConfig`, `debouncedSave` 移出。
3.  **提取 `useGraphInteraction`**: 将 `changeGraph`, `changeZoom`, 画布事件监听移出。

### 阶段三：组件解耦 (High Risk)

_目标：组件更加纯粹，通过 Props 或 Context 接收数据。_

1.  重构 `NodePanelDrawerV3`，使其不再直接依赖全局 `form` 实例，而是通过 Props 接收 `config` 和 `onChange`。
2.  将 `indexV3.tsx` 中的 JSX 结构拆分为 `WorkflowLayout` 组件。

---

## 编码规范建议

1.  **Hooks 命名**: 必须以 `use` 开头，文件名与函数名一致。
2.  **单一职责**: 一个 Hook 只负责一类相关的操作。
3.  **Context 使用**: 对于跨层级传递的状态 (如 `readOnly`, `workflowId`)，优先使用 Context 而非透传 Props。

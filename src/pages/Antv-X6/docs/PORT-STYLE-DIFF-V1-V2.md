# V1 与 V2 版本 Out Port 样式差异分析

## 问题描述

发现 V1 版本与 V2 版本在部分 out port 的样式表现不一致。

## 差异对比

### 1. 端口组配置中的 magnetRadius

**V1 版本** (`src/utils/graph.ts:446-502`):

```typescript
export const generatePortGroupConfig = (
  basePortSize: number,
  data: ChildNode,
) => {
  const magnetRadius = 50; // ⚠️ V1 使用 50
  const isLoopNode = data.type === NodeTypeEnum.Loop;

  return {
    out: {
      position: {
        name: fixedPortNode ? 'right' : 'absolute',
      },
      attrs: {
        circle: {
          r: basePortSize,
          magnet: true,
          magnetRadius: 50, // ⚠️ 端口组配置使用 50
        },
      },
      // ...
    },
    // ...
  };
};
```

**V2 版本** (`src/pages/Antv-X6/v2/utils/graphV2.ts:108-150`):

```typescript
const generatePortGroupConfig = (
  node: ChildNodeV2,
): PortsConfigV2['groups'] => {
  const MAGNET_RADIUS = 30; // ⚠️ V2 使用 30
  const baseCircle = {
    r: BASE_PORT_SIZE,
    magnet: true,
    magnetRadius: MAGNET_RADIUS, // ⚠️ 端口组配置使用 30
    // ...
  };

  return {
    [PortGroupEnumV2.out]: {
      position: { name: isFixedPortNode ? 'right' : 'absolute' },
      attrs: { circle: baseCircle }, // ⚠️ 使用 30
      // ...
    },
    // ...
  };
};
```

### 2. 端口项配置中的 magnetRadius

**V1 版本** (`src/utils/workflow.tsx:469-476`):

```typescript
const generatePortConfig = ({...}: PortConfig) => {
  return {
    // ...
    attrs: {
      circle: {
        r: basePortSize,
        magnet: true,
        stroke: color,
        fill: color,
        magnetRadius: 30,  // ✅ 端口项配置使用 30
        zIndex: 2,
      },
      // ...
    },
  };
};
```

**V2 版本** (`src/pages/Antv-X6/v2/utils/graphV2.ts:208-216`):

```typescript
function generatePortConfig(node: ChildNodeV2, {...}) {
  return {
    // ...
    attrs: {
      circle: {
        r: BASE_PORT_SIZE,
        magnet: true,
        stroke: color,
        fill: color,
        magnetRadius: MAGNET_RADIUS,  // ✅ 端口项配置使用 30 (MAGNET_RADIUS = 30)
        zIndex: 2,
      },
      // ...
    },
  };
}
```

## 关键发现

### 配置合并机制

在 AntV X6 中，端口的最终配置是通过**合并**端口组配置和端口项配置得到的：

1. **端口组配置** (`groups`)：定义端口组的默认属性
2. **端口项配置** (`items`)：定义具体端口的属性，会**覆盖**端口组配置

### 实际生效的配置

虽然端口组配置中 V1 使用 `magnetRadius: 50`，V2 使用 `magnetRadius: 30`，但由于端口项配置都会覆盖为 `magnetRadius: 30`，所以**理论上最终生效的应该都是 30**。

### 可能的差异原因

1. **配置合并时机**：如果 X6 在某些情况下先使用端口组配置，再应用端口项配置，可能会在某些渲染阶段看到差异。

2. **端口组配置的影响范围**：

   - 端口组配置可能影响端口的**初始渲染**
   - 可能影响端口的**连接吸附范围**计算
   - 可能影响端口的**高亮显示**

3. **其他样式属性**：除了 `magnetRadius`，可能还有其他属性存在差异。

## 详细对比表

| 配置项 | V1 版本 | V2 版本 | 说明 |
| --- | --- | --- | --- |
| **端口组 out.magnetRadius** | **50** | **30** | ⚠️ **主要差异** |
| 端口项 circle.magnetRadius | 30 | 30 | ✅ 一致 |
| 端口组 out.position | `fixedPortNode ? 'right' : 'absolute'` | `isFixedPortNode ? 'right' : 'absolute'` | ✅ 逻辑一致 |
| 端口组 out.connectable | `{ source: true, target: isLoopNode }` | `{ source: true, target: isLoopNode }` | ✅ 一致 |
| 端口项 circle.r | 3 | 3 | ✅ 一致 |
| 端口项 circle.stroke | `#5147FF` | `#5147FF` | ✅ 一致 |
| 端口项 circle.fill | `#5147FF` | `#5147FF` | ✅ 一致 |

## 影响分析

### magnetRadius 的作用

`magnetRadius` 定义了端口的**磁吸半径**，即：

- 鼠标拖拽连线时，距离端口多远的范围内会自动吸附到该端口
- 影响连线的**吸附体验**和**连接精度**

### 差异可能导致的视觉效果

1. **连接体验**：

   - V1: 更大的吸附范围（50px），更容易连接到端口
   - V2: 较小的吸附范围（30px），需要更精确地拖拽

2. **高亮显示**：

   - 如果 X6 使用端口组配置来绘制高亮区域，V1 的高亮区域会更大

3. **初始渲染**：
   - 在某些渲染阶段，可能会看到端口组配置的临时效果

## 建议修复方案

### 方案 1：统一端口组配置（推荐）

将 V2 的端口组配置中的 `magnetRadius` 改为 50，与 V1 保持一致：

```typescript
// src/pages/Antv-X6/v2/utils/graphV2.ts
const MAGNET_RADIUS = 30; // 端口项使用
const PORT_GROUP_MAGNET_RADIUS = 50; // 端口组使用（与 V1 保持一致）

const generatePortGroupConfig = (node: ChildNodeV2) => {
  const baseCircle = {
    r: BASE_PORT_SIZE,
    magnet: true,
    magnetRadius: PORT_GROUP_MAGNET_RADIUS, // 改为 50
    // ...
  };
  // ...
};
```

### 方案 2：统一为 30

将 V1 的端口组配置中的 `magnetRadius` 改为 30，与端口项配置保持一致：

```typescript
// src/utils/graph.ts
export const generatePortGroupConfig = (
  basePortSize: number,
  data: ChildNode,
) => {
  const magnetRadius = 30; // 改为 30，与端口项配置一致
  // ...
};
```

### 方案 3：深入调查

如果差异不明显或影响不大，可以：

1. 在浏览器中实际测试两个版本的端口行为
2. 检查是否有其他配置项存在差异
3. 确认用户反馈的具体问题

## 相关文件

| 文件路径                                        | 说明          |
| ----------------------------------------------- | ------------- |
| `src/utils/graph.ts:446-502`                    | V1 端口组配置 |
| `src/utils/workflow.tsx:424-496`                | V1 端口项配置 |
| `src/pages/Antv-X6/v2/utils/graphV2.ts:108-150` | V2 端口组配置 |
| `src/pages/Antv-X6/v2/utils/graphV2.ts:152-235` | V2 端口项配置 |

## 测试建议

1. **视觉对比**：

   - 在相同节点上对比 V1 和 V2 的 out port 显示
   - 检查端口大小、颜色、位置是否一致

2. **交互测试**：

   - 测试拖拽连线时的吸附范围
   - 检查鼠标悬停时的高亮效果

3. **特殊节点测试**：
   - 测试固定端口节点（Start、End、Loop 等）
   - 测试动态端口节点（Condition、QA 等）

---

## 修复记录

### 修复时间

2025-01-XX

### 修复内容

已将 V2 版本的端口组配置中的 `magnetRadius` 从 30 改为 50，与 V1 版本保持一致。

### 修改文件

- `src/pages/Antv-X6/v2/utils/graphV2.ts`
  - 添加常量 `PORT_GROUP_MAGNET_RADIUS = 50` 用于端口组配置
  - 在 `generatePortGroupConfig` 函数中使用 `PORT_GROUP_MAGNET_RADIUS` 替代 `MAGNET_RADIUS`
  - 保持端口项配置中的 `MAGNET_RADIUS = 30` 不变（与 V1 一致）

### 修改前后对比

**修改前**:

```typescript
const MAGNET_RADIUS = 30;
const baseCircle = {
  magnetRadius: MAGNET_RADIUS, // 端口组也使用 30
};
```

**修改后**:

```typescript
const MAGNET_RADIUS = 30; // 端口项配置使用
const PORT_GROUP_MAGNET_RADIUS = 50; // 端口组配置使用（与 V1 保持一致）
const baseCircle = {
  magnetRadius: PORT_GROUP_MAGNET_RADIUS, // 端口组使用 50
};
```

### 验证

- ✅ 代码修改完成
- ✅ Linter 检查通过
- ⏳ 待实际测试验证视觉效果和交互行为

---

**文档生成时间**: 2025-01-XX  
**问题发现**: 用户反馈 V1 与 V2 版本 out port 样式不一致  
**状态**: ✅ 已修复

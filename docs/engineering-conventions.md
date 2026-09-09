# 工程规范(命名 / 分层 / I18n)

> 由原 CLAUDE.md / AGENTS.md 的规范章节迁出(2026-08-17)。agent 入口见根目录 `AGENTS.md`;会话域文档见 [conversation/README.md](./conversation/README.md)。

## 1. 文件命名

- **组件目录**: PascalCase(`FileTree/`);组件文件 `index.tsx` 或 `ComponentName.tsx`;样式 `index.less`;类型 `type.ts` 或 `ComponentName.types.ts`
- **页面目录**: PascalCase(`AppDev/`、`EditAgent/`);页面文件 `index.tsx`;页面组件放 `components/` 子目录
- **Hook**: `useHookName.ts`(camelCase,use 开头);类型同文件或 `types.ts`
- **服务**: `serviceName.ts`(`appDev.ts`);API 函数动词开头(`getUserInfo`、`createProject`)
- **工具**: `utilityName.ts`;常量 `constants.ts` 或 `constantName.ts`

## 2. 变量命名

- 组件名/Props 接口:PascalCase(`FileTree`、`FileTreeProps`)
- Hook 与返回值:camelCase,描述性命名(`{ messages, sendMessage, isLoading }`)
- 状态:描述性(`isLoading`、`activeFile`、`devServerUrl`)
- API 函数:动词开头(`getProjectContent`、`startDev`)

## 3. I18n 规范

Key 结构:`{Client}.{Scope}.{Domain}.{key}`

- Client:`PC` / `Mobile` / `Claw`
- Scope:`Pages` / `Components` / `Toast` / `Modal` / `Common`
- Domain:业务域(PascalCase);key:语义化小驼峰

UI 文本缩写:Mgmt(命名空间)/Manage(动作)、Config、Auth、Perm、Dev、Param(s)、Doc(s)、Info、Stat(s)、ID、Conv、Msg、Admin、QA、Desc。

## 4. 项目分层

```
Pages → Components → Hooks → Services → Utils
  ↓        ↓         ↓        ↓        ↓
Models ← Types ← Constants ← Styles ← Locales
```

依赖规则:

1. 页面层可依赖所有层
2. 组件层可依赖 Hooks/Services/Utils/Types
3. Hooks 可依赖 Services/Utils/Types
4. 服务层可依赖 Utils/Types
5. 工具层只能依赖 Types/Constants
6. 类型层不依赖任何层

禁止:组件直接依赖 Models;Hooks 依赖 Components;Services 依赖 Hooks;Utils 依赖 Services。

红线执行:`.eslintrc.js` 的 `no-restricted-imports` 与 `.dependency-cruiser.cjs` 机器化上述规则;存量违规记录于 `.dependency-cruiser-known-violations.json`(只防新增、不阻断存量),本地自查 `pnpm run lint:arch`。

例外:会话模块双轨架构的页面级约束见 [conversation/conversation-maintenance-guide.md](./conversation/conversation-maintenance-guide.md) §2(页面只消费 `features/conversation/react/*`)。

### 4.1 组件分层(components/)

- `components/base/`:与业务无关的基础组件(图标、复制按钮、Tabs 等),禁止依赖任何业务模块
- `components/business-component/`:跨页面复用的业务组件(UnifiedChatSession、FilePreview 等)
- `components/` 顶层为历史存量,新组件按上述二分归位,存量逐步迁移
- 组件层(含 base/business-component/顶层)**禁止反向依赖 `@/pages/**`\*\*

### 4.2 域模块(features/)

- 按业务域垂直分层的模块,样板:`features/conversation/`(`domain/` 纯函数 → `runtime/` 非视图编排 → `adapters/` 旧线适配 → `react/` React 层,依赖方向不可反转)
- 页面层只消费 `features/<domain>/react/*`,禁止直接 import domain/runtime/adapters 内部实现
- 新建域模块须遵循同一分层方向,并配 eslint `no-restricted-imports` 红线

### 4.3 页面自治边界(pages/)

页面目录允许内聚私有实现,边界如下:

- ✅ 允许:页面私有 `components/`、`hooks/`、`types.ts`、`utils/`(仅本页消费)
- ❌ 禁止:页面私有 **API 接口层 services**(统一上提到 `src/services/`,按域组织(扁平文件如 `userapp.ts`,或域子目录如 `menuPermission/`))
- ⚠️ 例外:页面编排类服务(含本地状态与流程编排、非纯接口层,如 `Antv-X6/v3/services/WorkflowSaveService`)可保留页面私有,但不得被本页之外的任何模块 import
- ❌ 禁止:页面之间互相 import(`pages/A` 引 `@/pages/B`);存量清单见 [refactor/layering-audit.md](./refactor/layering-audit.md),只减不增

## 5. 代码组织

文件内部顺序:外部 import → 内部 import → 类型定义 → 实现 → 导出。

组件目录结构:

```
ComponentName/
├── index.tsx       # 入口
├── index.less
├── components/     # 子组件
├── hooks/          # 组件专用 hooks
├── types.ts
└── README.md
```

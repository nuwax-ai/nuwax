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

例外:会话模块双轨架构的页面级约束见 [conversation/conversation-maintenance-guide.md](./conversation/conversation-maintenance-guide.md) §2(页面只消费 `features/conversation/react/*`)。

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

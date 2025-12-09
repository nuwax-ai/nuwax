# Antv-X6 工作流编辑器 V1 版本功能文档

> 本文档梳理了 V1 版本的实现功能点和支持的节点类型，作为 V2 重构时的参照标准。
> 
> 📚 **详细技术文档**: [docs/README.md](./docs/README.md) - 包含完整的文档索引和导航

## 目录

1. [支持的节点类型](#支持的节点类型)
2. [核心功能模块](#核心功能模块)
3. [组件结构](#组件结构)
4. [节点配置详情](#节点配置详情)
5. [技术栈](#技术栈)
6. [详细文档](#详细文档)

---

## 支持的节点类型

V1 版本共支持 **17+ 种节点类型**，分为以下几类：

### 1. 基础节点

| 节点类型 | 枚举值 | 说明 |
|---------|--------|------|
| 开始节点 | `Start` | 工作流入口，支持配置开场白、引导问题、全局变量 |
| 结束节点 | `End` | 工作流结束，支持配置结束回复内容 |
| 过程输出 | `Output` | 中间输出节点 |

### 2. AI 节点

| 节点类型 | 枚举值 | 说明 |
|---------|--------|------|
| 大模型节点 | `LLM` | LLM 调用，支持模型选择、提示词、技能、异常处理 |
| 知识库节点 | `Knowledge` | 知识库检索，支持搜索策略、相似度阈值配置 |
| 意图识别节点 | `IntentRecognition` | 意图分类，支持多意图分支配置 |
| 问答节点 | `QA` | 问答交互，支持直接回答和选项回答 |

### 3. 逻辑控制节点

| 节点类型 | 枚举值 | 说明 |
|---------|--------|------|
| 条件分支节点 | `Condition` | 条件判断，支持多分支、拖拽排序 |
| 循环节点 | `Loop` | 循环执行，支持数组循环、指定次数、无限循环 |
| 终止循环 | `LoopBreak` | 跳出当前循环 |
| 继续循环 | `LoopContinue` | 跳过当前迭代 |
| 代码节点 | `Code` | 自定义代码执行（JavaScript/Python） |

### 4. 数据操作节点

| 节点类型 | 枚举值 | 说明 |
|---------|--------|------|
| 变量赋值节点 | `Variable` | 变量设置和获取 |
| 文本处理 | `TextProcessing` | 字符串拼接和分割 |
| 文档提取 | `DocumentExtraction` | 文档内容提取 |
| 数据库新增 | `TableDataAdd` | 数据库插入操作 |
| 数据库删除 | `TableDataDelete` | 数据库删除操作 |
| 数据库更新 | `TableDataUpdate` | 数据库更新操作 |
| 数据库查询 | `TableDataQuery` | 数据库查询操作 |
| SQL 执行 | `TableSQL` | 自定义 SQL 执行 |

### 5. 集成节点

| 节点类型 | 枚举值 | 说明 |
|---------|--------|------|
| 插件节点 | `Plugin` | 调用已配置的插件 |
| 工作流节点 | `Workflow` | 调用子工作流 |
| MCP 节点 | `Mcp` | MCP 协议集成 |
| 长期记忆节点 | `LongTermMemory` | 长期记忆存储和检索 |
| HTTP 请求 | `HTTPRequest` | HTTP 接口调用 |

---

## 核心功能模块

### 1. 画布功能

- **节点拖拽**: 从侧边栏拖入画布创建节点
- **节点连线**: 通过连接桩 (Port) 连接节点
- **画布缩放**: 支持滚轮缩放和适配屏幕
- **画布平移**: 支持拖拽移动画布
- **框选功能**: 批量选择节点
- **撤销/重做**: Ctrl+Z / Ctrl+Shift+Z

### 2. 节点操作

- **节点复制**: Ctrl+C / Ctrl+V
- **节点删除**: Delete / Backspace
- **节点属性编辑**: 点击节点打开属性面板
- **节点重命名**: 双击节点标题编辑
- **节点移动**: 拖拽节点到新位置

### 3. 连线功能

- **连接桩点击添加**: 点击连接桩显示可添加节点菜单
- **连线验证**: 防止循环连接、重复连接
- **连线删除**: 选中连线后删除
- **条件分支连线**: 支持多出口连线

### 4. 数据管理

- **自动保存**: 定时自动保存工作流
- **版本历史**: 查看和恢复历史版本
- **导入/导出**: JSON 格式导入导出

### 5. 调试功能

- **测试运行**: 工作流测试执行
- **节点状态显示**: 执行状态实时展示
- **日志查看**: 查看执行日志

### 6. 验证功能

- **节点配置验证**: 必填项检查
- **连线完整性验证**: 检查悬空连线
- **发布前验证**: 完整性检查

---

## 组件结构

### 目录结构

```
src/pages/Antv-X6/
├── index.tsx                 # 主入口组件
├── index.less                # 主样式文件
├── component/                # V1 节点配置组件
│   ├── nodeItem.tsx          # 基础节点 (Start/End/Loop/Variable/Code/TextProcessing)
│   ├── complexNode.tsx       # 复杂节点 (LLM/Intent/QA/HTTP)
│   ├── condition.tsx         # 条件分支节点
│   ├── library.tsx           # 知识库节点
│   ├── pluginNode.tsx        # 插件/工作流节点
│   ├── database.tsx          # 数据库节点
│   ├── ExceptionItem.tsx     # 异常处理配置
│   └── commonNode.tsx        # 通用表单组件
├── components/               # 组件目录
│   ├── NodePanelDrawer/      # 节点属性面板
│   │   └── index.tsx         # 面板路由组件
│   ├── NewSkill/             # 技能组件
│   │   ├── index.tsx         # 技能列表
│   │   └── SettingModal.tsx  # 技能设置弹窗
│   └── VersionAction/        # 版本操作
├── hooks/                    # 自定义 Hooks
├── utils/                    # 工具函数
└── params.tsx                # 参数配置常量
```

### 核心组件说明

#### NodePanelDrawer (节点属性面板)

负责根据节点类型渲染对应的配置表单：

```typescript
// 节点类型到配置组件的映射
switch (nodeType) {
  case NodeTypeEnum.Start:
    return <StartNode {...commonProps} />;
  case NodeTypeEnum.LLM:
    return <ModelNode {...commonProps} />;
  case NodeTypeEnum.Condition:
    return <ConditionNode {...commonProps} />;
  case NodeTypeEnum.Knowledge:
    return <KnowledgeNode {...commonProps} />;
  case NodeTypeEnum.Plugin:
  case NodeTypeEnum.Workflow:
  case NodeTypeEnum.MCP:
  case NodeTypeEnum.LongTermMemory:
    return <PluginInNode {...commonProps} />;
  case NodeTypeEnum.TableDataAdd:
  case NodeTypeEnum.TableDataDelete:
  case NodeTypeEnum.TableDataUpdate:
  case NodeTypeEnum.TableDataQuery:
  case NodeTypeEnum.TableSQL:
    return <Database {...commonProps} />;
  // ...
}
```

#### ExceptionItem (异常处理配置)

支持以下节点的异常处理配置：
- 大模型节点 (LLM)
- 知识库节点 (Knowledge)
- 插件节点 (Plugin)
- 工作流节点 (Workflow)
- MCP 节点 (Mcp)
- 数据库节点 (TableData*)

配置项：
- 超时时间 (timeout): 默认 180 秒
- 重试次数 (retryCount): 默认 0 次
- 异常处理方式 (exceptionHandleType):
  - `INTERRUPT`: 中断执行
  - `SPECIFIC_CONTENT`: 返回特定内容
  - `EXECUTE_EXCEPTION_FLOW`: 执行异常分支

---

## 节点配置详情

> 详细的节点数据结构字段定义请参阅: [节点数据结构详情文档](./docs/NODE-DATA-STRUCTURES.md)

### 配置概览

| 节点类型 | 主要配置项 | 支持异常处理 |
|---------|-----------|-------------|
| Start | inputArgs | ❌ |
| End/Output | returnType, outputArgs, content | ❌ |
| LLM | modelId, systemPrompt, userPrompt, skillComponentConfigs | ✅ |
| Knowledge | knowledgeBaseConfigs, searchStrategy, maxRecallCount, matchingDegree | ✅ |
| IntentRecognition | intentConfigs, extraPrompt | ❌ |
| QA | question, answerType, options | ❌ |
| Condition | conditionBranchConfigs | ❌ |
| Loop | loopType, loopTimes, variableArgs | ❌ |
| Variable | configType, inputArgs/outputArgs | ❌ |
| Code | codeLanguage, codeJavaScript/codePython | ❌ |
| TextProcessing | textHandleType, text/join/splits | ❌ |
| Plugin/Workflow/MCP | inputArgs, outputArgs | ✅ |
| TableData* | tableId, conditionArgs, sql | ✅ |
| HTTPRequest | method, url, headers, body, queries | ❌ |

---

## 技术栈

### 核心依赖

| 依赖 | 版本 | 用途 |
|-----|------|------|
| @antv/x6 | ^2.x | 图编辑引擎 |
| @antv/x6-react-shape | ^2.x | React 节点渲染 |
| react | ^18.x | UI 框架 |
| antd | ^5.x | UI 组件库 |
| react-beautiful-dnd | ^13.x | 拖拽排序 |
| monaco-editor | ^0.x | 代码编辑器 |

### 状态管理

- React Context: 画布状态
- umi useModel: 全局状态 (workflow model)
- Form State: antd Form

### 样式方案

- Less: 组件样式
- CSS Modules: 样式隔离
- Ant Design Token: 主题定制

---

## 详细文档

以下是更详细的参考文档：

### 节点相关

| 文档 | 说明 |
|-----|------|
| [节点数据结构详情](./docs/NODE-DATA-STRUCTURES.md) | 各节点类型的完整数据结构字段定义，包含 TypeScript 接口和表单字段映射 |

### X6 画布相关

| 文档 | 说明 |
|-----|------|
| [X6 自定义节点](./docs/X6-CUSTOM-NODES.md) | 自定义节点注册、GeneralNode/LoopNode 组件、节点样式和尺寸计算 |
| [X6 连接桩配置](./docs/X6-PORTS.md) | 端口组配置、端口生成逻辑、特殊节点端口、端口交互事件 |
| [X6 连线实现](./docs/X6-EDGES.md) | 边配置、自定义连接器、边创建/验证/事件处理、边样式管理 |
| [X6 事件处理](./docs/X6-EVENTS.md) | 画布/节点/端口/边事件、键盘快捷键、X6 插件配置 |

### 后端交互相关

| 文档 | 说明 |
|-----|------|
| [后端 API 数据交互](./docs/API-DATA-INTERACTION.md) | 节点/连线增删改、属性更新、变量引用、位置同步、初始化/重置逻辑 |

---

## V2 重构检查清单

在进行 V2 重构时，请确保以下功能点都已实现：

### 节点类型支持

- [ ] Start - 开始节点
- [ ] End - 结束节点
- [ ] Output - 过程输出节点
- [ ] LLM - 大模型节点 (含技能模块)
- [ ] Knowledge - 知识库节点
- [ ] IntentRecognition - 意图识别节点
- [ ] QA - 问答节点
- [ ] Condition - 条件分支节点
- [ ] Loop - 循环节点
- [ ] LoopBreak - 终止循环节点
- [ ] LoopContinue - 继续循环节点
- [ ] Code - 代码节点
- [ ] Variable - 变量赋值节点
- [ ] TextProcessing - 文本处理节点
- [ ] DocumentExtraction - 文档提取节点
- [ ] TableDataAdd - 数据库新增
- [ ] TableDataDelete - 数据库删除
- [ ] TableDataUpdate - 数据库更新
- [ ] TableDataQuery - 数据库查询
- [ ] TableSQL - SQL 执行
- [ ] Plugin - 插件节点
- [ ] Workflow - 工作流节点
- [ ] Mcp - MCP 节点
- [ ] LongTermMemory - 长期记忆节点
- [ ] HTTPRequest - HTTP 请求节点

### 核心功能

- [ ] 节点拖拽创建
- [ ] 节点连线
- [ ] 连接桩点击添加节点
- [ ] 节点属性面板
- [ ] 异常处理配置
- [ ] 技能管理 (插件/工作流/MCP)
- [ ] 条件分支拖拽排序
- [ ] 变量引用查找
- [ ] 自动保存
- [ ] 版本历史
- [ ] 测试运行
- [ ] 发布验证

### 组件完整性

- [ ] NodePanelDrawer - 节点属性面板容器
- [ ] ExceptionItem - 异常处理配置组件
- [ ] ConditionNode - 条件节点配置组件
- [ ] KnowledgeNode - 知识库节点配置组件
- [ ] PluginInNode - 插件节点配置组件
- [ ] Database - 数据库节点配置组件
- [ ] SkillList - 技能列表组件
- [ ] PromptOptimizeModal - 提示词优化弹窗
- [ ] SqlOptimizeModal - SQL 生成弹窗
- [ ] Created - 组件选择弹窗

---

## 相关文件索引

| 文件路径 | 说明 |
|---------|------|
| `src/types/interfaces/node.ts` | 节点类型定义 |
| `src/types/interfaces/graph.ts` | 图相关类型定义 |
| `src/types/enums/common.ts` | 通用枚举定义 (NodeTypeEnum 等) |
| `src/types/enums/node.ts` | 节点枚举定义 |
| `src/pages/Antv-X6/component/` | V1 节点配置组件目录 |
| `src/pages/Antv-X6/components/NodePanelDrawer/` | 节点面板路由组件 |
| `src/utils/graph.ts` | 图工具函数 (showExceptionHandle 等) |

---

*文档生成时间: 2024-12*
*用于 V2 重构参照*

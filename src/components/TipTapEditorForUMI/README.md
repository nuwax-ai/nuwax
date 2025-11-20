# TipTap 编辑器组件

一个基于 TipTap 的高级富文本编辑器，支持 `{` 字符触发的变量补全和 ToolBlock 插入功能。

## 特性

- **统一触发机制**: 通过 `{` 字符同时触发变量选择和工具选择
- **变量补全**: 支持变量搜索和快速插入
- **ToolBlock 插入**: 支持工具/技能块的插入和管理
- **主题支持**: 支持亮色和暗色主题切换
- **响应式设计**: 适配各种屏幕尺寸
- **完整的类型定义**: TypeScript 友好
- **UmiJS 集成**: 无缝集成 UmiJS 生态

## 安装依赖

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention @tiptap/extension-placeholder @tiptap/pm
```

## 快速开始

### 1. 基础使用

```tsx
import TipTapEditorForUMI from '@/components/TipTapEditorForUMI';
import { variableService, toolService } from '@/services';

function MyComponent() {
  const [content, setContent] = useState('');

  const variables = variableService.getAllVariables();
  const tools = toolService.getToolTree();

  return (
    <TipTapEditorForUMI
      content={content}
      variables={variables}
      tools={tools}
      onChange={setContent}
      placeholder="请输入内容... 按 { 键开始选择"
    />
  );
}
```

### 2. 高级配置

```tsx
<TipTapEditorForUMI
  content={initialContent}
  variables={variables}
  tools={tools}
  theme="dark"
  showToolbar={true}
  minHeight={300}
  maxHeight={600}
  placeholder="自定义占位符..."
  onChange={(content) => console.log(content)}
  editorOptions={{
    autofocus: true,
    editable: true,
  }}
/>
```

### 3. 变量管理

```tsx
import { variableService } from '@/services/variableService';

// 获取所有变量
const allVariables = variableService.getAllVariables();

// 搜索变量
const searchResults = variableService.searchVariables('user');

// 添加自定义变量
variableService.addVariable({
  key: 'customVar',
  name: '自定义变量',
  description: '这是一个自定义变量',
  type: 'string',
});

// 更新变量
variableService.updateVariable('customVar', {
  description: '更新的描述',
});

// 删除变量
variableService.removeVariable('customVar');
```

### 4. 工具管理

```tsx
import { toolService } from '@/services/toolService';

// 获取所有工具
const allTools = toolService.getAllTools();

// 获取扁平化工具列表（用于搜索）
const flattenedTools = toolService.getFlattenedTools();

// 搜索工具
const searchResults = toolService.searchTools('search');

// 按分类获取
const searchTools = toolService.getToolsByCategory('信息获取');

// 获取所有分类
const categories = toolService.getCategories();

// 添加自定义工具
toolService.addTool({
  key: 'custom-tool',
  title: '自定义工具',
  description: '这是一个自定义工具',
  category: '自定义分类',
});
```

## 核心功能

### 1. 变量补全

- **触发方式**: 输入 `@` 或 `{` 字符
- **显示格式**: `{variableName}`
- **搜索功能**: 支持名称、键值、描述的模糊搜索
- **类型支持**: string, number, boolean, date, time, url, object

### 2. ToolBlock 插入

- **触发方式**: 输入 `{` 字符选择工具
- **显示格式**: `{#ToolBlock tool="toolName"#}内容{#/ToolBlock#}`
- **分类展示**: 支持树形工具分类
- **内容编辑**: ToolBlock 内容可编辑

### 3. 编辑器特性

- **富文本编辑**: 基于 TipTap 的完整富文本功能
- **主题切换**: 亮色/暗色主题
- **工具栏**: 可配置的工具栏
- **快捷键**: 支持常用快捷键
- **响应式**: 移动端友好

## API 参考

### TipTapEditorForUMI Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `content` | string | `''` | 编辑器初始内容 |
| `variables` | VariableItem[] | `[]` | 变量列表数据 |
| `tools` | ToolItem[] | `[]` | 工具列表数据 |
| `onChange` | (content: string) => void | - | 内容变化回调 |
| `theme` | 'light' \| 'dark' | `'light'` | 编辑器主题 |
| `showToolbar` | boolean | `true` | 是否显示工具栏 |
| `minHeight` | number | `200` | 编辑器最小高度 |
| `maxHeight` | number | `500` | 编辑器最大高度 |
| `placeholder` | string | `'请输入内容...'` | 占位符文本 |
| `editorOptions` | any | `{}` | TipTap 编辑器配置 |

### VariableItem 接口

```typescript
interface VariableItem {
  key: string; // 变量唯一标识符
  name: string; // 变量显示名称
  description?: string; // 变量描述
  type?: 'string' | 'number' | 'boolean' | 'date' | 'time' | 'url' | 'object';
}
```

### ToolItem 接口

```typescript
interface ToolItem {
  key: string; // 工具唯一标识符
  title: string; // 工具显示标题
  description?: string; // 工具描述
  category?: string; // 工具分类
  children?: ToolItem[]; // 子工具列表
}
```

## 服务类

### VariableService

变量管理服务，提供变量的增删改查功能。

```typescript
import { variableService } from '@/services/variableService';

// 主要方法
variableService.getAllVariables();
variableService.getVariable(key);
variableService.searchVariables(query);
variableService.addVariable(variable);
variableService.updateVariable(key, updates);
variableService.removeVariable(key);
variableService.getStats();
variableService.exportVariables();
variableService.importVariables(jsonData);
```

### ToolService

工具管理服务，提供工具的增删改查功能。

```typescript
import { toolService } from '@/services/toolService';

// 主要方法
toolService.getAllTools();
toolService.getTool(key);
toolService.getFlattenedTools();
toolService.searchTools(query);
toolService.getToolsByCategory(category);
toolService.addTool(tool);
toolService.updateTool(key, updates);
toolService.removeTool(key);
toolService.getStats();
toolService.exportTools();
toolService.importTools(jsonData);
```

## 样式定制

编辑器使用 CSS Modules 进行样式管理，主要样式文件：

- `src/components/TipTapEditorForUMI/index.less` - 主要样式文件
- `src/examples/TipTapEditorExample/index.less` - 示例页面样式

### 主要样式类

- `.tiptap-editor-wrapper` - 编辑器容器
- `.toolblock-node` - ToolBlock 节点样式
- `.mention-node` - 变量提及样式
- `.unified-suggestion-popup` - 建议弹窗样式

## 最佳实践

### 1. 性能优化

```tsx
// 使用 useMemo 缓存数据和配置
const variables = useMemo(() => variableService.getAllVariables(), []);
const tools = useMemo(() => toolService.getToolTree(), []);

// 使用 useCallback 缓存回调函数
const handleChange = useCallback((content: string) => {
  setContent(content);
}, []);
```

### 2. 错误处理

```tsx
<TipTapEditorForUMI
  variables={variables}
  tools={tools}
  onChange={(content) => {
    try {
      setContent(content);
    } catch (error) {
      console.error('Content update failed:', error);
    }
  }}
/>
```

### 3. 主题适配

```tsx
// 监听主题变化
const { data } = useUnifiedTheme();
const editorTheme = data.theme === 'dark' ? 'dark' : 'light';

<TipTapEditorForUMI
  theme={editorTheme}
  // ... 其他 props
/>;
```

## 常见问题

### Q: 如何自定义变量列表？

A: 使用 `variableService` 的相关方法：

```tsx
// 添加自定义变量
variableService.addVariable({
  key: 'myVar',
  name: '我的变量',
  description: '这是一个自定义变量',
  type: 'string',
});
```

### Q: 如何自定义工具分类？

A: 创建自定义工具树结构：

```tsx
const customTools: ToolItem[] = [
  {
    key: 'my-category',
    title: '我的分类',
    description: '自定义工具分类',
    category: '工具分类',
    children: [
      {
        key: 'my-tool',
        title: '我的工具',
        description: '自定义工具',
      },
    ],
  },
];
```

### Q: 如何禁用某些功能？

A: 通过配置控制：

```tsx
// 禁用工具栏
<TipTapEditorForUMI showToolbar={false} />

// 只显示特定变量
<TipTapEditorForUMI variables={filteredVariables} />

// 只显示特定工具
<TipTapEditorForUMI tools={filteredTools} />
```

## 示例页面

完整的示例页面位于 `/examples/tiptap-editor`，包含：

- 功能演示
- 代码示例
- 使用文档
- API 参考

访问路径：`http://localhost:8000/examples/tiptap-editor`

## 贡献指南

1. 遵循项目的 TypeScript 和 ESLint 规范
2. 为新功能添加适当的测试
3. 更新相关文档
4. 确保向后兼容性

## 许可证

MIT License

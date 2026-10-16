# TiptapVariableInput

提示词编辑器，支持变量、mentions、工具块和 HTML/XML 原文。属性以 [types.ts](types.ts) 为准，组件出口见 [index.ts](index.ts)，不在文档复制类型表。

```tsx
import TiptapVariableInput from '@/components/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';

<TiptapVariableInput
  value={prompt}
  onChange={(html) => setPrompt(extractTextFromHTML(html))}
/>;
```

- `onChange` 返回 HTML；需要纯文本存储时显式调用 `extractTextFromHTML`。`value` 是受控回填，`defaultValue` 用于初始值。
- 变量使用 `{{key}}`，默认 `variableMode="text"`；`node` 使用独立节点，`mark` 使用文本标记。变更模式需验证光标、序列化和回填。
- 撤销/重做由 `enableHistory` 显式启用，默认关闭；不要依据快捷键说明假设已启用。
- 工作流属性面板使用 `imeSafe` 避免中文组合输入期间受控回写。回填和切换可编辑状态不应触发用户编辑或自动保存，回归见根目录 `tests/tiptapVariableInput.lifecycle.test.tsx`。
- 变量补全与替换规则见 [VARIABLE_SUGGESTION_RULES.md](VARIABLE_SUGGESTION_RULES.md)；HTML/XML、Raw 节点与转义规则见 [HTML_XML_PROCESSING_RULES.md](HTML_XML_PROCESSING_RULES.md)。这些规则受扩展加载顺序影响，调整扩展时保留对应边界验证。
- 程序化编辑通过 `getEditor` 获取实例后调用命令；组件尚未挂载或已卸载时不要假设实例存在。

import { css } from '@emotion/css';
import { useCallback, useMemo, useState } from 'react';
import { createEditor, Editor, Range, Transforms } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, Slate, withReact } from 'slate-react';

// 插入变量节点的方法
const insertVariable = (editor, variable) => {
  const variableNode = {
    type: 'variable',
    variable,
    children: [{ text: '' }],
  };
  Transforms.insertNodes(editor, variableNode);
  Transforms.move(editor); // 移动光标到后面
};

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'variable':
      return (
        <span
          {...attributes}
          contentEditable={false}
          className={css`
            background: #e6f7ff;
            padding: 2px 4px;
            border-radius: 2px;
            font-family: monospace;
          `}
        >
          {{}}
          {element.variable}
          {{}}
          {children}
        </span>
      );
    default:
      return <span {...attributes}>{children}</span>;
  }
};

const withVariables = (editor) => {
  const { isInline } = editor;
  editor.isInline = (element) =>
    element.type === 'variable' ? true : isInline(element);
  return editor;
};

export default function SlateVariableEditor({ variables }) {
  const editor = useMemo(
    () => withVariables(withHistory(withReact(createEditor()))),
    [],
  );
  const [value, setValue] = useState([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ]);

  const renderElement = useCallback((props) => <Element {...props} />, []);

  const handleKeyDown = (event) => {
    if (event.key === '{') {
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        const [start] = Range.edges(selection);
        const beforeRange = Editor.before(editor, start, { unit: 'word' });
        const beforeText = Editor.string(
          editor,
          beforeRange ? Editor.range(editor, beforeRange, start) : selection,
        );
        if (beforeText.endsWith('{')) {
          event.preventDefault();
          insertVariable(editor, variables[0] || '变量');
        }
      }
    }
  };

  return (
    <div
      className={css`
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 12px;
        min-height: 100px;
      `}
    >
      <Slate editor={editor} value={value} onChange={setValue}>
        <Editable
          renderElement={renderElement}
          placeholder="请输入内容..."
          onKeyDown={handleKeyDown}
        />
      </Slate>
    </div>
  );
}

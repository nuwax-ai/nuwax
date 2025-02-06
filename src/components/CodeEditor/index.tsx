import Editor from '@monaco-editor/react';
import React from 'react';
import './index.less';
interface Props {
  value: string | undefined;
  changeCode: (code: string) => void;
  // 代码编辑器的高度
  height?: string;
}
const CodeEditor: React.FC<Props> = ({
  value,
  changeCode,
  height = '400px',
}: Props) => {
  //   通知父组件，代码发生了变化
  const handleCodeChange = (value?: string) => {
    const newValue = value || '';
    changeCode(newValue);
  };

  return (
    <div className="code-editor">
      <Editor
        height={height}
        defaultLanguage="javascript"
        theme="vs-dark"
        value={value} // 使用 value 而不是 defaultValue，使编辑器成为受控组件
        onChange={handleCodeChange}
        options={{
          selectOnLineNumbers: true,
          folding: true,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;

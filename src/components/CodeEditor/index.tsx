import Editor from '@monaco-editor/react';
import React from 'react';
import { useModel } from 'umi';
import './index.less';
interface Props {
  // 代码编辑器的高度
  height: string;
}
const CodeEditor: React.FC<Props> = ({ height = '400px' }: Props) => {
  const { code, setCode } = useModel('monaco');

  //   通知父组件，代码发生了变化
  const handleCodeChange = (value?: string) => {
    const newValue = value || '';
    setCode(newValue);
  };

  return (
    <div className="code-editor">
      <Editor
        height={height}
        defaultLanguage="javascript"
        theme="vs-dark"
        value={code} // 使用 value 而不是 defaultValue，使编辑器成为受控组件
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

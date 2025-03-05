import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { language as pythonLanguage } from 'monaco-editor/esm/vs/basic-languages/python/python';
import React, { useEffect } from 'react';
import './index.less';
interface Props {
  value: string | undefined;
  changeCode: (code: string) => void;
  // 代码编辑器的高度
  codeLanguage: 'JavaScript' | 'Python';
  height?: string;
}
const CodeEditor: React.FC<Props> = ({
  value,
  changeCode,
  height = '400px',
  codeLanguage,
}: Props) => {
  //   通知父组件，代码发生了变化
  const handleCodeChange = (value?: string) => {
    const newValue = value || '';
    changeCode(newValue);
  };

  useEffect(() => {
    // 确保在组件加载时设置语言支持
    monaco.languages.register({ id: 'python' });
    monaco.languages.setMonarchTokensProvider('python', pythonLanguage);
  }, []);

  return (
    <div className="code-editor">
      <Editor
        height={height}
        language={codeLanguage ? codeLanguage.toLowerCase() : 'javascript'}
        theme="vs-dark"
        value={value} // 使用 value 而不是 defaultValue，使编辑器成为受控组件
        onChange={handleCodeChange}
        options={{
          selectOnLineNumbers: true,
          folding: true,
          automaticLayout: true,
        }}
        beforeMount={(monaco) => {
          // 注册python语言支持
          monaco.languages.register({ id: 'python' });
        }}
      />
    </div>
  );
};

export default CodeEditor;

import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import React, { useEffect } from 'react';

interface Props {
  value: string | undefined;
  changeCode: (code: string) => void;
  codeLanguage: 'JavaScript' | 'Python' | 'JSON';
  height?: string;
}

const CodeEditor: React.FC<Props> = ({
  value,
  changeCode,
  height = '400px',
  codeLanguage,
}) => {
  useEffect(() => {
    // 配置 loader，确保加载本地资源
    loader.config({
      monaco, // 显式绑定本地实例
      paths: {
        vs: '/monaco-editor/min/vs', // 与 publicPath 一致
      },
    });

    // 配置 Web Worker 路径
    (window as any).MonacoEnvironment = {
      getWorkerUrl: (_: any, label: string) => {
        return `/monaco-editor/min/vs/${label}.worker.js`;
      },
    };
  }, []);

  const handleCodeChange = (newValue?: string) => {
    changeCode(newValue || '');
  };

  return (
    <Editor
      height={height}
      language={codeLanguage.toLowerCase()}
      theme="vs-dark"
      value={value}
      onChange={handleCodeChange}
      options={{
        selectOnLineNumbers: true,
        folding: true,
        automaticLayout: true,
      }}
    />
  );
};

export default CodeEditor;

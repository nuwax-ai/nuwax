import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
// import { language as pythonLanguage } from 'monaco-editor/esm/vs/basic-languages/python/python';
import React, { useEffect } from 'react';

import './index.less';

interface Props {
  value: string | undefined;
  changeCode: (code: string) => void;
  // 代码编辑器的高度
  codeLanguage: 'JavaScript' | 'Python' | 'JSON';
  height?: string;
}
const CodeEditor: React.FC<Props> = ({
  value,
  changeCode,
  height = '400px',
  codeLanguage,
}: Props) => {
  // 统一路径生成逻辑
  // 修改路径获取逻辑
  const getMonacoPath = () => {
    console.log(123456, process.env);
    return process.env.NODE_ENV === 'development'
      ? '/monaco-editor/vs'
      : './monaco-editor/vs';
  };

  // 在组件挂载前配置 loader
  useEffect(() => {
    loader.config({
      paths: { vs: getMonacoPath() },
      monaco: monaco,
    });
  }, []);

  const handleCodeChange = (value?: string) => {
    const newValue = value || '';
    changeCode(newValue);
  };
  return (
    <Editor
      height={height}
      className={'code-editor'}
      language={codeLanguage.toLowerCase()}
      theme="vs-dark"
      value={value}
      onChange={handleCodeChange}
      options={{
        selectOnLineNumbers: true,
        folding: true,
        automaticLayout: true,
      }}
      beforeMount={() => {
        // 修复 worker 加载路径
        (window as any).MonacoEnvironment = {
          getWorkerUrl: (_moduleId: string, label: string) => {
            return `${getMonacoPath()}/language/${label}/monaco.worker.js`;
          },
        };
      }}
    />
  );
};

export default CodeEditor;

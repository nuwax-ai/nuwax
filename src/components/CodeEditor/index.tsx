import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import React, { useEffect, useState } from 'react';

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
  const [isMonacoReady, setIsMonacoReady] = useState(false);

  useEffect(() => {
    const initializeMonaco = async () => {
      try {
        const { conf, language } = await import(
          'monaco-editor/esm/vs/basic-languages/python/python'
        );
        await loader.init();

        // 先注册Python语言配置
        monaco.languages.register({ id: 'python' });
        monaco.languages.setMonarchTokensProvider('python', language);
        monaco.languages.setLanguageConfiguration('python', conf);

        // 最后设置worker路径
        (window as any).MonacoEnvironment = {
          getWorkerUrl: function (moduleId: number, label: string) {
            if (label === 'json') {
              return '/vs/json.worker.js';
            }
            if (label === 'typescript' || label === 'javascript') {
              return '/vs/ts.worker.js';
            }
            if (label === 'python') {
              return '/vs/ts.worker.js'; // Python使用TypeScript worker
            }
            return '/vs/editor.worker.js';
          },
          getWorker: function (moduleId: string, label: string) {
            if (label === 'python') {
              return new Worker('/vs/ts.worker.js');
            }
            return null;
          },
        };

        setIsMonacoReady(true);
      } catch (error) {
        console.error('Failed to initialize Monaco Editor:', error);
      }
    };

    loader.config({
      monaco,
      paths: {
        vs: '/vs', // 确保与webpack配置一致
      },
    });

    initializeMonaco();
  }, []);

  if (!isMonacoReady) {
    return <div>Loading editor...</div>;
  }

  const handleCodeChange = (newValue?: string) => {
    changeCode(newValue || '');
  };

  return (
    <Editor
      height={height}
      // language={'python'}
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

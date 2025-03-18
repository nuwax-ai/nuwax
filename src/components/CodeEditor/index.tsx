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

        monaco.languages.register({ id: 'python' });
        monaco.languages.setMonarchTokensProvider('python', language);
        monaco.languages.setLanguageConfiguration('python', conf);

        setIsMonacoReady(true);
      } catch (error) {
        console.error('Failed to initialize Monaco Editor:', error);
      }
    };

    loader.config({
      monaco,
      paths: {
        vs: '/monaco-editor/min/vs', // 与webpack配置保持一致
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

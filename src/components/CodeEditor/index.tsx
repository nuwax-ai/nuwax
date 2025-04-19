import { ICON_CONFIRM_STAR } from '@/constants/images.constants';
import Editor, { loader } from '@monaco-editor/react';
import { FloatButton } from 'antd';
import * as monaco from 'monaco-editor';
import React, { useEffect, useState } from 'react';
import { useParams } from 'umi';
import CodeOptimizeModal from '../CodeOptimizeModal';

interface Props {
  codeLanguage: 'JavaScript' | 'Python' | 'JSON';
  height?: string;
  value?: string | undefined;
  onChange?: (code: string) => void;
}

const CodeEditor: React.FC<Props> = ({
  value = '',
  onChange,
  height = '400px',
  codeLanguage,
}) => {
  const [isMonacoReady, setIsMonacoReady] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const { agentId } = useParams();

  useEffect(() => {
    loader.config({
      monaco,
      paths: {
        vs: '/vs', // 确保与 webpack 配置一致
      },
    });

    const initializeMonaco = async () => {
      try {
        const { conf, language } = await import(
          'monaco-editor/esm/vs/basic-languages/python/python'
        );
        await loader.init();

        // 注册 Python 语言配置
        monaco.languages.register({ id: 'python' });
        monaco.languages.setMonarchTokensProvider('python', language);
        monaco.languages.setLanguageConfiguration('python', conf);

        // 设置 worker 路径
        (window as any).MonacoEnvironment = {
          getWorkerUrl: function (moduleId: number, label: string) {
            if (label === 'json') {
              return '/vs/json.worker.js';
            }
            if (label === 'typescript' || label === 'javascript') {
              return '/vs/ts.worker.js';
            }
            if (label === 'python') {
              return '/vs/ts.worker.js'; // Python 使用 TypeScript worker
            }
            return '/vs/editor.worker.js';
          },
        };

        setIsMonacoReady(true);
      } catch (error) {
        console.error('Failed to initialize Monaco Editor:', error);
      }
    };

    initializeMonaco();
  }, []);

  if (!isMonacoReady) {
    return <div>Loading editor...</div>;
  }

  const handleCodeChange = (newValue?: string) => {
    if (onChange) {
      onChange(newValue || '');
    }
    // setIsModified(true);
  };

  return (
    <>
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
      <FloatButton
        shape="circle"
        type="primary"
        style={{ insetInlineEnd: 94 }}
        icon={<ICON_CONFIRM_STAR />}
        tooltip="代码助手"
        onClick={() => {
          setOpen(true);
        }}
      />
      <CodeOptimizeModal
        id={agentId}
        open={open}
        onCancel={() => {
          setOpen(false);
        }}
        onReplace={(newValue?: string) => {
          if (!newValue) return;

          if (newValue.includes('```')) {
            newValue.replace(/```/g, '');
          }

          onChange?.(newValue || '');
        }}
        defaultValue={value}
      />
    </>
  );
};

export default CodeEditor;

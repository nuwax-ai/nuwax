import CodeOptimizeModal from '@/components/CodeOptimizeModal';
import { ICON_CONFIRM_STAR } from '@/constants/images.constants';
import { CodeLangEnum } from '@/types/enums/plugin';
import Editor, { loader } from '@monaco-editor/react';
import { FloatButton, Form } from 'antd';
import { FormInstance } from 'antd/lib/form/Form';
import * as monaco from 'monaco-editor';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import ConditionRender from '../ConditionRender';

interface Props {
  className?: string;
  codeLanguage: CodeLangEnum;
  height?: string;
  value?: string | undefined;
  onChange?: (code: string) => void;
  form?: FormInstance;
  minimap?: boolean;
  // 是否显示代码优化按钮
  codeOptimizeVisible?: boolean;
  // 设置编辑器为只读模式
  isReadOnly?: boolean;
}

const CodeEditor: React.FC<Props> = ({
  value = '',
  className,
  onChange,
  height = '400px',
  codeLanguage,
  minimap = false,
  form,
  codeOptimizeVisible = true,
  isReadOnly = false,
}) => {
  const [isMonacoReady, setIsMonacoReady] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const { testRun } = useModel('model');
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
  };

  // 根据语言类型动态配置编辑器选项
  const getEditorOptions = () => {
    const baseOptions = {
      selectOnLineNumbers: true,
      folding: true,
      automaticLayout: true,
      readOnly: isReadOnly, // 设置编辑器为只读模式
      minimap: {
        enabled: minimap,
      },
    };

    // 如果是JSON语言，关闭代码输入提示相关功能
    if (codeLanguage.toLowerCase() === 'json') {
      return {
        ...baseOptions,
        // 关闭智能感知和自动完成
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        acceptSuggestionOnEnter: 'off' as const,
        tabCompletion: 'off' as const,
        wordBasedSuggestions: false,
        // 关闭参数提示
        parameterHints: {
          enabled: false,
        },
        // 关闭悬停提示
        hover: {
          enabled: false,
        },
        // 关闭代码片段
        snippetSuggestions: 'none' as const,
      };
    }

    return baseOptions;
  };

  return (
    <>
      {form ? (
        <Form.Item
          noStyle
          name={
            form?.getFieldValue('codeLanguage') === 'JavaScript'
              ? 'codeJavaScript'
              : 'codePython'
          }
        >
          <Editor
            className={className}
            height={height}
            language={codeLanguage.toLowerCase()}
            theme="vs-dark"
            value={value}
            onChange={handleCodeChange}
            options={getEditorOptions()}
          />
        </Form.Item>
      ) : (
        <Editor
          className={className}
          height={height}
          language={codeLanguage.toLowerCase()}
          theme="vs-dark"
          value={value}
          onChange={handleCodeChange}
          options={getEditorOptions()}
        />
      )}
      <ConditionRender condition={codeOptimizeVisible}>
        {/* 代码辅助生成，增加复用写在这个文件里面 */}
        <FloatButton
          shape="circle"
          type="primary"
          style={{ insetInlineEnd: 94, display: testRun ? 'none' : 'block' }}
          icon={<ICON_CONFIRM_STAR />}
          tooltip="代码助手"
          onClick={() => {
            setOpen(true);
          }}
        />
        <CodeOptimizeModal
          title="代码助手"
          open={open}
          codeLanguage={codeLanguage}
          onCancel={() => {
            setOpen(false);
          }}
          onReplace={(newValue?: string) => {
            if (!newValue) return;

            let text = newValue;

            if (text.includes('```')) {
              text = text.replace(/```/g, '');
            }

            onChange?.(text || '');
            setOpen(false);
          }}
        />
      </ConditionRender>
    </>
  );
};

export default CodeEditor;

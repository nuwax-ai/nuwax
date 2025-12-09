/**
 * V2 代码编辑器
 * 基于 Monaco Editor 的代码编辑器
 * 完全独立，不依赖 v1 任何代码
 */

import React, { useRef, useEffect } from 'react';
import MonacoEditor, { OnMount, BeforeMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

import './CodeEditorV2.less';

// ==================== 类型定义 ====================

export interface CodeEditorV2Props {
  /** 代码内容 */
  value?: string;
  /** 变更回调 */
  onChange?: (value: string) => void;
  /** 编程语言 */
  language?: string;
  /** 高度 */
  height?: string | number;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否显示行号 */
  lineNumbers?: boolean;
  /** 是否显示小地图 */
  minimap?: boolean;
  /** 主题 */
  theme?: 'vs-dark' | 'light' | 'vs';
  /** 占位符 */
  placeholder?: string;
}

// ==================== 组件实现 ====================

const CodeEditorV2: React.FC<CodeEditorV2Props> = ({
  value = '',
  onChange,
  language = 'python',
  height = 300,
  readOnly = false,
  lineNumbers = true,
  minimap = false,
  theme = 'vs-dark',
  placeholder,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // 编辑器挂载
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // 设置编辑器选项
    editor.updateOptions({
      readOnly,
      lineNumbers: lineNumbers ? 'on' : 'off',
      minimap: { enabled: minimap },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      fontSize: 13,
      tabSize: 2,
      folding: true,
      foldingHighlight: true,
      bracketPairColorization: { enabled: true },
      guides: {
        indentation: true,
        bracketPairs: true,
      },
    });
  };

  // 编辑器挂载前
  const handleEditorWillMount: BeforeMount = (monaco) => {
    // 可以在这里注册自定义语言或主题
  };

  // 内容变更
  const handleChange = (val: string | undefined) => {
    onChange?.(val || '');
  };

  // 更新只读状态
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly });
    }
  }, [readOnly]);

  return (
    <div className="code-editor-v2">
      <MonacoEditor
        height={height}
        language={language}
        value={value}
        theme={theme}
        onChange={handleChange}
        onMount={handleEditorMount}
        beforeMount={handleEditorWillMount}
        options={{
          readOnly,
          lineNumbers: lineNumbers ? 'on' : 'off',
          minimap: { enabled: minimap },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          fontSize: 13,
          tabSize: 2,
        }}
        loading={
          <div className="code-editor-v2-loading">加载编辑器中...</div>
        }
      />
      {!value && placeholder && (
        <div className="code-editor-v2-placeholder">{placeholder}</div>
      )}
    </div>
  );
};

export default CodeEditorV2;

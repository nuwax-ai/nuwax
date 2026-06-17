import { getLanguageFromFile } from '@/utils/monacoConfig';
import * as monaco from 'monaco-editor';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';

interface MonacoDiffEditorProps {
  /** 文件ID */
  fileId: string;
  /** 文件名（用于语法高亮） */
  fileName: string;
  /** 原始文件内容（左侧） */
  originalContent: string;
  /** 修改后的文件内容（右侧） */
  modifiedContent: string;
  /** 类名 */
  className?: string;
}

/**
 * Monaco DiffEditor 组件
 * 使用 monaco.editor.createDiffEditor 展示文件修改前后的 diff 对比
 * 左侧为原始内容（只读），右侧为修改后内容（只读）
 */
const MonacoDiffEditor: React.FC<MonacoDiffEditorProps> = ({
  fileId,
  fileName,
  originalContent,
  modifiedContent,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(
    null,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const language = getLanguageFromFile(fileName);

    // 创建 DiffEditor 实例
    const diffEditor = monaco.editor.createDiffEditor(containerRef.current, {
      automaticLayout: true,
      readOnly: true,
      renderSideBySide: true,
      originalEditable: false,
      scrollBeyondLastLine: false,
      fontSize: 12,
      fontFamily:
        "'JetBrains Mono', monospace, 'Fira Code','Consolas', 'Monaco', 'Courier New'",
      lineHeight: 20,
      tabSize: 2,
      minimap: { enabled: false },
      wordWrap: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      folding: true,
      contextmenu: false,
      // diff 特有配置
      enableSplitViewResizing: true,
      renderOverviewRuler: true,
      renderMarginRevertIcon: false,
      // 禁用验证装饰
      renderValidationDecorations: 'off',
    });

    // 设置 diff model
    const originalModel = monaco.editor.createModel(originalContent, language);
    const modifiedModel = monaco.editor.createModel(modifiedContent, language);

    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    diffEditorRef.current = diffEditor;
    setIsReady(true);

    return () => {
      // 清理
      diffEditor.dispose();
      originalModel.dispose();
      modifiedModel.dispose();
      diffEditorRef.current = null;
    };
  }, [fileId]);

  // 内容变化时更新 model
  useEffect(() => {
    if (!diffEditorRef.current || !isReady) return;

    const model = diffEditorRef.current.getModel();
    if (model) {
      model.original.setValue(originalContent);
      model.modified.setValue(modifiedContent);
    }
  }, [originalContent, modifiedContent, isReady]);

  return (
    <div className={`${styles['diff-editor-wrapper']} ${className || ''}`}>
      <div ref={containerRef} className={styles['diff-editor-container']} />
    </div>
  );
};

export default MonacoDiffEditor;

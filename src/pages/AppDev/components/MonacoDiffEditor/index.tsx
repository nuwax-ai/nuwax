import { getLanguageFromFile } from '@/utils/appDevUtils';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';

interface MonacoDiffEditorProps {
  /** 原始内容（目标版本） */
  originalContent: string;
  /** 修改后内容（当前版本） */
  modifiedContent: string;
  /** 文件语言 */
  language: string;
  /** 文件名 */
  fileName: string;
  /** 高度 */
  height?: string;
  /** 类名 */
  className?: string;
}

/**
 * Monaco Diff Editor 组件
 * 用于显示文件版本对比的差异内容
 */
const MonacoDiffEditor: React.FC<MonacoDiffEditorProps> = ({
  originalContent,
  modifiedContent,
  language,
  fileName,
  height = '100%',
  className,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(
    null,
  );
  const [isMonacoReady, setIsMonacoReady] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  /**
   * 初始化 Monaco Editor
   */
  useEffect(() => {
    const initializeMonaco = async () => {
      try {
        // 配置 Monaco Editor
        loader.config({
          monaco,
          paths: {
            vs: '/vs',
          },
        });

        await loader.init();
        setIsMonacoReady(true);
      } catch (error) {
        console.error('Failed to initialize Monaco Editor:', error);
      }
    };

    initializeMonaco();
  }, []);

  /**
   * 创建 Diff Editor
   */
  const createDiffEditor = useCallback(async () => {
    if (!editorRef.current || !isMonacoReady || diffEditorRef.current) {
      return;
    }

    try {
      // 获取文件语言
      const fileLanguage = language || getLanguageFromFile(fileName);

      // 创建原始模型
      const originalModel = monaco.editor.createModel(
        originalContent,
        fileLanguage,
      );

      // 创建修改后模型
      const modifiedModel = monaco.editor.createModel(
        modifiedContent,
        fileLanguage,
      );

      // 创建 Diff Editor
      const diffEditor = monaco.editor.createDiffEditor(editorRef.current, {
        theme: 'vs-dark',
        readOnly: true,
        automaticLayout: true,
        enableSplitViewResizing: false,
        renderSideBySide: true,
        ignoreTrimWhitespace: false,
        renderIndicators: true,
        originalEditable: false,
        modifiedEditable: false,
        fontSize: 14,
        lineNumbers: 'on',
        folding: true,
        wordWrap: 'on',
        minimap: {
          enabled: false,
        },
      });

      // 设置模型
      diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel,
      });

      diffEditorRef.current = diffEditor;
      setIsEditorReady(true);

      console.log('✅ [MonacoDiffEditor] Diff Editor 创建成功');
    } catch (error) {
      console.error('❌ [MonacoDiffEditor] 创建 Diff Editor 失败:', error);
    }
  }, [isMonacoReady, originalContent, modifiedContent, language, fileName]);

  /**
   * 销毁编辑器
   */
  const disposeEditor = useCallback(() => {
    if (diffEditorRef.current) {
      diffEditorRef.current.dispose();
      diffEditorRef.current = null;
      setIsEditorReady(false);
    }
  }, []);

  /**
   * 当 Monaco 准备就绪时创建编辑器
   */
  useEffect(() => {
    if (isMonacoReady) {
      createDiffEditor();
    }

    return () => {
      disposeEditor();
    };
  }, [isMonacoReady, createDiffEditor, disposeEditor]);

  /**
   * 当内容变化时更新编辑器
   */
  useEffect(() => {
    if (diffEditorRef.current && isEditorReady) {
      const fileLanguage = language || getLanguageFromFile(fileName);

      // 更新原始模型
      const originalModel = monaco.editor.createModel(
        originalContent,
        fileLanguage,
      );

      // 更新修改后模型
      const modifiedModel = monaco.editor.createModel(
        modifiedContent,
        fileLanguage,
      );

      // 设置新模型
      diffEditorRef.current.setModel({
        original: originalModel,
        modified: modifiedModel,
      });
    }
  }, [originalContent, modifiedContent, language, fileName, isEditorReady]);

  if (!isMonacoReady) {
    return (
      <div className={`${styles.loadingContainer} ${className || ''}`}>
        <div className={styles.loadingText}>正在加载编辑器...</div>
      </div>
    );
  }

  return (
    <div
      ref={editorRef}
      className={`${styles.diffEditor} ${className || ''}`}
      style={{ height }}
    />
  );
};

export default MonacoDiffEditor;

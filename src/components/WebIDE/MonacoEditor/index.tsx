import { FileNode } from '@/models/appDev';
import {
  editorOptions,
  javascriptCompilerOptions,
  typescriptCompilerOptions,
} from '@/utils/monacoConfig';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';

interface MonacoEditorProps {
  currentFile?: FileNode | null;
  onContentChange?: (fileId: string, content: string) => void;
  className?: string;
}

/**
 * 自定义Monaco Editor组件
 * 直接使用Monaco Editor API，避免CDN加载问题
 */
const MonacoEditor: React.FC<MonacoEditorProps> = ({
  currentFile,
  onContentChange,
  className,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const [isMonacoReady, setIsMonacoReady] = useState(false);

  /**
   * 根据文件扩展名获取语言类型
   */
  const getLanguageFromFile = useCallback((fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const fileNameLower = fileName.toLowerCase();

    // 检查是否为 Vue TSX 文件
    if (
      fileNameLower.includes('.vue.tsx') ||
      fileNameLower.endsWith('.vue.tsx')
    ) {
      return 'vue-tsx';
    }

    // 检查是否为 Vue 文件
    if (ext === 'vue') {
      return 'vue';
    }

    switch (ext) {
      case 'tsx':
      case 'jsx':
        return 'typescript';
      case 'ts':
        return 'typescript';
      case 'js':
        return 'javascript';
      case 'json':
        return 'json';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'md':
        return 'markdown';
      case 'less':
        return 'less';
      case 'scss':
        return 'scss';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'cc':
        return 'cpp';
      case 'c':
        return 'c';
      case 'go':
        return 'go';
      case 'rs':
        return 'rust';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'sh':
        return 'shell';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'xml':
        return 'xml';
      case 'sql':
        return 'sql';
      default:
        return 'plaintext';
    }
  }, []);

  /**
   * 初始化Monaco Editor
   */
  const initializeMonaco = useCallback(async () => {
    if (isMonacoReady) return;

    try {
      console.log('🔧 [MonacoEditor] 开始初始化Monaco Editor...');

      // 配置Monaco Editor使用本地资源
      loader.config({
        monaco,
        paths: {
          vs: '/vs', // 确保与 webpack 配置一致
        },
      });

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

      // 初始化Monaco Editor
      await loader.init();

      // 配置TypeScript编译器选项
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
        typescriptCompilerOptions,
      );
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
        javascriptCompilerOptions,
      );

      // 设置TypeScript和JavaScript的额外库
      monaco.languages.typescript.typescriptDefaults.setExtraLibs([
        {
          content: `
            declare module 'react' {
              export * from 'react';
            }
            declare module 'react-dom' {
              export * from 'react-dom';
            }
          `,
          filePath: 'react.d.ts',
        },
      ]);

      setIsMonacoReady(true);
      console.log('✅ [MonacoEditor] Monaco Editor初始化成功');
    } catch (error) {
      console.error('❌ [MonacoEditor] Monaco Editor初始化失败:', error);
    }
  }, [isMonacoReady]);

  /**
   * 创建编辑器实例
   */
  const createEditor = useCallback(() => {
    if (!editorRef.current || !isMonacoReady) return;

    // 如果已有编辑器实例，先清理
    if (editorInstanceRef.current) {
      try {
        if (!editorInstanceRef.current.isDisposed?.()) {
          editorInstanceRef.current.dispose();
        }
      } catch (error) {
        console.warn('Monaco Editor cleanup warning:', error);
      } finally {
        editorInstanceRef.current = null;
      }
    }

    try {
      const language = currentFile
        ? getLanguageFromFile(currentFile.name)
        : 'typescript';

      // 创建编辑器实例
      const editor = monaco.editor.create(editorRef.current, {
        ...editorOptions,
        language,
        value: currentFile?.content || '',
      });

      editorInstanceRef.current = editor;

      // 监听内容变化
      editor.onDidChangeModelContent(() => {
        if (currentFile && onContentChange) {
          const value = editor.getValue();
          onContentChange(currentFile.id, value);
        }
      });

      // 添加键盘快捷键
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        console.log('💾 [MonacoEditor] Save shortcut triggered');
      });

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        () => {
          editor.getAction('editor.action.formatDocument')?.run();
        },
      );

      console.log('✅ [MonacoEditor] 编辑器实例创建成功');
    } catch (error) {
      console.error('❌ [MonacoEditor] 创建编辑器实例失败:', error);
    }
  }, [isMonacoReady, currentFile, onContentChange, getLanguageFromFile]);

  /**
   * 更新编辑器内容
   */
  const updateEditorContent = useCallback(() => {
    if (!editorInstanceRef.current || !currentFile) return;

    const language = getLanguageFromFile(currentFile.name);
    const model = editorInstanceRef.current.getModel();

    if (model) {
      // 检查内容是否真的发生了变化
      const currentValue = model.getValue();
      const newValue = currentFile.content || '';

      if (currentValue !== newValue) {
        // 更新语言
        monaco.editor.setModelLanguage(model, language);
        // 更新内容
        model.setValue(newValue);
      }
    } else {
      // 创建新模型
      const newModel = monaco.editor.createModel(
        currentFile.content || '',
        language,
      );
      editorInstanceRef.current.setModel(newModel);
    }
  }, [currentFile, getLanguageFromFile]);

  // 初始化Monaco Editor
  useEffect(() => {
    initializeMonaco();
  }, [initializeMonaco]);

  // 创建编辑器实例
  useEffect(() => {
    if (isMonacoReady) {
      createEditor();
    }
  }, [isMonacoReady, createEditor]);

  // 更新编辑器内容
  useEffect(() => {
    if (isMonacoReady && editorInstanceRef.current && currentFile) {
      updateEditorContent();
    }
  }, [isMonacoReady, updateEditorContent, currentFile]);

  // 清理资源
  useEffect(() => {
    return () => {
      if (editorInstanceRef.current) {
        try {
          // 检查编辑器是否已经被dispose
          if (!editorInstanceRef.current.isDisposed?.()) {
            editorInstanceRef.current.dispose();
          }
        } catch (error) {
          // 忽略dispose错误，避免控制台报错
          console.warn('Monaco Editor dispose warning:', error);
        } finally {
          editorInstanceRef.current = null;
        }
      }
    };
  }, []);

  if (!isMonacoReady) {
    return (
      <div className={`${styles.monacoEditor} ${className || ''}`}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⏳</div>
          <h3 className={styles.emptyTitle}>正在加载编辑器...</h3>
          <p className={styles.emptyDescription}>
            请稍候，Monaco Editor正在初始化
          </p>
        </div>
      </div>
    );
  }

  if (!currentFile) {
    return (
      <div className={`${styles.monacoEditor} ${className || ''}`}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📄</div>
          <h3 className={styles.emptyTitle}>选择文件进行编辑</h3>
          <p className={styles.emptyDescription}>
            从左侧文件树中选择一个文件，或创建新文件开始编辑
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.monacoEditor} ${className || ''}`}>
      <div className={styles.editorHeader}>
        <div className={styles.fileInfo}>
          <span className={styles.fileName}>{currentFile.name}</span>
          <span className={styles.fileLanguage}>
            {getLanguageFromFile(currentFile.name)}
          </span>
        </div>
        <div className={styles.fileStats}>
          <span className={styles.fileSize}>
            {currentFile.content?.length || 0} 字符
          </span>
        </div>
      </div>

      <div className={styles.editorContainer}>
        <div ref={editorRef} className={styles.editor} />
      </div>
    </div>
  );
};

export default MonacoEditor;

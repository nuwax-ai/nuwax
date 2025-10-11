import { FileNode } from '@/models/appDev';
import {
  editorOptions,
  getLanguageFromFile,
  javascriptCompilerOptions,
  typescriptCompilerOptions,
  vueLanguageConfig,
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
  const isCreatingRef = useRef(false);
  const isDisposingRef = useRef(false);

  /**
   * 动态加载语言支持
   */
  const loadLanguageSupport = useCallback(async (language: string) => {
    if (!language || language === 'plaintext') return;

    try {
      console.log(`📦 [MonacoEditor] 动态加载语言支持: ${language}`);

      switch (language) {
        case 'typescript':
        case 'javascript':
          // TypeScript/JavaScript 内置支持，只需配置编译器选项
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
                declare module 'vue' {
                  export * from 'vue';
                }
                // Vue类型定义
                declare global {
                  namespace JSX {
                    interface IntrinsicElements {
                      [elem: string]: any;
                    }
                  }
                }
              `,
              filePath: 'global.d.ts',
            },
          ]);
          break;

        case 'css':
          await import(
            'monaco-editor/esm/vs/basic-languages/css/css.contribution'
          );
          break;

        case 'scss':
          await import(
            'monaco-editor/esm/vs/basic-languages/scss/scss.contribution'
          );
          break;

        case 'less':
          await import(
            'monaco-editor/esm/vs/basic-languages/less/less.contribution'
          );
          break;

        case 'html':
          await import(
            'monaco-editor/esm/vs/basic-languages/html/html.contribution'
          );
          break;

        case 'vue':
          // 注册Vue语言支持
          monaco.languages.register({ id: 'vue' });

          // 设置Vue语言的语言配置
          monaco.languages.setLanguageConfiguration(
            'vue',
            vueLanguageConfig.configuration as any,
          );

          // 为Vue文件提供HTML语法高亮
          monaco.languages.setMonarchTokensProvider('vue', {
            tokenizer: {
              root: [
                // Vue模板语法 {{ }}
                [/\{\{/, 'delimiter', '@expression'],
                // HTML标签
                [/<\/?[\w-]+/, 'tag'],
                [/<!DOCTYPE[^>]*>/, 'metatag'],
                // 属性
                [/[\w-]+(?==)/, 'attribute.name'],
                [/=/, 'delimiter'],
                // 属性值
                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/'([^'\\]|\\.)*$/, 'string.invalid'],
                [/"/, 'string', '@string.double'],
                [/'/, 'string', '@string.single'],
                // 注释
                [/<!--/, 'comment', '@comment'],
              ],
              comment: [
                [/-->/, 'comment', '@pop'],
                [/[^-]+/, 'comment'],
              ],
              string: [
                [/[^\\"']+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [
                  /["']/,
                  {
                    cases: {
                      '$#==$S2': { token: 'string', next: '@pop' },
                      '@default': 'string',
                    },
                  },
                ],
              ],
              expression: [
                [/\}\}/, 'delimiter', '@pop'],
                [/[^}]+/, 'variable'],
              ],
            },
          });
          break;

        default:
          // 对于其他语言，尝试动态加载基础语言支持
          try {
            await import(
              `monaco-editor/esm/vs/basic-languages/${language}/${language}.contribution`
            );
          } catch (e) {
            console.warn(`[MonacoEditor] 无法加载语言支持: ${language}`, e);
          }
          break;
      }

      console.log(`✅ [MonacoEditor] 语言支持加载完成: ${language}`);
    } catch (error) {
      console.error(`❌ [MonacoEditor] 加载语言支持失败 (${language}):`, error);
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

      // Monaco Editor webpack plugin 会自动处理 worker 配置
      // 这里不需要手动设置 MonacoEnvironment

      // 初始化Monaco Editor
      await loader.init();

      // 使用官方方案导入HTML语言支持
      try {
        await import('monaco-editor/esm/vs/basic-languages/html/html' as any);

        // HTML语言已经在Monaco中内置注册，我们只需要增强Vue支持
        // 为Vue文件添加HTML worker支持
        console.log('✅ [MonacoEditor] HTML语言支持已加载');
      } catch (error) {
        console.warn(
          '⚠️ [MonacoEditor] HTML语言支持加载失败，使用默认配置:',
          error,
        );
      }

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
            declare module '*.vue' {
              import { DefineComponent } from 'vue'
              const component: DefineComponent<{}, {}, any>
              export default component
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
   * 安全地清理编辑器实例
   */
  const safeDisposeEditor = useCallback(async () => {
    if (isDisposingRef.current || !editorInstanceRef.current) return;

    isDisposingRef.current = true;

    try {
      const editor = editorInstanceRef.current;

      // 检查编辑器是否已经被dispose
      if (
        editor &&
        typeof editor.isDisposed === 'function' &&
        !editor.isDisposed()
      ) {
        // 获取模型并在清理编辑器之前清理模型
        try {
          const model = editor.getModel();
          if (
            model &&
            typeof model.isDisposed === 'function' &&
            !model.isDisposed()
          ) {
            try {
              model.dispose();
            } catch (modelError) {
              // 忽略模型dispose错误
              console.debug(
                'Monaco Editor model dispose error (can be ignored):',
                modelError,
              );
            }
          }
        } catch (getModelError) {
          console.debug(
            'Monaco Editor get model error (can be ignored):',
            getModelError,
          );
        }

        // 清理编辑器
        try {
          editor.dispose();
        } catch (editorError) {
          // 忽略编辑器dispose错误
          console.debug(
            'Monaco Editor dispose error (can be ignored):',
            editorError,
          );
        }
      }
    } catch (error) {
      // 忽略dispose错误，这通常是由于并发操作导致的
      console.debug('Monaco Editor dispose error (can be ignored):', error);
    } finally {
      editorInstanceRef.current = null;
      isDisposingRef.current = false;
    }
  }, []);

  /**
   * 安全地执行异步操作，处理取消错误
   */
  const safeAsyncOperation = useCallback(
    async (
      operation: () => Promise<any>,
      errorMessage: string,
    ): Promise<any> => {
      try {
        return await operation();
      } catch (error) {
        // 处理各种类型的取消错误
        if (
          error === 'Canceled' ||
          (error instanceof Error &&
            (error.message === 'Canceled' ||
              error.message.includes('disposed') ||
              error.message.includes('canceled') ||
              error.message.includes('Cancelled')))
        ) {
          console.debug(`${errorMessage} - Operation was canceled (expected)`);
          return null;
        }
        console.error(`❌ ${errorMessage}:`, error);
        return null;
      }
    },
    [],
  );

  /**
   * 创建编辑器实例
   */
  const createEditor = useCallback(async () => {
    if (!editorRef.current || !isMonacoReady || isCreatingRef.current) return;

    // 防止并发创建
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;

    try {
      // 如果已有编辑器实例，先清理
      await safeAsyncOperation(
        () => safeDisposeEditor(),
        'Monaco Editor cleanup',
      );

      const language = currentFile
        ? getLanguageFromFile(currentFile.name)
        : 'typescript';

      // 动态加载语言支持
      await safeAsyncOperation(
        () => loadLanguageSupport(language),
        `Monaco Editor language loading (${language})`,
      );

      // 检查是否在等待期间被取消
      if (isDisposingRef.current) {
        console.debug(
          'Editor creation canceled - disposal started during creation',
        );
        return;
      }

      // 创建编辑器实例
      const editor = await safeAsyncOperation(async () => {
        return monaco.editor.create(editorRef.current!, {
          ...editorOptions,
          language,
          value: currentFile?.content || '',
        });
      }, 'Monaco Editor creation');

      if (!editor) {
        console.debug('Editor creation was canceled');
        return;
      }

      editorInstanceRef.current = editor;

      // 监听内容变化
      editor.onDidChangeModelContent(() => {
        if (currentFile && onContentChange && !isDisposingRef.current) {
          const value = editor.getValue();
          onContentChange(currentFile.id, value);
        }
      });

      // 添加键盘快捷键
      try {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          console.log('💾 [MonacoEditor] Save shortcut triggered');
        });

        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
          () => {
            editor.getAction('editor.action.formatDocument')?.run();
          },
        );
      } catch (commandError) {
        console.debug(
          'Monaco Editor command registration error (can be ignored):',
          commandError,
        );
      }

      console.log('✅ [MonacoEditor] 编辑器实例创建成功');
    } finally {
      isCreatingRef.current = false;
    }
  }, [
    isMonacoReady,
    currentFile,
    onContentChange,
    getLanguageFromFile,
    loadLanguageSupport,
    safeDisposeEditor,
    safeAsyncOperation,
  ]);

  /**
   * 更新编辑器内容
   */
  const updateEditorContent = useCallback(async () => {
    if (!editorInstanceRef.current || !currentFile || isDisposingRef.current)
      return;

    const editor = editorInstanceRef.current;

    // 检查编辑器是否已经被dispose
    if (editor.isDisposed?.()) return;

    try {
      const language = getLanguageFromFile(currentFile.name);

      // 动态加载语言支持
      await loadLanguageSupport(language);

      const model = editor.getModel();

      if (model && !model.isDisposed()) {
        // 检查内容是否真的发生了变化
        const currentValue = model.getValue();
        const newValue = currentFile.content || '';

        if (currentValue !== newValue) {
          // 更新语言
          try {
            monaco.editor.setModelLanguage(model, language);
            // 更新内容
            model.setValue(newValue);
          } catch (modelError) {
            console.debug(
              'Monaco Editor model update error (can be ignored):',
              modelError,
            );
          }
        }
      } else if (editor) {
        // 创建新模型
        try {
          const newModel = monaco.editor.createModel(
            currentFile.content || '',
            language,
          );
          editor.setModel(newModel);
        } catch (createModelError) {
          console.debug(
            'Monaco Editor model creation error (can be ignored):',
            createModelError,
          );
        }
      }
    } catch (error) {
      // 忽略被取消的错误和并发错误
      if (
        error instanceof Error &&
        (error.message === 'Canceled' || error.message.includes('disposed'))
      ) {
        console.debug(
          'Monaco Editor content update was canceled or disposed (expected during rapid file switching)',
        );
      } else {
        console.error('❌ [MonacoEditor] 更新编辑器内容失败:', error);
      }
    }
  }, [currentFile, getLanguageFromFile, loadLanguageSupport]);

  // 添加全局错误处理器来捕获Monaco Editor的取消错误
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;

      // 检查是否为Monaco Editor相关的取消错误
      if (
        reason instanceof Error &&
        (reason.message === 'Canceled' ||
          reason.message.includes('disposed') ||
          reason.message.includes('canceled') ||
          reason.message.includes('Cancelled') ||
          reason.stack?.includes('monaco-editor') ||
          reason.stack?.includes('MonacoEditor'))
      ) {
        // 阻止Monaco Editor的取消错误冒泡到全局错误处理
        event.preventDefault();
        console.debug(
          'Monaco Editor promise rejected (expected during rapid operations):',
          reason,
        );
        return;
      }

      // 检查是否为其他类型的取消错误
      if (
        reason === 'Canceled' ||
        (typeof reason === 'string' &&
          reason.toLowerCase().includes('cancel')) ||
        (reason &&
          typeof reason === 'object' &&
          'message' in reason &&
          typeof reason.message === 'string' &&
          reason.message.toLowerCase().includes('cancel'))
      ) {
        event.preventDefault();
        console.debug('Operation canceled (can be ignored):', reason);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection,
      );
    };
  }, []);

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
      // 组件卸载时清理编辑器
      safeDisposeEditor();
    };
  }, [safeDisposeEditor]);

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

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

      // 设置 worker 路径
      (window as any).MonacoEnvironment = {
        getWorkerUrl: function (_moduleId: number, label: string) {
          if (label === 'json') {
            return '/vs/json.worker.js';
          }
          if (label === 'css' || label === 'scss' || label === 'less') {
            return '/vs/css.worker.js';
          }
          if (label === 'html' || label === 'vue') {
            return '/vs/html.worker.js';
          }
          if (label === 'typescript' || label === 'javascript') {
            return '/vs/ts.worker.js';
          }
          if (label === 'css' || label === 'scss' || label === 'less') {
            return '/vs/css.worker.js';
          }
          if (label === 'html' || label === 'vue') {
            return '/vs/html.worker.js';
          }
          if (label === 'python') {
            return '/vs/ts.worker.js'; // Python 使用 TypeScript worker
          }
          return '/vs/editor.worker.js';
        },
      };

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
   * 创建编辑器实例
   */
  const createEditor = useCallback(async () => {
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

      // 动态加载语言支持
      await loadLanguageSupport(language);

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
  }, [
    isMonacoReady,
    currentFile,
    onContentChange,
    getLanguageFromFile,
    loadLanguageSupport,
  ]);

  /**
   * 更新编辑器内容
   */
  const updateEditorContent = useCallback(async () => {
    if (!editorInstanceRef.current || !currentFile) return;

    const language = getLanguageFromFile(currentFile.name);

    // 动态加载语言支持
    await loadLanguageSupport(language);

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
  }, [currentFile, getLanguageFromFile, loadLanguageSupport]);

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
      // 使用setTimeout确保在下一个事件循环中清理，避免冲突
      const cleanup = () => {
        if (editorInstanceRef.current) {
          try {
            const editor = editorInstanceRef.current;

            // 先移除内容变化监听器
            if (editor._contentWidgets) {
              editor._contentWidgets.clear();
            }

            // 清理所有装饰器
            if (editor._decorations) {
              editor._decorations = [];
            }

            // 获取模型并在清理编辑器之前清理模型
            const model = editor.getModel();
            if (model && !model.isDisposed()) {
              // 先清除所有标记
              model.removeAllDecorations();
              // 清理语言服务
              if (model._languageService) {
                model._languageService.dispose();
              }
              // 最后清理模型
              model.dispose();
            }

            // 检查编辑器是否已经被dispose
            if (!editor.isDisposed?.()) {
              editor.dispose();
            }
          } catch (error) {
            // 完全忽略dispose错误
            // console.debug('Monaco Editor cleanup:', error);
          } finally {
            editorInstanceRef.current = null;
          }
        }
      };

      // 延迟清理，避免与React的清理流程冲突
      const timeoutId = setTimeout(cleanup, 0);

      return () => {
        clearTimeout(timeoutId);
      };
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

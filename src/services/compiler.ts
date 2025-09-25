import { CompileOptions, CompileResult } from '@/models/appDev';

/**
 * Babel编译器服务
 * 使用Babel Standalone进行代码编译
 */
class BabelCompilerService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 动态导入Babel Standalone
      const Babel = await import('@babel/standalone');

      // 配置Babel预设
      Babel.registerPreset('react', Babel.default.presets.react);
      Babel.registerPreset('typescript', Babel.default.presets.typescript);
      Babel.registerPreset('env', Babel.default.presets.env);

      this.initialized = true;
      console.log('✅ [Babel] Babel compiler initialized successfully');
    } catch (error) {
      console.error('❌ [Babel] Failed to initialize Babel compiler:', error);
      throw error;
    }
  }

  async compile(
    code: string,
    options: {
      jsxRuntime?: 'automatic' | 'classic';
      filename?: string;
      sourceMaps?: boolean;
    } = {},
  ): Promise<CompileResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const Babel = await import('@babel/standalone');

      const result = Babel.default.transform(code, {
        presets: [
          ['react', { runtime: options.jsxRuntime || 'automatic' }],
          ['typescript', { isTSX: true, allExtensions: true }],
          ['env', { targets: { browsers: ['last 2 versions'] } }],
        ],
        filename: options.filename || 'compiled.tsx',
        sourceMaps: options.sourceMaps || false,
        compact: false,
        retainLines: true,
      });

      return {
        code: result.code || '',
        map: result.map,
        errors: [],
      };
    } catch (error) {
      console.error('❌ [Babel] Compilation error:', error);
      return {
        code,
        errors: [
          error instanceof Error ? error.message : 'Babel compilation failed',
        ],
      };
    }
  }
}

/**
 * 编译器服务
 * 提供多种编译选项，包括Babel和SWC
 */
class CompilerService {
  private static instance: CompilerService;
  private babelService: BabelCompilerService;
  private initialized = false;

  constructor() {
    this.babelService = new BabelCompilerService();
  }

  static getInstance(): CompilerService {
    if (!CompilerService.instance) {
      CompilerService.instance = new CompilerService();
    }
    return CompilerService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔧 [Compiler] Starting compiler initialization...');

    try {
      // 初始化Babel编译器
      await this.babelService.initialize();

      this.initialized = true;
      console.log(
        '✅ [Compiler] Compiler initialization complete - using Babel',
      );
    } catch (error) {
      console.error('❌ [Compiler] Compiler initialization failed:', error);
      throw error;
    }
  }

  async compile(
    code: string,
    options: CompileOptions = {},
  ): Promise<CompileResult> {
    console.log('🚀 [Compiler] Starting compilation...');
    console.log('🔧 [Compiler] Input code length:', code.length);

    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const result = await this.babelService.compile(code, {
        jsxRuntime: options.jsc?.transform?.react?.runtime || 'automatic',
        filename: 'compiled.tsx',
        sourceMaps: options.sourceMaps || false,
      });

      console.log('✅ [Compiler] Compilation successful');
      return result;
    } catch (error) {
      console.error('❌ [Compiler] Compilation error:', error);
      return {
        code,
        errors: [error instanceof Error ? error.message : 'Compilation failed'],
      };
    }
  }

  async compileFile(filePath: string, content: string): Promise<CompileResult> {
    console.log('🔧 [Compiler] Compiling file:', filePath);

    const language = this.getLanguageFromPath(filePath);
    const options: CompileOptions = this.getOptionsForLanguage(language);

    console.log('🔧 [Compiler] Language detected:', language);
    console.log('🔧 [Compiler] Compiler options:', options);

    return this.compile(content, options);
  }

  private getLanguageFromPath(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return 'tsx';
      case 'ts':
        return 'typescript';
      case 'js':
        return 'javascript';
      case 'json':
        return 'json';
      default:
        return 'plaintext';
    }
  }

  private getOptionsForLanguage(language: string): CompileOptions {
    switch (language) {
      case 'tsx':
        return {
          jsc: {
            target: 'es2022',
            parser: {
              syntax: 'typescript',
              tsx: true,
            },
            transform: {
              react: {
                runtime: 'automatic',
              },
            },
          },
          module: {
            type: 'es6',
          },
        };

      case 'typescript':
        return {
          jsc: {
            target: 'es2022',
            parser: {
              syntax: 'typescript',
            },
          },
          module: {
            type: 'es6',
          },
        };

      case 'javascript':
        return {
          jsc: {
            target: 'es2022',
            parser: {
              syntax: 'jsx',
            },
            transform: {
              react: {
                runtime: 'automatic',
              },
            },
          },
          module: {
            type: 'es6',
          },
        };

      default:
        return {
          jsc: {
            target: 'es2022',
            parser: {
              syntax: 'ecmascript',
            },
          },
          module: {
            type: 'es6',
          },
        };
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// 导出单例实例
export const compilerService = CompilerService.getInstance();
export default compilerService;

/**
 * Monaco Editor 配置
 * 确保使用本地资源而不是CDN
 */

// 配置Monaco Editor使用本地资源
export const monacoConfig = {
  paths: {
    vs: '/vs', // 使用本地复制的Monaco Editor资源
  },
};

// 支持的文件类型和对应的Monaco语言
export const languageMap: Record<string, string> = {
  // TypeScript/JavaScript
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',

  // 样式文件
  css: 'css',
  less: 'less',
  scss: 'scss',
  sass: 'scss',

  // HTML和模板
  html: 'html',
  htm: 'html',
  vue: 'html', // Vue暂时使用HTML高亮

  // 其他常用语言
  json: 'json',
  md: 'markdown',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
};

// 获取语言类型的函数
export const getLanguageFromFile = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  // 特殊处理Vue文件
  if (ext === 'vue') {
    return 'html';
  }

  return languageMap[ext || ''] || 'plaintext';
};

// 配置Monaco Editor的TypeScript编译器选项
export const typescriptCompilerOptions = {
  target: 5, // ES2020
  allowNonTsExtensions: true,
  moduleResolution: 2, // NodeJs
  module: 5, // ESNext
  noEmit: true,
  esModuleInterop: true,
  jsx: 2, // React
  reactNamespace: 'React',
  allowJs: true,
  typeRoots: ['node_modules/@types'],
  lib: ['ES2020', 'DOM', 'DOM.Iterable'],
  skipLibCheck: true,
  strict: false,
  forceConsistentCasingInFileNames: true,
  resolveJsonModule: true,
  isolatedModules: true,
  noEmitOnError: true,
};

// 配置Monaco Editor的JavaScript编译器选项
export const javascriptCompilerOptions = {
  target: 5, // ES2020
  allowNonTsExtensions: true,
  moduleResolution: 2, // NodeJs
  module: 5, // ESNext
  noEmit: true,
  esModuleInterop: true,
  jsx: 2, // React
  reactNamespace: 'React',
  allowJs: true,
  lib: ['ES2020', 'DOM', 'DOM.Iterable'],
  skipLibCheck: true,
  strict: false,
  forceConsistentCasingInFileNames: true,
  resolveJsonModule: true,
  isolatedModules: true,
  noEmitOnError: true,
};

// Vue语法高亮配置
export const vueLanguageConfig = {
  // 自定义Vue语言的token provider
  id: 'vue',
  extensions: ['.vue'],
  aliases: ['Vue', 'vue'],

  // 基础配置
  configuration: {
    comments: {
      blockComment: ['<!--', '-->'],
      lineComment: '//',
    },
    brackets: [
      ['<!--', '-->'],
      ['<', '>'],
      ['{', '}'],
      ['(', ')'],
      ['[', ']'],
    ],
    autoClosingPairs: [
      { open: '<', close: '>' },
      { open: '{', close: '}' },
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [
      { open: '<', close: '>' },
      { open: '{', close: '}' },
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  },
};

// 配置Monaco Editor的编辑器选项
export const editorOptions = {
  automaticLayout: true,
  scrollBeyondLastLine: false,
  fontSize: 14,
  tabSize: 2,
  minimap: { enabled: false },
  wordWrap: 'on' as const,
  lineNumbers: 'on' as const,
  renderLineHighlight: 'all' as const,
  selectOnLineNumbers: true,
  matchBrackets: 'always' as const,
  autoIndent: 'advanced' as const,
  formatOnPaste: true,
  formatOnType: true,
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  parameterHints: { enabled: true },
  // 启用自动保存
  autoSave: 'afterDelay' as const,
  autoSaveDelay: 1000,
  // 启用代码折叠
  folding: true,
  foldingStrategy: 'indentation' as const,
  // 启用自动闭合
  autoClosingBrackets: 'always' as const,
  autoClosingQuotes: 'always' as const,
  // 启用智能缩进
  smartIndent: true,
  // 启用拖拽选择
  dragAndDrop: true,
  // 启用多光标
  multiCursorModifier: 'ctrlCmd' as const,
  // 启用代码片段
  acceptSuggestionOnEnter: 'on' as const,
  // 启用悬停提示
  hover: {
    enabled: true,
    delay: 300,
  },
  // 启用代码补全
  suggest: {
    showKeywords: true,
    showSnippets: true,
    showFunctions: true,
    showConstructors: true,
    showFields: true,
    showVariables: true,
    showClasses: true,
    showStructs: true,
    showInterfaces: true,
    showModules: true,
    showProperties: true,
    showEvents: true,
    showOperators: true,
    showUnits: true,
    showValues: true,
    showConstants: true,
    showEnums: true,
    showEnumMembers: true,
    showColors: true,
    showFiles: true,
    showReferences: true,
    showFolders: true,
    showTypeParameters: true,
    showIssues: true,
    showUsers: true,
    showWords: true,
  },
};

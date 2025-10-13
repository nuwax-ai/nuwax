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
  mjs: 'javascript',
  cjs: 'javascript',

  // 样式文件
  css: 'css',
  less: 'less',
  scss: 'scss',
  sass: 'scss',

  // HTML和模板
  html: 'html',
  htm: 'html',
  vue: 'html', // Vue文件暂时使用HTML渲染

  // 配置文件
  json: 'json',
  jsonc: 'jsonc',
  json5: 'json',
  md: 'markdown',
  markdown: 'markdown',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  cfg: 'ini',
  conf: 'ini',

  // 编程语言
  py: 'python',
  python: 'python',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  swift: 'swift',
  kt: 'kotlin',
  scala: 'scala',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  fish: 'shell',
  ps1: 'powershell',
  ps: 'powershell',
  bat: 'bat',
  cmd: 'bat',

  // 数据库
  sql: 'sql',
  mysql: 'sql',
  pgsql: 'sql',
  sqlite: 'sql',

  // 其他
  dockerfile: 'dockerfile',
  dockerignore: 'plaintext',
  gitignore: 'plaintext',
  gitattributes: 'plaintext',
  env: 'plaintext',
  envlocal: 'plaintext',
  envdev: 'plaintext',
  envprod: 'plaintext',
  txt: 'plaintext',
  log: 'plaintext',
  lock: 'plaintext',
  lockb: 'plaintext',
};

// 获取语言类型的函数
export const getLanguageFromFile = (fileName: string): string => {
  if (!fileName || typeof fileName !== 'string') {
    return 'plaintext';
  }

  const fileNameLower = fileName.toLowerCase();

  // 特殊文件名处理（无扩展名但已知类型）
  const specialFiles: Record<string, string> = {
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    rakefile: 'ruby',
    gemfile: 'ruby',
    podfile: 'ruby',
    vagrantfile: 'ruby',
    berksfile: 'ruby',
    cheffile: 'ruby',
    capfile: 'ruby',
    'config.ru': 'ruby',
    guardfile: 'ruby',
    fastfile: 'ruby',
    appfile: 'ruby',
    matchfile: 'ruby',
    snapfile: 'ruby',
    scanfile: 'ruby',
    gymfile: 'ruby',
    deliverfile: 'ruby',
    pilotfile: 'ruby',
    precheckfile: 'ruby',
    supplyfile: 'ruby',
    screengrabfile: 'ruby',
  };

  // 检查特殊文件名
  if (specialFiles[fileNameLower]) {
    return specialFiles[fileNameLower];
  }

  // 处理带点的文件名
  const parts = fileName.split('.');
  if (parts.length < 2) {
    return 'plaintext';
  }

  const ext = parts.pop()?.toLowerCase();
  if (!ext) {
    return 'plaintext';
  }

  // 处理复合扩展名
  const compoundExts: Record<string, string> = {
    'd.ts': 'typescript',
    vue: 'vue',
    jsx: 'javascript',
    tsx: 'typescript',
    mjs: 'javascript',
    cjs: 'javascript',
  };

  // 检查复合扩展名
  if (parts.length > 1) {
    const lastTwoParts = parts.slice(-2).join('.');
    if (compoundExts[lastTwoParts]) {
      return compoundExts[lastTwoParts];
    }
  }

  // 返回对应的语言类型，如果不存在则返回 plaintext
  return languageMap[ext] || 'plaintext';
};

// 检查文件类型是否被支持
export const isSupportedFileType = (fileName: string): boolean => {
  const language = getLanguageFromFile(fileName);
  return language !== 'plaintext';
};

// 获取文件类型的显示名称
export const getFileTypeDisplayName = (fileName: string): string => {
  const language = getLanguageFromFile(fileName);

  const displayNames: Record<string, string> = {
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    css: 'CSS',
    less: 'Less',
    scss: 'SCSS',
    html: 'HTML',
    vue: 'Vue',
    json: 'JSON',
    jsonc: 'JSON with Comments',
    markdown: 'Markdown',
    xml: 'XML',
    yaml: 'YAML',
    toml: 'TOML',
    ini: 'INI',
    python: 'Python',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    csharp: 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    go: 'Go',
    rust: 'Rust',
    swift: 'Swift',
    kotlin: 'Kotlin',
    scala: 'Scala',
    shell: 'Shell',
    powershell: 'PowerShell',
    bat: 'Batch',
    sql: 'SQL',
    dockerfile: 'Dockerfile',
    makefile: 'Makefile',
    plaintext: 'Plain Text',
  };

  return displayNames[language] || 'Unknown';
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

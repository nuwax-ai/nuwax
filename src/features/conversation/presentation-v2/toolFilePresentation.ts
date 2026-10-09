/**
 * V2 工具详情「文件路径」展示纯函数：路径拆段 + 扩展名徽标映射。
 * 纯模块（不依赖 umi/antd/i18n），供 ToolNodeDetail 渲染与 vitest 直接使用。
 * 2026-09-14 商讨定调：跳转关闭 + 徽标统一中性灰，语言社区配色已随可点样式一并移除，
 * 仅保留类型缩写徽标。
 */

/**
 * 会话沙箱工作区路径：/home/user/{数字会话ID}/...。
 * 其余（如 /home/user/Desktop/a.md）按原样完整展示。
 */
const SANDBOX_HOME_PATTERN = /^\/home\/user\/\d+\//;

/** 是否为会话沙箱工作区路径；否则（如 /home/user/Desktop/x.md）按原样完整展示 */
export function isConversationSandboxPath(target: string): boolean {
  return SANDBOX_HOME_PATTERN.test(target ?? '');
}

export interface SandboxFilePathParts {
  /** 文件所在目录（不含结尾斜杠；根目录文件为空串） */
  dir: string;
  /** 文件名（含扩展名） */
  name: string;
  /** 小写扩展名（不含点；无扩展名/点开头的隐藏文件为空串） */
  ext: string;
}

/** 把路径拆成目录与文件名；容忍结尾斜杠，点开头的隐藏文件不算扩展名 */
export function splitFilePath(target: string): SandboxFilePathParts {
  const normalized = (target ?? '').replace(/\/+$/, '');
  const slashIndex = normalized.lastIndexOf('/');
  const name = slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized;
  const dir = slashIndex >= 0 ? normalized.slice(0, slashIndex) : '';
  const dotIndex = name.lastIndexOf('.');
  const ext = dotIndex > 0 ? name.slice(dotIndex + 1).toLowerCase() : '';
  return { dir, name, ext };
}

export interface FileTypeInfo {
  /** 徽标缩写（如 TS / MD） */
  label: string;
}

/** 常见扩展名 → 徽标缩写映射 */
const EXT_TYPE_MAP: Record<string, string> = {
  ts: 'TS',
  tsx: 'TSX',
  js: 'JS',
  jsx: 'JSX',
  mjs: 'JS',
  cjs: 'JS',
  json: 'JSON',
  md: 'MD',
  markdown: 'MD',
  css: 'CSS',
  less: 'LESS',
  scss: 'SCSS',
  sass: 'SASS',
  html: 'HTML',
  htm: 'HTML',
  xml: 'XML',
  yml: 'YML',
  yaml: 'YML',
  py: 'PY',
  sh: 'SH',
  bash: 'SH',
  zsh: 'SH',
  go: 'GO',
  rs: 'RS',
  java: 'JAVA',
  c: 'C',
  h: 'C',
  cpp: 'C++',
  cc: 'C++',
  hpp: 'C++',
  php: 'PHP',
  rb: 'RB',
  sql: 'SQL',
  vue: 'VUE',
  svg: 'SVG',
  png: 'IMG',
  jpg: 'IMG',
  jpeg: 'IMG',
  gif: 'IMG',
  webp: 'IMG',
  mp4: 'VIDEO',
  mov: 'VIDEO',
  webm: 'VIDEO',
  mp3: 'AUDIO',
  wav: 'AUDIO',
  flac: 'AUDIO',
  zip: 'ZIP',
  gz: 'ZIP',
  tar: 'ZIP',
  rar: 'ZIP',
  pdf: 'PDF',
  txt: 'TXT',
  log: 'LOG',
  env: 'ENV',
};

/** 按文件名取徽标信息；未知扩展名给大写缩写（无扩展名归为 FILE） */
export function getFileTypeInfo(fileName: string): FileTypeInfo {
  const { ext } = splitFilePath(fileName);
  const label = EXT_TYPE_MAP[ext];
  if (label) {
    return { label };
  }
  return { label: (ext || 'file').slice(0, 4).toUpperCase() };
}

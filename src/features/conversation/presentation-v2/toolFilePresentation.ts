/**
 * V2 工具详情「文件路径」展示纯函数：路径拆段 + 扩展名徽标映射。
 * 纯模块（不依赖 umi/antd/i18n），供 ToolNodeDetail 渲染与 vitest 直接使用。
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
  /** 徽标底色 */
  bg: string;
  /** 徽标文字色；浅底色徽标需深色文字，缺省白色 */
  color?: string;
}

const DARK_TEXT = '#1f2328';

/** 常见扩展名 → 徽标映射；配色取各语言社区惯用色 */
const EXT_TYPE_MAP: Record<string, FileTypeInfo> = {
  ts: { label: 'TS', bg: '#3178c6' },
  tsx: { label: 'TSX', bg: '#3178c6' },
  js: { label: 'JS', bg: '#f7df1e', color: DARK_TEXT },
  jsx: { label: 'JSX', bg: '#f7df1e', color: DARK_TEXT },
  mjs: { label: 'JS', bg: '#f7df1e', color: DARK_TEXT },
  cjs: { label: 'JS', bg: '#f7df1e', color: DARK_TEXT },
  json: { label: 'JSON', bg: '#c98a2d' },
  md: { label: 'MD', bg: '#6a5af9' },
  markdown: { label: 'MD', bg: '#6a5af9' },
  css: { label: 'CSS', bg: '#2965f1' },
  less: { label: 'LESS', bg: '#2f5aa8' },
  scss: { label: 'SCSS', bg: '#c6538c' },
  sass: { label: 'SASS', bg: '#c6538c' },
  html: { label: 'HTML', bg: '#e34c26' },
  htm: { label: 'HTML', bg: '#e34c26' },
  xml: { label: 'XML', bg: '#8a8f98' },
  yml: { label: 'YML', bg: '#8a63d2' },
  yaml: { label: 'YML', bg: '#8a63d2' },
  py: { label: 'PY', bg: '#3572a5' },
  sh: { label: 'SH', bg: '#4a5568' },
  bash: { label: 'SH', bg: '#4a5568' },
  zsh: { label: 'SH', bg: '#4a5568' },
  go: { label: 'GO', bg: '#00add8' },
  rs: { label: 'RS', bg: '#dea584', color: DARK_TEXT },
  java: { label: 'JAVA', bg: '#b07219' },
  c: { label: 'C', bg: '#03599c' },
  h: { label: 'C', bg: '#03599c' },
  cpp: { label: 'C++', bg: '#f34b7d' },
  cc: { label: 'C++', bg: '#f34b7d' },
  hpp: { label: 'C++', bg: '#f34b7d' },
  php: { label: 'PHP', bg: '#4f5d95' },
  rb: { label: 'RB', bg: '#701516' },
  sql: { label: 'SQL', bg: '#e38c00' },
  vue: { label: 'VUE', bg: '#41b883' },
  svg: { label: 'SVG', bg: '#ffb13b', color: DARK_TEXT },
  png: { label: 'IMG', bg: '#8a63d2' },
  jpg: { label: 'IMG', bg: '#8a63d2' },
  jpeg: { label: 'IMG', bg: '#8a63d2' },
  gif: { label: 'IMG', bg: '#8a63d2' },
  webp: { label: 'IMG', bg: '#8a63d2' },
  mp4: { label: 'VIDEO', bg: '#b3543f' },
  mov: { label: 'VIDEO', bg: '#b3543f' },
  webm: { label: 'VIDEO', bg: '#b3543f' },
  mp3: { label: 'AUDIO', bg: '#0f9d8f' },
  wav: { label: 'AUDIO', bg: '#0f9d8f' },
  flac: { label: 'AUDIO', bg: '#0f9d8f' },
  zip: { label: 'ZIP', bg: '#8a8f98' },
  gz: { label: 'ZIP', bg: '#8a8f98' },
  tar: { label: 'ZIP', bg: '#8a8f98' },
  rar: { label: 'ZIP', bg: '#8a8f98' },
  pdf: { label: 'PDF', bg: '#e03e52' },
  txt: { label: 'TXT', bg: '#8a8f98' },
  log: { label: 'LOG', bg: '#8a8f98' },
  env: { label: 'ENV', bg: '#ecd53f', color: DARK_TEXT },
};

const UNKNOWN_TYPE_BG = '#8a8f98';

/** 按文件名取徽标信息；未知扩展名给中性灰底 + 大写缩写（无扩展名归为 FILE） */
export function getFileTypeInfo(fileName: string): FileTypeInfo {
  const { ext } = splitFilePath(fileName);
  const mapped = EXT_TYPE_MAP[ext];
  if (mapped) {
    return mapped;
  }
  return {
    bg: UNKNOWN_TYPE_BG,
    label: (ext || 'file').slice(0, 4).toUpperCase(),
  };
}

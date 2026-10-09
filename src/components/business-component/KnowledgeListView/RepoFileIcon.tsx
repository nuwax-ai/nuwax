/**
 * 资料库文件图标：复刻 nuwax-repo-web 资料库的线性文件图标体系
 * （lucide 风格 24×24 描边图形 + 类型配色），映射规则与 repo-web
 * PageTree 的 docIconFor 对齐——pageType（folder/sheet/datatable）优先，
 * 其余按 fileType 扩展名匹配（pptx 橙 / html 紫 / pdf 红 / 表格绿 /
 * 代码数据青），md/txt/doc 及未知回落默认文档蓝。
 * 外层 40px 圆形 tinted 底与技能/专家/连接器网格卡图标口径一致。
 */
import React from 'react';

/** 单个线性图标绘制内容（stroke=currentColor,由外层 svg 承载描边属性） */
type IconGlyph = React.ReactNode;

/** 文档页：圆角矩形 + 两条文字线（默认蓝,md/txt/doc 及未知回落） */
const DOC_GLYPH: IconGlyph = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="11.5" x2="15" y2="11.5" />
    <line x1="9" y1="15.5" x2="13" y2="15.5" />
  </>
);

/** 演示文稿：标题线 + 播放三角（ppt/pptx 橙） */
const PPT_GLYPH: IconGlyph = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="11" x2="15" y2="11" />
    <path d="m10.2 14.3 3.8 2.15-3.8 2.15z" fill="currentColor" stroke="none" />
  </>
);

/** 网页：尖括号对（html/htm 紫） */
const HTML_GLYPH: IconGlyph = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <polyline points="10 10.6 7.2 12.8 10 15" />
    <polyline points="14 10.6 16.8 12.8 14 15" />
  </>
);

/** PDF：单条文字线（与默认文档的两条线区分,红） */
const PDF_GLYPH: IconGlyph = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="12" x2="15" y2="12" />
  </>
);

/** 表格：表头横线 + 首列竖线（xls/xlsx/csv 与 sheet 页同款,绿） */
const TABLE_GLYPH: IconGlyph = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="9" x2="9" y2="21" />
  </>
);

/** 多维表格：多行多列网格（datatable 页,深青） */
const DATATABLE_GLYPH: IconGlyph = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="8.5" x2="21" y2="8.5" />
    <line x1="3" y1="14" x2="21" y2="14" />
    <line x1="9" y1="8.5" x2="9" y2="21" />
    <line x1="15" y1="8.5" x2="15" y2="21" />
  </>
);

/** 代码数据文件：长短不一的代码行（json/xml/yml/yaml/log,青） */
const CODE_GLYPH: IconGlyph = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="11" x2="13" y2="11" />
    <line x1="9" y1="14" x2="11" y2="14" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </>
);

/** 目录：文件夹形（space 树中的目录节点,深灰） */
const FOLDER_GLYPH: IconGlyph = (
  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
);

/** 图标配色：前景色 + tinted 底色（与技能卡 tinted 底口径一致的 12% 透明度） */
interface RepoFileIconTheme {
  color: string;
  bg: string;
}

/** 类型 → 图标 + 配色（色值对齐 nuwax-repo-web 资料库 App.css 类型着色） */
const ICON_THEME_DOC: RepoFileIconTheme = {
  color: '#3370ff',
  bg: 'rgba(51, 112, 255, 12%)',
};
const ICON_THEME_TABLE: RepoFileIconTheme = {
  color: '#00b96b',
  bg: 'rgba(0, 185, 107, 12%)',
};
const ICON_THEME_DATATABLE: RepoFileIconTheme = {
  color: '#14a7b8',
  bg: 'rgba(20, 167, 184, 12%)',
};
const ICON_THEME_FOLDER: RepoFileIconTheme = {
  color: '#4e5769',
  bg: 'rgba(78, 87, 105, 12%)',
};

interface RepoFileIconRule {
  glyph: IconGlyph;
  theme: RepoFileIconTheme;
}

/** 扩展名（小写）→ 图标规则;色板对齐 repo-web DOC_ICON_RULES 着色 */
const EXT_ICON_RULES: Record<string, RepoFileIconRule> = {
  ppt: {
    glyph: PPT_GLYPH,
    theme: { color: '#ff7d00', bg: 'rgba(255, 125, 0, 12%)' },
  },
  pptx: {
    glyph: PPT_GLYPH,
    theme: { color: '#ff7d00', bg: 'rgba(255, 125, 0, 12%)' },
  },
  html: {
    glyph: HTML_GLYPH,
    theme: { color: '#722ed1', bg: 'rgba(114, 46, 209, 12%)' },
  },
  htm: {
    glyph: HTML_GLYPH,
    theme: { color: '#722ed1', bg: 'rgba(114, 46, 209, 12%)' },
  },
  pdf: {
    glyph: PDF_GLYPH,
    theme: { color: '#f53f3f', bg: 'rgba(245, 63, 63, 12%)' },
  },
  xls: { glyph: TABLE_GLYPH, theme: ICON_THEME_TABLE },
  xlsx: { glyph: TABLE_GLYPH, theme: ICON_THEME_TABLE },
  csv: { glyph: TABLE_GLYPH, theme: ICON_THEME_TABLE },
  json: {
    glyph: CODE_GLYPH,
    theme: { color: '#13c2c2', bg: 'rgba(19, 194, 194, 12%)' },
  },
  xml: {
    glyph: CODE_GLYPH,
    theme: { color: '#13c2c2', bg: 'rgba(19, 194, 194, 12%)' },
  },
  yml: {
    glyph: CODE_GLYPH,
    theme: { color: '#13c2c2', bg: 'rgba(19, 194, 194, 12%)' },
  },
  yaml: {
    glyph: CODE_GLYPH,
    theme: { color: '#13c2c2', bg: 'rgba(19, 194, 194, 12%)' },
  },
  log: {
    glyph: CODE_GLYPH,
    theme: { color: '#13c2c2', bg: 'rgba(19, 194, 194, 12%)' },
  },
};

/** pageType（folder/sheet/datatable）→ 图标规则,优先于扩展名（repo-web 同序） */
const PAGE_TYPE_ICON_RULES: Record<string, RepoFileIconRule> = {
  folder: { glyph: FOLDER_GLYPH, theme: ICON_THEME_FOLDER },
  sheet: { glyph: TABLE_GLYPH, theme: ICON_THEME_TABLE },
  datatable: { glyph: DATATABLE_GLYPH, theme: ICON_THEME_DATATABLE },
};

const DEFAULT_RULE: RepoFileIconRule = {
  glyph: DOC_GLYPH,
  theme: ICON_THEME_DOC,
};

/** 标题后缀启发式可识别的扩展名集合（「…v2.0」之类数字尾巴不匹配） */
const TITLE_SUFFIX_EXTS = new Set(Object.keys(EXT_ICON_RULES));

export interface RepoFileIconProps {
  /** 文档类型（sourceExt 优先、pageType 回落的统一大写口径） */
  fileType?: string;
  /** 页面类型（folder/sheet/datatable/doc） */
  pageType?: string;
  /** 名称（fileType 缺失时按标题后缀启发式兜底） */
  name?: string;
  className?: string;
}

/**
 * 解析图标规则：pageType 命中 folder/sheet/datatable 优先（目录/表格
 * 是页面形态而非导入文件）；否则按 fileType 小写扩展名匹配；均未命中
 * 且 fileType 为空时按名称后缀启发式（对齐 repo-web docIconFor）;
 * 最终回落默认文档图标（md/txt/doc 及未知均蓝色文档）。
 */
const resolveIconRule = ({
  fileType,
  pageType,
  name,
}: Omit<RepoFileIconProps, 'className'>): RepoFileIconRule => {
  const pageRule = PAGE_TYPE_ICON_RULES[(pageType ?? '').toLowerCase()];
  if (pageRule) {
    return pageRule;
  }
  const ext = (fileType ?? '').toLowerCase();
  if (ext !== '') {
    return EXT_ICON_RULES[ext] ?? DEFAULT_RULE;
  }
  const suffix = /\.([a-z0-9]{1,8})$/i.exec(name ?? '')?.[1]?.toLowerCase();
  if (suffix && TITLE_SUFFIX_EXTS.has(suffix)) {
    return EXT_ICON_RULES[suffix];
  }
  return DEFAULT_RULE;
};

const RepoFileIcon: React.FC<RepoFileIconProps> = ({
  fileType,
  pageType,
  name,
  className,
}) => {
  const { glyph, theme } = resolveIconRule({ fileType, pageType, name });
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{ backgroundColor: theme.bg, color: theme.color }}
    >
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyph}
      </svg>
    </span>
  );
};

export default RepoFileIcon;

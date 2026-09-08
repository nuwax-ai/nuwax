/**
 * V2 投影 · 消息文本容错词法解析器。
 *
 * 消息 text 内嵌两类「纯属性自定义标签」（与 plugins/ds-markdown-process、
 * plugins/ds-markdown-think 的写入协议一致）：
 *   <div><markdown-custom-process executeId=".." type=".." status=".." name=".."></markdown-custom-process></div>
 *   <div><markdown-custom-think status="thinking|finished" content="encodeURIComponent(..)"></markdown-custom-think></div>
 *
 * 本解析器把 text 切分为有序段（think / process / 正文 / unknown），供
 * projectConversation 组装结构化节点。约束（spec「异常与失败场景」）：
 * - 任何畸形输入产出 unknown 段，绝不抛异常；
 * - 保持原始顺序；
 * - 与 MarkdownRenderer/utils.ts 的分组正则兼容（可选 div/p 包装、SSE 转义引号）。
 */

export interface ThinkSegment {
  type: 'think';
  status: 'thinking' | 'finished';
  content: string;
}

export interface ProcessSegment {
  type: 'process';
  executeId?: string;
  componentType?: string;
  status?: string;
  name?: string;
}

export interface TextSegment {
  type: 'text';
  content: string;
}

export interface UnknownSegment {
  type: 'unknown';
  content: string;
}

export type MessageSegment =
  | ThinkSegment
  | ProcessSegment
  | TextSegment
  | UnknownSegment;

/** 主正则：process/think 标签 + 可选 div/p 包装（与 groupMarkdownProcesses 同一约定） */
const TAG_WITH_WRAPPER_REGEX =
  /(?:\s*<(?:div|p)>\s*)?<markdown-custom-(process|think)\b[^>]*>(?:<\/markdown-custom-\1>)?(?:\s*<\/(?:div|p)>\s*)?/g;

const GENERIC_ATTR_REGEX = /([a-zA-Z][a-zA-Z0-9]*)\s*=\s*"([^"]*)"/g;

/** 读取标签全部属性。先归一化 SSE 转义引号（\\" 与 \\'），再做通用双引号属性扫描。 */
const readTagAttrs = (tag: string): Record<string, string> => {
  const normalized = tag.replace(/\\"/g, '"').replace(/\\'/g, "'");
  const attrs: Record<string, string> = {};
  GENERIC_ATTR_REGEX.lastIndex = 0;
  let matched: RegExpExecArray | null;
  while ((matched = GENERIC_ATTR_REGEX.exec(normalized)) !== null) {
    attrs[matched[1]] = matched[2];
  }
  return attrs;
};

const decodeNameAttr = (raw: string): string => {
  try {
    return decodeURIComponent(raw);
  } catch {
    // 属性被 HTML 实体编码的历史数据：解一层常见实体后原样返回
    return raw
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
};

const decodeContentAttr = (raw: string): string => {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

/** 剥离段间残留的包装标签（开闭 div/p），避免正文段两端出现空标签 */
const stripWrapperTags = (text: string): string =>
  text
    .replace(/^[\s\n]*(?:<(?:div|p)>[\s\n]*)+/, '')
    .replace(/(?:[\s\n]*<\/(?:div|p)>[\s\n]*)+$/, '');

/**
 * 切分消息 text 为有序段。纯函数、容错：解析过程任何异常返回原文本的
 * unknown 段，不向外抛出。
 */
export function parseMessageSegments(
  input: string | undefined | null,
): MessageSegment[] {
  const text = typeof input === 'string' ? input : '';
  if (!text) return [];
  if (
    text.indexOf('markdown-custom-process') === -1 &&
    text.indexOf('markdown-custom-think') === -1
  ) {
    return text.trim() ? [{ type: 'text', content: text }] : [];
  }

  try {
    const segments: MessageSegment[] = [];
    let cursor = 0;

    const pushGap = (gap: string) => {
      const stripped = stripWrapperTags(gap);
      if (!stripped.trim()) return;
      // 主正则没吃掉的标签碎片（未闭合/属性截断）单独标记为 unknown，
      // 碎片之前的干净正文仍按正文段保留，不因畸形尾巴整段丢弃。
      const fragmentIndex = stripped.search(/<\/?markdown-custom/);
      if (fragmentIndex === -1) {
        segments.push({ type: 'text', content: stripped });
        return;
      }
      const head = stripped.slice(0, fragmentIndex);
      if (head.trim()) {
        segments.push({ type: 'text', content: head });
      }
      segments.push({
        type: 'unknown',
        content: stripped.slice(fragmentIndex),
      });
    };

    TAG_WITH_WRAPPER_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TAG_WITH_WRAPPER_REGEX.exec(text)) !== null) {
      if (match.index > cursor) {
        pushGap(text.slice(cursor, match.index));
      }
      const attrs = readTagAttrs(match[0]);
      if (match[1] === 'think') {
        segments.push({
          type: 'think',
          status: attrs.status === 'thinking' ? 'thinking' : 'finished',
          content: decodeContentAttr(attrs.content ?? ''),
        });
      } else {
        segments.push({
          type: 'process',
          executeId: attrs.executeId,
          componentType: attrs.type,
          status: attrs.status,
          name:
            attrs.name !== undefined ? decodeNameAttr(attrs.name) : undefined,
        });
      }
      cursor = TAG_WITH_WRAPPER_REGEX.lastIndex;
    }

    if (cursor < text.length) {
      pushGap(text.slice(cursor));
    }
    return segments;
  } catch {
    return [{ type: 'unknown', content: text }];
  }
}

/**
 * 剥离全部自定义标签（think/process 及包装 div/p），保留纯 Markdown 正文。
 * 用于最终回答展示与复制范围（复制内容不含隐藏过程）。
 */
export function stripCustomTags(input: string | undefined | null): string {
  const text = typeof input === 'string' ? input : '';
  if (!text) return '';
  return text
    .replace(
      /(?:\s*<(?:div|p)>\s*)?<markdown-custom-(?:process|think)\b[^>]*>(?:<\/markdown-custom-(?:process|think)>)?(?:\s*<\/(?:div|p)>\s*)?/g,
      '\n\n',
    )
    .replace(/(?:\s*<(?:div|p)>\s*|\s*<\/(?:div|p)>\s*)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

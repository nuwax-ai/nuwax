/**
 * 思考内容内联标签协议
 *
 * 与 markdown-custom-process（plugins/ds-markdown-process）同一套「文本协议」：
 * SSE 模型层把思考内容写成纯属性的 <markdown-custom-think> 标签内嵌消息 text，
 * 按流式时序出现在工具调用与正文之间，渲染层即可在真实发生位置展示思考块，
 * 而不是把所有思考聚合到消息顶部的固定区域。
 *
 * - content 属性为 encodeURIComponent 后的思考文本：单行、不含引号/尖括号，
 *   对属性写入与 markdown HTML 块解析都安全
 * - status="thinking" 表示本轮思考仍在流式输出；status="finished" 表示已被
 *   后续输出（工具调用/正文/下一轮思考）超越
 * - 流式期间按 THINK_FLUSH_CHARS 滞回地原地重写 content 属性：分片很小且高频，
 *   若每片都重写会破坏 answer 前缀匹配，触发整条消息 Markdown 全量重推
 * - 标签始终是「开+闭完整写出、原地重写更新」的形态，与 getCustomBlock 一致，
 *   不存在未闭合标签，避免流式解析歧义
 */

const THINK_BLOCK_NAME = 'markdown-custom-think';

/** content 属性重写的最小滞回字符数：本轮思考累积超过该增量才重写标签。 */
const THINK_FLUSH_CHARS = 120;

/** 匹配一个完整的思考标签块（含可选 div/p 包装，与分组算法的包装约定一致）。 */
const thinkBlockRegex = new RegExp(
  `\\n*\\s*<(?:div|p)>\\s*<${THINK_BLOCK_NAME}\\b[^>]*>\\s*</${THINK_BLOCK_NAME}>\\s*</(?:div|p)>\\n*\\s*`,
);

const openStatusRegex = /status=(?:"|\\")thinking(?:"|\\")/;

const contentAttrRegex = /content=(?:"|\\")([^"\\]*)(?:"|\\")/;

const getThinkBlockWrapper = (
  status: 'thinking' | 'finished',
  content: string,
): string =>
  `\n\n<div><${THINK_BLOCK_NAME} status="${status}" content="${encodeURIComponent(
    content,
  )}"></${THINK_BLOCK_NAME}></div>\n\n`;

const decodeContentAttr = (block: string): string => {
  const matched = block.match(contentAttrRegex);
  if (!matched) return '';
  try {
    return decodeURIComponent(matched[1]);
  } catch {
    return matched[1];
  }
};

const findLastThinkBlock = (
  text: string,
): { index: number; endIndex: number; block: string } | null => {
  if (!text || text.indexOf(THINK_BLOCK_NAME) === -1) return null;
  const regex = new RegExp(thinkBlockRegex.source, 'g');
  let last: RegExpExecArray | null = null;
  let matched: RegExpExecArray | null;
  while ((matched = regex.exec(text)) !== null) {
    last = matched;
  }
  if (!last) return null;
  return {
    index: last.index,
    endIndex: last.index + last[0].length,
    block: last[0],
  };
};

/** text 中是否存在未收口（status="thinking"）的思考标签块。 */
export const hasOpenThinkBlock = (text: string): boolean => {
  const last = findLastThinkBlock(text);
  return !!last && openStatusRegex.test(last.block);
};

const replaceLastThinkBlock = (
  text: string,
  status: 'thinking' | 'finished',
  content: string,
): string => {
  const last = findLastThinkBlock(text);
  if (!last) return text;
  // 收口时若调用方拿不到本轮全量内容（如终态兜底路径 thinkBlocks 已丢），
  // 保留标签内已写出的内容，只翻转状态，避免清空已展示的思考。
  const nextContent =
    status === 'finished' && !content ? decodeContentAttr(last.block) : content;
  return (
    text.slice(0, last.index) +
    getThinkBlockWrapper(status, nextContent) +
    text.slice(last.endIndex)
  );
};

/**
 * 写入一轮思考分片。
 *
 * @param text 当前消息 text
 * @param roundContent 本轮思考的累计全量内容（由模型层 thinkBlocks 维护）
 * @param finalize 该分片是否同时结束本轮思考
 */
export const appendThinkChunk = (
  text: string,
  roundContent: string,
  finalize = false,
): string => {
  if (hasOpenThinkBlock(text)) {
    const last = findLastThinkBlock(text);
    const flushedLength = last ? decodeContentAttr(last.block).length : 0;
    // 滞回：未达阈值且不收口时跳过重写，避免每个分片都触发全量重推
    if (!finalize && roundContent.length - flushedLength < THINK_FLUSH_CHARS) {
      return text;
    }
    return replaceLastThinkBlock(
      text,
      finalize ? 'finished' : 'thinking',
      roundContent,
    );
  }
  // 新一轮思考：完整写出标签块（本轮起始分片即全部累计内容）。
  // 空内容（如仅携带 finished 标记的收尾分片）不产生空块。
  if (!roundContent) {
    return text;
  }
  return (
    text +
    getThinkBlockWrapper(finalize ? 'finished' : 'thinking', roundContent)
  );
};

/**
 * 收口未闭合的思考标签块。无开放块时原样返回（幂等），
 * 供 PROCESSING / 正文 / 终态等「思考被超越」的边界调用。
 */
export const finalizeThinkBlock = (text: string, roundContent = ''): string => {
  if (!hasOpenThinkBlock(text)) return text;
  return replaceLastThinkBlock(text, 'finished', roundContent);
};

/**
 * 存量历史消息兼容：后端只有聚合 think 字段（无流式位置信息），
 * 合成为一个置于消息开头的已完成思考块，与新消息形态统一。
 */
export const getLegacyThinkBlock = (think: string): string =>
  getThinkBlockWrapper('finished', think);

/** 剥离全部思考标签块，用于复制等只需要正文的场景。 */
export const stripThinkBlocks = (text: string): string =>
  text.replace(new RegExp(thinkBlockRegex.source, 'g'), '');

export { THINK_BLOCK_NAME };

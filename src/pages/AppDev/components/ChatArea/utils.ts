interface AppDevProcessBlock {
  tag: string;
  identity: string;
}

const getAttrValue = (tag: string, attrName: string): string => {
  const attrRegex = new RegExp(`${attrName}="([^"]*)"`, 'i');
  return tag.match(attrRegex)?.[1] || '';
};

const safeParseToolCallData = (tag: string): Record<string, any> => {
  const rawData = getAttrValue(tag, 'data');
  if (!rawData) return {};

  try {
    return JSON.parse(decodeURIComponent(rawData));
  } catch {
    return {};
  }
};

const getToolCallIdentity = (tag: string): string => {
  const data = safeParseToolCallData(tag);
  const kind = data.kind || '';
  const title = data.title || '';
  const locationPath = Array.isArray(data.locations)
    ? data.locations[0]?.path || ''
    : '';
  const command = data.rawInput?.command || '';
  const filePath = data.rawInput?.file_path || locationPath;
  const identityParts = [kind, title, filePath, command];

  return identityParts.some(Boolean) ? identityParts.join('|') : tag;
};

const compactToolCallsByLastOccurrence = (
  blocks: AppDevProcessBlock[],
): AppDevProcessBlock[] => {
  const seenIdentities = new Set<string>();
  const compactedReversed: AppDevProcessBlock[] = [];

  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index];

    if (!seenIdentities.has(block.identity)) {
      seenIdentities.add(block.identity);
      compactedReversed.push(block);
    }
  }

  return compactedReversed.reverse();
};

const appendToolCallGroup = (
  result: string,
  blocks: AppDevProcessBlock[],
): string => {
  const compactedBlocks = compactToolCallsByLastOccurrence(blocks);

  if (compactedBlocks.length >= 2) {
    return `${result}\n\n<appdev-process-group count="${
      compactedBlocks.length
    }">\n${compactedBlocks
      .map((block) => block.tag)
      .join('\n')}\n</appdev-process-group>\n\n`;
  }

  if (compactedBlocks.length === 1) {
    return `${result}\n\n<div>${compactedBlocks[0].tag}</div>\n\n`;
  }

  return result;
};

/**
 * 根据规则将 AppDev 连续的 appdev-toolcall 标签合并
 * 规则：
 * 1. 连续 2 个及以上的过程标签合并
 * 2. 中间包含 appdev-plan 的不合并（作为分隔符）
 * 3. 标签间只包含空白字符时不中断合并
 * 4. 同一工具调用分组内相同工具仅保留最后一个，统计数量使用过滤后的数量
 */
export function groupAppDevProcesses(text: string): string {
  if (!text) return '';

  // 匹配 appdev-toolcall 和 appdev-plan 标签及其可选的 div/p 包装器
  // 注意：我们只合并 toolcall，而 plan 作为分隔符
  const blockRegex =
    /(?:\s*<(?:div|p)>\s*)?(<(appdev-toolcall|appdev-plan)\b[^>]*?>(?:<\/\2>)?)(?:\s*<\/(?:div|p)>\s*)?/g;

  let result = '';
  let lastIndex = 0;
  let currentGroup: AppDevProcessBlock[] = [];
  let match;

  const flushGroup = () => {
    if (currentGroup.length > 0) {
      result = appendToolCallGroup(result, currentGroup);
      currentGroup = [];
    }
  };

  while ((match = blockRegex.exec(text)) !== null) {
    const tagMatch = match[1];
    const tagName = match[2];

    // 检查是否为“执行计划”
    const isPlan = tagName === 'appdev-plan';

    // 处理匹配项之前的文本
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore.trim() !== '') {
      flushGroup();
      result += textBefore;
    }

    if (isPlan) {
      flushGroup();
      // Plan 标签不进组，单独渲染
      result += `\n\n<div>${tagMatch}</div>\n\n`;
    } else {
      // ToolCall 标签进入待合并组
      currentGroup.push({
        tag: tagMatch,
        identity: getToolCallIdentity(tagMatch),
      });
    }

    lastIndex = blockRegex.lastIndex;
  }

  flushGroup();
  result += text.slice(lastIndex);

  return result;
}

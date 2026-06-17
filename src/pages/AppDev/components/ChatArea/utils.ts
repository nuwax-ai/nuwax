/**
 * 根据规则将 AppDev 连续的 appdev-toolcall 标签合并
 * 规则：
 * 1. 连续 2 个及以上的过程标签合并
 * 2. 中间包含 appdev-plan 的不合并（作为分隔符）
 * 3. 标签间只包含空白字符时不中断合并
 */
export function groupAppDevProcesses(text: string): string {
  if (!text) return '';

  // 匹配 appdev-toolcall 和 appdev-plan 标签及其可选的 div/p 包装器
  // 注意：我们只合并 toolcall，而 plan 作为分隔符
  const blockRegex =
    /(?:\s*<(?:div|p)>\s*)?(<(appdev-toolcall|appdev-plan)\b[^>]*?>(?:<\/\2>)?)(?:\s*<\/(?:div|p)>\s*)?/g;

  let result = '';
  let lastIndex = 0;
  let currentGroup: string[] = [];
  let match;

  const flushGroup = () => {
    if (currentGroup.length > 0) {
      if (currentGroup.length >= 2) {
        // 合并为组标签
        result += `\n\n<appdev-process-group count="${
          currentGroup.length
        }">\n${currentGroup.join('\n')}\n</appdev-process-group>\n\n`;
      } else {
        // 只有一个，保持原样
        result += `\n\n<div>${currentGroup[0]}</div>\n\n`;
      }
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
      currentGroup.push(tagMatch);
    }

    lastIndex = blockRegex.lastIndex;
  }

  flushGroup();
  result += text.slice(lastIndex);

  return result;
}

/**
 * 智能源码替换入口
 * 根据目标文件类型（.vue / .tsx/.jsx）自动路由到对应的框架替换器
 */

import * as ReactReplacer from './react';
import { escapeRegExp } from './shared';
import type { SmartReplaceOptions } from './types';
import { detectFramework } from './types';
import * as VueReplacer from './vue';

/**
 * 属性替换（通用，无框架差异）
 */
function smartReplaceAttribute(
  line: string,
  options: SmartReplaceOptions & { attributeName?: string },
  framework: 'react' | 'vue',
): string {
  const attributeName = options.attributeName;
  if (!attributeName) {
    console.warn('[SmartReplace] Missing attributeName');
    return line;
  }

  // Match attr="..." or attr='...'
  const regex = new RegExp(`${escapeRegExp(attributeName)}=(["'])([^"']*)\\1`);
  if (regex.test(line)) {
    return line.replace(regex, `${attributeName}=$1${options.newValue}$1`);
  }

  console.warn(
    `[SmartReplace:${framework}] Failed to match attribute:`,
    attributeName,
  );
  return line;
}

/**
 * 智能替换源码（框架感知）
 * 根据 filePath 判断 React/Vue，路由到对应替换逻辑
 */
export async function smartReplaceInSource(
  content: string,
  options: SmartReplaceOptions & { filePath?: string },
): Promise<string> {
  const framework = options.filePath
    ? detectFramework(options.filePath)
    : 'react';
  const replacer = framework === 'vue' ? VueReplacer : ReactReplacer;

  const lines = content.split('\n');
  const targetLine = Math.max(0, options.lineNumber - 1);

  if (targetLine >= lines.length) {
    throw new Error(`Line ${options.lineNumber} exceeds file length`);
  }

  try {
    switch (options.type) {
      case 'style': {
        const styleResult = await replacer.replaceStyleMultiLine(
          lines,
          targetLine,
          options,
        );
        if (styleResult.found) {
          lines[styleResult.lineIndex] = styleResult.newLine;
        } else {
          console.warn(
            `[SmartReplace:${framework}] Style not found in element`,
          );
        }
        break;
      }
      case 'content': {
        const contentResult = await replacer.replaceContentMultiLine(
          lines,
          targetLine,
          options,
        );
        if (contentResult.found) {
          const deleteCount =
            (contentResult.endLine ?? contentResult.startLine) -
            contentResult.startLine +
            1;
          lines.splice(
            contentResult.startLine,
            deleteCount,
            ...contentResult.newLines,
          );
        } else {
          console.warn(
            `[SmartReplace:${framework}] Content not found:`,
            options.originalValue,
          );
        }
        break;
      }
      case 'attribute': {
        lines[targetLine] = smartReplaceAttribute(
          lines[targetLine],
          options,
          framework,
        );
        break;
      }
    }

    return lines.join('\n');
  } catch (error) {
    console.error(
      `[SmartReplace:${framework}] Failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
    return content;
  }
}

export { detectFramework } from './types';
export type { SmartReplaceOptions } from './types';

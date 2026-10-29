import { TaskResultData } from '@/types/interfaces/utils';

/**
 * 提取任务结果数据。
 * 多个 `<task-result>` 时取最后一个；同一段里多个 `<file>` 时取第一个。
 * Chat 会话结束 settle、AppDevPro 结束自动打开、进页自动预览共用此口径。
 */
export const extractTaskResult = (text: string): TaskResultData => {
  const result: TaskResultData = {
    hasTaskResult: false,
  };

  if (!text) return result;

  const taskResultMatches = text.match(/<task-result>[\s\S]*?<\/task-result>/g);
  if (!taskResultMatches?.length) {
    return result;
  }

  result.hasTaskResult = true;
  const taskResultContent = taskResultMatches[
    taskResultMatches.length - 1
  ].replace(/^<task-result>|<\/task-result>$/g, '');

  const descriptionMatch = taskResultContent.match(
    /<description>([\s\S]*?)<\/description>/,
  );
  if (descriptionMatch) {
    result.description = descriptionMatch[1].trim();
  }

  const fileMatch = taskResultContent.match(/<file>([\s\S]*?)<\/file>/);
  if (fileMatch) {
    result.file = fileMatch[1].trim();
  }

  return result;
};

/**
 * 提取字符串中最后一个 <task-result> 内的第一个 <file>。
 * 与 extractTaskResult 同一口径，仅返回文件路径。
 */
export const extractLastTaskResultFile = (text: string): string | null => {
  const file = extractTaskResult(text).file;
  return file?.trim() ? file : null;
};

/**
 * 任务结果行上展示的文件名。
 * 旧产物常带目录（`999999/report/a.pptx`），新产物经常只给文件名。
 * 有路径时只留最后一段，避免一行里塞进整段目录。
 */
export const taskResultFileName = (file: string): string => {
  const normalized = file.trim().replace(/[/\\]+$/, '');
  const slash = Math.max(
    normalized.lastIndexOf('/'),
    normalized.lastIndexOf('\\'),
  );
  return (slash >= 0 ? normalized.slice(slash + 1) : normalized) || file.trim();
};

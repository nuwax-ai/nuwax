import { TaskResultData } from '@/types/interfaces/utils';

/**
 * 提取任务结果数据
 * @param text 文本
 * @returns 任务结果数据
 */
export const extractTaskResult = (text: string): TaskResultData => {
  const result: TaskResultData = {
    hasTaskResult: false,
  };

  if (!text) return result;

  // 1️⃣ 匹配 <task-result>...</task-result>
  const taskResultMatch = text.match(/<task-result>([\s\S]*?)<\/task-result>/);

  if (!taskResultMatch) {
    return result;
  }

  result.hasTaskResult = true;
  const taskResultContent = taskResultMatch[1];

  // 2️⃣ 提取 description
  const descriptionMatch = taskResultContent.match(
    /<description>([\s\S]*?)<\/description>/,
  );
  if (descriptionMatch) {
    result.description = descriptionMatch[1].trim();
  }

  // 3️⃣ 提取 file
  const fileMatch = taskResultContent.match(/<file>([\s\S]*?)<\/file>/);
  if (fileMatch) {
    result.file = fileMatch[1].trim();
  }

  return result;
};

/**
 * 提取字符串中最后一个 <task-result> 内的 <file> 内容
 * @param text 原始字符串
 * @returns file 内容或 null
 */
export const extractLastTaskResultFile = (text: string): string | null => {
  if (!text) return null;

  // 匹配所有 <task-result>...</task-result>
  const taskResultMatches = text.match(/<task-result>[\s\S]*?<\/task-result>/g);

  if (!taskResultMatches || taskResultMatches.length === 0) {
    return null;
  }

  // 取最后一个 <task-result>
  const lastTaskResult = taskResultMatches[taskResultMatches.length - 1];

  // 在其中提取 <file> 内容
  const fileMatch = lastTaskResult.match(/<file>([\s\S]*?)<\/file>/);

  return fileMatch?.[1]?.trim() ?? null;
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

import { DataTypeEnum } from '@/types/enums/common';
import { TaskResultData } from '@/types/interfaces/utils';

// function auto zero
function zeroFill(time: number) {
  const _time = time < 10 ? '0' + time : time;
  return _time;
}

export const getTime = (date: string) => {
  const newdate = new Date(date);
  return (
    newdate.getFullYear() +
    '-' +
    zeroFill(newdate.getMonth() + 1) +
    '-' +
    zeroFill(newdate.getDate()) +
    ' ' +
    zeroFill(newdate.getHours()) +
    ':' +
    zeroFill(newdate.getMinutes()) +
    ':' +
    zeroFill(newdate.getSeconds())
  );
};

/**
 * 优化级联菜单的显示与回显
 * @params value 传入的value
 * @params options 配置项
 */
export const CascaderValue = (value?: DataTypeEnum): string[] => {
  if (!value || value === undefined) return [];

  // 处理文件数组类型
  if (value.startsWith('Array_File_')) {
    return ['Array_File', value];
  }

  // 处理普通文件类型
  if (value.startsWith('File_')) {
    return ['File', value];
  }

  return [value];
};

/**
 * 级联菜单选中后数据转为DataTypeEnum
 * @params value 传入的value
 * @params options 配置项
 */
export const CascaderChange = (values: string[]): DataTypeEnum => {
  // 确保总是返回合法的枚举值
  const lastValue = values[values.length - 1];
  return Object.values(DataTypeEnum).includes(lastValue as DataTypeEnum)
    ? (lastValue as DataTypeEnum)
    : DataTypeEnum.String;
};

// 根据类型返回不同的accpet类型
export const getAccept = (type: DataTypeEnum) => {
  switch (type) {
    case DataTypeEnum.File_Image:
      return 'image/*';
    case DataTypeEnum.File_PPT:
      return '.ppt,.pptx';
    case DataTypeEnum.File_Doc:
      return '.doc,.docx';
    case DataTypeEnum.File_PDF:
      return '.pdf';
    case DataTypeEnum.File_Txt:
      return '.txt';
    case DataTypeEnum.File_Zip:
      return '.zip,.rar,.7z';
    case DataTypeEnum.File_Excel:
      return '.xls,.xlsx,.csv';
    case DataTypeEnum.File_Video:
      return 'video/*';
    case DataTypeEnum.File_Audio:
    case DataTypeEnum.File_Voice:
      return 'audio/*';
    case DataTypeEnum.File_Code:
      return '.js,.txt,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.cs,.go,.php,.rb,.sh';
    case DataTypeEnum.File_Svg:
      return '.svg';
    default:
      return '';
  }
};

export const isEmptyObject = (obj: any) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

export * from './clipboard';

// 导出拷贝相关组件
export { default as CopyButton } from '@/components/base/CopyButton';
export { default as CopyIconButton } from '@/components/base/CopyIconButton';

/**
 * 替换路径模板中的动态变量
 * @param template - 路径模板，例如 /view/detail/{id}
 * @param params - 参数对象，例如 { id: 123 }
 * @returns 替换后的路径，例如 /view/detail/123
 */
export const fillPathParams = (
  template: string,
  params: Record<string, string | number>,
): string => {
  return template.replace(/{(\w+)}/g, (_, key) => {
    if (params[key] === undefined) {
      throw new Error(`缺少路径参数: ${key}`);
    }
    return String(params[key]);
  });
};

/**
 * 检查路径模板中的变量是否在 data 中存在且值有效
 * @param template 路径模板，例如 /user/{id}/{name}
 * @param data 参数对象，例如 { id: 1, name: 'Tom' }
 * @returns 是否全部存在且有效
 */
export const checkPathParams = (
  template: string,
  data: Record<string, any>,
): boolean => {
  const keys = [...template.matchAll(/{(\w+)}/g)].map((m) => m[1]);
  return (
    keys.length === 0 ||
    keys.every(
      (k) => data[k] !== undefined && data[k] !== null && data[k] !== '',
    )
  );
};

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

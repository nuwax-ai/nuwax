import { DataTypeEnum } from '@/types/enums/common';

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

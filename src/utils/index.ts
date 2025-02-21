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

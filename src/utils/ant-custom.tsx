/**
 * ant design 自定义方法
 */

import { ExclamationCircleFilled } from '@ant-design/icons';
import { Modal } from 'antd';

const { confirm } = Modal;

// modal 确认框
export const modalConfirm = (
  title: string,
  content: string,
  onOk: () => void,
  onCancel?: () => void,
) => {
  confirm({
    title,
    icon: <ExclamationCircleFilled />,
    content,
    okText: '确定',
    maskClosable: true,
    cancelText: '取消',
    onOk,
    onCancel,
  });
};

// 默认值的范围,如果字段类型是 int,范围限制在: [-2147483648,2147483647] 区间
// NUMBER,对应类型是: DECIMAL(20,6) ,限制小数点最多 6位,整数最多:14 位,
// 格式化数字
export const formatterNumber = (value: number | string | undefined) => {
  if (!value) return '';

  // 如果是字符串，直接处理
  if (typeof value === 'string') {
    const [integerPart, decimalPart] = value.split('.');
    if (decimalPart && decimalPart.length > 6) {
      return `${integerPart}.${decimalPart.slice(0, 6)}`;
    }
    return value;
  }

  // 如果是数字，转换为字符串处理
  const numValue = value;
  if (isNaN(numValue)) return '';
  const [integerPart, decimalPart] = numValue.toString().split('.');
  if (decimalPart && decimalPart.length > 6) {
    return `${integerPart}.${decimalPart.slice(0, 6)}`;
  }
  return numValue;
};

// 指定从 formatter 里转换回数字的方式，和 formatter 搭配使用
export const parserNumber = (displayValue: string | undefined) => {
  if (!displayValue) return '';

  const str = displayValue.toString();
  const dotIndex = str.indexOf('.');
  if (dotIndex === -1) {
    return str;
  }

  return str.substring(0, dotIndex + 7);
};

import { UploadFileStatus } from '@/types/enums/common';
import type { FileType, UploadFileInfo } from '@/types/interfaces/common';
import cloneDeep from 'lodash/cloneDeep';
// 过滤非数字
const getNumbersOnly = (text: string) => {
  return text?.replace(/[^0-9]/g, '');
};

// 判断字符串是否全是数字
const isNumber = (value: string) => {
  return !Number.isNaN(Number(value));
};

// 校验手机号是否合法
function isValidPhone(phone: string) {
  const reg = /^1[3456789]\d{9}$/;
  return reg.test(phone);
}

// 校验邮箱地址是否合法
function isValidEmail(email: string) {
  const reg = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,}$/;
  return reg.test(email);
}

// 校验数据库表名是否合法
// 1. 表名必须以字母开头，后面可以跟字母、数字或下划线。
function validateTableName(tableName: string) {
  const reg = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return reg.test(tableName);
}

// 检测字符串是否为有效的JSON格式
function isValidJSON(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // 去除首尾空白字符
  const trimmedStr = str.trim();

  // 检查基本结构：对象必须以 { 开头， 以} 结尾；
  if (!/^{/.test(trimmedStr) || !/}$/.test(trimmedStr)) {
    return false;
  }

  try {
    JSON.parse(trimmedStr);
    return true;
  } catch (error) {
    return false;
  }
}

// 检测字符串是否为有效的JSON格式，并返回解析结果
function parseJSON<T = any>(
  str: string,
): { isValid: boolean; data?: T; error?: string } {
  if (!str || typeof str !== 'string') {
    return { isValid: false, error: '输入为空或不是字符串' };
  }

  try {
    const data = JSON.parse(str) as T;
    return { isValid: true, data };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'JSON格式错误',
    };
  }
}

// 校验登录密码
function validatePassword(password: string) {
  return password?.length >= 6;
  // const reg = /^(?=.*\d)(?=.*[a-zA-Z])[\da-zA-Z~!@#$%^&*]{8,16}$/;
  // return reg.test(password);
}

const getBase64 = (img: FileType, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img as Blob);
};

// 获取url地址search中的参数
const getURLParams = () => {
  const searchParams = window.location.search.substring(1).split('&');
  // 为了解决元素隐式具有 "any" 类型的问题，将 params 的类型定义为 Record<string, string>
  // 这样就可以使用 string 类型的 key 来索引 params 对象
  const params: Record<string, string> = {};
  for (const param of searchParams) {
    const [key, value] = param.split('=');
    params[key] = value;
  }
  return params;
};

// 给页面head添加base标签: <base target="_blank">
const addBaseTarget = () => {
  if (!document.head.querySelector('base')) {
    const base = document.createElement('base');
    base.target = '_blank';
    document.head.append(base);
  }
};

// 格式化时间
function formatTimeAgo(targetTime: string) {
  if (!targetTime) {
    return '';
  }
  const now = new Date().getTime(); // 当前时间戳，单位为毫秒
  const target = new Date(targetTime).getTime();

  const diff = now - target; // 时间差（毫秒）
  const diffSeconds = Math.floor(diff / 1000); // 转换为秒
  const diffMinutes = Math.floor(diffSeconds / 60); // 转换为分钟
  const diffHours = Math.floor(diffMinutes / 60); // 转换为小时
  const diffDays = Math.floor(diffHours / 24); // 转换为天

  if (diffDays > 365 * 2) {
    return `${Math.floor(diffDays / 365)}年前`;
  } else if (diffDays > 365) {
    return '去年';
  } else if (diffDays > 30) {
    const currentDate = new Date();
    const inputDate = new Date(targetTime);
    // 计算月份差
    let monthsDifference =
      (currentDate.getFullYear() - inputDate.getFullYear()) * 12;
    monthsDifference += currentDate.getMonth() - inputDate.getMonth();

    // 如果当前日期的日小于输入日期的日，月份差减 1
    if (currentDate.getDate() < inputDate.getDate()) {
      monthsDifference--;
    }

    if (monthsDifference >= 1) {
      return `${monthsDifference} 月前`;
    }
    return null;
  } else if (diffDays > 6) {
    return `${diffDays}天前`;
  } else if (diffDays > 2) {
    let date = new Date(targetTime);
    let month = date.getMonth() + 1;
    let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
    return `${month}-${day}`;
  } else if (diffDays === 2) {
    return '前天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffHours > 1) {
    return `${diffHours}小时前`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}分钟前`;
  } else {
    return '刚刚';
  }
}

// html自定义转义
function encodeHTML(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 检查第一个数组每个元素是否都存在于第二个数组中。
const arraysContainSameItems = (arr1: string[], arr2: string[]) => {
  // 使用 Set 去重
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  // 检查 set1 中的每个元素是否都在 set2 中
  for (let item of set1) {
    if (!set2.has(item)) {
      return false;
    }
  }

  return true;
};

// 获取上传进度状态
const getProgressStatus = (fileInfo: UploadFileInfo) => {
  if (fileInfo?.status === UploadFileStatus.error) {
    return 'exception';
  }

  if (fileInfo?.status === UploadFileStatus.done) {
    return 'success';
  }

  if (Math.floor(fileInfo?.percent || 0) === 100) {
    return 'success';
  }

  return 'active';
};

// 向上查找元素
const findParentElement = (element: HTMLElement, className: string) => {
  let currentElement = element;
  while (currentElement.parentElement) {
    if (currentElement.parentElement.classList.contains(className)) {
      return currentElement.parentElement;
    }
    currentElement = currentElement.parentElement;
  }
  return null;
};

const findClassElement = (currentElement: HTMLElement, className: string) => {
  if (currentElement.classList.contains(className)) {
    return currentElement;
  }
  return findParentElement(currentElement, className);
};

export {
  addBaseTarget,
  arraysContainSameItems,
  cloneDeep,
  encodeHTML,
  findClassElement,
  findParentElement,
  formatTimeAgo,
  getBase64,
  getNumbersOnly,
  getProgressStatus,
  getURLParams,
  isNumber,
  isValidEmail,
  isValidJSON,
  isValidPhone,
  parseJSON,
  validatePassword,
  validateTableName,
};

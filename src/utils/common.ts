import type { FileType } from '@/types/interfaces/common';
import cloneDeep from 'lodash/cloneDeep';
// 过滤非数字
const getNumbersOnly = (text: string) => {
  return text?.replace(/[^0-9]/g, '');
};

// 判断字符串是否全是数字
const isNumber = (value: string) => {
  return !Number.isNaN(Number(value));
};

function isValidPhone(phone: string) {
  const reg = /^1[3456789]\d{9}$/;
  return reg.test(phone);
}

function isValidEmail(email: string) {
  const reg = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,}$/;
  return reg.test(email);
}

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

export {
  addBaseTarget,
  cloneDeep,
  encodeHTML,
  formatTimeAgo,
  getBase64,
  getNumbersOnly,
  getURLParams,
  isNumber,
  isValidEmail,
  isValidPhone,
  validatePassword,
};

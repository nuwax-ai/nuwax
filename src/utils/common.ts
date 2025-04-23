import type { FileType } from '@/types/interfaces/common';

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

export {
  addBaseTarget,
  getBase64,
  getNumbersOnly,
  getURLParams,
  isNumber,
  isValidEmail,
  isValidPhone,
  validatePassword,
};

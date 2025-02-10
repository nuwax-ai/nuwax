import type { FileType } from '@/types/interfaces/common';

// 过滤非数字
const getNumbersOnly = (text: string) => {
  return text?.replace(/[^0-9]/g, '');
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
  const reg = /^(?=.*\d)(?=.*[a-zA-Z])[\da-zA-Z~!@#$%^&*]{8,16}$/;
  return reg.test(password);
}

const getBase64 = (img: FileType, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img as Blob);
};

export {
  getBase64,
  getNumbersOnly,
  isValidEmail,
  isValidPhone,
  validatePassword,
};

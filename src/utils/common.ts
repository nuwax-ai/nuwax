// 过滤非数字
const getNumbersOnly = (text: string) => {
  return text?.replace(/[^0-9]/g, '');
};

function isValidEmail(email: string) {
  const reg = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,}$/;
  return reg.test(email);
}

export { getNumbersOnly, isValidEmail };

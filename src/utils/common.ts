// 过滤非数字
const getNumbersOnly = (text: string) => {
  return text?.replace(/[^0-9]/g, '');
};

function isValidEmail(email: string) {
  const reg = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,}$/;
  return reg.test(email);
}

function validatePassword(password: string) {
  const reg = /^(?=.*\d)(?=.*[a-zA-Z])[\da-zA-Z~!@#$%^&*]{8,16}$/;
  return reg.test(password);
}

export { getNumbersOnly, isValidEmail, validatePassword };

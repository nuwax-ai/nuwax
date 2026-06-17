// debounce
export const debounce = <T extends unknown[]>(
  fn: (...args: T) => void,
  delay = 2000,
) => {
  let timer: NodeJS.Timeout | null = null;
  return (...args: T) => {
    // 使用箭头函数
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args); // 箭头函数中不需要 apply
      timer = null;
    }, delay);
  };
};

// throttle
export const throttle = <T extends unknown[]>(
  fn: (...args: T) => void,
  delay = 2000,
) => {
  let timer: NodeJS.Timeout | null = null;
  return (...args: T) => {
    // 使用箭头函数
    if (timer) return;
    timer = setTimeout(() => {
      fn(...args); // 箭头函数中不需要 apply
      timer = null;
    }, delay);
  };
};

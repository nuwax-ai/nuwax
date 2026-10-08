import { useLayoutEffect, useRef, useState } from 'react';

/** 只在账号栏能容纳两个中文字符时显示姓名；测量不依赖姓名显隐。 */
export function useSidebarUserNameVisibility() {
  const userRowRef = useRef<HTMLDivElement>(null);
  const nameThresholdRef = useRef<HTMLSpanElement>(null);
  const [showUserName, setShowUserName] = useState(true);

  useLayoutEffect(() => {
    const row = userRowRef.current;
    const threshold = nameThresholdRef.current;
    const avatar = row?.firstElementChild;
    if (!row || !threshold || !avatar) return;

    const measure = () => {
      const minimumNameWidth = threshold.getBoundingClientRect().width;
      // 未布局的测试/隐藏容器不以零宽标尺作决策；恢复布局后由观察器复算。
      if (minimumNameWidth <= 0) return;
      const rowStyle = window.getComputedStyle(row);
      const pixels = (value: string) => parseFloat(value) || 0;
      const availableNameWidth =
        row.getBoundingClientRect().width -
        avatar.getBoundingClientRect().width -
        pixels(rowStyle.paddingLeft) -
        pixels(rowStyle.paddingRight) -
        pixels(rowStyle.borderLeftWidth) -
        pixels(rowStyle.borderRightWidth) -
        // 隐藏后仍扣姓名存在时的间隔，防止回收间隔又触发展示而抖动。
        pixels(rowStyle.columnGap);
      setShowUserName(availableNameWidth >= minimumNameWidth);
    };

    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(row);
    observer?.observe(avatar);
    // 2em 标尺始终存在，姓名隐藏时也能响应字体大小变化。
    observer?.observe(threshold);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return { userRowRef, nameThresholdRef, showUserName };
}

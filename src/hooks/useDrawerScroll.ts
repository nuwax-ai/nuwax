import { useEffect } from 'react';

/**
 * 处理 Ant Design Drawer 组件的横向滚动条问题
 *
 * 解决 Drawer 组件打开/关闭时出现的横向滚动条闪烁问题
 *
 * @param visible Drawer 是否可见
 */
const useDrawerScroll = (visible: boolean): void => {
  // 添加样式类名
  const className = 'drawer-scroll-hidden';
  // 检查是否已存在我们的样式
  if (!document.getElementById('drawer-scroll-style')) {
    // 创建新的样式元素
    const style = document.createElement('style');
    style.id = 'drawer-scroll-style';
    style.innerHTML = `
        .${className} {
          overflow-x: hidden !important;
        }
      `;
    document.head.appendChild(style);
  }

  // 根据 visible 状态添加或移除类
  useEffect(() => {
    if (visible) {
      // 打开抽屉时，添加类以隐藏横向滚动条
      document.body.classList.add(className);
      document.documentElement.classList.add(className);
    } else {
      setTimeout(() => {
        document.body.classList.remove(className);
        document.documentElement.classList.remove(className);
      }, 400);
    }
  }, [visible]);
};

export default useDrawerScroll;

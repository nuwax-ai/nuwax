import { Avatar, Space, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';

/**
 * 带头像和省略号的文本组件
 * 功能：
 * - 支持头像 + 文本的布局
 * - 文本超出时自动显示省略号
 * - 只有在文本超出时才显示 Tooltip
 *
 * @param {string} avatarSrc - 头像图片地址
 * @param {React.ReactNode} text - 显示的文本内容
 * @param {number} avatarSize - 头像大小（默认 24）
 * @param {number} spaceSize - Space 间距（默认 8）
 * @param {string} emptyText - 文本为空时显示的内容（默认 '-'）
 */
export interface EllipsisWithAvatarProps {
  avatarSrc?: string;
  text?: React.ReactNode;
  avatarSize?: number;
  spaceSize?: number;
  emptyText?: string;
}

const EllipsisWithAvatar: React.FC<EllipsisWithAvatarProps> = ({
  avatarSrc,
  text,
  avatarSize = 24,
  spaceSize = 8,
  emptyText = '-',
}) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);

  // 检测文本是否超出
  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const { scrollWidth, offsetWidth } = textRef.current;
        setIsOverflow(scrollWidth > offsetWidth);
      }
    };

    // 初次检测
    checkOverflow();

    // 监听窗口大小变化
    window.addEventListener('resize', checkOverflow);

    // 使用 MutationObserver 监听内容变化
    const observer = new MutationObserver(checkOverflow);
    if (textRef.current) {
      observer.observe(textRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      window.removeEventListener('resize', checkOverflow);
      observer.disconnect();
    };
  }, [text]);

  const displayText = text || emptyText;

  const content = (
    <div className={styles.ellipsisCell}>
      <Space size={spaceSize}>
        <Avatar size={avatarSize} src={avatarSrc} />
        <span ref={textRef} className={styles.ellipsisText}>
          {displayText}
        </span>
      </Space>
    </div>
  );

  // 只有在文本超出时才显示 Tooltip
  if (isOverflow) {
    return (
      <Tooltip title={displayText} placement="top">
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default EllipsisWithAvatar;

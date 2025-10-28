import AuthorInfo from '@/components/base/AuthorInfo';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface CardWrapperProps {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  // 底部
  footer?: React.ReactNode;
  // 额外信息
  extra?: React.ReactNode;
  // 内容
  content: string;
  // 标题
  title: string;
  // 头像
  avatar: string;
  // 名称
  name: string;
  // 图片
  icon: string;
  // 默认图片
  defaultIcon: string;
}

/**
 * 卡片组件
 */
const CardWrapper: React.FC<PropsWithChildren<CardWrapperProps>> = ({
  className,
  onClick,
  footer,
  extra,
  content,
  title,
  avatar,
  name,
  icon,
  defaultIcon,
  style,
}) => {
  return (
    <div
      className={cx('flex', 'flex-col', 'gap-4', styles.container, className)}
      onClick={onClick}
      style={style}
    >
      <header className={cx('flex', styles.header)}>
        <img
          className={cx(styles.image)}
          src={icon || defaultIcon}
          alt=""
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultIcon;
          }}
        />
        <div
          className={cx(
            'flex-1',
            'flex',
            'flex-col',
            'content-between',
            'overflow-hide',
          )}
        >
          <h3 className={cx('text-ellipsis', styles.title)}>{title}</h3>
          <div
            className={cx('flex', 'items-center', styles['author-rel-info'])}
          >
            <AuthorInfo avatar={avatar} name={name} />
            {extra && (
              <div
                className={cx(
                  'flex',
                  'content-between',
                  'items-center',
                  styles['extra-box'],
                )}
              >
                {extra}
              </div>
            )}
          </div>
        </div>
      </header>
      <p className={cx('text-ellipsis-2', styles.content)}>{content}</p>
      {footer}
    </div>
  );
};

export default CardWrapper;

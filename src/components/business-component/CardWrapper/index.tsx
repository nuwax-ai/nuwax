import AuthorInfo from '@/components/base/AuthorInfo';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface CardWrapperProps {
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
  onClick,
  footer,
  extra,
  content,
  title,
  avatar,
  name,
  icon,
  defaultIcon,
}) => {
  return (
    <div
      className={cx('flex', 'flex-col', 'gap-4', styles.container)}
      onClick={onClick}
    >
      <header className={cx('flex', styles.header)}>
        <img
          className={cx(styles.image)}
          src={icon}
          alt=""
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultIcon;
          }}
        />
        <div className={cx('flex-1', 'overflow-hide')}>
          <h3 className={cx('text-ellipsis', styles.title)}>{title}</h3>
          <div
            className={cx('flex', 'items-center', 'gap-12', 'overflow-hide')}
          >
            <AuthorInfo avatar={avatar} name={name} />
            {extra}
          </div>
        </div>
      </header>
      <p className={cx('text-ellipsis-2', styles.content)}>{content}</p>
      {footer}
    </div>
  );
};

export default CardWrapper;

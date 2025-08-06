import AuthorInfo from '@/components/base/AuthorInfo';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface CardWrapperProps {
  onClick?: () => void;
  footer: React.ReactNode;
  extra?: React.ReactNode;
  content: string;
  title: string;
  avatar: string;
  name: string;
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
}) => {
  return (
    <div
      className={cx('flex', 'flex-col', 'gap-4', styles.container)}
      onClick={onClick}
    >
      <header className={cx('flex', styles.header)}>
        <img
          className={cx(styles.image)}
          src={require('@/assets/images/card-wrapper-header.png')}
          alt=""
        />
        <div className={cx('flex-1')}>
          <h3>{title}</h3>
          <div>
            <AuthorInfo avatar={avatar} name={name} />
            {extra}
          </div>
        </div>
      </header>
      <p>{content}</p>
      {footer}
    </div>
  );
};

export default CardWrapper;

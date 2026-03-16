import AuthorInfo from '@/components/base/AuthorInfo';
import { Skeleton } from 'antd';
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
  title: React.ReactNode;
  // 头像
  avatar?: string;
  // 名称
  name: string;
  // 图片
  icon: string;
  // 默认图片
  defaultIcon: string;
  // 加载状态
  loading?: boolean;
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
  loading = false,
}) => {
  if (loading) {
    return (
      <div
        className={cx('flex', 'flex-col', 'gap-2', styles.container, className)}
        style={{ ...style, height: 170 }}
      >
        <header className={cx('flex', styles.header)} style={{ gap: 8 }}>
          <Skeleton.Avatar
            active
            size="large"
            shape="square"
            className={styles.image}
            style={{ width: 50, height: 50, borderRadius: 10 }}
          />
          <div
            className={cx(
              'flex-1',
              'flex',
              'flex-col',
              'content-between',
              'overflow-hide',
            )}
            style={{ height: 50 }}
          >
            <Skeleton.Input
              active
              size="small"
              style={{ width: '60%', height: 18 }}
            />
            <div
              className={cx('flex', 'items-center', styles['author-rel-info'])}
              style={{ height: 16 }}
            >
              <Skeleton.Avatar
                active
                size="small"
                style={{ width: 16, height: 16, marginRight: 4 }}
              />
              <Skeleton.Input
                active
                size="small"
                style={{ width: 60, height: 14 }}
              />
              <div className={cx('ml-auto')}>
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 80, height: 14 }}
                />
              </div>
            </div>
          </div>
        </header>
        <div style={{ marginTop: 4 }}>
          <Skeleton
            active
            paragraph={{ rows: 1, width: ['90%'] }}
            title={false}
          />
        </div>
        <div
          className={cx('flex', 'content-between', 'items-center')}
          style={{ marginTop: 'auto' }}
        >
          <Skeleton.Button
            active
            size="small"
            style={{ width: 60, height: 20 }}
          />
          <div className={cx('flex', 'gap-2')}>
            <Skeleton.Button
              active
              size="small"
              style={{ width: 32, height: 20 }}
            />
            {/* <Skeleton.Button active size="small" style={{ width: 32, height: 20 }} /> */}
          </div>
        </div>
      </div>
    );
  }

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
          {typeof title === 'string' ? (
            <h3 className={cx('text-ellipsis', styles.title)}>{title}</h3>
          ) : (
            <div style={{ width: '100%', overflow: 'hidden' }}>{title}</div>
          )}
          <div
            className={cx('flex', 'items-center', styles['author-rel-info'])}
          >
            {avatar && <AuthorInfo avatar={avatar} name={name} />}
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

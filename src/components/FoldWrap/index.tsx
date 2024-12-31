import type { FoldWrapType } from '@/types/interfaces/common';
import { CloseOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const FoldWrap: React.FC<PropsWithChildren<FoldWrapType>> = (props) => {
  const {
    className,
    icon,
    title,
    desc,
    visible,
    otherAction,
    onClose,
    lineMargin,
    children,
  } = props;

  return (
    <div
      className={cx(
        'flex',
        'flex-col',
        'flex-1',
        'w-full',
        'overflow-hide',
        styles['show-stand'],
        { [styles.hidden]: !visible },
        className,
      )}
    >
      <div className={cx(styles['stand-header'], 'flex', 'items-center')}>
        {icon}
        <span className={cx('flex-1', 'text-ellipsis')}>{title}</span>
        {otherAction}
        <CloseOutlined
          className={cx(styles.close, 'cursor-pointer')}
          onClick={onClose}
        />
      </div>
      <div className={cx(styles.desc, 'text-ellipsis-3')}>{desc}</div>
      <div
        className={cx(styles['divider-horizontal'], {
          [styles.margin]: lineMargin,
        })}
      />
      <div className={cx('flex-1', 'overflow-y')}>
        {children || (
          <Empty className={cx(styles.empty)} description="暂无内容" />
        )}
      </div>
    </div>
  );
};

export default FoldWrap;

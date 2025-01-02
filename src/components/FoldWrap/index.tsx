import type { FoldWrapType } from '@/types/interfaces/common';
import { CloseOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 折叠容器组件
 */
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

  const styleHide = !visible ? styles.hidden : '';
  const styleMargin = lineMargin ? styles.margin : '';
  const iconMargin = icon ? styles['icon-margin'] : '';

  return (
    <div
      className={cx(
        'flex flex-col flex-1 w-full overflow-hide',
        styles['show-stand'],
        styleHide,
        className,
      )}
    >
      <div className={cx(styles['stand-header'], 'flex', 'items-center')}>
        {icon}
        <span className={cx('flex-1 text-ellipsis', iconMargin)}>{title}</span>
        {otherAction}
        <CloseOutlined
          className={cx(styles.close, 'cursor-pointer')}
          onClick={onClose}
        />
      </div>
      <div className={cx(styles.desc, 'text-ellipsis-3')}>{desc}</div>
      <div className={cx(styles['divider-horizontal'], styleMargin)} />
      <div className={'flex-1 overflow-y'}>
        {children || (
          <Empty className={cx(styles.empty)} description="暂无内容" />
        )}
      </div>
    </div>
  );
};

export default FoldWrap;

import type { ToggleWrapProps } from '@/types/interfaces/common';
import { CloseOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 容器组件
 */
const ToggleWrap: React.FC<PropsWithChildren<ToggleWrapProps>> = ({
  className,
  title,
  visible,
  onClose,
  children,
}) => {
  return (
    <div
      className={cx('flex', 'flex-col', styles.container, className, {
        [styles.hidden]: !visible,
      })}
    >
      <div
        className={cx(styles.header, 'flex', 'items-center', 'content-between')}
      >
        <h3>{title}</h3>
        <CloseOutlined
          className={cx(styles.close, 'cursor-pointer')}
          onClick={onClose}
        />
      </div>
      <div className={cx(styles['divider-horizontal'])} />
      <div className={'flex-1 overflow-y'}>{children}</div>
    </div>
  );
};

export default ToggleWrap;

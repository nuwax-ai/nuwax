import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 数据处理
 */
const DataProcess: React.FC = () => {
  return (
    <div className={cx(styles.container)}>
      <div className={cx('flex', 'items-center', 'radius-6', styles.box)}>
        <img
          className={cx('radius-6')}
          src="https://p9-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/07a3405d271b47f4be8c3c19ae400061~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1741405016&x-signature=gcJzMOnzn3uxXAaJZJPoAA8eqEM%3D"
          alt=""
        />
        <div className={cx('flex-1', 'overflow-hide')}>
          <h3 className={cx('text-ellipsis')}>文档名称</h3>
          <span className={cx(styles.desc)}>18kb</span>
        </div>
        <span>处理中.处理完成</span>
      </div>
    </div>
  );
};

export default DataProcess;

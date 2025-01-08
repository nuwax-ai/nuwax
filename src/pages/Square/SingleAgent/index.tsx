import {
  PlayCircleOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const SingleAgent: React.FC = () => {
  return (
    <div className={cx(styles.container, 'cursor-pointer')}>
      <div className={cx(styles.header, 'flex')}>
        <img
          className={cx(styles['a-logo'])}
          src="https://p9-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/0b14781940254e149392c83efe2a3879~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1738919517&x-signature=4pnEy11ZIobgZy1jW0Wzo2cIK64%3D"
          alt=""
        />
        <div className={cx(styles['info-container'], 'flex-1')}>
          <div className={cx('flex')}>
            <span className={cx('flex-1', styles['a-name'], 'text-ellipsis')}>
              合成台新园村
            </span>
          </div>
          <div className={cx('flex', 'items-center', styles['info-author'])}>
            <img
              className={cx(styles['avatar'])}
              src="https://p9-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/0b14781940254e149392c83efe2a3879~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1738919517&x-signature=4pnEy11ZIobgZy1jW0Wzo2cIK64%3D"
              alt=""
            />
            <span className={cx(styles.author)}>伊甸园</span>
            <span className={cx(styles.nickname)}>@xiaoxiao</span>
          </div>
          <p className={cx(styles.desc, 'text-ellipsis-3')}>
            每一位伟大的设计师背后，都有一个更伟大的工具。就像您手中的魔法棒，只需挥一挥，就能将您的设计草图变成令人惊叹的景观。让我们一起创造美丽新世界！
          </p>
        </div>
      </div>
      <div className={cx(styles['divider-horizontal'])} />
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <div className={cx('flex', styles.left)}>
          <span className={cx(styles.text, 'flex')}>
            <UserOutlined />
            <span>1.6k</span>
          </span>
          <span className={cx(styles.text, 'flex')}>
            <PlayCircleOutlined />
            <span>1.6k</span>
          </span>
          <span className={cx(styles.text, 'flex')}>
            <StarOutlined />
            <span>99</span>
          </span>
        </div>
        <div className={cx(styles.right)}>
          <span className={cx('cursor-pointer')}>立即使用</span>
        </div>
      </div>
    </div>
  );
};

export default SingleAgent;

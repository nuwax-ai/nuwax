import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import RunOver from './RunOver';

const cx = classNames.bind(styles);

const ChatView: React.FC = () => {
  return (
    <div className={cx(styles.container, 'flex')}>
      <img
        className={cx(styles.avatar)}
        src="https://p6-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/a200a4d4715a403cb3b2c52b9c71f6e4~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1739513009&x-signature=ltYlnCs3AvJgGnFoj73k8AKYewI%3D"
        alt=""
      />
      <div className={cx('flex-1')}>
        <div className={cx(styles.author)}>英雄联盟</div>
        <RunOver />
        <div className={cx(styles['chat-content'], 'radius-6')}>
          <p>这里是内容区域</p>
        </div>
      </div>
    </div>
  );
};

export default ChatView;

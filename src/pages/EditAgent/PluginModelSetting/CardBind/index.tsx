import classNames from 'classnames';
import React from 'react';
import BindDataSource from './BindDataSource';
import CardModeSetting from './CardModeSetting';
import styles from './index.less';

const cx = classNames.bind(styles);

const CardBind: React.FC = () => {
  return (
    <div className={cx('flex', 'h-full', styles.container)}>
      <div className={cx('flex-1', 'px-16', 'py-16')}>
        <h3 className={cx(styles.title)}>选择卡片样式</h3>
        <CardModeSetting />
      </div>
      <div className={cx('flex-1', 'px-16', 'py-16')}>
        <h3 className={cx(styles.title)}>为卡片绑定数据源</h3>
        <BindDataSource />
      </div>
    </div>
  );
};

export default CardBind;

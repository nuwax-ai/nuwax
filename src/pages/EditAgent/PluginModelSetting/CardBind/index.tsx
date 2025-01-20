import CardModeSetting from '@/components/CardModeSetting';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const CardBind: React.FC = () => {
  return (
    <div className={cx(styles.container)}>
      <CardModeSetting />
    </div>
  );
};

export default CardBind;

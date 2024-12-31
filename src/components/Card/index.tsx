import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import { Radio } from 'antd';

const cx = classNames.bind(styles);

interface CardType {
  type: string;
  checked: boolean;
  onClick: (type: string) => void;
}

const Card: React.FC<CardType> = ({type, checked, onClick}) => {
  return (
    <>
      {/*卡片一*/}
      <div className={cx(styles.container, 'flex', 'hover-box', 'cursor-pointer')} onClick={onClick}>
        <img src="" alt="" />
        <div className={cx(styles.center, 'flex-1')}>
          <h3>标题</h3>
          <p className={cx('text-ellipsis-2')}>内容描述是一种重要的沟通和表达，它在描述实物时发挥着至关重要的作用</p>
        </div>
        <Radio checked={checked} className={cx(styles.radio)} onClick={() => onClick('1')} />
      </div>
    </>
  );
};

export default Card;
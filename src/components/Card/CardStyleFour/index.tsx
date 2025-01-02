import { CardStyleEnum } from '@/types/enums/common';
import type { CardStyleType } from '@/types/interfaces/common';
import { Radio } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片四
 */
const CardStyleFour: React.FC<CardStyleType> = ({ type, onClick }) => {
  return (
    <div
      className={cx(
        styles.container,
        'flex',
        'flex-col',
        'hover-box',
        'cursor-pointer',
      )}
      onClick={() => onClick(CardStyleEnum.FOUR)}
    >
      <h3>标题</h3>
      <p className={'text-ellipsis-2'}>
        内容描述是一种重要的沟通和表达，它在描述实物时发挥着至关重要的作用
      </p>
      <Radio
        checked={type === CardStyleEnum.FOUR}
        className={cx(styles.radio)}
      />
    </div>
  );
};

export default CardStyleFour;

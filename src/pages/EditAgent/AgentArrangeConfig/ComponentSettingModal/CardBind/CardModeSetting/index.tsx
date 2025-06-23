import type { CardModeSettingProps } from '@/types/interfaces/agentConfig';
import { Radio } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片模式设置
 */
const CardModeSetting: React.FC<CardModeSettingProps> = ({
  cardKey,
  list,
  onChoose,
}) => {
  return (
    <div className={cx('h-full', 'overflow-y')}>
      {list?.map((item) => (
        <div
          key={item.id}
          className={cx(
            styles['card-box'],
            'flex',
            'hover-box',
            'cursor-pointer',
          )}
          onClick={() => onChoose(item)}
        >
          <img className={'radius-6'} src={item.imageUrl} alt="" />
          <Radio
            checked={item.cardKey === cardKey}
            className={cx(styles.radio)}
          />
        </div>
      ))}
    </div>
  );
};

export default CardModeSetting;

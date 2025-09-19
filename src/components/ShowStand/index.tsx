import Card from '@/components/Card';
import ToggleWrap from '@/components/ToggleWrap';
import { CardStyleEnum } from '@/types/enums/common';
import { CardDataInfo } from '@/types/interfaces/cardInfo';
import { ShowStandProps } from '@/types/interfaces/common';
import { Empty } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 展示台
 */
const ShowStand: React.FC<ShowStandProps> = ({
  className,
  visible,
  onClose,
  cardList,
}) => {
  // 单张卡片样式为2
  const cardStyleTwo = (item: CardDataInfo) => {
    return cardList?.length === 1 && item.cardKey === CardStyleEnum.TWO;
  };

  return (
    <ToggleWrap
      title={'展示台'}
      className={className}
      visible={visible}
      onClose={onClose}
    >
      {cardList?.length > 0 ? (
        <div className={cx(styles['inner-container'], 'scrollbar')}>
          <div className={cx(styles['card-item-container'])}>
            {cardList?.map((item, index) => (
              <Card
                key={`${item.cardKey}${index}`}
                {...item}
                className={cardStyleTwo(item) ? styles['card-style-two'] : ''}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description="暂无数据" />
        </div>
      )}
    </ToggleWrap>
  );
};

export default ShowStand;

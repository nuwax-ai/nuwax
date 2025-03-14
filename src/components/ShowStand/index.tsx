import Card from '@/components/Card';
import { CardStyleEnum } from '@/types/enums/common';
import { Empty } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import ToggleWrap from '@/components/ToggleWrap';

const cx = classNames.bind(styles);

// 展示台组件
export interface ShowStandProps {
  className?: string;
  list: {
    id: number;
    img: string;
    title: string;
    desc: string;
  }[];
  visible: boolean;
  onClose: () => void;
}

/**
 * 展示台
 */
const ShowStand: React.FC<ShowStandProps> = ({ className, visible, onClose, list }) => {
  return (
    <ToggleWrap
      title={'展示台'}
      className={className}
      visible={visible}
      onClose={onClose}
    >
      {list?.length > 0 ? (
        <div className={cx(styles['inner-container'])}>
          {list?.map((item) => (
            <Card
              key={item.id}
              {...item}
              type={CardStyleEnum.ONE}
              className={styles['card-wrapper']}
            />
          ))}
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

import Card from '@/components/Card';
import FoldWrap from '@/components/FoldWrap';
import { CardStyleEnum } from '@/types/enums/common';
import { Empty } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ShowStandProps {
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
const ShowStand: React.FC<ShowStandProps> = ({ visible, onClose, list }) => {
  return (
    <FoldWrap
      lineMargin
      title={'展示台'}
      className={styles.container}
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
    </FoldWrap>
  );
};

export default ShowStand;

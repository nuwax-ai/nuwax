import { PublishStatusEnum } from '@/types/enums/common';
import { CurrentPublishItemProps } from '@/types/interfaces/publish';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 当前发布组件
const CurrentPublishItem: React.FC<CurrentPublishItemProps> = ({
  info,
  onOffShelf,
}) => {
  return (
    <div className={cx('flex', 'items-center', styles.container)}>
      <div
        className={cx(
          'flex',
          'flex-col',
          'flex-1',
          'overflow-hide',
          styles['p-info'],
        )}
      >
        <span className={cx(styles['p-name'], 'text-ellipsis')}>
          {info?.description}
        </span>
        <span className={cx(styles['p-time'], 'text-ellipsis')}>
          {`${
            info?.publishUser?.nickName || info?.publishUser?.userName
          }发布于${moment(info?.publishDate).format('YYYY-MM-DD HH:mm')}`}
        </span>
      </div>
      <div
        className={cx(
          'flex',
          'items-center',
          'content-center',
          'radius-6',
          'cursor-pointer',
          styles.btn,
          { [styles['disabled-btn']]: !info?.publishStatus },
          {
            [styles['off-btn']]:
              info?.publishStatus === PublishStatusEnum.Published,
          },
        )}
        onClick={onOffShelf}
      >
        {`${
          info?.publishStatus === PublishStatusEnum.Published
            ? '下架'
            : '已下架'
        }`}
      </div>
    </div>
  );
};

export default CurrentPublishItem;

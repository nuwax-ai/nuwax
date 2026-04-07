import { dict } from '@/services/i18nRuntime';
import { PublishStatusEnum } from '@/types/enums/common';
import { CurrentPublishItemProps } from '@/types/interfaces/publish';
import classNames from 'classnames';
import dayjs from 'dayjs';
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
          {`${info?.publishUser?.nickName || info?.publishUser?.userName}${dict(
            'PC.Components.CurrentPublishItem.publishedAt',
          )}${dayjs(info?.publishDate).format('YYYY-MM-DD HH:mm')}`}
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
          {
            [styles['disabled-btn']]:
              info?.publishStatus !== PublishStatusEnum.Published,
          },
          {
            [styles['off-btn']]:
              info?.publishStatus === PublishStatusEnum.Published,
          },
        )}
        onClick={onOffShelf}
      >
        {`${
          info?.publishStatus === PublishStatusEnum.Published
            ? dict('PC.Components.CurrentPublishItem.offShelf')
            : info?.publishStatus === PublishStatusEnum.Applying
            ? dict('PC.Components.CurrentPublishItem.reviewing')
            : dict('PC.Components.CurrentPublishItem.hasBeenOffShelf')
        }`}
      </div>
    </div>
  );
};

export default CurrentPublishItem;

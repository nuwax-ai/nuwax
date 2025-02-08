import agentImage from '@/assets/images/agent_image.png';
import CustomPopover from '@/components/CustomPopover';
import { APPLICATION_MORE_ACTION } from '@/constants/space.contants';
import type { ApplicationMoreActionEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ApplicationItemProps } from '@/types/interfaces/space';
import {
  CheckCircleTwoTone,
  MoreOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个应用项
 */
const ApplicationItem: React.FC<ApplicationItemProps> = ({
  img,
  onClick,
  onClickMore,
}) => {
  // 收藏事件
  const handlerCollect = (e) => {
    e.stopPropagation();
  };

  // 点击更多操作
  const handlerClickMore = (item: CustomPopoverItem) => {
    const type = item.type as ApplicationMoreActionEnum;
    onClickMore(type);
  };

  return (
    <div
      className={cx(
        styles.container,
        'w-full',
        'px-16',
        'py-16',
        'radius-6',
        'flex',
        'flex-col',
        'content-between',
        'cursor-pointer',
      )}
      onClick={() => onClick('11100')}
    >
      <div className={cx('flex', styles.header)}>
        <div className={cx('flex-1', 'overflow-hide')}>
          <div className={cx('flex', styles['info-box'])}>
            <h3 className={cx('text-ellipsis', styles.title)}>智慧家居管家</h3>
            <CheckCircleTwoTone twoToneColor="#52c41a" />
          </div>
          <p className={cx('text-ellipsis-2', styles.desc)}>
            英语培训加速赛英语培训加速赛英语培训加速赛英语培训加速赛
          </p>
        </div>
        <span className={cx(styles['logo-box'], 'overflow-hide')}>
          <img src={img || (agentImage as string)} alt="" />
        </span>
      </div>
      <div className={cx('flex', styles['rel-info'])}>
        <span>豆包</span>
        <span>AI大模型</span>
        <span>最近编辑</span>
        <span>11-11 16:00</span>
      </div>
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <div className={cx('flex-1', 'flex', 'overflow-hide')}>
          <UserOutlined />
          <span className={cx('flex-1', 'text-ellipsis', styles.author)}>
            张超
          </span>
        </div>
        <span
          className={cx(
            styles['icon-box'],
            'flex',
            'content-center',
            'items-center',
            'hover-box',
          )}
          onClick={handlerCollect}
        >
          <StarOutlined />
        </span>
        <CustomPopover
          onClick={handlerClickMore}
          list={APPLICATION_MORE_ACTION}
        >
          <span
            className={cx(
              styles['icon-box'],
              'flex',
              'content-center',
              'items-center',
              'hover-box',
            )}
          >
            <MoreOutlined />
          </span>
        </CustomPopover>
      </div>
    </div>
  );
};

export default ApplicationItem;

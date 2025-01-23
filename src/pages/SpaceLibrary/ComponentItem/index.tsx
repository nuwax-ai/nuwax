import CustomPopover from '@/components/CustomPopover';
import { COMPONENT_MORE_ACTION } from '@/constants/library.constants';
import type { ComponentItemProps } from '@/types/interfaces/library';
import { MoreOutlined, PieChartOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 单个资源组件
const ComponentItem: React.FC<ComponentItemProps> = ({
  title,
  desc,
  img,
  onClick,
  onClickMore,
}) => {
  return (
    <div
      className={cx(
        styles.container,
        'py-12',
        'radius-6',
        'flex',
        'flex-col',
        'content-between',
        'cursor-pointer',
      )}
      onClick={onClick}
    >
      <div className={cx('flex', 'content-between', styles.header)}>
        <div
          className={cx(
            'flex-1',
            'flex',
            'flex-col',
            'content-around',
            'overflow-hide',
          )}
        >
          <h3 className={cx('text-ellipsis', styles['plugin-name'])}>
            {title}
          </h3>
          <p className={cx('text-ellipsis', styles.desc)}>{desc}</p>
        </div>
        <img className={cx(styles.img)} src={img} alt="" />
      </div>
      {/*插件类型*/}
      <div
        className={cx('flex', 'flex-wrap', 'items-center', styles['type-wrap'])}
      >
        <span
          className={cx(
            styles.box,
            'flex',
            'items-center',
            'content-center',
            'px-6',
          )}
        >
          <PieChartOutlined />
          <span>插件</span>
        </span>
        <span
          className={cx(
            styles.box,
            'flex',
            'items-center',
            'content-center',
            'px-6',
          )}
        >
          <span>已发布</span>
        </span>
      </div>
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <img className={cx(styles.img, 'radius-6')} src={img} alt="" />
        <span>admin, 最近编辑 12-05 15:34</span>
        <CustomPopover list={COMPONENT_MORE_ACTION} onClick={onClickMore}>
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

export default ComponentItem;

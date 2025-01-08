import personal from '@/assets/images/personal.png';
import {
  AuditOutlined,
  BorderVerticleOutlined,
  CopyOutlined,
  HddOutlined,
  RadarChartOutlined,
} from '@ant-design/icons';
import { Popover } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// todo 待确定
const LIST = [
  {
    type: 1,
    icon: <BorderVerticleOutlined />,
    text: '应用开发',
  },
  {
    type: 2,
    icon: <HddOutlined />,
    text: '组件库',
  },
  {
    type: 3,
    icon: <RadarChartOutlined />,
    text: '团队设置',
  },
  {
    type: 4,
    icon: <AuditOutlined />,
    text: '资源开发',
  },
];

const SpaceSection: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <div className={cx('h-full', 'px-6', 'py-16', 'overflow-y')}>
      <Popover
        placement="bottomLeft"
        open={open}
        trigger="click"
        arrow={false}
        onOpenChange={setOpen}
        content={
          <div className={cx(styles.header)}>
            <img
              className={cx(styles.img, 'radius-6')}
              src={personal as string}
              alt=""
            />
            <span className={cx('flex-1', styles.title)}>个人空间</span>
          </div>
        }
      >
        <div
          className={cx(
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
            'px-6',
            styles['header'],
          )}
        >
          <img
            className={cx(styles.img, 'radius-6')}
            src={personal as string}
            alt=""
          />
          <span className={cx('flex-1', styles.title)}>个人空间</span>
          <CopyOutlined />
        </div>
      </Popover>
      <ul>
        {LIST.map((item) => (
          <li
            key={item.type}
            className={cx(
              styles['space-item'],
              'hover-box',
              'flex',
              'items-center',
              'cursor-pointer',
            )}
          >
            {item.icon}
            <span className={cx(styles.text)}>{item.text}</span>
          </li>
        ))}
      </ul>
      <h3 className={cx(styles['collection-title'])}>开发收藏</h3>
      <ul>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf26-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1735635749&x-signature=DgUpNQcsa2fsW8U18NYrc%2FDEcM4%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf26-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1735635749&x-signature=DgUpNQcsa2fsW8U18NYrc%2FDEcM4%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf26-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1735635749&x-signature=DgUpNQcsa2fsW8U18NYrc%2FDEcM4%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
      </ul>
    </div>
  );
};

export default SpaceSection;

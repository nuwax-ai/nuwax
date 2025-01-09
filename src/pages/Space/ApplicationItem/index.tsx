import { APPLICATION_MORE_ACTION } from '@/constants/space.contants';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import {
  CheckCircleTwoTone,
  MoreOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Popover } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const ApplicationItem: React.FC = () => {
  const handlerCollect = (e) => {
    e.preventDefault();
    console.log('收藏');
  };

  const handlerClickMore = (type: ApplicationMoreActionEnum) => {
    console.log(type);
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
          <img
            src="https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736495925&x-signature=Cep9yaOi9FW4Y14KmEY9u366780%3D"
            alt=""
          />
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
        <Popover
          content={
            <ul>
              {APPLICATION_MORE_ACTION.map((item) => (
                <li
                  key={item.type}
                  className={cx(
                    styles['more-line'],
                    'hover-box',
                    'cursor-pointer',
                    {
                      [styles.del]: item.type === ApplicationMoreActionEnum.Del,
                    },
                  )}
                  onClick={() => handlerClickMore(item.type)}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          }
          placement="bottomRight"
          arrow={false}
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
        </Popover>
      </div>
    </div>
  );
};

export default ApplicationItem;

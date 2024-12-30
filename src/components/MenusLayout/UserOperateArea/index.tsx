import { USER_OPERATE_AREA } from '@/constants/menus.constants';
import type { UserOperatorAreaEnum } from '@/types/enums/menus';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import type { UserOperateAreaType } from '@/types/interfaces/menus';

const cx = classNames.bind(styles);
const UserOperateArea: React.FC<UserOperateAreaType> = ({ onClick }) => {
  return (
    <>
      {USER_OPERATE_AREA.map((item, index) => {
        return (
          <Tooltip
            key={index}
            placement="right"
            color={'#fff'}
            overlayInnerStyle={{ color: '#000' }}
            title={item.title}
          >
            <div
              className={cx(
                styles['user-icon'],
                'flex',
                'content-center',
                'items-center',
                'hover-box',
                'cursor-pointer',
              )}
              onClick={() => onClick(item.type)}
            >
              {item.icon}
            </div>
          </Tooltip>
        );
      })}
    </>
  );
};

export default UserOperateArea;

import { EVENT_TYPE } from '@/constants/event.constants';
import { USER_OPERATE_AREA } from '@/constants/menus.constants';
import { apiNotifyMessageUnreadCount } from '@/services/message';
import { UserOperatorAreaEnum } from '@/types/enums/menus';
import type {
  UserOperateAreaItemType,
  UserOperateAreaType,
} from '@/types/interfaces/layouts';
import eventBus from '@/utils/eventBus';
import { Badge, Tooltip } from 'antd';
import classNames from 'classnames';
import { cloneDeep } from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 一级菜单栏底部的用户操作区域组件
 */
const UserOperateArea: React.FC<UserOperateAreaType> = ({ onClick }) => {
  const { unreadCount, setUnreadCount } = useModel('layout');
  // 查询用户未读消息数量
  const { run: runNotifyMessageUnreadCount } = useRequest(
    apiNotifyMessageUnreadCount,
    {
      manual: true,
      onSuccess: (result: number) => {
        if (result > 0) {
          setUnreadCount(result);
        }
      },
    },
  );

  const dataSource: UserOperateAreaItemType[] = useMemo(() => {
    const _userOperateArea = cloneDeep(USER_OPERATE_AREA);
    if (unreadCount === 0) {
      return _userOperateArea;
    } else {
      return _userOperateArea.map((item: UserOperateAreaItemType) => {
        if (item.type === UserOperatorAreaEnum.Message) {
          item.title = `${unreadCount} 条未读消息`;
        }
        return item;
      });
    }
  }, [unreadCount, USER_OPERATE_AREA]);

  useEffect(() => {
    // 初始化查询未读消息数量
    runNotifyMessageUnreadCount();
    // 监听新消息事件
    eventBus.on(EVENT_TYPE.NewNotifyMessage, runNotifyMessageUnreadCount);

    return () => {
      eventBus.off(EVENT_TYPE.NewNotifyMessage, runNotifyMessageUnreadCount);
    };
  }, []);

  return dataSource.map((item, index) => (
    <Tooltip
      key={index}
      placement="right"
      color={'#fff'}
      styles={{
        body: { color: '#000' },
      }}
      title={item.title}
    >
      <div
        className={cx(
          styles['user-icon'],
          'flex',
          'content-center',
          'items-center',
          'hover-deep',
          'cursor-pointer',
        )}
        onClick={() => onClick(item.type)}
      >
        {item.type === UserOperatorAreaEnum.Message && unreadCount > 0 ? (
          <Badge count={unreadCount} size="small">
            {item.icon}
          </Badge>
        ) : (
          item.icon
        )}
      </div>
    </Tooltip>
  ));
};

export default UserOperateArea;

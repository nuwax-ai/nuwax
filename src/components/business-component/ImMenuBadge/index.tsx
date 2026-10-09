import { imUnreadState } from '@/services/imEventBridge';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { isImMenu } from '@/utils/imMenuPolicy';
import { Badge } from 'antd';
import React, { useSyncExternalStore } from 'react';

const getServerUnreadCount = () => 0;

const UnreadBadge: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const count = useSyncExternalStore(
    imUnreadState.subscribe,
    imUnreadState.getSnapshot,
    getServerUnreadCount,
  );
  return (
    <Badge
      count={count}
      overflowCount={99}
      size="small"
      style={{ flexShrink: 0 }}
    >
      {children}
    </Badge>
  );
};

/** 消息导航共用角标；普通菜单不注册展示订阅，也不增加 DOM 包装。 */
const ImMenuBadge: React.FC<{
  menu?: MenuItemDto;
  children?: React.ReactNode;
}> = ({ menu, children }) => {
  if (!menu || !isImMenu(menu)) return <>{children}</>;
  return <UnreadBadge>{children}</UnreadBadge>;
};

export default ImMenuBadge;

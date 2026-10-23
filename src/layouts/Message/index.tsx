import { dict } from '@/services/i18nRuntime';
import {
  apiInstantMessageContacts,
  apiNotifyMessageList,
  apiNotifyMessageUnreadClear,
} from '@/services/message';
import type { NotifyMessageInfo } from '@/types/interfaces/message';
import type { RequestResponse } from '@/types/interfaces/request';
import { useRequest } from 'ahooks';
import { Empty, Popover } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';
import MessageItem from './MessageItem';
import { buildContactDisplayNameMap } from './senderDisplayName';

const cx = classNames.bind(styles);

interface MessageProps {
  className?: string;
  children?: React.ReactNode;
}

const Message: React.FC<MessageProps> = ({ className, children }) => {
  const { setUnreadCount, openMessage, setOpenMessage } = useModel('layout');
  // 消息列表
  const [messageList, setMessageList] = useState<NotifyMessageInfo[]>([]);
  // IM 通讯录「备注优先」显示名（NW-094）：打开面板时尽力拉取，失败留空回退旧取名
  const [contactNames, setContactNames] = useState<Map<string, string>>(
    () => new Map(),
  );

  // 清除所有未读消息
  const { run: runClear } = useRequest(apiNotifyMessageUnreadClear, {
    manual: true,
    debounceWait: 300,
  });

  // 查询用户消息列表
  const { run: runMessageList } = useRequest(apiNotifyMessageList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<NotifyMessageInfo[]>) => {
      setMessageList(result?.data || []);
    },
  });

  useEffect(() => {
    if (openMessage) {
      runMessageList({
        size: 100,
      });

      // 备注名跟随：通讯录拉取失败（IM 未部署/未登录）时静默，列表仍按旧取名渲染
      void apiInstantMessageContacts().then((result) => {
        setContactNames(buildContactDisplayNameMap(result?.data?.items));
      });

      runClear();
      setUnreadCount(0);
    }
  }, [openMessage]);

  return (
    <Popover
      classNames={{ root: cx(styles.container, className) }}
      // 内容区域
      content={
        <div className={cx(styles['message-list'], 'scroll-container')}>
          {messageList?.length > 0 ? (
            messageList.map((item, index) => {
              return (
                <MessageItem
                  key={index}
                  info={item}
                  contactNames={contactNames}
                />
              );
            })
          ) : (
            <Empty
              className={cx(
                'h-full',
                'flex',
                'flex-col',
                'items-center',
                'content-center',
              )}
              description={dict('PC.Layouts.Message.noMessages')}
            />
          )}
        </div>
      }
      arrow={false}
      destroyOnHidden
      placement="rightBottom"
      trigger="click"
      open={openMessage}
      onOpenChange={setOpenMessage}
    >
      {children}
    </Popover>
  );
};

export default Message;

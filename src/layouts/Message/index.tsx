import { MESSAGE_OPTIONS } from '@/constants/menus.constants';
import {
  apiNotifyMessageList,
  apiNotifyMessageUnreadClear,
} from '@/services/message';
import { MessageReadStatusEnum } from '@/types/enums/menus';
import type { NotifyMessageInfo } from '@/types/interfaces/message';
import type { RequestResponse } from '@/types/interfaces/request';
import { ClearOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Empty, message, Popover, Segmented, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';
import MessageItem from './MessageItem';

const cx = classNames.bind(styles);

const Message: React.FC = () => {
  const { unreadCount, setUnreadCount, openMessage, setOpenMessage } =
    useModel('layout');
  // 分段控制器：全部、未读
  const [segmentedValue, setSegmentedValue] = useState<MessageReadStatusEnum>(
    MessageReadStatusEnum.All,
  );
  // 消息列表
  const [messageList, setMessageList] = useState<NotifyMessageInfo[]>([]);
  // 未读消息列表
  const [unreadMessageList, setUnreadMessageList] = useState<
    NotifyMessageInfo[]
  >([]);

  // 清除所有未读消息
  const { run: runClear } = useRequest(apiNotifyMessageUnreadClear, {
    manual: true,
    debounceInterval: 300,
  });

  // 查询用户消息列表
  const { run: runMessageList } = useRequest(apiNotifyMessageList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: async (result: RequestResponse<NotifyMessageInfo[]>) => {
      if (segmentedValue === MessageReadStatusEnum.All) {
        setMessageList(result?.data || []);
      } else {
        setUnreadMessageList(result?.data || []);
        await runClear();
        setUnreadCount(0);
      }
    },
  });

  // 切换分段控制器
  const handlerChangeSegment = async (status: MessageReadStatusEnum) => {
    setSegmentedValue(status);
    if (status === MessageReadStatusEnum.All) {
      runMessageList({
        size: 100,
      });
    } else {
      runMessageList({
        size: 100,
        readStatus: MessageReadStatusEnum.Unread,
      });
    }
  };

  useEffect(() => {
    if (openMessage) {
      runMessageList({
        size: 100,
      });
    } else {
      setSegmentedValue(MessageReadStatusEnum.All);
    }
  }, [openMessage]);

  const showList =
    segmentedValue === MessageReadStatusEnum.All
      ? messageList
      : unreadMessageList;

  const handleClearAll = async () => {
    await runClear();
    setUnreadMessageList([]);
    setUnreadCount(0);
    message.success('已清除所有未读消息');
  };

  return (
    <Popover
      overlayClassName={cx(styles.container)}
      content={
        <>
          <div className={cx('flex', 'content-between')}>
            {/*分段控制器*/}
            <Segmented
              className={cx(styles.segment)}
              value={segmentedValue}
              onChange={handlerChangeSegment}
              block
              options={MESSAGE_OPTIONS}
            />
            {/*清空按钮*/}
            <Tooltip
              placement="top"
              color={'#fff'}
              overlayInnerStyle={{ color: '#000' }}
              title={'清除所有未读消息'}
            >
              {/*根据是否有未读消息做图标切换*/}
              {unreadCount > 0 ? (
                <ClearOutlined
                  onClick={handleClearAll}
                  className={cx('cursor-pointer')}
                />
              ) : (
                <ClearOutlined
                  className={cx(styles['del-disabled'], 'cursor-disabled')}
                />
              )}
            </Tooltip>
          </div>
          {/*内容区域*/}
          <div className={cx(styles['message-list'], 'py-16', 'overflow-y')}>
            {showList?.length > 0 ? (
              showList.map((item, index) => {
                return <MessageItem key={index} info={item} />;
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
                description={
                  segmentedValue === MessageReadStatusEnum.All
                    ? '暂无消息'
                    : '暂无未读消息'
                }
              />
            )}
          </div>
        </>
      }
      arrow={false}
      destroyTooltipOnHide
      placement="rightBottom"
      trigger="click"
      open={openMessage}
      onOpenChange={setOpenMessage}
    ></Popover>
  );
};

export default Message;

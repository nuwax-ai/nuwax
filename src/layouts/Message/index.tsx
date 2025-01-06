import { MESSAGE_OPTIONS } from '@/constants/menus.constants';
import { MessageOptionEnum } from '@/types/enums/menus';
import { ClearOutlined } from '@ant-design/icons';
import { Empty, Popover, Segmented, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Message: React.FC = () => {
  const { openMessage, setOpenMessage } = useModel('layout');
  // 分段控制器：全部、未读
  const [value, setValue] = useState<MessageOptionEnum>(MessageOptionEnum.All);
  // 消息列表 todo: 待修改any
  const [messageList, setMessageList] = useState<any[]>([]);
  // 未读消息列表 todo: 待修改any
  const [unreadMessageList, setUnreadMessageList] = useState<any[]>([]);
  const handlerChange = (value: MessageOptionEnum) => {
    setValue(value);
  };

  // todo
  const handlerClear = () => {
    console.log('清除未读消息');
    setUnreadMessageList([]);
  };
  return (
    <Popover
      overlayClassName={cx(styles.container)}
      content={
        <>
          <div className={cx('flex', 'content-between')}>
            <Segmented
              className={cx(styles.segment)}
              value={value}
              onChange={handlerChange}
              block
              options={MESSAGE_OPTIONS}
            />
            <Tooltip
              placement="top"
              color={'#fff'}
              overlayInnerStyle={{ color: '#000' }}
              title={'清除所有未读消息'}
            >
              {/*根据是否有未读消息做图标切换*/}
              {unreadMessageList?.length > 0 ? (
                <ClearOutlined
                  onClick={handlerClear}
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
            {messageList?.length > 0 ? (
              messageList.map((item, index) => {
                return <div key={index}>item</div>;
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
                  value === MessageOptionEnum.All ? '暂无消息' : '暂无未读消息'
                }
              />
            )}
          </div>
        </>
      }
      title={null}
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

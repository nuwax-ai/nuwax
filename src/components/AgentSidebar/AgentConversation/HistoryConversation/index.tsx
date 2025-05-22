import CustomPopover from '@/components/CustomPopover';
import { apiAgentConversationDelete } from '@/services/agentConfig';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { Empty, message, Modal } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 历史会话弹窗
export interface HistoryConversationProps {
  conversationList?: ConversationInfo[];
  isOpen?: boolean;
  onDel: (id: number) => void;
  onCancel?: () => void;
}

/**
 * 历史会话弹窗
 */
const HistoryConversation: React.FC<HistoryConversationProps> = ({
  conversationList,
  isOpen,
  onCancel,
  onDel,
}) => {
  // 删除会话
  const { run: runDel } = useRequest(apiAgentConversationDelete, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (_: null, params: number[]) => {
      const conversationId = params[0];
      onDel(conversationId);
      message.success('删除成功');
    },
  });

  const handleLink = (id: number, agentId: number) => {
    onCancel?.();
    history.push(`/home/chat/${id}/${agentId}`);
  };

  return (
    <Modal
      title={<p>历史会话</p>}
      width={600}
      footer={null}
      maskClosable
      destroyOnClose
      open={isOpen}
      onCancel={onCancel}
    >
      <div className={cx(styles.container, 'overflow-y')}>
        {conversationList?.length ? (
          conversationList.map((item: ConversationInfo) => (
            <CustomPopover
              key={item.id}
              list={[{ label: '删除' }]}
              onClick={() => runDel(item.id)}
            >
              <div
                className={cx(
                  'flex',
                  'items-center',
                  'radius-6',
                  'cursor-pointer',
                  'hover-box',
                  styles.row,
                )}
                onClick={() => handleLink(item.id, item.agentId)}
              >
                <p className={cx('flex-1', 'text-ellipsis')}>{item.topic}</p>
                <span>{moment(item.created).format('MM-DD HH:mm')}</span>
              </div>
            </CustomPopover>
          ))
        ) : (
          <div
            className={cx('flex', 'items-center', 'content-center', 'h-full')}
          >
            <Empty description="暂无数据" />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default HistoryConversation;

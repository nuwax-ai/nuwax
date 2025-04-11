import { apiAgentConversationList } from '@/services/agentConfig';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { history } from '@@/core/history';
import { LoadingOutlined } from '@ant-design/icons';
import { Empty, Modal } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 历史会话弹窗
 */
const HistoryConversation: React.FC = () => {
  const { openHistoryModal, setOpenHistoryModal } = useModel('layout');
  // 历史会话列表
  const [conversationList, setConversationList] = useState<ConversationInfo[]>(
    [],
  );

  // 查询历史会话记录
  const { run: runHistory, loading } = useRequest(apiAgentConversationList, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (result: ConversationInfo[]) => {
      setConversationList(result);
    },
  });

  useEffect(() => {
    if (openHistoryModal) {
      runHistory({
        agentId: null,
      });
    }

    return () => {
      setConversationList([]);
    };
  }, [openHistoryModal]);

  const handleLink = (id: number) => {
    setOpenHistoryModal(false);
    history.push(`/home/chat/${id}`);
  };

  return (
    <Modal
      title={<p>历史会话</p>}
      width={600}
      footer={null}
      maskClosable
      destroyOnClose
      open={openHistoryModal}
      onCancel={() => setOpenHistoryModal(false)}
    >
      <div className={cx(styles.container, 'overflow-y')}>
        {loading ? (
          <div
            className={cx('flex', 'items-center', 'content-center', 'h-full')}
          >
            <LoadingOutlined />
          </div>
        ) : conversationList?.length > 0 ? (
          <ul>
            {conversationList?.map((item) => (
              <li
                key={item.id}
                className={cx(
                  'flex',
                  'items-center',
                  'radius-6',
                  'cursor-pointer',
                  'hover-box',
                  styles.row,
                )}
                onClick={() => handleLink(item.id)}
              >
                <p className={cx('flex-1')}>{item.topic}</p>
                <span>{moment(item.created).format('MM-DD HH:mm')}</span>
              </li>
            ))}
          </ul>
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

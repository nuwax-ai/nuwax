import CustomPopover from '@/components/CustomPopover';
import { apiAgentConversationDelete } from '@/services/agentConfig';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { LoadingOutlined } from '@ant-design/icons';
import { Empty, message, Modal } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect } from 'react';
import { history, useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 历史会话弹窗
 */
const HistoryConversation: React.FC = () => {
  const { openHistoryModal, setOpenHistoryModal } = useModel('layout');
  const {
    loadingHistory,
    setLoadingHistory,
    runHistory,
    conversationList,
    setConversationList,
  } = useModel('conversationHistory');

  // 删除会话
  const { run: runDel } = useRequest(apiAgentConversationDelete, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (_: null, params: number[]) => {
      const conversationId = params[0];
      setConversationList((list: ConversationInfo[]) =>
        list.filter((item) => item.id !== conversationId),
      );
      message.success('删除成功');
    },
  });

  useEffect(() => {
    if (openHistoryModal) {
      setLoadingHistory(true);
      runHistory({
        agentId: null,
      });
    }
  }, [openHistoryModal]);

  const handleLink = (id: number, agentId: number) => {
    setOpenHistoryModal(false);
    history.push(`/home/chat/${id}/${agentId}`);
  };

  return (
    <Modal
      title={<p>历史会话</p>}
      width={600}
      footer={null}
      maskClosable
      destroyOnHidden
      open={openHistoryModal}
      onCancel={() => setOpenHistoryModal(false)}
    >
      <div className={cx(styles.container, 'overflow-y')}>
        {loadingHistory ? (
          <div
            className={cx('flex', 'items-center', 'content-center', 'h-full')}
          >
            <LoadingOutlined />
          </div>
        ) : conversationList?.length > 0 ? (
          <>
            {conversationList?.map((item: ConversationInfo) => (
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
                  <span>{dayjs(item.created).format('MM-DD HH:mm')}</span>
                </div>
              </CustomPopover>
            ))}
          </>
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

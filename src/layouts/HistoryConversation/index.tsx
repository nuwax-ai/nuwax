import { apiAgentConversationList } from '@/services/agentConfig';
import { Modal } from 'antd';
import React from 'react';
import { useModel } from 'umi';
import InfiniteList from '../InfiniteList';

/**
 * 历史会话弹窗
 */
const HistoryConversation: React.FC = () => {
  const { openHistoryModal, setOpenHistoryModal } = useModel('layout');

  const fetchApi = async (lastId: number | null, pageSize: number) => {
    return apiAgentConversationList({
      agentId: null,
      lastId,
      limit: pageSize,
    }).then((res) => {
      return {
        list: res.data ?? [],
        hasMore: res.data.length >= pageSize,
      };
    });
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
      <InfiniteList height={500} pageSize={20} loadData={fetchApi} />
    </Modal>
  );
};

export default HistoryConversation;

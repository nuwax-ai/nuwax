import InfiniteList from '@/layouts/InfiniteList';
import { apiAgentConversationList } from '@/services/agentConfig';
import { Modal } from 'antd';
import React from 'react';
import { history, useModel, useParams } from 'umi';

/**
 * 历史会话弹窗
 */
const HistoryConversation: React.FC = () => {
  const { openHistoryModal, setOpenHistoryModal } = useModel('layout');
  const { conversationList, setConversationList, runDel } = useModel(
    'conversationHistory',
  );
  const params = useParams();
  const id = Number(params.id);
  const agentId = Number(params.agentId);

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

  const handleLink = (id: number, agentId: number) => {
    setOpenHistoryModal(false);
    history.push(`/home/chat/${id}/${agentId}`);
  };

  // 删除会话
  const handleDelete = async (currentId: number) => {
    try {
      await runDel(currentId);
      if (id === currentId) {
        setOpenHistoryModal(false);
        // 删除自己跳转至新会话
        history.push('/agent/' + agentId);
      }
    } catch (e) {}
  };

  return (
    <Modal
      title={<p>历史会话</p>}
      width={600}
      footer={null}
      maskClosable
      open={openHistoryModal}
      onCancel={() => setOpenHistoryModal(false)}
    >
      <InfiniteList
        height={500}
        pageSize={20}
        conversationList={conversationList}
        setConversationList={setConversationList}
        loadData={fetchApi}
        handleLink={handleLink}
        runDel={handleDelete}
      />
    </Modal>
  );
};

export default HistoryConversation;

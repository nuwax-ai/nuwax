import InfiniteList from '@/layouts/InfiniteList';
import { apiAgentConversationList } from '@/services/agentConfig';
import { Modal } from 'antd';
import React from 'react';
import { history, useModel, useParams } from 'umi';

// 历史会话弹窗
export interface HistoryConversationProps {
  agentId: number;
  isOpen?: boolean;
  onCancel?: () => void;
}

/**
 * 历史会话弹窗
 */
const HistoryConversation: React.FC<HistoryConversationProps> = ({
  agentId,
  isOpen,
  onCancel,
}) => {
  const { conversationListItem, setConversationListItem, runDel } = useModel(
    'conversationHistory',
  );

  const params = useParams();
  const id = Number(params.id);

  const handleDelete = async (currentId: number) => {
    try {
      await runDel(currentId);
      if (id === currentId) {
        onCancel?.();
        // 删除自己跳转至新会话
        history.push('/agent/' + agentId);
      }
    } catch (e) {}
  };

  const handleLink = (id: number, agentId: number) => {
    onCancel?.();
    history.push(`/home/chat/${id}/${agentId}`);
  };

  const fetchApi = async (lastId: number | null, pageSize: number) => {
    return apiAgentConversationList({
      agentId,
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
      open={isOpen}
      onCancel={onCancel}
    >
      <InfiniteList
        height={500}
        pageSize={20}
        conversationList={conversationListItem}
        setConversationList={setConversationListItem}
        loadData={fetchApi}
        handleLink={handleLink}
        runDel={handleDelete}
      />
    </Modal>
  );
};

export default HistoryConversation;

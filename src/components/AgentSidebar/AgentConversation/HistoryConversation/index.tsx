import InfiniteList from '@/layouts/InfiniteList';
import {
  apiAgentConversationDelete,
  apiAgentConversationList,
} from '@/services/agentConfig';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { message, Modal } from 'antd';
import React from 'react';
import { history, useParams, useRequest } from 'umi';

// 历史会话弹窗
export interface HistoryConversationProps {
  agentId: number;
  conversationList?: ConversationInfo[];
  setConversationList?: React.Dispatch<
    React.SetStateAction<ConversationInfo[] | undefined>
  >;
  isOpen?: boolean;
  onDel: (id: number) => void;
  onCancel?: () => void;
}

/**
 * 历史会话弹窗
 */
const HistoryConversation: React.FC<HistoryConversationProps> = ({
  agentId,
  conversationList,
  setConversationList,
  isOpen,
  onCancel,
  onDel,
}) => {
  const params = useParams();
  const id = Number(params.id);

  // 删除会话
  const { run: runDel } = useRequest(apiAgentConversationDelete, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (_: null, params: number[]) => {
      const conversationId = params[0];
      setConversationList?.((list) =>
        list?.filter((item) => item.id !== conversationId),
      );
      onDel(conversationId);
      // 删除自己跳转至新会话
      if (conversationId === id) {
        history.push('/agent/' + agentId);
      }
      message.success('删除成功');
    },
  });

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
        conversationList={conversationList}
        setConversationList={setConversationList}
        loadData={fetchApi}
        handleLink={handleLink}
        runDel={runDel}
      />
    </Modal>
  );
};

export default HistoryConversation;

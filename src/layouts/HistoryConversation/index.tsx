import InfiniteList from '@/layouts/InfiniteList';
import {
  apiAgentConversationDelete,
  apiAgentConversationList,
} from '@/services/agentConfig';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { message, Modal } from 'antd';
import React from 'react';
import { history, useModel, useRequest } from 'umi';

/**
 * 历史会话弹窗
 */
const HistoryConversation: React.FC = () => {
  const { openHistoryModal, setOpenHistoryModal } = useModel('layout');
  const { conversationList, setConversationList } = useModel(
    'conversationHistory',
  );

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
  const { run: runDel } = useRequest(apiAgentConversationDelete, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (_: null, params: number[]) => {
      const conversationId = params[0];
      setConversationList((list: ConversationInfo[]) => {
        const arr = list.filter((item) => item.id !== conversationId);
        // 跳转到删除的会话
        const item = arr.find((item) => item.id === conversationId);

        if (!item) {
          if (arr.length) {
            // 如果当前会话已删除，跳转到第一个会话
            history.push(`/home/chat/${arr[0].id}/${arr[0].agentId}`);
          } else {
            history.push('/');
          }
        }
        return arr;
      });
      message.success('删除成功');
    },
  });

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
        runDel={runDel}
      />
    </Modal>
  );
};

export default HistoryConversation;

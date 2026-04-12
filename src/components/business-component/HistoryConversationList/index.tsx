import {
  apiAgentConversationDelete,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useDebounceFn } from 'ahooks';
import { Input, message, Modal } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { history, useLocation, useModel } from 'umi';
import ConversationList, { ConversationListRef } from './ConversationList';
import styles from './index.module.less';

// 历史会话页面组件Props
export interface HistoryConversationListProps {
  agentId?: number | null;
  onClickLink: (id: number, agentId: number) => void;
}

/**
 * 历史会话页面组件
 * 该组件用于展示历史会话列表和应用智能体历史会话列表页面
 */
const HistoryConversationList: React.FC<HistoryConversationListProps> = ({
  agentId,
  onClickLink,
}) => {
  const { runHistory } = useModel('conversationHistory');
  const location = useLocation();
  const [keyword, setKeyword] = useState<string>('');
  const [activeKeyword, setActiveKeyword] = useState<string>('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [currentRenameId, setCurrentRenameId] = useState<number | null>(null);
  const [newTopic, setNewTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentDeleteId, setCurrentDeleteId] = useState<number | null>(null);
  const listRef = useRef<ConversationListRef>(null);

  const { isMobile } = useModel('layout');

  // 防抖处理搜索逻辑
  const { run: handleSearch } = useDebounceFn(
    (val: string) => {
      setActiveKeyword(val);
    },
    {
      wait: 500,
    },
  );

  // 监听菜单点击刷新（类似查看全部）推送的 _t 状态
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      setKeyword('');
      setActiveKeyword('');
      listRef.current?.refresh();
    }
  }, [location.state]);

  const onStartSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);
    handleSearch(val);
  };

  const handleEdit = (id: number, currentTopic: string) => {
    setCurrentRenameId(id);
    setNewTopic(currentTopic);
    setRenameModalVisible(true);
  };

  const handleRenameSubmit = async () => {
    if (!currentRenameId) return;
    const trimmedTopic = newTopic.trim();
    if (!trimmedTopic) {
      message.warning(
        t('PC.Components.HistoryConversationList.renameTitleEmpty'),
      );
      return;
    }
    if (trimmedTopic.length > 50) {
      message.warning(
        t('PC.Components.HistoryConversationList.renameTitleTooLong'),
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiAgentConversationUpdate({
        id: currentRenameId,
        topic: trimmedTopic,
      });

      if (res.success) {
        listRef.current?.refresh();
        runHistory({
          agentId,
          limit: 20,
        });
        message.success(
          t('PC.Components.HistoryConversationList.renameSuccess'),
        );
        setRenameModalVisible(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    setCurrentDeleteId(id);
    setDeleteModalVisible(true);
  };

  const handleDeleteSubmit = async () => {
    if (!currentDeleteId) return;

    setSubmitting(true);
    try {
      const res = await apiAgentConversationDelete(currentDeleteId);

      if (res.success) {
        listRef.current?.removeItem(currentDeleteId);
        runHistory({
          agentId,
          limit: 20,
        });
        message.success(
          t('PC.Components.HistoryConversationList.deleteSuccess'),
        );
        setDeleteModalVisible(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles['close-icon']} ${
          isMobile ? styles['close-icon-mobile'] : ''
        }`}
        onClick={() => {
          history.back();
        }}
      >
        <CloseOutlined />
      </div>
      <div className={styles['main-content']}>
        <div
          className={`${styles.title} ${
            isMobile ? styles['title-mobile'] : ''
          }`}
        >
          {t('PC.Components.HistoryConversationList.pageTitle')}
        </div>
        <div
          className={`${styles['search-input']} ${
            isMobile ? styles['search-input-mobile'] : ''
          }`}
        >
          <Input
            prefix={<SearchOutlined style={{ color: '#999', fontSize: 16 }} />}
            placeholder={t(
              'PC.Components.HistoryConversationList.searchPlaceholder',
            )}
            value={keyword}
            onChange={onStartSearch}
            className={styles['search-input-field']}
            allowClear
          />
        </div>
        <div className={styles['list-wrapper']}>
          <ConversationList
            ref={listRef}
            agentId={agentId}
            keyword={activeKeyword}
            onItemClick={onClickLink}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <Modal
        title={t('PC.Components.HistoryConversationList.renameModalTitle')}
        open={renameModalVisible}
        onOk={handleRenameSubmit}
        onCancel={() => setRenameModalVisible(false)}
        confirmLoading={submitting}
        okButtonProps={{ disabled: !newTopic.trim() }}
        okText={t('PC.Common.Global.confirm')}
        cancelText={t('PC.Common.Global.cancel')}
        destroyOnHidden
        centered
      >
        <div style={{ padding: '24px 0 8px' }}>
          <Input
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder={t(
              'PC.Components.HistoryConversationList.renamePlaceholder',
            )}
            maxLength={50}
            autoFocus
            onPressEnter={handleRenameSubmit}
            suffix={
              <span style={{ color: '#bfbfbf', fontSize: 14 }}>
                {newTopic.length} / 50
              </span>
            }
          />
        </div>
      </Modal>

      <Modal
        title={t('PC.Components.HistoryConversationList.deleteModalTitle')}
        open={deleteModalVisible}
        onOk={handleDeleteSubmit}
        onCancel={() => setDeleteModalVisible(false)}
        confirmLoading={submitting}
        okText={t('PC.Common.Global.confirm')}
        cancelText={t('PC.Common.Global.cancel')}
        okButtonProps={{ danger: true }}
        destroyOnHidden
        centered
      >
        <div
          style={{
            padding: '24px 0 8px',
            color: 'rgba(0, 0, 0, 0.45)',
            fontSize: 14,
          }}
        >
          {t('PC.Components.HistoryConversationList.deleteModalContent')}
        </div>
      </Modal>
    </div>
  );
};

export default HistoryConversationList;

import {
  apiAgentConversationDelete,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useDebounceFn } from 'ahooks';
import { Input, message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import { history } from 'umi';
import ConversationList, {
  ConversationListRef,
} from './components/ConversationList';
import styles from './index.less';

const cx = classNames.bind(styles);

const HistoryConversation: React.FC = () => {
  const [keyword, setKeyword] = useState<string>('');
  const [activeKeyword, setActiveKeyword] = useState<string>('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [currentRenameId, setCurrentRenameId] = useState<number | null>(null);
  const [newTopic, setNewTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentDeleteId, setCurrentDeleteId] = useState<number | null>(null);
  const listRef = useRef<ConversationListRef>(null);

  // 防抖处理搜索逻辑
  const { run: handleSearch } = useDebounceFn(
    (val: string) => {
      setActiveKeyword(val);
    },
    {
      wait: 500,
    },
  );

  const onStartSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);
    handleSearch(val);
  };

  const handleLink = (id: number, agentId: number) => {
    history.push(`/home/chat/${id}/${agentId}`);
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
      message.warning('标题不能为空');
      return;
    }
    if (trimmedTopic.length > 50) {
      message.warning('标题长度不能超过 50 个字符');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiAgentConversationUpdate({
        id: currentRenameId,
        topic: trimmedTopic,
      });

      if (res.success) {
        listRef.current?.updateItemTopic(currentRenameId, trimmedTopic);
        message.success('修改成功');
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
        message.success('删除成功');
        setDeleteModalVisible(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cx(styles.container)}>
      <div
        className={cx(styles['close-icon'])}
        onClick={() => {
          history.back();
        }}
      >
        <CloseOutlined />
      </div>
      <div className={cx(styles['main-content'])}>
        <div className={cx(styles.title)}>历史会话</div>
        <div className={cx(styles['search-input'])}>
          <Input
            prefix={<SearchOutlined style={{ color: '#999', fontSize: 16 }} />}
            placeholder="搜索历史会话"
            value={keyword}
            onChange={onStartSearch}
            bordered={false}
            className={cx(styles['search-input-field'])}
            allowClear
          />
        </div>
        <div className={cx(styles['list-wrapper'])}>
          <ConversationList
            ref={listRef}
            keyword={activeKeyword}
            onItemClick={handleLink}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <Modal
        title="修改名称"
        open={renameModalVisible}
        onOk={handleRenameSubmit}
        onCancel={() => setRenameModalVisible(false)}
        confirmLoading={submitting}
        okButtonProps={{ disabled: !newTopic.trim() }}
        okText="确定"
        cancelText="取消"
        destroyOnClose
        centered
      >
        <div style={{ padding: '24px 0 8px' }}>
          <Input
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="请输入新名称"
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
        title="永久删除会话"
        open={deleteModalVisible}
        onOk={handleDeleteSubmit}
        onCancel={() => setDeleteModalVisible(false)}
        confirmLoading={submitting}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        destroyOnClose
        centered
      >
        <div
          style={{
            padding: '24px 0 8px',
            color: 'rgba(0, 0, 0, 0.45)',
            fontSize: 14,
          }}
        >
          本条会话数据将被永久删除,不可恢复及撤销。确定要删除吗?
        </div>
      </Modal>
    </div>
  );
};

export default HistoryConversation;

import InfiniteList from '@/layouts/InfiniteList';
import { apiAgentConversationList } from '@/services/agentConfig';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useDebounceFn } from 'ahooks';
import { Input } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { history, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const HistoryConversation: React.FC = () => {
  const [keyword, setKeyword] = useState<string>('');
  const [activeKeyword, setActiveKeyword] = useState<string>('');
  const [conversationList, setConversationList] = useState<
    ConversationInfo[] | undefined
  >([]);

  const { runDel } = useModel('conversationHistory');

  // 防抖处理搜索逻辑
  const { run: handleSearch } = useDebounceFn(
    (val: string) => {
      setActiveKeyword(val);
      // 清空列表触发 key 变化对应的重载逻辑
      setConversationList([]);
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

  const fetchApi = async (lastId: number | null, pageSize: number) => {
    return apiAgentConversationList({
      agentId: null,
      lastId,
      limit: pageSize,
      topic: activeKeyword || undefined,
    }).then((res) => {
      return {
        list: res.data ?? [],
        hasMore: res.data.length >= pageSize,
      };
    });
  };

  const handleLink = (id: number, agentId: number) => {
    history.push(`/home/chat/${id}/${agentId}`);
  };

  const handleDelete = async (currentId: number) => {
    // 调用 model 的删除方法
    try {
      await runDel(currentId);
      // 本地移除对应的会话项
      setConversationList(
        (prev) => prev?.filter((item) => item.id !== currentId) || [],
      );
    } catch (e) {
      console.error(e);
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
          {/* 使用 activeKeyword 作为 key，确保搜索条件变更时组件重置并重新加载 */}
          <InfiniteList
            key={activeKeyword}
            height={'100%'}
            pageSize={20}
            conversationList={conversationList}
            setConversationList={setConversationList}
            loadData={fetchApi}
            handleLink={handleLink}
            runDel={handleDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default HistoryConversation;

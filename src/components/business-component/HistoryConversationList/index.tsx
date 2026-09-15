import {
  apiAgentConversationDelete,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useDebounceFn } from 'ahooks';
import { Input, message, Modal, Segmented } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { history, useLocation, useModel } from 'umi';
import ConversationList, { ConversationListRef } from './ConversationList';
import ProjectList, { ProjectListRef } from './ProjectList';
import styles from './index.module.less';

/** 一级数据源 tab：任务（会话，默认）/ 项目（项目 + 项目会话） */
type SourceTab = 'task' | 'project';

// 历史会话页面组件Props
export interface HistoryConversationListProps {
  agentId?: number | null;
  onClickLink: (id: number, agentId: number) => void;
  /** 是否是应用智能体模式 */
  isAppSidebarMode?: boolean;
  /** 标题左侧插槽 */
  titleLeftSlot?: React.ReactNode;
  /** 展示「任务/项目」一级切换（默认 true；应用侧栏模式无项目概念传 false） */
  enableProjectTab?: boolean;
}

/**
 * 历史会话页面组件
 * 该组件用于展示历史会话列表和应用智能体历史会话列表页面
 */
const HistoryConversationList: React.FC<HistoryConversationListProps> = ({
  agentId,
  onClickLink,
  isAppSidebarMode = false,
  titleLeftSlot,
  enableProjectTab = true,
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
  const [sourceTab, setSourceTab] = useState<SourceTab>('task');
  const listRef = useRef<ConversationListRef>(null);
  const projectListRef = useRef<ProjectListRef>(null);
  // 重命名/删除 Modal 对活动列表生效：按一级 tab 路由到对应列表的 ref
  const activeList = () =>
    sourceTab === 'task' ? listRef.current : projectListRef.current;

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
      activeList()?.refresh();
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

  // 重命名会话
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
        activeList()?.refresh();
        // 应用智能体模式下，查询当前智能体的8条会话记录，否则查询所有智能体的5条会话记录
        const limit = isAppSidebarMode ? 8 : 5;
        runHistory({
          agentId,
          limit,
        });

        // 派发自定义更新事件，通知侧栏「会话记录 / 最近使用」列表及时同步名称
        window.dispatchEvent(
          new CustomEvent('conversation-updated', {
            detail: { id: currentRenameId, topic: trimmedTopic },
          }),
        );

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

  // 删除会话
  const handleDeleteSubmit = async () => {
    if (!currentDeleteId) return;

    setSubmitting(true);
    try {
      const res = await apiAgentConversationDelete(currentDeleteId);

      if (res.success) {
        activeList()?.removeItem(currentDeleteId);
        window.dispatchEvent(
          new CustomEvent('conversation-deleted', {
            detail: { id: currentDeleteId },
          }),
        );
        // 应用智能体模式下，查询当前智能体的8条会话记录，否则查询所有智能体的5条会话记录
        const limit = isAppSidebarMode ? 8 : 5;
        runHistory({
          agentId,
          limit,
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
      <div
        className={styles['main-content']}
        // 页面四周留白内联兜底：dev HMR 场景下本文件样式映射偶发漂移，
        // 内联保证标题/搜索框/列表不贴内容区边缘（bug 2351「边距没了」）
        style={{ padding: '24px 24px 0' }}
      >
        <div
          className={`${styles.title} flex items-center gap-4 ${
            isMobile ? styles['title-mobile'] : ''
          }`}
        >
          {titleLeftSlot}
          <span>{t('PC.Components.HistoryConversationList.pageTitle')}</span>
        </div>
        {enableProjectTab && (
          <div className={styles['source-tabs']}>
            {/* 一级数据源切换：antd Segmented，样式对齐女娲应用页 source-segmented */}
            <Segmented
              className={styles['source-segmented']}
              options={[
                {
                  label: t('PC.Components.HistoryConversationList.taskTab'),
                  value: 'task',
                },
                {
                  label: t('PC.Components.HistoryConversationList.projectTab'),
                  value: 'project',
                },
              ]}
              value={sourceTab}
              onChange={(value) => setSourceTab(value as SourceTab)}
            />
          </div>
        )}
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
          {!enableProjectTab || sourceTab === 'task' ? (
            <ConversationList
              ref={listRef}
              agentId={agentId}
              keyword={activeKeyword}
              onItemClick={onClickLink}
              onEdit={handleEdit}
              onDelete={handleDelete}
              // 有「项目」tab 承接项目会话时，任务列表排除项目会话防双显；
              // 无项目 tab 的入口（OpenApp 应用侧栏）保持全量，否则项目会话无处可见
              excludeProjectConversations={enableProjectTab}
            />
          ) : (
            <ProjectList
              ref={projectListRef}
              keyword={activeKeyword}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
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

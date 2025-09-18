import SvgIcon from '@/components/base/SvgIcon';
import Loading from '@/components/custom/Loading';
import { apiAgentConversationList } from '@/services/agentConfig';
import { AgentConversationProps } from '@/types/interfaces/agentTask';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { formatTimeAgo } from '@/utils/common';
import { Button, Empty, Typography } from 'antd';
import classNames from 'classnames';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { history, useModel, useRequest } from 'umi';
import HistoryConversation from './HistoryConversation';
import styles from './index.less';

const cx = classNames.bind(styles);

export type AgentConversationRef = {
  updateList: (info: ConversationInfo) => void;
};

// 智能体相关会话
const AgentConversation = forwardRef<
  AgentConversationRef,
  AgentConversationProps
>(({ agentId }, ref) => {
  // 使用 model 中的历史会话弹窗状态，而不是本地状态
  const {
    isHistoryConversationOpen,
    closeHistoryConversation,
    openHistoryConversation,
  } = useModel('conversationInfo');
  const conversationHistory = useModel('conversationHistory');

  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  // 历史会话列表
  const [conversationList, setConversationList] =
    useState<ConversationInfo[]>();

  // 查询历史会话记录
  const { run: runHistory } = useRequest(apiAgentConversationList, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (result: ConversationInfo[]) => {
      setConversationList(result);
      setLoadingHistory(false);
    },
    onError: () => {
      setLoadingHistory(false);
    },
  });

  // 暴露方法给父组件
  useImperativeHandle(
    ref,
    () => ({
      updateList: (info: ConversationInfo) => {
        const list = conversationList?.map((item) => {
          if (item.id === info.id) {
            item.topic = info.topic;
          }
          return item;
        });
        setConversationList(list);
      },
    }),
    [conversationList],
  );

  useEffect(() => {
    setLoadingHistory(true);
    runHistory({
      agentId,
    });
  }, [agentId]);

  const handleLink = (id: number, agentId: number) => {
    history.push(`/home/chat/${id}/${agentId}`);
  };

  const handleDel = (id: number) => {
    setConversationList((list) => {
      return list?.filter((item) => item.id !== id);
    });

    conversationHistory?.setConversationList?.((list: any[]) => {
      return list?.filter((item: { id: number }) => item.id !== id);
    });
  };

  // 查看更多 打开历史会话弹窗 - 现在通过 model 状态管理
  const handleMore = useCallback(() => {
    // 这里不再需要设置本地状态，因为使用 model 中的状态
    openHistoryConversation();
  }, []);

  return (
    <div className={cx(styles.container)}>
      {!loadingHistory && (
        <div
          className={cx(
            'flex',
            'items-center',
            'content-between',
            styles.titleBox,
          )}
        >
          <Typography.Title className={cx(styles.title)} level={5}>
            相关会话
          </Typography.Title>
          <Button
            size="small"
            className={cx(styles.more, 'cursor-pointer')}
            onClick={handleMore}
            icon={
              <SvgIcon
                name="icons-common-caret_right"
                style={{ fontSize: 16 }}
              />
            }
            iconPosition="end"
            type="text"
          >
            查看更多
          </Button>
        </div>
      )}
      <div className={cx(styles['chat-wrapper'])}>
        {loadingHistory ? (
          <Loading className={cx(styles['loading-box'])} />
        ) : conversationList?.length ? (
          conversationList?.slice(0, 5)?.map((item) => (
            <div
              key={item.id}
              className={cx(styles['chat-item'], 'cursor-pointer', 'hover-box')}
              onClick={() => handleLink(item.id, item.agentId)}
            >
              <p className={cx('text-ellipsis', 'flex-1')}>{item.topic}</p>
              <span className={cx(styles.time)}>
                {formatTimeAgo(item.created)}
              </span>
            </div>
          ))
        ) : (
          <Empty description="暂无相关会话" />
        )}
      </div>
      <HistoryConversation
        agentId={agentId}
        conversationList={conversationList}
        setConversationList={setConversationList}
        isOpen={isHistoryConversationOpen}
        onCancel={closeHistoryConversation}
        onDel={handleDel}
      />
    </div>
  );
});

export default AgentConversation;

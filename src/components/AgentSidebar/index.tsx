import Loading from '@/components/custom/Loading';
import useDrawerScroll from '@/hooks/useDrawerScroll';
import { EditAgentShowType, OpenCloseEnum } from '@/types/enums/space';
import { AgentSidebarProps } from '@/types/interfaces/agentTask';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import StickyBox from 'react-sticky-box';
import { useModel } from 'umi';
import AgentContent from './AgentContent';
import AgentConversation from './AgentConversation';
import styles from './index.less';
import StatisticsInfo from './StatisticsInfo';
import TimedTask from './TimedTask';

const cx = classNames.bind(styles);

// 智能体详情页侧边栏
export type AgentSidebarRef = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  updateList: (info: ConversationInfo) => void;
};

export type AgentConversationRef = {
  updateList: (info: ConversationInfo) => void;
};

const AgentSidebar = forwardRef<AgentSidebarRef, AgentSidebarProps>(
  (
    {
      className,
      agentId,
      loading,
      agentDetail,
      onToggleCollectSuccess,
      onVisibleChange,
    },
    ref,
  ) => {
    const [visible, setVisible] = useState<boolean>(false);
    const [foldVisible, setFoldVisible] = useState<boolean>(false);
    const { showType } = useModel('conversationInfo');
    const agentConversationRef = useRef<AgentConversationRef>(null);

    const handleClose = () => {
      setVisible(!visible);
      setTimeout(() => {
        setFoldVisible(!foldVisible);
      }, 300);
    };

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        open: () => {
          setVisible(true);
          setFoldVisible(false);
        },
        close: () => {
          setVisible(false);
          setFoldVisible(true);
        },
        toggle: () => {
          setVisible((v) => !v);
          setFoldVisible((f) => !f);
        },
        updateList: (info: ConversationInfo) => {
          agentConversationRef.current?.updateList(info);
        },
      }),
      [],
    );

    useEffect(() => {
      if (showType === EditAgentShowType.Show_Stand) {
        setVisible(false);
        setFoldVisible(true);
      }
    }, [showType]);

    // 将可见性变化通知父组件
    useEffect(() => {
      onVisibleChange?.(visible);
    }, [visible]);

    useDrawerScroll(visible);

    return (
      <>
        <div
          className={cx(styles.rightSidebar, 'flex', 'flex-col', className, {
            [styles.hide]: !visible,
          })}
        >
          {loading ? (
            <Loading />
          ) : (
            <>
              {/* 统计信息 */}
              <StickyBox
                offsetTop={0}
                style={{ zIndex: 10 }}
                className={cx(styles['statistics-content'])}
              >
                <StatisticsInfo
                  statistics={agentDetail?.statistics}
                  visible={visible}
                  onClose={handleClose}
                />
              </StickyBox>
              <div className={cx(styles['container-scroll'], styles.container)}>
                <div className={cx(styles['container-content'], 'scrollbar')}>
                  <div className={cx(styles['container-body'])}>
                    {/* 智能体内容 */}
                    <AgentContent
                      agentDetail={agentDetail}
                      onToggleCollectSuccess={onToggleCollectSuccess}
                    />
                    {/* 智能体相关会话 */}
                    <AgentConversation
                      ref={agentConversationRef}
                      agentId={agentId}
                    />
                    {/* 定时任务 */}
                    {agentDetail?.openScheduledTask === OpenCloseEnum.Open && (
                      <TimedTask agentId={agentId} />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        {/* <img
        className={cx(styles.fold, 'cursor-pointer', {
          [styles.show]: !visible,
        })}
        src={foldImage}
        onClick={handleClose}
      /> */}
      </>
    );
  },
);

export default AgentSidebar;

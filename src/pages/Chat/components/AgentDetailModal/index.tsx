import AgentContent from '@/components/AgentSidebar/AgentContent';
import AgentConversation from '@/components/AgentSidebar/AgentConversation';
import TimedTask from '@/components/AgentSidebar/TimedTask';
import Loading from '@/components/custom/Loading';
import { dict } from '@/services/i18nRuntime';
import { OpenCloseEnum } from '@/types/enums/space';
import type { AgentDetailDto } from '@/types/interfaces/agent';
import { Modal } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface AgentDetailModalProps {
  open: boolean;
  onClose: () => void;
  agentId: number;
  loading?: boolean;
  agentDetail?: AgentDetailDto | null;
}

/**
 * 智能体详情悬浮弹窗（会话详情页）：
 * 内容与 AgentSidebar 一致（详情卡 + 相关会话 + 定时任务），以居中 Modal 悬浮展示，
 * 打开期间不关闭、不挤压文件树/终端/云电脑面板（取代原互斥侧栏入口）。
 */
const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  open,
  onClose,
  agentId,
  loading,
  agentDetail,
}) => {
  return (
    <Modal
      title={dict('PC.Pages.Chat.viewAgentDetails')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
      destroyOnHidden
    >
      {loading ? (
        <Loading />
      ) : (
        <div className={cx(styles.body, 'scrollbar')}>
          {/* 智能体内容 */}
          <AgentContent agentDetail={agentDetail} />
          {/* 智能体相关会话 */}
          <AgentConversation agentId={agentId} />
          {/* 定时任务 */}
          {agentDetail?.openScheduledTask === OpenCloseEnum.Open && (
            <TimedTask agentId={agentId} />
          )}
        </div>
      )}
    </Modal>
  );
};

export default AgentDetailModal;

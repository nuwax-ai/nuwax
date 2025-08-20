import agentImage from '@/assets/images/agent_image.png';
import MenuListItem from '@/components/base/MenuListItem';
import type { AgentConfigInfo, AgentInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React from 'react';
import { history, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 开发收藏
const DevCollect: React.FC = () => {
  const { runCancelCollect, devCollectAgentList } = useModel('devCollectAgent');
  const { agentList, handlerCollect } = useModel('applicationDev');

  // 点击开发收藏的智能体
  const handleDevCollect = (agentId: number, spaceId: number) => {
    history.push(`/space/${spaceId}/agent/${agentId}`);
  };

  // 取消收藏
  const handleCancelCollect = async (agentId: number) => {
    await runCancelCollect(agentId);
    const index = agentList?.findIndex(
      (item: AgentConfigInfo) => item.id === agentId,
    );
    if (index > -1) {
      handlerCollect(index, false);
    }
  };

  return devCollectAgentList?.length > 0 ? (
    devCollectAgentList?.map((item: AgentInfo, index: number) => (
      <MenuListItem
        key={item.id}
        isFirst={index === 0}
        onClick={() => handleDevCollect(item.agentId, item.spaceId)}
        icon={item.icon || (agentImage as string)}
        name={item.name}
        onCancelCollect={() => handleCancelCollect(item.agentId)}
      />
    ))
  ) : (
    <>
      <div className={cx(styles['no-dev-collect'])}>还没有收藏任何内容</div>
      <div className={cx(styles['no-dev-collect'])}>
        点击⭐️按钮可将内容添加到这里~
      </div>
    </>
  );
};

export default DevCollect;

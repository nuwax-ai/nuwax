import ConditionRender from '@/components/ConditionRender';
import {
  apiUserCollectAgentList,
  apiUserEditAgentList,
  apiUserUsedAgentList,
} from '@/services/agentDev';
import type { AgentInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';
import UserRelAgentList from './UserRelAgentList';

const cx = classNames.bind(styles);

/**
 * 主页二级菜单栏
 */
const HomeSection: React.FC = () => {
  const [editAgentList, setEditAgentList] = useState<AgentInfo[]>([]);
  const [usedAgentList, setUsedAgentList] = useState<AgentInfo[]>([]);
  const [collectAgentList, setCollectAgentList] = useState<AgentInfo[]>([]);
  // 查询用户最近编辑的智能体列表
  const { run: runEdit } = useRequest(apiUserEditAgentList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: AgentInfo[]) => {
      setEditAgentList(result);
    },
  });

  // 查询用户最近使用过的智能体列表
  const { run: runUsed } = useRequest(apiUserUsedAgentList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: AgentInfo[]) => {
      setUsedAgentList(result);
    },
  });

  // 查询用户收藏的智能体列表
  const { run: runCollect } = useRequest(apiUserCollectAgentList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: AgentInfo[]) => {
      setCollectAgentList(result);
    },
  });

  useEffect(() => {
    runEdit({
      size: 10,
    });
    runUsed({
      size: 10,
    });
    runCollect({
      page: 1,
      size: 10,
    });
  }, []);

  const handleClick = (info: AgentInfo) => {
    const { agentId, spaceId } = info;
    history.push(`/space/${spaceId}/agent/${agentId}`);
  };

  return (
    <div className={cx('px-6', 'py-16')}>
      <h3 className={cx(styles.title)}>最近使用</h3>
      <UserRelAgentList list={usedAgentList} onClick={handleClick} />
      <ConditionRender condition={editAgentList?.length}>
        <h3 className={cx(styles.title, 'mt-16')}>最近编辑</h3>
        <UserRelAgentList list={editAgentList} onClick={handleClick} />
      </ConditionRender>
      <ConditionRender condition={collectAgentList?.length}>
        <h3 className={cx(styles.title, 'mt-16')}>收藏</h3>
        <UserRelAgentList list={collectAgentList} onClick={handleClick} />
      </ConditionRender>
    </div>
  );
};

export default HomeSection;

import AnalyzeStatistics from '@/components/AnalyzeStatistics';
import CreateAgent from '@/components/CreateAgent';
import SelectList from '@/components/SelectList';
import { SPACE_ID, USER_INFO } from '@/constants/home.constants';
import { CREATE_LIST, FILTER_STATUS } from '@/constants/space.contants';
import {
  apiAgentConfigList,
  apiAgentCopy,
  apiAgentDelete,
} from '@/services/agentConfig';
import { PublishStatusEnum } from '@/types/enums/common';
import {
  ApplicationMoreActionEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import { AnalyzeStatisticsItem } from '@/types/interfaces/common';
import type { UserInfo } from '@/types/interfaces/login';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useRequest } from 'umi';
import AgentMove from './AgentMove';
import ApplicationItem from './ApplicationItem';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 工作空间 - 应用开发
 */
const SpaceDevelop: React.FC = () => {
  // 打开分析弹窗
  const [openAnalyze, setOpenAnalyze] = useState<boolean>(false);
  // 迁移弹窗
  const [openMove, setOpenMove] = useState<boolean>(false);
  const [openCreateAgent, setOpenCreateAgent] = useState<boolean>(false);
  const [status, setStatus] = useState<FilterStatusEnum>(FilterStatusEnum.All);
  const [agentStatistics, setAgentStatistics] = useState<
    AnalyzeStatisticsItem[]
  >([]);
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );
  const [agentList, setAgentList] = useState<AgentConfigInfo[]>([]);
  const agentAll = useRef<AgentConfigInfo[]>([]);

  // 查询空间智能体列表接口
  const { run } = useRequest(apiAgentConfigList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: AgentConfigInfo[]) => {
      setAgentList(result);
      agentAll.current = result;
    },
  });

  // 创建副本
  const { run: runCopy } = useRequest(apiAgentCopy, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('已成功创建副本');
      const spaceId = localStorage.getItem(SPACE_ID) || 25;
      run(spaceId);
    },
  });

  // 删除智能体
  const { run: runDel } = useRequest(apiAgentDelete, {
    manual: true,
    debounceWait: 300,
    onSuccess: (_, params) => {
      message.success('已成功删除');
      const agentId = params[0].agentId;
      const _agentList = agentList.filter((item) => item.id !== agentId);
      setAgentList(_agentList);
      agentAll.current = agentAll.current.filter((item) => item.id !== agentId);
    },
  });

  useEffect(() => {
    const spaceId = localStorage.getItem(SPACE_ID) || 25;
    run(spaceId);
  }, []);

  // 切换状态
  const handlerChangeStatus = (value: FilterStatusEnum) => {
    setStatus(value);
    switch (value) {
      case FilterStatusEnum.All:
        const _agentList = agentAll.current;
        setAgentList(_agentList);
        break;
      case FilterStatusEnum.Published:
        const _agentPublishedList = agentAll.current.filter(
          (item) => item.publishStatus === PublishStatusEnum.Published,
        );
        setAgentList(_agentPublishedList);
        break;
    }
  };

  const handleUserInfo = () => {
    const userInfoString = localStorage.getItem(USER_INFO);
    return JSON.parse(userInfoString) as UserInfo;
  };

  // 切换创建者
  const handlerChangeCreate = (value: CreateListEnum) => {
    setCreate(value);
    switch (value) {
      case CreateListEnum.All_Person:
        const _agentList = agentAll.current;
        setAgentList(_agentList);
        break;
      case CreateListEnum.Me:
        const userInfo = handleUserInfo();
        const id = userInfo.id;
        const _agentListCreateByMe = agentAll.current.filter(
          (item) => item.creatorId === id,
        );
        console.log(id, 999);
        setAgentList(_agentListCreateByMe);
        break;
    }
  };

  const handlerConfirmMove = () => {
    setOpenMove(false);
  };

  // 点击跳转到智能体
  const handleClick = (agentId: string) => {
    history.push(`/edit-agent?agent_id=${agentId}`);
  };

  // 设置统计信息
  const handleSetStatistics = (agentInfo: AgentConfigInfo) => {
    const statisticsInfo = agentInfo.agentStatistics;
    const analyzeList = [
      {
        label: '对话人数',
        value: statisticsInfo.userCount,
      },
      {
        label: '对话次数',
        value: statisticsInfo.convCount,
      },
      {
        label: '收藏用户数',
        value: statisticsInfo.collectCount,
      },
      {
        label: '点赞次数',
        value: statisticsInfo.likeCount,
      },
    ];
    setAgentStatistics(analyzeList);
  };

  // 点击更多操作
  const handlerClickMore = (type: ApplicationMoreActionEnum, index: number) => {
    console.log(type);
    const agentInfo = agentList[index];
    switch (type) {
      case ApplicationMoreActionEnum.Analyze:
        handleSetStatistics(agentInfo);
        setOpenAnalyze(true);
        break;
      // 创建副本
      case ApplicationMoreActionEnum.Create_Copy:
        runCopy({
          agentId: agentInfo.id,
        });
        break;
      case ApplicationMoreActionEnum.Move:
        setOpenMove(true);
        break;
      case ApplicationMoreActionEnum.Del:
        runDel({
          agentId: agentInfo.id,
        });
        break;
    }
  };

  // 确认创建智能体
  const handlerConfirmCreateAgent = (agentId: string) => {
    setOpenCreateAgent(false);
    history.push(`/edit-agent?agent_id=${agentId}`);
  };

  // 收藏
  const handlerCollect = (index: number, isCollect: boolean) => {
    const _agentList = [...agentList];
    _agentList[index].devCollected = isCollect;
    setAgentList(_agentList);
  };

  return (
    <div className={cx(styles.container, 'h-full')}>
      <div className={cx('flex', 'content-between')}>
        <h3 className={cx(styles.title)}>应用开发</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpenCreateAgent(true)}
        >
          创建智能体
        </Button>
      </div>
      <div className={cx('flex', styles['select-search-area'])}>
        <SelectList
          value={status}
          options={FILTER_STATUS}
          onChange={handlerChangeStatus}
        />
        <SelectList
          value={create}
          options={CREATE_LIST}
          onChange={handlerChangeCreate}
        />
        <Input
          rootClassName={cx(styles.input)}
          placeholder="搜索智能体"
          prefix={<SearchOutlined />}
        />
      </div>
      {agentList?.length > 0 ? (
        <div className={cx(styles['main-container'])}>
          {agentList?.map((item, index) => (
            <ApplicationItem
              key={item.id}
              agentConfigInfo={item}
              onClickMore={(type) => handlerClickMore(type, index)}
              onCollect={(isCollect: boolean) =>
                handlerCollect(index, isCollect)
              }
              onClick={handleClick}
            />
          ))}
        </div>
      ) : (
        <div className={cx('flex', 'content-center', styles['no-data'])}>
          <span>未能找到相关结果</span>
        </div>
      )}
      {/*分析统计弹窗*/}
      <AnalyzeStatistics
        open={openAnalyze}
        onCancel={() => setOpenAnalyze(false)}
        title="智能体概览"
        list={agentStatistics}
      />
      {/*智能体迁移弹窗*/}
      <AgentMove
        open={openMove}
        title="智能体名称"
        onCancel={() => setOpenMove(false)}
        onConfirm={handlerConfirmMove}
      />
      {/*创建智能体*/}
      <CreateAgent
        open={openCreateAgent}
        onCancel={() => setOpenCreateAgent(false)}
        onConfirm={handlerConfirmCreateAgent}
      />
    </div>
  );
};

export default SpaceDevelop;

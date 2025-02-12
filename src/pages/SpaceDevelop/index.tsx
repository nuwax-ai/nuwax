import AnalyzeStatistics from '@/components/AnalyzeStatistics';
import CreateAgent from '@/components/CreateAgent';
import SelectList from '@/components/SelectList';
import { SPACE_ID } from '@/constants/home.constants';
import { CREATE_LIST, FILTER_STATUS } from '@/constants/space.contants';
import { apiAgentConfigList } from '@/services/agentConfig';
import {
  ApplicationMoreActionEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
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
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );
  const [agentList, setAgentList] = useState<AgentConfigInfo[]>([]);

  // 查询空间智能体列表接口
  const { run } = useRequest(apiAgentConfigList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: AgentConfigInfo[]) => {
      console.log(result);
      setAgentList(result);
    },
  });

  useEffect(() => {
    const spaceId = localStorage.getItem(SPACE_ID) || 25;
    run(spaceId);
  }, []);

  const handlerChangeStatus = (value: FilterStatusEnum) => {
    setStatus(value);
  };

  const handlerChangeCreate = (value: CreateListEnum) => {
    setCreate(value);
  };

  const handlerConfirmMove = () => {
    setOpenMove(false);
  };

  const handleClick = (agentId: string) => {
    history.push(`/edit-agent?agent_id=${agentId}`);
  };

  // 点击更多操作
  const handlerClickMore = (type: ApplicationMoreActionEnum) => {
    console.log(type);
    switch (type) {
      case ApplicationMoreActionEnum.Analyze:
        setOpenAnalyze(true);
        break;
      // 创建副本
      case ApplicationMoreActionEnum.Create_Copy:
        message.success('智能体已复制');
        break;
      case ApplicationMoreActionEnum.Move:
        setOpenMove(true);
        break;
      case ApplicationMoreActionEnum.Del:
        break;
    }
  };

  const handlerConfirmCreateAgent = () => {
    setOpenCreateAgent(false);
    const agentId = '10101010';
    history.push(`/edit-agent?agent_id=${agentId}`);
  };

  const analyzeList = [
    {
      label: '对话人数',
      value: '2324',
    },
    {
      label: '对话次数',
      value: '12334',
    },
    {
      label: '收藏用户数',
      value: '1322',
    },
    {
      label: '点赞次数',
      value: '1423',
    },
  ];

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
      <div className={cx(styles['main-container'])}>
        {agentList?.map((item) => (
          <ApplicationItem
            key={item.id}
            onClickMore={handlerClickMore}
            onClick={handleClick}
          />
        ))}
        <ApplicationItem onClickMore={handlerClickMore} onClick={handleClick} />
        <ApplicationItem onClickMore={handlerClickMore} onClick={handleClick} />
        <ApplicationItem onClickMore={handlerClickMore} onClick={handleClick} />
        <ApplicationItem onClickMore={handlerClickMore} onClick={handleClick} />
        <ApplicationItem onClickMore={handlerClickMore} onClick={handleClick} />
        <ApplicationItem onClickMore={handlerClickMore} onClick={handleClick} />
        <ApplicationItem onClickMore={handlerClickMore} onClick={handleClick} />
        <ApplicationItem onClickMore={handlerClickMore} onClick={handleClick} />
        <ApplicationItem onClickMore={handlerClickMore} onClick={handleClick} />
        <ApplicationItem onClickMore={handlerClickMore} onClick={handleClick} />
      </div>
      {/*分析统计弹窗*/}
      <AnalyzeStatistics
        open={openAnalyze}
        onCancel={() => setOpenAnalyze(false)}
        title="智能体概览"
        list={analyzeList}
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

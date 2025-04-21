import AnalyzeStatistics from '@/components/AnalyzeStatistics';
import CreateAgent from '@/components/CreateAgent';
import SelectList from '@/components/SelectList';
import { USER_INFO } from '@/constants/home.constants';
import { CREATE_LIST, FILTER_STATUS } from '@/constants/space.constants';
import {
  apiAgentConfigList,
  apiAgentCopy,
  apiAgentDelete,
  apiAgentTransfer,
} from '@/services/agentConfig';
import { PublishStatusEnum } from '@/types/enums/common';
import {
  ApplicationMoreActionEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';
import { AgentConfigInfo, AgentInfo } from '@/types/interfaces/agent';
import { AnalyzeStatisticsItem } from '@/types/interfaces/common';
import type { UserInfo } from '@/types/interfaces/login';
import {
  ExclamationCircleFilled,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Input, message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest } from 'umi';
import AgentMove from './AgentMove';
import ApplicationItem from './ApplicationItem';
import styles from './index.less';

const cx = classNames.bind(styles);
const { confirm } = Modal;

/**
 * 工作空间 - 应用开发
 */
const SpaceDevelop: React.FC = () => {
  const { spaceId } = useParams();
  // 打开分析弹窗
  const [openAnalyze, setOpenAnalyze] = useState<boolean>(false);
  // 迁移弹窗
  const [openMove, setOpenMove] = useState<boolean>(false);
  const [currentAgentInfo, setCurrentAgentInfo] = useState<AgentInfo | null>(
    null,
  );
  const [openCreateAgent, setOpenCreateAgent] = useState<boolean>(false);
  const [status, setStatus] = useState<FilterStatusEnum>(FilterStatusEnum.All);
  const [agentStatistics, setAgentStatistics] = useState<
    AnalyzeStatisticsItem[]
  >([]);
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );
  // 搜索关键词
  const [keyword, setKeyword] = useState<string>('');
  // 创建者ID
  const createIdRef = useRef<number>(0);
  // 目标智能体ID
  const targetAgentIdRef = useRef<number>(0);
  const { agentList, setAgentList, agentAllRef, handlerCollect } =
    useModel('applicationDev');
  const { runEdit, devCollectAgentList, runDevCollect } =
    useModel('devCollectAgent');

  // 过滤筛选智能体列表数据
  const handleFilterList = (
    filterStatus: FilterStatusEnum,
    filterCreate: CreateListEnum,
    filterKeyword: string,
    list = agentAllRef.current,
  ) => {
    let _list = list as AgentConfigInfo[];
    if (filterStatus === FilterStatusEnum.Published) {
      _list = _list.filter(
        (item) => item.publishStatus === PublishStatusEnum.Published,
      );
    }
    if (filterCreate === CreateListEnum.Me) {
      _list = _list.filter((item) => item.creatorId === createIdRef.current);
    }
    if (filterKeyword) {
      _list = _list.filter((item) => item.name.includes(filterKeyword));
    }
    setAgentList(_list);
  };

  // 查询空间智能体列表接口
  const { run } = useRequest(apiAgentConfigList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentConfigInfo[]) => {
      handleFilterList(status, create, keyword, result);
      agentAllRef.current = result;
    },
  });

  // 创建副本
  const { run: runCopy } = useRequest(apiAgentCopy, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('已成功创建副本');
      run(spaceId);
    },
  });

  // 删除或者迁移智能体后, 从列表移除智能体
  const handleDelAgent = () => {
    const agentId = targetAgentIdRef.current;
    const _agentList =
      agentList?.filter((item: AgentConfigInfo) => item.id !== agentId) || [];
    setAgentList(_agentList);
    agentAllRef.current = agentAllRef.current?.filter(
      (item: AgentConfigInfo) => item.id !== agentId,
    );
  };

  // 删除智能体
  const { run: runDel } = useRequest(apiAgentDelete, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: number[]) => {
      message.success('已成功删除');
      const id = params[0];
      handleDelAgent();
      runEdit({
        size: 8,
      });
      // 如果智能体开发收藏列表包含此删除智能体, 重新查询
      const index = devCollectAgentList?.findIndex(
        (item: AgentInfo) => item.agentId === id,
      );
      if (index > -1) {
        // 更新开发智能体收藏列表
        runDevCollect({
          page: 1,
          size: 8,
        });
      }
    },
  });

  // 智能体迁移接口
  const { run: runTransfer } = useRequest(apiAgentTransfer, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('迁移成功');
      handleDelAgent();
      setOpenMove(false);
      setCurrentAgentInfo(null);
    },
  });

  useEffect(() => {
    const userInfoString = localStorage.getItem(USER_INFO);
    if (!!userInfoString) {
      const userInfo = JSON.parse(userInfoString) as UserInfo;
      createIdRef.current = userInfo.id;
    }
  }, []);

  useEffect(() => {
    run(spaceId);
  }, [spaceId]);

  // 切换状态
  const handlerChangeStatus = (value: React.Key) => {
    const _status = value as FilterStatusEnum;
    setStatus(_status);
    handleFilterList(_status, create, keyword);
  };

  // 切换创建者
  const handlerChangeCreate = (value: React.Key) => {
    const _create = value as CreateListEnum;
    setCreate(_create);
    handleFilterList(status, _create, keyword);
  };

  // 智能体搜索
  const handleQueryAgent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const _keyword = e.target.value;
    setKeyword(_keyword);
    handleFilterList(status, create, _keyword);
  };

  // 清除关键词
  const handleClearKeyword = () => {
    setKeyword('');
    handleFilterList(status, create, '');
  };

  // 确认迁移智能体
  const handlerConfirmMove = (targetSpaceId: string) => {
    runTransfer({
      agentId: targetAgentIdRef.current,
      targetSpaceId,
    });
  };

  // 点击跳转到智能体
  const handleClick = (agentId: number) => {
    history.push(`/space/${spaceId}/agent/${agentId}`);
  };

  // 设置统计信息
  const handleSetStatistics = (agentInfo: AgentConfigInfo) => {
    const { userCount, convCount, collectCount, likeCount } =
      agentInfo?.agentStatistics;
    const analyzeList = [
      {
        label: '对话人数',
        value: userCount,
      },
      {
        label: '对话次数',
        value: convCount,
      },
      {
        label: '收藏用户数',
        value: collectCount,
      },
      {
        label: '点赞次数',
        value: likeCount,
      },
    ];
    setAgentStatistics(analyzeList);
  };

  // 点击更多操作
  const handlerClickMore = (type: ApplicationMoreActionEnum, index: number) => {
    const agentInfo = agentList[index];
    const { id } = agentInfo;
    targetAgentIdRef.current = id;
    switch (type) {
      case ApplicationMoreActionEnum.Analyze:
        handleSetStatistics(agentInfo);
        setOpenAnalyze(true);
        break;
      // 创建副本
      case ApplicationMoreActionEnum.Create_Copy:
        runCopy(id);
        break;
      // 迁移
      case ApplicationMoreActionEnum.Move:
        setOpenMove(true);
        setCurrentAgentInfo(agentInfo);
        break;
      case ApplicationMoreActionEnum.Del:
        confirm({
          title: '您确定要删除此智能体吗?',
          icon: <ExclamationCircleFilled />,
          content: agentInfo?.name,
          okText: '确定',
          maskClosable: true,
          cancelText: '取消',
          onOk() {
            runDel(id);
          },
        });
        break;
    }
  };

  // 确认创建智能体
  const handlerConfirmCreateAgent = (agentId: string) => {
    setOpenCreateAgent(false);
    history.push(`/space/${spaceId}/agent/${agentId}`);
  };

  return (
    <div className={cx(styles.container, 'h-full')}>
      <div className={cx('flex', 'content-between')}>
        <h3 className={cx(styles.title)}>智能体开发</h3>
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
          size="middle"
        />
        <SelectList
          value={create}
          options={CREATE_LIST}
          onChange={handlerChangeCreate}
          size="middle"
        />
        <Input
          rootClassName={cx(styles.input)}
          placeholder="搜索智能体"
          value={keyword}
          onChange={handleQueryAgent}
          prefix={<SearchOutlined />}
          allowClear
          onClear={handleClearKeyword}
        />
      </div>
      {agentList?.length > 0 ? (
        <div className={cx(styles['main-container'])}>
          {agentList?.map((item: AgentConfigInfo, index: number) => (
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
        title={currentAgentInfo?.name}
        onCancel={() => setOpenMove(false)}
        onConfirm={handlerConfirmMove}
      />
      {/*创建智能体*/}
      <CreateAgent
        open={openCreateAgent}
        onCancel={() => setOpenCreateAgent(false)}
        onConfirmCreate={handlerConfirmCreateAgent}
      />
    </div>
  );
};

export default SpaceDevelop;

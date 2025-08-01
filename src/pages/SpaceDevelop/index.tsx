import AnalyzeStatistics from '@/components/AnalyzeStatistics';
import CreateAgent from '@/components/CreateAgent';
import Loading from '@/components/Loading';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import SelectList from '@/components/SelectList';
import UploadImportConfig from '@/components/UploadImportConfig';
import { CREATE_LIST, FILTER_STATUS } from '@/constants/space.constants';
import {
  apiAgentConfigList,
  apiAgentCopyToSpace,
  apiAgentDelete,
  apiAgentTransfer,
} from '@/services/agentConfig';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
import {
  ApplicationMoreActionEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';
import { AgentConfigInfo, AgentInfo } from '@/types/interfaces/agent';
import { AnalyzeStatisticsItem, FileType } from '@/types/interfaces/common';
import { modalConfirm } from '@/utils/ant-custom';
import { exportConfigFile } from '@/utils/exportImportFile';
import { jumpToAgent } from '@/utils/router';
import {
  ExclamationCircleFilled,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Empty, Input, message, Modal, Upload } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest } from 'umi';
import ApplicationItem from './ApplicationItem';
import CreateApiKeyModal from './CreateApiKeyModal';
import CreateTempChatModal from './CreateTempChatModal';
import styles from './index.less';

const cx = classNames.bind(styles);
const { confirm } = Modal;

/**
 * 工作空间 - 应用开发
 */
const SpaceDevelop: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  // 打开分析弹窗
  const [openAnalyze, setOpenAnalyze] = useState<boolean>(false);
  // 迁移、复制弹窗
  const [openMove, setOpenMove] = useState<boolean>(false);
  // 打开创建临时会话弹窗
  const [openTempChat, setOpenTempChat] = useState<boolean>(false);
  // 打开API Key弹窗
  const [openApiKey, setOpenApiKey] = useState<boolean>(false);
  const [currentAgentInfo, setCurrentAgentInfo] =
    useState<AgentConfigInfo | null>(null);
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
  const [loading, setLoading] = useState<boolean>(false);
  // 复制模板loading
  const [transferLoading, setTransferLoading] = useState<boolean>(false);
  const [copyToSpaceLoading, setCopyToSpaceLoading] = useState<boolean>(false);

  // 目标智能体ID
  const targetAgentIdRef = useRef<number>(0);
  const currentClickTypeRef = useRef<ApplicationMoreActionEnum>();
  const { agentList, setAgentList, agentAllRef, handlerCollect } =
    useModel('applicationDev');
  const { runEdit, devCollectAgentList, runDevCollect } =
    useModel('devCollectAgent');
  // 获取用户信息
  const { userInfo } = useModel('userInfo');

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
      _list = _list.filter((item) => item.creatorId === userInfo.id);
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
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 复制到空间
  const { run: runCopyToSpace } = useRequest(apiAgentCopyToSpace, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (data: number, params: number[]) => {
      setCopyToSpaceLoading(false);
      message.success('已成功创建副本');
      // 关闭弹窗
      setOpenMove(false);
      // 目标空间ID
      const targetSpaceId = params[1];
      // 如果目标空间ID和当前空间ID相同, 则重新查询当前空间智能体列表
      // if (targetSpaceId === spaceId) {
      //   run(spaceId);
      // }
      // 跳转
      jumpToAgent(targetSpaceId, data);
    },
    onError: () => {
      setCopyToSpaceLoading(false);
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
      setTransferLoading(false);
      message.success('迁移成功');
      handleDelAgent();
      setOpenMove(false);
      setCurrentAgentInfo(null);
    },
    onError: () => {
      setTransferLoading(false);
    },
  });

  useEffect(() => {
    setLoading(true);
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
  const handlerConfirmMove = (targetSpaceId: number) => {
    // 迁移
    if (currentClickTypeRef.current === ApplicationMoreActionEnum.Move) {
      setTransferLoading(true);
      runTransfer(targetAgentIdRef.current, targetSpaceId);
    }
    // 复制到空间
    else if (
      currentClickTypeRef.current === ApplicationMoreActionEnum.Copy_To_Space
    ) {
      setCopyToSpaceLoading(true);
      runCopyToSpace(targetAgentIdRef.current, targetSpaceId);
    }
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
      // 复制到空间
      case ApplicationMoreActionEnum.Copy_To_Space:
      // 迁移
      case ApplicationMoreActionEnum.Move:
        // 记录当前点击操作的类型
        currentClickTypeRef.current = type;
        setOpenMove(true);
        setCurrentAgentInfo(agentInfo);
        break;
      // 临时会话
      case ApplicationMoreActionEnum.Temporary_Session:
        setOpenTempChat(true);
        setCurrentAgentInfo(agentInfo);
        break;
      // API Key
      case ApplicationMoreActionEnum.API_Key:
        setOpenApiKey(true);
        setCurrentAgentInfo(agentInfo);
        break;
      // 导出配置
      case ApplicationMoreActionEnum.Export_Config:
        modalConfirm(
          `导出配置 - ${agentInfo?.name}`,
          '如果内部包含数据表或知识库，数据本身不会导出',
          () => {
            exportConfigFile(id, AgentComponentTypeEnum.Agent);
            return new Promise((resolve) => {
              setTimeout(resolve, 1000);
            });
          },
        );
        break;
      // 日志
      case ApplicationMoreActionEnum.Log:
        history.push(`/space/${spaceId}/${id}/log`);
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
  const handlerConfirmCreateAgent = (agentId: number) => {
    setOpenCreateAgent(false);
    history.push(`/space/${spaceId}/agent/${agentId}`);
  };

  // 导入配置成功后，刷新智能体列表
  const handleImportConfig = () => {
    run(spaceId);
  };

  // beforeUpload 返回 false 或 Promise.reject 时，只用于拦截上传行为，不会阻止文件进入上传列表（原因）。如果需要阻止列表展现，可以通过返回 Upload.LIST_IGNORE 实现。
  const beforeUploadDefault = (file: FileType) => {
    const fileName = file.name.toLocaleLowerCase();
    const isValidFile = fileName.endsWith('.agent');
    if (!isValidFile) {
      message.error('请上传.agent类型的文件!');
    }
    return isValidFile || Upload.LIST_IGNORE;
  };

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <div className={cx('flex', 'content-between')}>
        <h3 className={cx(styles.title)}>智能体开发</h3>
        <div className={cx('flex', 'gap-10')}>
          <UploadImportConfig
            spaceId={spaceId}
            onUploadSuccess={handleImportConfig}
            beforeUpload={beforeUploadDefault}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpenCreateAgent(true)}
          >
            创建智能体
          </Button>
        </div>
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
      <div className={cx('flex-1', 'overflow-y')}>
        {loading ? (
          <Loading className="h-full" />
        ) : agentList?.length > 0 ? (
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
          <div
            className={cx('flex', 'items-center', 'content-center', 'h-full')}
          >
            <Empty description="未能找到相关结果" />
          </div>
        )}
      </div>

      {/*分析统计弹窗*/}
      <AnalyzeStatistics
        open={openAnalyze}
        onCancel={() => setOpenAnalyze(false)}
        title="智能体概览"
        list={agentStatistics}
      />
      {/*智能体迁移弹窗*/}
      <MoveCopyComponent
        spaceId={spaceId}
        loading={copyToSpaceLoading || transferLoading}
        type={currentClickTypeRef.current} // 默认为迁移
        open={openMove}
        title={currentAgentInfo?.name}
        onCancel={() => setOpenMove(false)}
        onConfirm={handlerConfirmMove}
      />
      {/*创建智能体*/}
      <CreateAgent
        spaceId={spaceId}
        open={openCreateAgent}
        onCancel={() => setOpenCreateAgent(false)}
        onConfirmCreate={handlerConfirmCreateAgent}
      />
      {/* 临时会话弹窗 */}
      <CreateTempChatModal
        agentId={currentAgentInfo?.id}
        open={openTempChat}
        name={currentAgentInfo?.name}
        onCancel={() => setOpenTempChat(false)}
      />
      {/* API Key弹窗 */}
      <CreateApiKeyModal
        agentId={currentAgentInfo?.id}
        open={openApiKey}
        name={currentAgentInfo?.name}
        onCancel={() => setOpenApiKey(false)}
      />
    </div>
  );
};

export default SpaceDevelop;

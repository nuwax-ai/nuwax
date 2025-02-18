import AnalyzeStatistics from '@/components/AnalyzeStatistics';
import CreateKnowledge from '@/components/CreateKnowledge';
import CreateNewPlugin from '@/components/CreateNewPlugin';
import CreateWorkflow from '@/components/CreateWorkflow';
import CustomPopover from '@/components/CustomPopover';
import SelectList from '@/components/SelectList';
import { SPACE_ID, USER_INFO } from '@/constants/home.constants';
import {
  CREATE_LIST,
  FILTER_STATUS,
  LIBRARY_ALL_RESOURCE,
  LIBRARY_ALL_TYPE,
} from '@/constants/space.contants';
import { apiComponentList } from '@/services/library';
import { PublishStatusEnum } from '@/types/enums/common';
import { ComponentMoreActionEnum } from '@/types/enums/library';
import {
  ComponentTypeEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';
import type {
  AnalyzeStatisticsItem,
  CustomPopoverItem,
} from '@/types/interfaces/common';
import type {
  ComponentInfo,
  WorkflowBaseInfo,
} from '@/types/interfaces/library';
import type { UserInfo } from '@/types/interfaces/login';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useRequest } from 'umi';
import ComponentItem from './ComponentItem';
import CreateModel from './CreateModel';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 工作空间 - 组件库
 */
const SpaceLibrary: React.FC = () => {
  // 组件列表
  const [componentList, setComponentList] = useState<ComponentInfo[]>([]);
  // 所有智能体列表
  const componentAllRef = useRef<ComponentInfo[]>([]);
  // 新建工作流弹窗
  const [openWorkflow, setOpenWorkflow] = useState<boolean>(false);
  // 新建插件弹窗
  const [openPlugin, setOpenPlugin] = useState<boolean>(false);
  // 打开分析弹窗
  const [openAnalyze, setOpenAnalyze] = useState<boolean>(false);
  // 打开创建知识库弹窗
  const [openKnowledge, setOpenKnowledge] = useState<boolean>(false);
  // 打开创建模型弹窗
  const [openModel, setOpenModel] = useState<boolean>(false);
  // 类型
  const [type, setType] = useState<ComponentTypeEnum>(0);
  // 过滤状态
  const [status, setStatus] = useState<FilterStatusEnum>(FilterStatusEnum.All);
  // 搜索关键词
  const [keyword, setKeyword] = useState<string>('');
  // 创建者ID
  const createIdRef = useRef<number>(0);
  const [componentStatistics, setComponentStatistics] = useState<
    AnalyzeStatisticsItem[]
  >([]);
  // 创建
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );
  // 空间id
  const spaceId = localStorage.getItem(SPACE_ID) as number;

  // 查询组件列表接口
  const { run: runComponent } = useRequest(apiComponentList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: ComponentInfo[]) => {
      setComponentList(result);
      componentAllRef.current = result;
    },
  });

  useEffect(() => {
    const userInfoString = localStorage.getItem(USER_INFO);
    const userInfo = JSON.parse(userInfoString) as UserInfo;
    createIdRef.current = userInfo.id;
  }, []);

  useEffect(() => {
    runComponent(spaceId);
  }, []);

  useEffect(() => {
    const unlisten = history.listen(() => {
      const _spaceId = localStorage.getItem(SPACE_ID) as number;
      runComponent(_spaceId);
    });

    return () => {
      unlisten();
    };
  }, []);

  // 过滤筛选智能体列表数据
  const handleFilterList = (
    filterType: ComponentTypeEnum,
    filterStatus: FilterStatusEnum,
    filterCreate: CreateListEnum,
    filterKeyword: string,
  ) => {
    let list = componentAllRef.current;
    if (filterType !== 0) {
      list = list.filter((item) => item.type === filterType);
    }
    if (filterStatus === FilterStatusEnum.Published) {
      list = list.filter(
        (item) => item.publishStatus === PublishStatusEnum.Published,
      );
    }
    if (filterCreate === CreateListEnum.Me) {
      list = list.filter((item) => item.creatorId === createIdRef.current);
    }
    if (filterKeyword) {
      list = list.filter((item) => item.name.includes(filterKeyword));
    }
    setComponentList(list);
  };

  // 切换类型
  const handlerChangeType = (value: ComponentTypeEnum) => {
    setType(value);
    handleFilterList(value, status, create, keyword);
  };

  // 切换创建者
  const handlerChangeCreate = (value: CreateListEnum) => {
    setCreate(value);
    handleFilterList(type, status, value, keyword);
  };

  // 切换状态
  const handlerChangeStatus = (value: FilterStatusEnum) => {
    setStatus(value);
    handleFilterList(type, value, create, keyword);
  };

  // 智能体搜索
  const handleQueryAgent = (e) => {
    const _keyword = e.target.value;
    setKeyword(_keyword);
    handleFilterList(type, status, create, _keyword);
  };

  // 确认添加插件事件
  const handleConfirmPlugin = (id: number) => {
    setOpenPlugin(false);
    history.push(`/space/${spaceId}/plugin/${id}`);
  };

  // 确认添加工作流事件
  const handleConfirmWorkflow = (data: WorkflowBaseInfo) => {
    const id = data.id;
    setOpenWorkflow(false);
    history.push(`/workflow/${id}`);
  };

  // 点击添加资源
  const handleClickPopoverItem = (item) => {
    const { value: type } = item;
    switch (type) {
      case ComponentTypeEnum.Workflow:
        setOpenWorkflow(true);
        break;
      case ComponentTypeEnum.Plugin:
        setOpenPlugin(true);
        break;
      case ComponentTypeEnum.Knowledge:
        setOpenKnowledge(true);
        break;
      case ComponentTypeEnum.Database:
        message.warning('数据库此版本暂时未做');
        break;
      case ComponentTypeEnum.Model:
        setOpenModel(true);
        break;
    }
  };

  // 设置统计信息
  const handleSetStatistics = () => {
    const analyzeList = [
      {
        label: '智能体引用数',
        value: '2324',
      },
      {
        label: '调用次数',
        value: '12334',
      },
      {
        label: '平均响应时长（毫秒）',
        value: '1322',
      },
      {
        label: '调用成功率',
        value: '99.8%',
      },
    ];
    setComponentStatistics(analyzeList);
  };

  // 点击更多操作
  const handleClickMore = (item: CustomPopoverItem) => {
    const { type } = item;
    switch (type) {
      case ComponentMoreActionEnum.Copy:
        break;
      case ComponentMoreActionEnum.Statistics:
        handleSetStatistics();
        setOpenAnalyze(true);
        break;
      case ComponentMoreActionEnum.Del:
        break;
    }
  };

  // 点击单个资源组件
  const handleClickComponent = (item: ComponentInfo) => {
    const { type } = item;
    switch (type) {
      case ComponentTypeEnum.Workflow:
        history.push(`/workflow/${item.id}`);
        break;
      case ComponentTypeEnum.Plugin:
        history.push(`/space/${spaceId}/plugin/${item.id}/cloud-tool`);
        break;
      case ComponentTypeEnum.Knowledge:
        setOpenKnowledge(true);
        break;
      case ComponentTypeEnum.Database:
        message.warning('数据库此版本暂时未做');
        break;
      case ComponentTypeEnum.Model:
        setOpenModel(true);
        break;
    }
  };

  const handleCancelCreateKnowledge = () => {
    setOpenKnowledge(false);
    // history.push('/space/1101010/knowledge/15115');
  };

  return (
    <div className={cx(styles.container, 'h-full')}>
      <div className={cx('flex', 'content-between')}>
        <h3 className={cx(styles.title)}>组件库</h3>
        {/*添加资源*/}
        <CustomPopover
          list={LIBRARY_ALL_RESOURCE}
          onClick={handleClickPopoverItem}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            组件
          </Button>
        </CustomPopover>
      </div>
      <div className={cx('flex', styles['select-search-area'])}>
        <SelectList
          value={type}
          options={LIBRARY_ALL_TYPE}
          onChange={handlerChangeType}
        />
        <SelectList
          value={create}
          options={CREATE_LIST}
          onChange={handlerChangeCreate}
        />
        <SelectList
          value={status}
          options={FILTER_STATUS}
          onChange={handlerChangeStatus}
        />
        <Input
          rootClassName={cx(styles.input)}
          placeholder="搜索组件"
          value={keyword}
          onChange={handleQueryAgent}
          prefix={<SearchOutlined />}
        />
      </div>
      <div className={cx(styles['main-container'])}>
        {componentList?.map((item) => (
          <ComponentItem
            key={item.id}
            componentInfo={item}
            onClick={() => handleClickComponent(item)}
            onClickMore={handleClickMore}
          />
        ))}
      </div>
      {/*统计概览*/}
      <AnalyzeStatistics
        open={openAnalyze}
        onCancel={() => setOpenAnalyze(false)}
        title="统计概览"
        list={componentStatistics}
      />
      {/*新建插件弹窗*/}
      <CreateNewPlugin
        spaceId={spaceId}
        open={openPlugin}
        onCancel={() => setOpenPlugin(false)}
        onConfirmCreate={handleConfirmPlugin}
      />
      {/*创建知识库弹窗*/}
      <CreateKnowledge
        open={openKnowledge}
        onCancel={handleCancelCreateKnowledge}
        onConfirm={() => setOpenKnowledge(false)}
      />
      {/*创建工作流*/}
      <CreateWorkflow
        spaceId={spaceId}
        open={openWorkflow}
        onCancel={() => setOpenWorkflow(false)}
        onConfirm={handleConfirmWorkflow}
      />
      {/*创建模型*/}
      <CreateModel
        open={openModel}
        onCancel={() => setOpenModel(false)}
        onConfirm={() => setOpenModel(false)}
      />
    </div>
  );
};

export default SpaceLibrary;

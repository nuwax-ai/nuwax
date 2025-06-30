// import AnalyzeStatistics from '@/components/AnalyzeStatistics';
import ConditionRender from '@/components/ConditionRender';
import CreateKnowledge from '@/components/CreateKnowledge';
import CreateNewPlugin from '@/components/CreateNewPlugin';
import CreateWorkflow from '@/components/CreateWorkflow';
import CreatedItem from '@/components/CreatedItem';
import CustomPopover from '@/components/CustomPopover';
import Loading from '@/components/Loading';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import SelectList from '@/components/SelectList';
import {
  CREATE_LIST,
  FILTER_STATUS,
  LIBRARY_ALL_RESOURCE,
  LIBRARY_ALL_TYPE,
} from '@/constants/space.constants';
import { apiTableAdd, apiTableDelete } from '@/services/dataTable';
import { apiKnowledgeConfigDelete } from '@/services/knowledge';
import {
  apiComponentList,
  apiCopyTable,
  apiWorkflowCopyToSpace,
  apiWorkflowDelete,
} from '@/services/library';
import { apiModelDelete } from '@/services/modelConfig';
import { apiPluginCopyToSpace, apiPluginDelete } from '@/services/plugin';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum, PublishStatusEnum } from '@/types/enums/common';
import { PluginTypeEnum } from '@/types/enums/plugin';
import {
  ApplicationMoreActionEnum,
  ComponentTypeEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ComponentInfo } from '@/types/interfaces/library';
import { jumpToPlugin, jumpToWorkflow } from '@/utils/router';
import {
  ExclamationCircleFilled,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Empty, Input, message, Modal } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest } from 'umi';
import ComponentItem from './ComponentItem';
import CreateModel from './CreateModel';
import styles from './index.less';
const cx = classNames.bind(styles);
const { confirm } = Modal;

/**
 * 工作空间 - 组件库
 */
const SpaceLibrary: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  // 组件列表
  const [componentList, setComponentList] = useState<ComponentInfo[]>([]);
  // 所有智能体列表
  const componentAllRef = useRef<ComponentInfo[]>([]);
  // 当前组件信息
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<ComponentInfo | null>(null);
  // 新建工作流弹窗
  const [openWorkflow, setOpenWorkflow] = useState<boolean>(false);
  // 新建插件弹窗
  const [openPlugin, setOpenPlugin] = useState<boolean>(false);
  // 新建数据库弹窗
  const [openDatabase, setOpenDatabase] = useState<boolean>(false);
  // 打开分析弹窗
  // const [openAnalyze, setOpenAnalyze] = useState<boolean>(false);
  // 迁移、复制弹窗
  const [openMove, setOpenMove] = useState<boolean>(false);
  // 打开创建知识库弹窗
  const [openKnowledge, setOpenKnowledge] = useState<boolean>(false);
  // 打开创建模型弹窗
  const [openModel, setOpenModel] = useState<boolean>(false);
  const [modelComponentInfo, setModelComponentInfo] =
    useState<ComponentInfo | null>();
  // 类型
  const [type, setType] = useState<ComponentTypeEnum>(
    ComponentTypeEnum.All_Type,
  );
  // 过滤状态
  const [status, setStatus] = useState<FilterStatusEnum>(FilterStatusEnum.All);
  // 搜索关键词
  const [keyword, setKeyword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  // const [componentStatistics, setComponentStatistics] = useState<
  //   AnalyzeStatisticsItem[]
  // >([]);

  // 创建
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );
  // 获取用户信息
  const { userInfo } = useModel('userInfo');

  // 过滤筛选智能体列表数据
  const handleFilterList = (
    filterType: ComponentTypeEnum,
    filterStatus: FilterStatusEnum,
    filterCreate: CreateListEnum,
    filterKeyword: string,
    list = componentAllRef.current,
  ) => {
    let _list = list;
    if (filterType !== ComponentTypeEnum.All_Type) {
      _list = _list.filter((item) => item.type === filterType);
    }
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
    setComponentList(_list);
  };

  // 查询组件列表接口
  const { run: runComponent } = useRequest(apiComponentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ComponentInfo[]) => {
      handleFilterList(type, status, create, keyword, result);
      componentAllRef.current = result;
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 复制到空间成功后处理数据
  const handleCopyToSpaceSuccess = ({
    params,
    data,
    type,
  }: {
    params: number[];
    data: number;
    type: ComponentTypeEnum;
  }) => {
    // 关闭弹窗
    setOpenMove(false);
    // 目标空间ID
    const targetSpaceId = params[1];
    // 跳转
    if (type === ComponentTypeEnum.Plugin) {
      jumpToPlugin(targetSpaceId, data);
    } else if (type === ComponentTypeEnum.Workflow) {
      jumpToWorkflow(targetSpaceId, data);
    }
  };

  // 插件 - 复制到空间接口
  const { run: runPluginCopyToSpace, loading: loadingPlugin } = useRequest(
    apiPluginCopyToSpace,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (data: number, params: number[]) => {
        message.success('插件复制成功');
        // 复制到空间成功后处理数据
        handleCopyToSpaceSuccess({
          params,
          data,
          type: ComponentTypeEnum.Plugin,
        });
      },
    },
  );

  // 删除成功后处理数据
  const handleDel = (id: number) => {
    const list = componentList.filter((info) => info.id !== id);
    setComponentList(list);
    componentAllRef.current = componentAllRef.current.filter(
      (info) => info.id !== id,
    );
  };

  // 删除插件接口
  const { run: runPluginDel } = useRequest(apiPluginDelete, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: number[]) => {
      message.success('插件删除成功');
      const id = params[0];
      handleDel(id);
    },
  });

  // 删除指定模型配置信息
  const { run: runModelDel } = useRequest(apiModelDelete, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: number[]) => {
      message.success('模型删除成功');
      const id = params[0];
      handleDel(id);
    },
  });

  // 工作流 - 复制工作流到空间
  const { run: runWorkflowCopyToSpace, loading: loadingWorkflow } = useRequest(
    apiWorkflowCopyToSpace,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (data: number, params: number[]) => {
        message.success('工作流复制成功');
        // 复制到空间成功后处理数据
        handleCopyToSpaceSuccess({
          params,
          data,
          type: ComponentTypeEnum.Workflow,
        });
      },
    },
  );

  // 工作流 - 删除工作流接口
  const { run: runWorkflowDel } = useRequest(apiWorkflowDelete, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: number[]) => {
      message.success('工作流删除成功');
      const id = params[0];
      handleDel(id);
    },
  });

  // 知识库基础配置接口 - 数据删除接口
  const { run: runKnowledgeDel } = useRequest(apiKnowledgeConfigDelete, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: number[]) => {
      message.success('知识库删除成功');
      const id = params[0];
      handleDel(id);
    },
  });

  // Table - 数据删除接口
  const { run: runTableDel } = useRequest(apiTableDelete, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: number[]) => {
      message.success('数据表删除成功');
      const id = params[0];
      handleDel(id);
    },
  });

  // Table - 数据表复制
  const { run: runCopyTable } = useRequest(apiCopyTable, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('数据表复制成功');
      runComponent(spaceId);
    },
  });

  useEffect(() => {
    setLoading(true);
    runComponent(spaceId);
  }, [spaceId]);

  // 切换类型
  const handlerChangeType = (value: React.Key) => {
    const _value = value as ComponentTypeEnum;
    setType(_value);
    handleFilterList(_value, status, create, keyword);
  };

  // 切换创建者
  const handlerChangeCreate = (value: React.Key) => {
    const _value = value as CreateListEnum;
    setCreate(_value);
    handleFilterList(type, status, _value, keyword);
  };

  // 切换状态
  const handlerChangeStatus = (value: React.Key) => {
    const _value = value as FilterStatusEnum;
    setStatus(_value);
    handleFilterList(type, _value, create, keyword);
  };

  // 智能体搜索
  const handleQueryAgent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const _keyword = e.target.value;
    setKeyword(_keyword);
    handleFilterList(type, status, create, _keyword);
  };

  // 清除关键词
  const handleClearKeyword = () => {
    setKeyword('');
    handleFilterList(type, status, create, '');
  };

  // 根据type类型，判断插件跳转路径
  const handlePluginUrl = (
    id: number,
    spaceId: number,
    type: PluginTypeEnum,
  ) => {
    if (type === PluginTypeEnum.CODE) {
      history.push(`/space/${spaceId}/plugin/${id}/cloud-tool`);
    } else if (type === PluginTypeEnum.HTTP) {
      history.push(`/space/${spaceId}/plugin/${id}`);
    }
  };

  const handleConfirmModel = () => {
    setOpenModel(false);
    runComponent(spaceId);
  };

  // 点击添加资源
  const handleClickPopoverItem = (item: CustomPopoverItem) => {
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
      case ComponentTypeEnum.Table:
        setOpenDatabase(true);
        break;
      case ComponentTypeEnum.Model:
        setModelComponentInfo(null);
        setOpenModel(true);
        break;
    }
  };

  // 确认创建数据表
  const handleConfirmCreateTable = async (value: AnyObject) => {
    const { name: tableName, description: tableDescription, icon } = value;
    const params = {
      tableName,
      tableDescription,
      spaceId,
      icon,
    };

    const { data } = await apiTableAdd(params);
    history.push(`/space/${spaceId}/table/${data}`);
  };

  // 设置统计信息
  // const handleSetStatistics = () => {
  //   const analyzeList = [
  //     {
  //       label: '智能体引用数',
  //       value: '2324',
  //     },
  //     {
  //       label: '调用次数',
  //       value: '12334',
  //     },
  //     {
  //       label: '平均响应时长（毫秒）',
  //       value: '1322',
  //     },
  //     {
  //       label: '调用成功率',
  //       value: '99.8%',
  //     },
  //   ];
  //   setComponentStatistics(analyzeList);
  // };

  // 删除组件确认弹窗
  const showDeleteConfirm = (type: ComponentTypeEnum, info: ComponentInfo) => {
    const { id, name } = info;
    confirm({
      title: '您确定要删除此组件吗?',
      icon: <ExclamationCircleFilled />,
      content: name,
      okText: '确定',
      maskClosable: true,
      cancelText: '取消',
      onOk() {
        switch (type) {
          case ComponentTypeEnum.Plugin:
            runPluginDel(id);
            break;
          case ComponentTypeEnum.Model:
            runModelDel(id);
            break;
          case ComponentTypeEnum.Workflow:
            runWorkflowDel(id);
            break;
          case ComponentTypeEnum.Knowledge:
            runKnowledgeDel(id);
            break;
          case ComponentTypeEnum.Table:
            runTableDel(id);
            break;
        }
      },
    });
  };

  // 确认复制到空间
  const handlerConfirmCopyToSpace = (targetSpaceId: number) => {
    if (currentComponentInfo?.type === ComponentTypeEnum.Plugin) {
      runPluginCopyToSpace(currentComponentInfo.id, targetSpaceId);
    } else if (currentComponentInfo?.type === ComponentTypeEnum.Workflow) {
      runWorkflowCopyToSpace(currentComponentInfo.id, targetSpaceId);
    }
  };

  // 点击更多操作 插件： 创建副本、删除 模型：删除 工作流：创建副本、删除 知识库： 删除
  const handleClickMore = (item: CustomPopoverItem, info: ComponentInfo) => {
    const { action, type } = item as unknown as {
      action: ApplicationMoreActionEnum;
      type: ComponentTypeEnum;
    };
    const { id } = info;
    // 插件
    if (type === ComponentTypeEnum.Plugin) {
      switch (action) {
        case ApplicationMoreActionEnum.Copy_To_Space:
          setOpenMove(true);
          setCurrentComponentInfo(info);
          break;
        case ApplicationMoreActionEnum.Del:
          showDeleteConfirm(type, info);
          break;
      }
    }

    // 模型
    if (
      type === ComponentTypeEnum.Model &&
      action === ApplicationMoreActionEnum.Del
    ) {
      showDeleteConfirm(type, info);
    }

    // 工作流
    if (type === ComponentTypeEnum.Workflow) {
      switch (action) {
        case ApplicationMoreActionEnum.Copy_To_Space:
          setOpenMove(true);
          setCurrentComponentInfo(info);
          break;
        case ApplicationMoreActionEnum.Del:
          showDeleteConfirm(type, info);
          break;
      }
    }

    // 知识库
    if (
      type === ComponentTypeEnum.Knowledge &&
      action === ApplicationMoreActionEnum.Del
    ) {
      showDeleteConfirm(type, info);
    }

    // 数据表
    if (type === ComponentTypeEnum.Table) {
      switch (action) {
        case ApplicationMoreActionEnum.Del:
          showDeleteConfirm(type, info);
          break;
        case ApplicationMoreActionEnum.Copy:
          runCopyTable({ tableId: id });
          break;
      }
    }
  };

  // 点击单个资源组件
  const handleClickComponent = (item: ComponentInfo) => {
    const { type, id, spaceId, ext } = item;
    switch (type) {
      case ComponentTypeEnum.Workflow:
        history.push(`/space/${spaceId}/workflow/${id}`);
        break;
      case ComponentTypeEnum.Plugin:
        handlePluginUrl(id, spaceId, ext as PluginTypeEnum);
        break;
      case ComponentTypeEnum.Knowledge:
        history.push(`/space/${spaceId}/knowledge/${id}`);
        break;
      case ComponentTypeEnum.Table:
        history.push(`/space/${spaceId}/table/${id}`);
        break;
      case ComponentTypeEnum.Model:
        setModelComponentInfo(item);
        setOpenModel(true);
        break;
    }
  };

  return (
    <div
      className={cx(
        styles.container,
        'flex',
        'flex-col',
        'h-full',
        'overflow-y',
      )}
    >
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
          allowClear
          onClear={handleClearKeyword}
        />
      </div>
      <div className={cx('flex-1', 'overflow-y')}>
        {loading ? (
          <Loading className="h-full" />
        ) : componentList?.length > 0 ? (
          <div className={cx(styles['main-container'])}>
            {componentList?.map((info) => (
              <ComponentItem
                key={`${info.id}${info.type}`}
                componentInfo={info}
                onClick={() => handleClickComponent(info)}
                onClickMore={(item) => handleClickMore(item, info)}
              />
            ))}
          </div>
        ) : (
          <div
            className={cx('flex', 'h-full', 'items-center', 'content-center')}
          >
            <Empty description="未能找到相关结果" />
          </div>
        )}
      </div>
      {/*统计概览*/}
      {/*<AnalyzeStatistics*/}
      {/*  open={openAnalyze}*/}
      {/*  onCancel={() => setOpenAnalyze(false)}*/}
      {/*  title="统计概览"*/}
      {/*  list={componentStatistics}*/}
      {/*/>*/}
      {/*新建插件弹窗*/}
      <CreateNewPlugin
        spaceId={spaceId}
        open={openPlugin}
        onCancel={() => setOpenPlugin(false)}
      />
      {/*创建知识库弹窗*/}
      <CreateKnowledge
        spaceId={spaceId}
        open={openKnowledge}
        onCancel={() => setOpenKnowledge(false)}
      />
      <CreatedItem
        spaceId={spaceId}
        open={openDatabase}
        type={AgentComponentTypeEnum.Table}
        onCancel={() => setOpenDatabase(false)}
        Confirm={handleConfirmCreateTable}
      />
      {/*复制到空间弹窗*/}
      <MoveCopyComponent
        spaceId={spaceId}
        loading={loadingPlugin || loadingWorkflow}
        type={ApplicationMoreActionEnum.Copy_To_Space}
        mode={currentComponentInfo?.type as unknown as AgentComponentTypeEnum}
        open={openMove}
        title={currentComponentInfo?.name}
        onCancel={() => setOpenMove(false)}
        onConfirm={handlerConfirmCopyToSpace}
      />
      {/*创建工作流*/}
      <CreateWorkflow
        spaceId={spaceId}
        open={openWorkflow}
        onCancel={() => setOpenWorkflow(false)}
      />
      <ConditionRender condition={openModel}>
        {/*创建模型*/}
        <CreateModel
          mode={
            modelComponentInfo
              ? CreateUpdateModeEnum.Update
              : CreateUpdateModeEnum.Create
          }
          spaceId={spaceId}
          id={modelComponentInfo?.id}
          open={openModel}
          onCancel={() => setOpenModel(false)}
          onConfirm={handleConfirmModel}
        />
      </ConditionRender>
    </div>
  );
};

export default SpaceLibrary;

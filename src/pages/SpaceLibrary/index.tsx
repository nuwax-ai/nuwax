// import AnalyzeStatistics from '@/components/AnalyzeStatistics';
import ButtonToggle from '@/components/ButtonToggle';
import ConditionRender from '@/components/ConditionRender';
import CreateKnowledge from '@/components/CreateKnowledge';
import CreateNewPlugin from '@/components/CreateNewPlugin';
import CreateWorkflow from '@/components/CreateWorkflow';
import CreatedItem from '@/components/CreatedItem';
import CustomPopover from '@/components/CustomPopover';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import UploadImportConfig from '@/components/UploadImportConfig';
import Loading from '@/components/custom/Loading';
import SelectList from '@/components/custom/SelectList';
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
import { modalConfirm } from '@/utils/ant-custom';
import { exportConfigFile } from '@/utils/exportImportFile';
import {
  jumpTo,
  jumpToPlugin,
  jumpToPluginCloudTool,
  jumpToWorkflow,
} from '@/utils/router';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Empty, Input, message, Row, Space } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest, useSearchParams } from 'umi';
import ComponentItem from './ComponentItem';
import CreateModel from './CreateModel';
import styles from './index.less';
type IQuery = 'type' | 'create' | 'status' | 'keyword';

const cx = classNames.bind(styles);

/**
 * 工作空间 - 组件库
 */
const SpaceLibrary: React.FC = () => {
  // ✅ umi 中的 useSearchParams
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ 当 select 改变时同步 URL
  const handleChange = (key: IQuery, value: string) => {
    // 更新 URL 参数
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

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
    searchParams.get('type') || ComponentTypeEnum.All_Type,
  );
  // 过滤状态
  const [status, setStatus] = useState<FilterStatusEnum>(
    Number(searchParams.get('status')) || FilterStatusEnum.All,
  );
  // 搜索关键词
  const [keyword, setKeyword] = useState<string>(
    searchParams.get('keyword') || '',
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingWorkflow, setLoadingWorkflow] = useState<boolean>(false);
  const [loadingPlugin, setLoadingPlugin] = useState<boolean>(false);
  // const [componentStatistics, setComponentStatistics] = useState<
  //   AnalyzeStatisticsItem[]
  // >([]);

  // 创建
  const [create, setCreate] = useState<CreateListEnum>(
    Number(searchParams.get('create')) || CreateListEnum.All_Person,
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

  // ✅ 监听 URL 改变（支持浏览器前进/后退）
  useEffect(() => {
    const type = searchParams.get('type') || ComponentTypeEnum.All_Type;
    const status = Number(searchParams.get('status')) || FilterStatusEnum.All;
    const create =
      Number(searchParams.get('create')) || CreateListEnum.All_Person;
    const keyword = searchParams.get('keyword') || '';

    setType(type);
    setStatus(status);
    setCreate(create);
    setKeyword(keyword);

    handleFilterList(type, status, create, keyword);
  }, [searchParams]);

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
      // 代码插件跳转云端工具页面
      if (currentComponentInfo?.ext === PluginTypeEnum.CODE) {
        jumpToPluginCloudTool(targetSpaceId, data);
      } else {
        // 普通插件跳转插件工具页面
        jumpToPlugin(targetSpaceId, data);
      }
    } else if (type === ComponentTypeEnum.Workflow) {
      jumpToWorkflow(targetSpaceId, data);
    }
  };

  // 插件 - 复制到空间接口
  const { run: runPluginCopyToSpace } = useRequest(apiPluginCopyToSpace, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (data: number, params: number[]) => {
      message.success('插件复制成功');
      setLoadingPlugin(false);
      // 复制到空间成功后处理数据
      handleCopyToSpaceSuccess({
        params,
        data,
        type: ComponentTypeEnum.Plugin,
      });
    },
    onError: () => {
      setLoadingPlugin(false);
    },
  });

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
  const { run: runWorkflowCopyToSpace } = useRequest(apiWorkflowCopyToSpace, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (data: number, params: number[]) => {
      message.success('工作流复制成功');
      setLoadingWorkflow(false);
      // 复制到空间成功后处理数据
      handleCopyToSpaceSuccess({
        params,
        data,
        type: ComponentTypeEnum.Workflow,
      });
    },
    onError: () => {
      setLoadingWorkflow(false);
    },
  });

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
    handleChange('type', _value);
  };

  // 切换创建者
  const handlerChangeCreate = (value: React.Key) => {
    const _value = value as CreateListEnum;
    setCreate(_value);
    handleFilterList(type, status, _value, keyword);
    handleChange('create', _value.toString());
  };

  // 切换状态
  const handlerChangeStatus = (value: React.Key) => {
    const _value = value as FilterStatusEnum;
    setStatus(_value);
    handleFilterList(type, _value, create, keyword);
    handleChange('status', _value.toString());
  };

  // 智能体搜索
  const handleQueryAgent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const _keyword = e.target.value;
    setKeyword(_keyword);
    handleFilterList(type, status, create, _keyword);
    handleChange('keyword', _keyword);
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
  ): string => {
    if (type === PluginTypeEnum.CODE) {
      return `/space/${spaceId}/plugin/${id}/cloud-tool`;
    } else if (type === PluginTypeEnum.HTTP) {
      return `/space/${spaceId}/plugin/${id}`;
    }
    return '';
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

  // 删除组件确认弹窗
  const showDeleteConfirm = (type: ComponentTypeEnum, info: ComponentInfo) => {
    const { id, name } = info;
    modalConfirm('您确定要删除此组件吗?', name, () => {
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
      return new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    });
  };

  // 确认复制到空间
  const handlerConfirmCopyToSpace = (targetSpaceId: number) => {
    if (currentComponentInfo?.type === ComponentTypeEnum.Plugin) {
      setLoadingPlugin(true);
      runPluginCopyToSpace(currentComponentInfo.id, targetSpaceId);
    } else if (currentComponentInfo?.type === ComponentTypeEnum.Workflow) {
      setLoadingWorkflow(true);
      runWorkflowCopyToSpace(currentComponentInfo.id, targetSpaceId);
    }
  };

  // 点击更多操作 插件：复制到空间、导出配置、删除
  const handlePluginClickMore = (
    action: ApplicationMoreActionEnum,
    info: ComponentInfo,
  ) => {
    switch (action) {
      // 复制到空间
      case ApplicationMoreActionEnum.Copy_To_Space:
        setOpenMove(true);
        setCurrentComponentInfo(info);
        break;
      // 导出配置
      case ApplicationMoreActionEnum.Export_Config:
        exportConfigFile(info.id, AgentComponentTypeEnum.Plugin);
        break;
    }
  };

  // 点击更多操作 模型：导出配置、删除
  const handleModelClickMore = (
    action: ApplicationMoreActionEnum,
    info: ComponentInfo,
  ) => {
    switch (action) {
      case ApplicationMoreActionEnum.Export_Config:
        exportConfigFile(info.id, AgentComponentTypeEnum.Model);
        break;
    }
  };

  // 点击更多操作 工作流：复制到空间、导出配置、删除
  const handleWorkflowClickMore = (
    action: ApplicationMoreActionEnum,
    info: ComponentInfo,
  ) => {
    switch (action) {
      case ApplicationMoreActionEnum.Copy_To_Space:
        setOpenMove(true);
        setCurrentComponentInfo(info);
        break;
      case ApplicationMoreActionEnum.Export_Config:
        modalConfirm(
          `导出配置 - ${info?.name}`,
          '如果内部包含数据表或知识库，数据本身不会导出',
          () => {
            exportConfigFile(info.id, AgentComponentTypeEnum.Workflow);
            return new Promise((resolve) => {
              setTimeout(resolve, 1000);
            });
          },
        );
        break;
    }
  };

  // 点击更多操作 数据表：复制、导出配置、删除
  const handleTableClickMore = (
    action: ApplicationMoreActionEnum,
    info: ComponentInfo,
  ) => {
    switch (action) {
      case ApplicationMoreActionEnum.Export_Config:
        modalConfirm(
          `导出配置 - ${info?.name}`,
          '仅导出数据表结构，数据本身不会导出',
          () => {
            exportConfigFile(info.id, AgentComponentTypeEnum.Table);
            return new Promise((resolve) => {
              setTimeout(resolve, 1000);
            });
          },
        );
        break;
      case ApplicationMoreActionEnum.Copy:
        runCopyTable({ tableId: info.id });
        break;
    }
  };

  // 点击更多操作 日志
  const handleClickLog = (type: ComponentTypeEnum, info: ComponentInfo) => {
    switch (type) {
      case ComponentTypeEnum.Workflow:
        history.push(`/space/${spaceId}/library-log?query=${info?.id ?? ''}`);
        break;
      case ComponentTypeEnum.Plugin:
        history.push(`/space/${spaceId}/library-log?query=${info?.id ?? ''}`);
        break;
    }
  };

  // 点击更多操作
  const handleClickMore = (item: CustomPopoverItem, info: ComponentInfo) => {
    const { action, type } = item as unknown as {
      action: ApplicationMoreActionEnum;
      type: ComponentTypeEnum;
    };
    // 删除操作，所有类型的组件都有删除操作，所以单独处理, 知识库只有删除操作
    if (action === ApplicationMoreActionEnum.Del) {
      showDeleteConfirm(type, info);
    } else if (action === ApplicationMoreActionEnum.Log) {
      handleClickLog(type, info);
    } else {
      switch (type) {
        // 插件
        case ComponentTypeEnum.Plugin:
          handlePluginClickMore(action, info);
          break;
        // 模型
        case ComponentTypeEnum.Model:
          handleModelClickMore(action, info);
          break;
        // 工作流
        case ComponentTypeEnum.Workflow:
          handleWorkflowClickMore(action, info);
          break;
        // 数据表
        case ComponentTypeEnum.Table:
          handleTableClickMore(action, info);
          break;
      }
    }
  };

  // 点击单个资源组件
  const handleClickComponent = (item: ComponentInfo) => {
    const { type, id, spaceId, ext } = item;

    let url = '';
    switch (type) {
      case ComponentTypeEnum.Workflow:
        url = `/space/${spaceId}/workflow/${id}`;
        break;
      case ComponentTypeEnum.Plugin:
        url = handlePluginUrl(id, spaceId, ext as PluginTypeEnum);
        break;
      case ComponentTypeEnum.Knowledge:
        url = `/space/${spaceId}/knowledge/${id}`;
        break;
      case ComponentTypeEnum.Table:
        url = `/space/${spaceId}/table/${id}`;
        break;
      case ComponentTypeEnum.Model:
        setModelComponentInfo(item);
        setOpenModel(true);
        break;
    }

    if (url) {
      jumpTo(url);
    }
  };

  // 导入配置成功后，刷新组件列表
  const handleImportConfig = () => {
    runComponent(spaceId);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <Row>
        <Col
          xs={24}
          sm={24}
          md={24}
          lg={24}
          xl={14}
          xxl={12}
          style={{ marginBottom: 5 }}
        >
          <div>
            <Space>
              <h3 className={cx(styles.title)}>组件库</h3>
              <SelectList
                value={type}
                options={LIBRARY_ALL_TYPE}
                onChange={handlerChangeType}
              />
              {/* 单选模式 */}
              <ButtonToggle
                options={CREATE_LIST}
                value={create}
                onChange={(value) => handlerChangeCreate(value as React.Key)}
              />
              <ButtonToggle
                options={FILTER_STATUS}
                value={status}
                onChange={(value) => handlerChangeStatus(value as React.Key)}
              />
            </Space>
          </div>
        </Col>
        <Col
          xs={24}
          sm={24}
          md={24}
          lg={24}
          xl={10}
          xxl={12}
          style={{ marginBottom: 5 }}
        >
          <div className={cx('flex', 'gap-10', 'justify-content-end')}>
            <Input
              rootClassName={cx(styles.input)}
              placeholder="搜索组件"
              value={keyword}
              onChange={handleQueryAgent}
              prefix={<SearchOutlined />}
              allowClear
              onClear={handleClearKeyword}
              style={{ width: 214 }}
            />
            <UploadImportConfig
              spaceId={spaceId}
              onUploadSuccess={handleImportConfig}
            />
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
        </Col>
      </Row>

      {loading ? (
        <Loading />
      ) : componentList?.length > 0 ? (
        <div
          className={cx(
            styles['main-container'],
            'flex-1',
            'scroll-container-hide',
          )}
        >
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
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description="未能找到相关结果" />
        </div>
      )}
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

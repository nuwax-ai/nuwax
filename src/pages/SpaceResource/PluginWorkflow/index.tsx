import CreateNewPlugin from '@/components/CreateNewPlugin';
import CreateWorkflow from '@/components/CreateWorkflow';
import { apiComponentList } from '@/services/library';
import { PublishStatusEnum } from '@/types/enums/common';
import {
  ComponentTypeEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';
import type { ComponentInfo } from '@/types/interfaces/library';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useModel, useParams, useRequest } from 'umi';
import ComponentList from './components/ComponentList';
import HeaderArea from './components/HeaderArea';
import LeftGroupList from './components/LeftGroupList';
import styles from './index.less';

const cx = classNames.bind(styles);

const ALLOWED_TYPES = new Set([
  ComponentTypeEnum.Workflow,
  ComponentTypeEnum.Plugin,
]);

const SpacePluginWorkflow: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const { userInfo } = useModel('userInfo');
  const location = useLocation();

  const [componentList, setComponentList] = useState<ComponentInfo[]>([]);
  const componentAllRef = useRef<ComponentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [openWorkflow, setOpenWorkflow] = useState(false);
  const [openPlugin, setOpenPlugin] = useState(false);

  // 顶部筛选类型状态，默认为全部类型
  const [type, setType] = useState<ComponentTypeEnum>(
    ComponentTypeEnum.All_Type,
  );

  // 资源分组状态，0 表示全部
  const [groupId, setGroupId] = useState<number>(0);
  const [selectedGroupType, setSelectedGroupType] = useState<
    string | undefined
  >(undefined);

  const filterParamsRef = useRef({
    type: ComponentTypeEnum.All_Type,
    status: FilterStatusEnum.All,
    create: CreateListEnum.All_Person,
    keyword: '',
    groupId: 0,
  });

  const handleFilterList = (
    filterType: ComponentTypeEnum,
    filterStatus: FilterStatusEnum,
    filterCreate: CreateListEnum,
    filterKeyword: string,
    filterGroupId?: number,
    list = componentAllRef.current,
  ) => {
    setType(filterType);

    // 只要是非左侧分组点击触发的操作（即来自顶层 HeaderArea 的逆时切换、查询搜索等动作），无条件重置当前选中的 groupId 为 0，取消选中状态
    let currentGId = filterGroupId !== undefined ? filterGroupId : 0;
    if (filterGroupId === undefined) {
      setGroupId(0);
      setSelectedGroupType(undefined);
    }

    filterParamsRef.current = {
      type: filterType,
      status: filterStatus,
      create: filterCreate,
      keyword: filterKeyword,
      groupId: currentGId,
    };

    let _list = list.filter((item) =>
      ALLOWED_TYPES.has(item.type as ComponentTypeEnum),
    );
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
    if (currentGId && Number(currentGId) !== 0) {
      _list = _list.filter(
        (item) => Number(item.groupId) === Number(currentGId),
      );
    }
    setComponentList(_list);
  };

  const handleGroupChange = (id: number, groupType?: string) => {
    setGroupId(id);
    setSelectedGroupType(groupType);
    const {
      type: currentType,
      status,
      create,
      keyword,
    } = filterParamsRef.current;
    handleFilterList(currentType, status, create, keyword, id);
  };

  const { run: runComponent } = useRequest(apiComponentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ComponentInfo[]) => {
      componentAllRef.current = result;
      const {
        type: currentType,
        status,
        create,
        keyword,
        groupId: currentGId,
      } = filterParamsRef.current;
      handleFilterList(
        currentType,
        status,
        create,
        keyword,
        currentGId,
        result,
      );
      setLoading(false);
    },
    onError: () => setLoading(false),
  });

  useEffect(() => {
    if (location.state) return;
    setLoading(true);
    runComponent(spaceId);
  }, [spaceId]);

  useEffect(() => {
    if (location.state) {
      setLoading(true);
      runComponent(spaceId);
    }
  }, [location.state]);

  // 用户点击侧边栏页面菜单路由发生切换时，无条件将选中的分组状态重置为 0，取消高亮选中
  useEffect(() => {
    setGroupId(0);
    setSelectedGroupType(undefined);
    filterParamsRef.current.groupId = 0;
    const {
      type: currentType,
      status,
      create,
      keyword,
    } = filterParamsRef.current;
    handleFilterList(currentType, status, create, keyword, 0);
  }, [location.key]);

  const handleDel = (id: number) => {
    setComponentList((prev) => prev.filter((item) => item.id !== id));
    componentAllRef.current = componentAllRef.current.filter(
      (item) => item.id !== id,
    );
  };

  return (
    <div className={cx(styles.container)}>
      <HeaderArea
        spaceId={spaceId}
        selectedGroupType={selectedGroupType}
        onFilterChange={handleFilterList}
        onUploadSuccess={() => runComponent(spaceId)}
        onOpenWorkflow={() => setOpenWorkflow(true)}
        onOpenPlugin={() => setOpenPlugin(true)}
      />
      <div className={cx(styles['content-body'])}>
        <LeftGroupList
          className={cx(styles.sidebar)}
          spaceId={spaceId}
          value={groupId}
          onChange={handleGroupChange}
          componentList={componentAllRef.current}
          filterType={type}
        />
        <div className={cx(styles['list-area'], 'scroll-container-hide')}>
          <ComponentList
            loading={loading}
            componentList={componentList}
            spaceId={spaceId}
            onDelete={handleDel}
            onRefresh={() => runComponent(spaceId)}
          />
        </div>
      </div>

      <CreateNewPlugin
        spaceId={spaceId}
        open={openPlugin}
        onCancel={() => setOpenPlugin(false)}
        defaultGroupId={groupId !== 0 ? groupId : undefined}
      />
      <CreateWorkflow
        spaceId={spaceId}
        open={openWorkflow}
        onCancel={() => setOpenWorkflow(false)}
        defaultGroupId={groupId !== 0 ? groupId : undefined}
      />
    </div>
  );
};

export default SpacePluginWorkflow;

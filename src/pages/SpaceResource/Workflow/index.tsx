import CreateWorkflow from '@/components/CreateWorkflow';
import { dict } from '@/services/i18nRuntime';
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
import ComponentList from '../components/ComponentList';
import LeftGroupList from '../components/LeftGroupList';
import HeaderArea from './components/HeaderArea';
import styles from './index.less';

const cx = classNames.bind(styles);

const ALLOWED_TYPES = new Set([
  ComponentTypeEnum.Workflow,
  ComponentTypeEnum.Plugin,
]);

const SpaceWorkflow: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const { userInfo } = useModel('userInfo');
  const location = useLocation();

  const [componentList, setComponentList] = useState<ComponentInfo[]>([]);
  const componentAllRef = useRef<ComponentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [openWorkflow, setOpenWorkflow] = useState(false);

  // 顶部筛选类型状态，默认为工作流
  const [type, setType] = useState<ComponentTypeEnum>(
    ComponentTypeEnum.Workflow,
  );

  // 资源分组状态，0 表示全部
  const [groupId, setGroupId] = useState<number>(0);
  const [selectedGroupType, setSelectedGroupType] = useState<
    string | undefined
  >(undefined);

  const filterParamsRef = useRef({
    type: ComponentTypeEnum.Workflow,
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

    // 如果 filterGroupId 不为 undefined，说明是左侧分组点击触发的操作，则更新分组选中状态
    // 如果为 undefined，说明是顶部 HeaderArea 的搜索过滤操作，则保持当前已选中的分组状态 groupId 不变
    let currentGId = groupId;
    if (filterGroupId !== undefined) {
      currentGId = filterGroupId;
      setGroupId(filterGroupId);
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

  const [refreshGroupTrigger, setRefreshGroupTrigger] = useState(0);

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
      setRefreshGroupTrigger((prev) => prev + 1);
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
      setGroupId(0);
      setSelectedGroupType(undefined);
      filterParamsRef.current.groupId = 0;
      setLoading(true);
      runComponent(spaceId);
    }
  }, [location.state]);

  const handleDel = (id: number) => {
    setComponentList((prev) => prev.filter((item) => item.id !== id));
    componentAllRef.current = componentAllRef.current.filter(
      (item) => item.id !== id,
    );
    setRefreshGroupTrigger((prev) => prev + 1);
  };

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles['content-body'])}>
        <LeftGroupList
          className={cx(styles.sidebar)}
          spaceId={spaceId}
          value={groupId}
          onChange={handleGroupChange}
          componentList={componentAllRef.current}
          filterType={type}
          refreshTrigger={refreshGroupTrigger}
          title={dict('PC.Pages.SpacePluginWorkflow.workflowPageTitle')}
        />
        <div className={cx(styles['right-content'])}>
          <HeaderArea
            spaceId={spaceId}
            selectedGroupType={selectedGroupType}
            onFilterChange={handleFilterList}
            onUploadSuccess={() => runComponent(spaceId)}
            onOpenWorkflow={() => setOpenWorkflow(true)}
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
      </div>

      <CreateWorkflow
        spaceId={spaceId}
        open={openWorkflow}
        onCancel={() => setOpenWorkflow(false)}
        defaultGroupId={groupId !== 0 ? groupId : undefined}
      />
    </div>
  );
};

export default SpaceWorkflow;

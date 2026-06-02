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
import { history, useModel, useParams, useRequest } from 'umi';
import ComponentList from './components/ComponentList';
import HeaderArea from './components/HeaderArea';
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

  const [componentList, setComponentList] = useState<ComponentInfo[]>([]);
  const componentAllRef = useRef<ComponentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [openWorkflow, setOpenWorkflow] = useState(false);
  const [openPlugin, setOpenPlugin] = useState(false);

  const filterParamsRef = useRef({
    type: ComponentTypeEnum.All_Type,
    status: FilterStatusEnum.All,
    create: CreateListEnum.All_Person,
    keyword: '',
  });

  const handleFilterList = (
    filterType: ComponentTypeEnum,
    filterStatus: FilterStatusEnum,
    filterCreate: CreateListEnum,
    filterKeyword: string,
    list = componentAllRef.current,
  ) => {
    filterParamsRef.current = {
      type: filterType,
      status: filterStatus,
      create: filterCreate,
      keyword: filterKeyword,
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
    setComponentList(_list);
  };

  const { run: runComponent } = useRequest(apiComponentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ComponentInfo[]) => {
      componentAllRef.current = result;
      const { type, status, create, keyword } = filterParamsRef.current;
      handleFilterList(type, status, create, keyword, result);
      setLoading(false);
    },
    onError: () => setLoading(false),
  });

  useEffect(() => {
    if (history.location.state) return;
    setLoading(true);
    runComponent(spaceId);
  }, [spaceId]);

  useEffect(() => {
    if (history.location.state) {
      setLoading(true);
      runComponent(spaceId);
    }
  }, [history.location.state]);

  const handleDel = (id: number) => {
    setComponentList((prev) => prev.filter((item) => item.id !== id));
    componentAllRef.current = componentAllRef.current.filter(
      (item) => item.id !== id,
    );
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <HeaderArea
        spaceId={spaceId}
        onFilterChange={handleFilterList}
        onUploadSuccess={() => runComponent(spaceId)}
        onOpenWorkflow={() => setOpenWorkflow(true)}
        onOpenPlugin={() => setOpenPlugin(true)}
      />
      <ComponentList
        loading={loading}
        componentList={componentList}
        spaceId={spaceId}
        onDelete={handleDel}
      />

      <CreateNewPlugin
        spaceId={spaceId}
        open={openPlugin}
        onCancel={() => setOpenPlugin(false)}
      />
      <CreateWorkflow
        spaceId={spaceId}
        open={openWorkflow}
        onCancel={() => setOpenWorkflow(false)}
      />
    </div>
  );
};

export default SpacePluginWorkflow;

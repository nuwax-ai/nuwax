import ButtonToggle from '@/components/ButtonToggle';
import CreateNewPlugin from '@/components/CreateNewPlugin';
import CreateWorkflow from '@/components/CreateWorkflow';
import CustomPopover from '@/components/CustomPopover';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import UploadImportConfig from '@/components/UploadImportConfig';
import Loading from '@/components/custom/Loading';
import SelectList from '@/components/custom/SelectList';
import {
  CREATE_LIST,
  FILTER_STATUS,
  PLUGIN_WORKFLOW_RESOURCE,
  PLUGIN_WORKFLOW_TYPE,
} from '@/constants/space.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiComponentList,
  apiWorkflowCopyToSpace,
  apiWorkflowDelete,
} from '@/services/library';
import { apiPluginCopyToSpace, apiPluginDelete } from '@/services/plugin';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
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
import { Button, Empty, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest, useSearchParams } from 'umi';
import ComponentItem from '../../SpaceLibrary/ComponentItem';
import styles from './index.less';

const cx = classNames.bind(styles);

const ALLOWED_TYPES = new Set([
  ComponentTypeEnum.Workflow,
  ComponentTypeEnum.Plugin,
]);

const SpacePluginWorkflow: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const { userInfo } = useModel('userInfo');

  const [componentList, setComponentList] = useState<ComponentInfo[]>([]);
  const componentAllRef = useRef<ComponentInfo[]>([]);
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<ComponentInfo | null>(null);
  const [openWorkflow, setOpenWorkflow] = useState(false);
  const [openPlugin, setOpenPlugin] = useState(false);
  const [openMove, setOpenMove] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [loadingPlugin, setLoadingPlugin] = useState(false);

  const [type, setType] = useState<ComponentTypeEnum>(
    (searchParams.get('type') as ComponentTypeEnum) ||
      ComponentTypeEnum.All_Type,
  );
  const [status, setStatus] = useState<FilterStatusEnum>(
    Number(searchParams.get('status')) || FilterStatusEnum.All,
  );
  const [create, setCreate] = useState<CreateListEnum>(
    Number(searchParams.get('create')) || CreateListEnum.All_Person,
  );
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');

  const handleChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleFilterList = (
    filterType: ComponentTypeEnum,
    filterStatus: FilterStatusEnum,
    filterCreate: CreateListEnum,
    filterKeyword: string,
    list = componentAllRef.current,
  ) => {
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

  useEffect(() => {
    const t =
      (searchParams.get('type') as ComponentTypeEnum) ||
      ComponentTypeEnum.All_Type;
    const s = Number(searchParams.get('status')) || FilterStatusEnum.All;
    const c = Number(searchParams.get('create')) || CreateListEnum.All_Person;
    const k = searchParams.get('keyword') || '';
    setType(t);
    setStatus(s);
    setCreate(c);
    setKeyword(k);
    handleFilterList(t, s, c, k);
  }, [searchParams]);

  const { run: runComponent } = useRequest(apiComponentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ComponentInfo[]) => {
      componentAllRef.current = result;
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
      setSearchParams(new URLSearchParams());
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

  const { run: runPluginDel } = useRequest(apiPluginDelete, {
    manual: true,
    onSuccess: (_: null, p: number[]) => {
      message.success(dict('PC.Pages.SpaceLibrary.Index.pluginDeleteSuccess'));
      handleDel(p[0]);
    },
  });

  const { run: runWorkflowDel } = useRequest(apiWorkflowDelete, {
    manual: true,
    onSuccess: (_: null, p: number[]) => {
      message.success(
        dict('PC.Pages.SpaceLibrary.Index.workflowDeleteSuccess'),
      );
      handleDel(p[0]);
    },
  });

  const handleCopyToSpaceSuccess = (
    targetSpaceId: number,
    data: number,
    type: ComponentTypeEnum,
  ) => {
    setOpenMove(false);
    if (type === ComponentTypeEnum.Plugin) {
      if (currentComponentInfo?.ext === PluginTypeEnum.CODE) {
        jumpToPluginCloudTool(targetSpaceId, data);
      } else {
        jumpToPlugin(targetSpaceId, data);
      }
    } else if (type === ComponentTypeEnum.Workflow) {
      jumpToWorkflow(targetSpaceId, data);
    }
  };

  const { run: runPluginCopyToSpace } = useRequest(apiPluginCopyToSpace, {
    manual: true,
    onSuccess: (data: number, p: number[]) => {
      message.success(dict('PC.Pages.SpaceLibrary.Index.pluginCopySuccess'));
      setLoadingPlugin(false);
      handleCopyToSpaceSuccess(p[1], data, ComponentTypeEnum.Plugin);
    },
    onError: () => setLoadingPlugin(false),
  });

  const { run: runWorkflowCopyToSpace } = useRequest(apiWorkflowCopyToSpace, {
    manual: true,
    onSuccess: (data: number, p: number[]) => {
      message.success(dict('PC.Pages.SpaceLibrary.Index.workflowCopySuccess'));
      setLoadingWorkflow(false);
      handleCopyToSpaceSuccess(p[1], data, ComponentTypeEnum.Workflow);
    },
    onError: () => setLoadingWorkflow(false),
  });

  const handlerConfirmCopyToSpace = (targetSpaceId: number) => {
    if (currentComponentInfo?.type === ComponentTypeEnum.Plugin) {
      setLoadingPlugin(true);
      runPluginCopyToSpace(currentComponentInfo.id, targetSpaceId);
    } else if (currentComponentInfo?.type === ComponentTypeEnum.Workflow) {
      setLoadingWorkflow(true);
      runWorkflowCopyToSpace(currentComponentInfo.id, targetSpaceId);
    }
  };

  const handleClickComponent = (item: ComponentInfo) => {
    const { type, id, spaceId, ext } = item;
    if (type === ComponentTypeEnum.Workflow) {
      jumpTo(`/space/${spaceId}/workflow/${id}`);
    } else if (type === ComponentTypeEnum.Plugin) {
      const url =
        ext === PluginTypeEnum.CODE
          ? `/space/${spaceId}/plugin/${id}/cloud-tool`
          : `/space/${spaceId}/plugin/${id}`;
      jumpTo(url);
    }
  };

  const handleClickMore = (item: CustomPopoverItem, info: ComponentInfo) => {
    const { action, type } = item as unknown as {
      action: ApplicationMoreActionEnum;
      type: ComponentTypeEnum;
    };
    if (action === ApplicationMoreActionEnum.Del) {
      const { id, name } = info;
      modalConfirm(
        dict('PC.Pages.SpaceLibrary.Index.confirmDeleteComponent'),
        name,
        () => {
          if (type === ComponentTypeEnum.Plugin) runPluginDel(id);
          else if (type === ComponentTypeEnum.Workflow) runWorkflowDel(id);
          new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
        },
      );
    } else if (action === ApplicationMoreActionEnum.Log) {
      const logType =
        type === ComponentTypeEnum.Workflow
          ? AgentComponentTypeEnum.Workflow
          : AgentComponentTypeEnum.Plugin;
      history.push(
        `/space/${spaceId}/library-log?targetType=${logType}&targetId=${
          info?.id ?? ''
        }`,
      );
    } else if (action === ApplicationMoreActionEnum.Copy_To_Space) {
      setOpenMove(true);
      setCurrentComponentInfo(info);
    } else if (action === ApplicationMoreActionEnum.Export_Config) {
      if (type === ComponentTypeEnum.Plugin) {
        exportConfigFile(info.id, AgentComponentTypeEnum.Plugin);
      } else if (type === ComponentTypeEnum.Workflow) {
        modalConfirm(
          dict(
            'PC.Pages.SpaceLibrary.Index.exportConfigTitle',
            info?.name || '',
          ),
          dict('PC.Pages.SpaceLibrary.Index.exportWorkflowConfigDesc'),
          () => {
            exportConfigFile(info.id, AgentComponentTypeEnum.Workflow);
            new Promise((resolve) => {
              setTimeout(resolve, 1000);
            });
          },
        );
      }
    }
  };

  const handleClickPopoverItem = (item: CustomPopoverItem) => {
    if (item.value === ComponentTypeEnum.Workflow) setOpenWorkflow(true);
    else if (item.value === ComponentTypeEnum.Plugin) setOpenPlugin(true);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <div className={cx(styles['header-area'])}>
        <div className={cx(styles['header-left'])}>
          <h3 className={cx(styles.title)}>
            {dict('PC.Pages.SpacePluginWorkflow.pageTitle')}
          </h3>
          <SelectList
            value={type}
            options={PLUGIN_WORKFLOW_TYPE}
            onChange={(v) => {
              const _v = v as ComponentTypeEnum;
              setType(_v);
              handleFilterList(_v, status, create, keyword);
              handleChange('type', _v);
            }}
          />
          <ButtonToggle
            options={CREATE_LIST}
            value={create}
            onChange={(v) => {
              const _v = v as CreateListEnum;
              setCreate(_v);
              handleFilterList(type, status, _v, keyword);
              handleChange('create', _v.toString());
            }}
          />
          <ButtonToggle
            options={FILTER_STATUS}
            value={status}
            onChange={(v) => {
              const _v = v as FilterStatusEnum;
              setStatus(_v);
              handleFilterList(type, _v, create, keyword);
              handleChange('status', _v.toString());
            }}
          />
        </div>
        <div className={cx(styles['header-right'])}>
          <Input
            rootClassName={cx(styles.input)}
            placeholder={dict('PC.Pages.SpaceLibrary.Index.searchComponent')}
            value={keyword}
            onChange={(e) => {
              const k = e.target.value;
              setKeyword(k);
              handleFilterList(type, status, create, k);
              handleChange('keyword', k);
            }}
            prefix={<SearchOutlined />}
            allowClear
            onClear={() => {
              setKeyword('');
              handleFilterList(type, status, create, '');
            }}
            style={{ width: 214 }}
          />
          <UploadImportConfig
            spaceId={spaceId}
            onUploadSuccess={() => runComponent(spaceId)}
          />
          <CustomPopover
            list={PLUGIN_WORKFLOW_RESOURCE}
            onClick={handleClickPopoverItem}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              {dict('PC.Pages.SpaceLibrary.Index.addComponent')}
            </Button>
          </CustomPopover>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : componentList.length > 0 ? (
        <div
          className={cx(
            styles['main-container'],
            'flex-1',
            'scroll-container-hide',
          )}
        >
          {componentList.map((info) => (
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
          <Empty description={dict('PC.Pages.SpaceLibrary.Index.noResults')} />
        </div>
      )}

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
    </div>
  );
};

export default SpacePluginWorkflow;

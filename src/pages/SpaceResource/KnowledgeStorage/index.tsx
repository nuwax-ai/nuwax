import ButtonToggle from '@/components/ButtonToggle';
import CreateKnowledge from '@/components/CreateKnowledge';
import CreatedItem from '@/components/CreatedItem';
import CustomPopover from '@/components/CustomPopover';
import UploadImportConfig from '@/components/UploadImportConfig';
import Loading from '@/components/custom/Loading';
import SelectList from '@/components/custom/SelectList';
import {
  CREATE_LIST,
  FILTER_STATUS,
  KNOWLEDGE_STORAGE_RESOURCE,
  KNOWLEDGE_STORAGE_TYPE,
} from '@/constants/space.constants';
import { apiTableAdd, apiTableDelete } from '@/services/dataTable';
import { dict } from '@/services/i18nRuntime';
import { apiKnowledgeConfigDelete } from '@/services/knowledge';
import { apiComponentList, apiCopyTable } from '@/services/library';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
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
import { jumpTo } from '@/utils/router';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, message } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest, useSearchParams } from 'umi';
import ComponentItem from '../../SpaceLibrary/ComponentItem';
import styles from './index.less';

const cx = classNames.bind(styles);

const ALLOWED_TYPES = new Set([
  ComponentTypeEnum.Knowledge,
  ComponentTypeEnum.Table,
]);

const SpaceKnowledgeStorage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const { userInfo } = useModel('userInfo');

  const [componentList, setComponentList] = useState<ComponentInfo[]>([]);
  const componentAllRef = useRef<ComponentInfo[]>([]);
  const [openKnowledge, setOpenKnowledge] = useState(false);
  const [openDatabase, setOpenDatabase] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (value) newParams.set(key, value);
    else newParams.delete(key);
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

  const { run: runKnowledgeDel } = useRequest(apiKnowledgeConfigDelete, {
    manual: true,
    onSuccess: (_: null, p: number[]) => {
      message.success(
        dict('PC.Pages.SpaceLibrary.Index.knowledgeDeleteSuccess'),
      );
      handleDel(p[0]);
    },
  });

  const { run: runTableDel } = useRequest(apiTableDelete, {
    manual: true,
    onSuccess: (_: null, p: number[]) => {
      message.success(dict('PC.Pages.SpaceLibrary.Index.tableDeleteSuccess'));
      handleDel(p[0]);
    },
  });

  const { run: runCopyTable } = useRequest(apiCopyTable, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Pages.SpaceLibrary.Index.tableCopySuccess'));
      runComponent(spaceId);
    },
  });

  const handleClickComponent = (item: ComponentInfo) => {
    const { type, id, spaceId } = item;
    if (type === ComponentTypeEnum.Knowledge) {
      jumpTo(`/space/${spaceId}/knowledge/${id}`);
    } else if (type === ComponentTypeEnum.Table) {
      jumpTo(`/space/${spaceId}/table/${id}`);
    }
  };

  const handleClickMore = (item: CustomPopoverItem, info: ComponentInfo) => {
    const { action, type } = item as unknown as {
      action: ApplicationMoreActionEnum;
      type: ComponentTypeEnum;
    };
    const { id, name } = info;
    if (action === ApplicationMoreActionEnum.Del) {
      modalConfirm(
        dict('PC.Pages.SpaceLibrary.Index.confirmDeleteComponent'),
        name,
        () => {
          if (type === ComponentTypeEnum.Knowledge) runKnowledgeDel(id);
          else if (type === ComponentTypeEnum.Table) runTableDel(id);
          new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
        },
      );
    } else if (action === ApplicationMoreActionEnum.Export_Config) {
      if (type === ComponentTypeEnum.Table) {
        modalConfirm(
          dict(
            'PC.Pages.SpaceLibrary.Index.exportConfigTitle',
            info?.name || '',
          ),
          dict('PC.Pages.SpaceLibrary.Index.exportTableConfigDesc'),
          () => {
            exportConfigFile(info.id, AgentComponentTypeEnum.Table);
            new Promise((resolve) => {
              setTimeout(resolve, 1000);
            });
          },
        );
      }
    } else if (action === ApplicationMoreActionEnum.Copy) {
      runCopyTable({ tableId: id });
    }
  };

  const handleClickPopoverItem = (item: CustomPopoverItem) => {
    if (item.value === ComponentTypeEnum.Knowledge) setOpenKnowledge(true);
    else if (item.value === ComponentTypeEnum.Table) setOpenDatabase(true);
  };

  const handleConfirmCreateTable = async (value: AnyObject) => {
    const { name: tableName, description: tableDescription, icon } = value;
    const { data } = await apiTableAdd({
      tableName,
      tableDescription,
      spaceId,
      icon,
    });
    history.push(`/space/${spaceId}/table/${data}`);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <div className={cx(styles['header-area'])}>
        <div className={cx(styles['header-left'])}>
          <h3 className={cx(styles.title)}>
            {dict('PC.Pages.SpaceKnowledgeStorage.pageTitle')}
          </h3>
          <SelectList
            value={type}
            options={KNOWLEDGE_STORAGE_TYPE}
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
            list={KNOWLEDGE_STORAGE_RESOURCE}
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
    </div>
  );
};

export default SpaceKnowledgeStorage;

import ButtonToggle from '@/components/ButtonToggle';
import CreatedItem from '@/components/CreatedItem';
import UploadImportConfig from '@/components/UploadImportConfig';
import Loading from '@/components/custom/Loading';
import { CREATE_LIST } from '@/constants/space.constants';
import { apiTableAdd, apiTableDelete } from '@/services/dataTable';
import { dict } from '@/services/i18nRuntime';
import { apiComponentList, apiCopyTable } from '@/services/library';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  ApplicationMoreActionEnum,
  ComponentTypeEnum,
  CreateListEnum,
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
import styles from '../styles/resource-list.less';

const cx = classNames.bind(styles);

const ALLOWED_TYPES = new Set([ComponentTypeEnum.Table]);

const SpaceStorage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const { userInfo } = useModel('userInfo');

  const [componentList, setComponentList] = useState<ComponentInfo[]>([]);
  const componentAllRef = useRef<ComponentInfo[]>([]);
  const [openDatabase, setOpenDatabase] = useState(false);
  const [loading, setLoading] = useState(false);

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
    filterCreate: CreateListEnum,
    filterKeyword: string,
    list = componentAllRef.current,
  ) => {
    let _list = list.filter((item) =>
      ALLOWED_TYPES.has(item.type as ComponentTypeEnum),
    );
    if (filterCreate === CreateListEnum.Me) {
      _list = _list.filter((item) => item.creatorId === userInfo.id);
    }
    if (filterKeyword) {
      _list = _list.filter((item) => item.name.includes(filterKeyword));
    }
    setComponentList(_list);
  };

  useEffect(() => {
    const c = Number(searchParams.get('create')) || CreateListEnum.All_Person;
    const k = searchParams.get('keyword') || '';
    setCreate(c);
    setKeyword(k);
    handleFilterList(c, k);
  }, [searchParams]);

  const { run: runComponent } = useRequest(apiComponentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ComponentInfo[]) => {
      componentAllRef.current = result;
      handleFilterList(create, keyword, result);
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
    if (type === ComponentTypeEnum.Table) {
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
          if (type === ComponentTypeEnum.Table) runTableDel(id);
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
            {dict('PC.Common.Global.dataTable')}
          </h3>
          <ButtonToggle
            options={CREATE_LIST}
            value={create}
            onChange={(v) => {
              const _v = v as CreateListEnum;
              setCreate(_v);
              handleFilterList(_v, keyword);
              handleChange('create', _v.toString());
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
              handleFilterList(create, k);
              handleChange('keyword', k);
            }}
            prefix={<SearchOutlined />}
            allowClear
            onClear={() => {
              setKeyword('');
              handleFilterList(create, '');
            }}
            style={{ width: 214 }}
          />
          <UploadImportConfig
            spaceId={spaceId}
            onUploadSuccess={() => runComponent(spaceId)}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpenDatabase(true)}
          >
            {dict('PC.Pages.AgentArrangeConfig.addTable')}
          </Button>
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

export default SpaceStorage;

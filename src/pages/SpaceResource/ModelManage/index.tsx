import ButtonToggle from '@/components/ButtonToggle';
import ConditionRender from '@/components/ConditionRender';
import Loading from '@/components/custom/Loading';
import { CREATE_LIST } from '@/constants/space.constants';
import { dict } from '@/services/i18nRuntime';
import { apiComponentList } from '@/services/library';
import { apiModelDelete } from '@/services/modelConfig';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  ApplicationMoreActionEnum,
  ComponentTypeEnum,
  CreateListEnum,
} from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ComponentInfo } from '@/types/interfaces/library';
import { modalConfirm } from '@/utils/ant-custom';
import { exportConfigFile } from '@/utils/exportImportFile';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest, useSearchParams } from 'umi';
import ComponentItem from '../../SpaceLibrary/ComponentItem';
import CreateModel from '../../SpaceLibrary/CreateModel';
import styles from './index.less';

const cx = classNames.bind(styles);

const SpaceModelManage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const { userInfo } = useModel('userInfo');

  const [componentList, setComponentList] = useState<ComponentInfo[]>([]);
  const componentAllRef = useRef<ComponentInfo[]>([]);
  const [openModel, setOpenModel] = useState(false);
  const [modelComponentInfo, setModelComponentInfo] =
    useState<ComponentInfo | null>(null);
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
    let _list = list.filter((item) => item.type === ComponentTypeEnum.Model);
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

  const { run: runModelDel } = useRequest(apiModelDelete, {
    manual: true,
    onSuccess: (_: null, p: number[]) => {
      message.success(dict('PC.Pages.SpaceLibrary.Index.modelDeleteSuccess'));
      handleDel(p[0]);
    },
  });

  const handleClickComponent = (item: ComponentInfo) => {
    setModelComponentInfo(item);
    setOpenModel(true);
  };

  const handleClickMore = (item: CustomPopoverItem, info: ComponentInfo) => {
    const { action } = item as unknown as { action: ApplicationMoreActionEnum };
    if (action === ApplicationMoreActionEnum.Del) {
      modalConfirm(
        dict('PC.Pages.SpaceLibrary.Index.confirmDeleteComponent'),
        info.name,
        () => {
          runModelDel(info.id);
          new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
        },
      );
    } else if (action === ApplicationMoreActionEnum.Export_Config) {
      exportConfigFile(info.id, AgentComponentTypeEnum.Model);
    }
  };

  const handleConfirmModel = () => {
    setOpenModel(false);
    runComponent(spaceId);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <div className={cx(styles['header-area'])}>
        <div className={cx(styles['header-left'])}>
          <h3 className={cx(styles.title)}>
            {dict('PC.Pages.SpaceModelManage.pageTitle')}
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setModelComponentInfo(null);
              setOpenModel(true);
            }}
          >
            {dict('PC.Pages.SpaceLibrary.Index.addComponent')}
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

      <ConditionRender condition={openModel}>
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

export default SpaceModelManage;

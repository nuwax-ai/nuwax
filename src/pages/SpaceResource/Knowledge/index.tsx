import ButtonToggle from '@/components/ButtonToggle';
import CreateKnowledge from '@/components/CreateKnowledge';
import Loading from '@/components/custom/Loading';
import { CREATE_LIST, FILTER_STATUS } from '@/constants/space.constants';
import { dict } from '@/services/i18nRuntime';
import { apiKnowledgeConfigDelete } from '@/services/knowledge';
import { apiComponentList } from '@/services/library';
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
import { jumpTo } from '@/utils/router';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest, useSearchParams } from 'umi';
import ComponentItem from '../../SpaceLibrary/ComponentItem';
import styles from '../styles/resource-list.less';

const cx = classNames.bind(styles);

const ALLOWED_TYPES = new Set([ComponentTypeEnum.Knowledge]);

const SpaceKnowledge: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const { userInfo } = useModel('userInfo');

  const [componentList, setComponentList] = useState<ComponentInfo[]>([]);
  const componentAllRef = useRef<ComponentInfo[]>([]);
  const [openKnowledge, setOpenKnowledge] = useState(false);
  const [loading, setLoading] = useState(false);

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
    filterStatus: FilterStatusEnum,
    filterCreate: CreateListEnum,
    filterKeyword: string,
    list = componentAllRef.current,
  ) => {
    let _list = list.filter((item) =>
      ALLOWED_TYPES.has(item.type as ComponentTypeEnum),
    );
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
    const s = Number(searchParams.get('status')) || FilterStatusEnum.All;
    const c = Number(searchParams.get('create')) || CreateListEnum.All_Person;
    const k = searchParams.get('keyword') || '';
    setStatus(s);
    setCreate(c);
    setKeyword(k);
    handleFilterList(s, c, k);
  }, [searchParams]);

  const { run: runComponent } = useRequest(apiComponentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ComponentInfo[]) => {
      componentAllRef.current = result;
      handleFilterList(status, create, keyword, result);
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

  const handleClickComponent = (item: ComponentInfo) => {
    const { type, id, spaceId } = item;
    if (type === ComponentTypeEnum.Knowledge) {
      jumpTo(`/space/${spaceId}/knowledge/${id}`);
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
          new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
        },
      );
    }
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <div className={cx(styles['header-area'])}>
        <div className={cx(styles['header-left'])}>
          <h3 className={cx(styles.title)}>
            {dict('PC.Common.Global.knowledge')}
          </h3>
          <ButtonToggle
            options={CREATE_LIST}
            value={create}
            onChange={(v) => {
              const _v = v as CreateListEnum;
              setCreate(_v);
              handleFilterList(status, _v, keyword);
              handleChange('create', _v.toString());
            }}
          />
          <ButtonToggle
            options={FILTER_STATUS}
            value={status}
            onChange={(v) => {
              const _v = v as FilterStatusEnum;
              setStatus(_v);
              handleFilterList(_v, create, keyword);
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
              handleFilterList(status, create, k);
              handleChange('keyword', k);
            }}
            prefix={<SearchOutlined />}
            allowClear
            onClear={() => {
              setKeyword('');
              handleFilterList(status, create, '');
            }}
            style={{ width: 214 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpenKnowledge(true)}
          >
            {dict('PC.Components.CreateKnowledge.createTitle')}
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

      <CreateKnowledge
        spaceId={spaceId}
        open={openKnowledge}
        onCancel={() => setOpenKnowledge(false)}
      />
    </div>
  );
};

export default SpaceKnowledge;

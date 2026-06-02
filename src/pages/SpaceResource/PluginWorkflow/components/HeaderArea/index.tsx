import ButtonToggle from '@/components/ButtonToggle';
import CustomPopover from '@/components/CustomPopover';
import UploadImportConfig from '@/components/UploadImportConfig';
import SelectList from '@/components/custom/SelectList';
import {
  CREATE_LIST,
  FILTER_STATUS,
  PLUGIN_WORKFLOW_RESOURCE,
  PLUGIN_WORKFLOW_TYPE,
} from '@/constants/space.constants';
import { dict } from '@/services/i18nRuntime';
import {
  ComponentTypeEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useSearchParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface HeaderAreaProps {
  spaceId: number;
  onFilterChange: (
    type: ComponentTypeEnum,
    status: FilterStatusEnum,
    create: CreateListEnum,
    keyword: string,
  ) => void;
  onUploadSuccess: () => void;
  onOpenWorkflow: () => void;
  onOpenPlugin: () => void;
}

const HeaderArea: React.FC<HeaderAreaProps> = ({
  spaceId,
  onFilterChange,
  onUploadSuccess,
  onOpenWorkflow,
  onOpenPlugin,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

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

  useEffect(() => {
    if (history.location.state) {
      setSearchParams(new URLSearchParams());
    }
  }, [history.location.state]);

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
    onFilterChange(t, s, c, k);
  }, [searchParams]);

  const handleClickPopoverItem = (item: CustomPopoverItem) => {
    if (item.value === ComponentTypeEnum.Workflow) onOpenWorkflow();
    else if (item.value === ComponentTypeEnum.Plugin) onOpenPlugin();
  };

  return (
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
            onFilterChange(_v, status, create, keyword);
            handleChange('type', _v);
          }}
        />
        <ButtonToggle
          options={CREATE_LIST}
          value={create}
          onChange={(v) => {
            const _v = v as CreateListEnum;
            setCreate(_v);
            onFilterChange(type, status, _v, keyword);
            handleChange('create', _v.toString());
          }}
        />
        <ButtonToggle
          options={FILTER_STATUS}
          value={status}
          onChange={(v) => {
            const _v = v as FilterStatusEnum;
            setStatus(_v);
            onFilterChange(type, _v, create, keyword);
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
            onFilterChange(type, status, create, k);
            handleChange('keyword', k);
          }}
          prefix={<SearchOutlined />}
          allowClear
          onClear={() => {
            setKeyword('');
            onFilterChange(type, status, create, '');
            handleChange('keyword', '');
          }}
          style={{ width: 214 }}
        />
        <UploadImportConfig
          spaceId={spaceId}
          onUploadSuccess={onUploadSuccess}
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
  );
};

export default HeaderArea;

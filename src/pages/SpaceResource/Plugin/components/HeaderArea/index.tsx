import ButtonToggle from '@/components/ButtonToggle';
import UploadImportConfig from '@/components/UploadImportConfig';
import { CREATE_LIST, FILTER_STATUS } from '@/constants/space.constants';
import { dict } from '@/services/i18nRuntime';
import {
  ComponentTypeEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface HeaderAreaProps {
  spaceId: number;
  selectedGroupType?: string;
  onFilterChange: (
    type: ComponentTypeEnum,
    status: FilterStatusEnum,
    create: CreateListEnum,
    keyword: string,
  ) => void;
  onUploadSuccess: () => void;
  onOpenPlugin: () => void;
}

const HeaderArea: React.FC<HeaderAreaProps> = ({
  spaceId,
  onFilterChange,
  onUploadSuccess,
  onOpenPlugin,
}) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [type, setType] = useState<ComponentTypeEnum>(ComponentTypeEnum.Plugin);
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
    if (location.state) {
      setSearchParams(new URLSearchParams());
    }
  }, [location.state]);

  useEffect(() => {
    const t = ComponentTypeEnum.Plugin;
    const s = Number(searchParams.get('status')) || FilterStatusEnum.All;
    const c = Number(searchParams.get('create')) || CreateListEnum.All_Person;
    const k = searchParams.get('keyword') || '';
    setType(t);
    setStatus(s);
    setCreate(c);
    setKeyword(k);
    onFilterChange(t, s, c, k);
  }, [searchParams]);

  return (
    <div className={cx(styles['header-area'])}>
      <div className={cx(styles['header-left'])}>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={onOpenPlugin}>
          {dict('PC.Pages.AgentArrangeConfig.addPlugin')}
        </Button>
      </div>
    </div>
  );
};

export default HeaderArea;

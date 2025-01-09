import SelectList from '@/components/SelectList';
import { CREATE_LIST, FILTER_STATUS } from '@/constants/space.contants';
import ApplicationItem from '@/pages/Space/ApplicationItem';
import { CreateListEnum, FilterStatusEnum } from '@/types/enums/space';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const Space: React.FC = () => {
  const [status, setStatus] = useState<FilterStatusEnum>(FilterStatusEnum.All);
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );
  const handleChangeStatus = (value: FilterStatusEnum) => {
    setStatus(value);
  };

  const handleChangeCreate = (value: CreateListEnum) => {
    setCreate(value);
  };

  return (
    <div className={cx(styles.container, 'h-full')}>
      <div className={cx('flex', 'content-between')}>
        <h3 className={cx(styles.title)}>应用开发</h3>
        <Button type="primary" icon={<PlusOutlined />}>
          创建智能体
        </Button>
      </div>
      <div className={cx('flex', styles['select-search-area'])}>
        <SelectList
          value={status}
          options={FILTER_STATUS}
          onChange={handleChangeStatus}
        />
        <SelectList
          value={create}
          options={CREATE_LIST}
          onChange={handleChangeCreate}
        />
        <Input
          rootClassName={cx(styles.input)}
          placeholder="搜索智能体"
          prefix={<SearchOutlined />}
        />
      </div>
      <div className={cx(styles['main-container'])}>
        <ApplicationItem />
        <ApplicationItem />
        <ApplicationItem />
        <ApplicationItem />
        <ApplicationItem />
        <ApplicationItem />
        <ApplicationItem />
        <ApplicationItem />
        <ApplicationItem />
        <ApplicationItem />
      </div>
    </div>
  );
};

export default Space;

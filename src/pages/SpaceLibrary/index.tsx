import AnalyzeStatistics from '@/components/AnalyzeStatistics';
import SelectList from '@/components/SelectList';
import {
  CREATE_LIST,
  FILTER_STATUS,
  LIBRARY_ALL_TYPE,
} from '@/constants/space.contants';
import { ComponentMoreActionEnum } from '@/types/enums/library';
import {
  CreateListEnum,
  FilterStatusEnum,
  LibraryAllTypeEnum,
} from '@/types/enums/space';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import ComponentItem from './ComponentItem';
import styles from './index.less';

const cx = classNames.bind(styles);

const SpaceLibrary: React.FC = () => {
  // 打开分析弹窗
  const [openAnalyze, setOpenAnalyze] = useState<boolean>(false);
  // 打开创建组件弹窗
  const [openCreateComponent, setOpenCreateComponent] =
    useState<boolean>(false);
  const [type, setType] = useState<LibraryAllTypeEnum>(
    LibraryAllTypeEnum.All_Type,
  );
  const [status, setStatus] = useState<FilterStatusEnum>(FilterStatusEnum.All);
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );

  console.log(openCreateComponent);

  const handlerChangeType = (value: LibraryAllTypeEnum) => {
    setType(value);
  };

  const handlerChangeStatus = (value: FilterStatusEnum) => {
    setStatus(value);
  };

  const handlerChangeCreate = (value: CreateListEnum) => {
    setCreate(value);
  };

  // 点击更多操作
  const handleClickMore = (type: ComponentMoreActionEnum) => {
    console.log(type);
    switch (type) {
      case ComponentMoreActionEnum.Copy:
        break;
      case ComponentMoreActionEnum.Statistics:
        setOpenAnalyze(true);
        break;
      case ComponentMoreActionEnum.Del:
        break;
    }
  };

  const analyzeList = [
    {
      label: '智能体引用数',
      value: '2324',
    },
    {
      label: '调用次数',
      value: '12334',
    },
    {
      label: '平均响应时长（毫秒）',
      value: '1322',
    },
    {
      label: '调用成功率',
      value: '99.8%',
    },
  ];

  return (
    <div className={cx(styles.container, 'h-full')}>
      <div className={cx('flex', 'content-between')}>
        <h3 className={cx(styles.title)}>组件库</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpenCreateComponent(true)}
        >
          组件
        </Button>
      </div>
      <div className={cx('flex', styles['select-search-area'])}>
        <SelectList
          value={type}
          options={LIBRARY_ALL_TYPE}
          onChange={handlerChangeType}
        />
        <SelectList
          value={create}
          options={CREATE_LIST}
          onChange={handlerChangeCreate}
        />
        <SelectList
          value={status}
          options={FILTER_STATUS}
          onChange={handlerChangeStatus}
        />
        <Input
          rootClassName={cx(styles.input)}
          placeholder="搜索组件"
          prefix={<SearchOutlined />}
        />
      </div>
      <div className={cx(styles['main-container'])}>
        <ComponentItem
          title={'这里是插件的名字'}
          desc={'这里是更多的详细的插件描述信息'}
          img={
            'https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon1.png?lk3s=ca44e09c&x-expires=1737538782&x-signature=%2B2KWOCHgi5KfBHYzusAUEH8VTis%3D'
          }
          onClickMore={handleClickMore}
        />
      </div>
      <AnalyzeStatistics
        open={openAnalyze}
        onCancel={() => setOpenAnalyze(false)}
        title="统计概览"
        list={analyzeList}
      />
    </div>
  );
};

export default SpaceLibrary;

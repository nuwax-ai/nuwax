import AnalyzeStatistics from '@/components/AnalyzeStatistics';
import CustomPopover from '@/components/CustomPopover';
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
import { CustomPopoverItem } from '@/types/interfaces/common';
import { history } from '@@/core/history';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import ComponentItem from './ComponentItem';
import CreateNewPlugin from './CreateNewPlugin';
import styles from './index.less';

const cx = classNames.bind(styles);

const SpaceLibrary: React.FC = () => {
  // 新建插件弹窗
  const [openPlugin, setOpenPlugin] = useState<boolean>(false);
  // 打开分析弹窗
  const [openAnalyze, setOpenAnalyze] = useState<boolean>(false);
  const [type, setType] = useState<LibraryAllTypeEnum>(
    LibraryAllTypeEnum.All_Type,
  );
  const [status, setStatus] = useState<FilterStatusEnum>(FilterStatusEnum.All);
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );

  const handlerChangeType = (value: LibraryAllTypeEnum) => {
    setType(value);
  };

  const handlerChangeStatus = (value: FilterStatusEnum) => {
    setStatus(value);
  };

  const handlerChangeCreate = (value: CreateListEnum) => {
    setCreate(value);
  };

  // 点击添加资源
  const handleClickPopoverItem = (item) => {
    const { value: type } = item;
    switch (type as LibraryAllTypeEnum) {
      case LibraryAllTypeEnum.Workflow:
        break;
      case LibraryAllTypeEnum.Plugin:
        setOpenPlugin(true);
        break;
      case LibraryAllTypeEnum.Knowledge:
        break;
      case LibraryAllTypeEnum.DataBase:
        break;
      case LibraryAllTypeEnum.Model:
        break;
    }
  };

  // 点击更多操作
  const handleClickMore = (item: CustomPopoverItem) => {
    const { type } = item;
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

  // 点击单个资源组件 todo 需根据组件类型，跳转到不同页面
  const handleClickComponent = () => {
    history.push('/space/1101010/plugin/15115');
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
        {/*添加资源*/}
        <CustomPopover list={LIBRARY_ALL_TYPE} onClick={handleClickPopoverItem}>
          <Button type="primary" icon={<PlusOutlined />}>
            组件
          </Button>
        </CustomPopover>
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
          onClick={handleClickComponent}
          onClickMore={handleClickMore}
        />
        <ComponentItem
          title={'这里是插件的名字'}
          desc={'这里是更多的详细的插件描述信息'}
          img={
            'https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon1.png?lk3s=ca44e09c&x-expires=1737538782&x-signature=%2B2KWOCHgi5KfBHYzusAUEH8VTis%3D'
          }
          onClick={handleClickComponent}
          onClickMore={handleClickMore}
        />
        <ComponentItem
          title={'这里是插件的名字'}
          desc={'这里是更多的详细的插件描述信息'}
          img={
            'https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon1.png?lk3s=ca44e09c&x-expires=1737538782&x-signature=%2B2KWOCHgi5KfBHYzusAUEH8VTis%3D'
          }
          onClick={handleClickComponent}
          onClickMore={handleClickMore}
        />
        <ComponentItem
          title={'这里是插件的名字'}
          desc={'这里是更多的详细的插件描述信息'}
          img={
            'https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon1.png?lk3s=ca44e09c&x-expires=1737538782&x-signature=%2B2KWOCHgi5KfBHYzusAUEH8VTis%3D'
          }
          onClick={handleClickComponent}
          onClickMore={handleClickMore}
        />
        <ComponentItem
          title={'这里是插件的名字'}
          desc={'这里是更多的详细的插件描述信息'}
          img={
            'https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon1.png?lk3s=ca44e09c&x-expires=1737538782&x-signature=%2B2KWOCHgi5KfBHYzusAUEH8VTis%3D'
          }
          onClick={handleClickComponent}
          onClickMore={handleClickMore}
        />
      </div>
      {/*统计概览*/}
      <AnalyzeStatistics
        open={openAnalyze}
        onCancel={() => setOpenAnalyze(false)}
        title="统计概览"
        list={analyzeList}
      />
      {/*新建插件弹窗*/}
      <CreateNewPlugin
        open={openPlugin}
        onCancel={() => setOpenPlugin(false)}
      />
    </div>
  );
};

export default SpaceLibrary;

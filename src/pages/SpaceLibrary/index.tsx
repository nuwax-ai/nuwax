import AnalyzeStatistics from '@/components/AnalyzeStatistics';
import CreateKnowledge from '@/components/CreateKnowledge';
import CreateNewPlugin from '@/components/CreateNewPlugin';
import CreateWorkflow from '@/components/CreateWorkflow';
import CustomPopover from '@/components/CustomPopover';
import SelectList from '@/components/SelectList';
import { SPACE_ID } from '@/constants/home.constants';
import {
  CREATE_LIST,
  FILTER_STATUS,
  LIBRARY_ALL_RESOURCE,
  LIBRARY_ALL_TYPE,
} from '@/constants/space.contants';
import { ComponentMoreActionEnum } from '@/types/enums/library';
import {
  CreateListEnum,
  FilterStatusEnum,
  LibraryAllTypeEnum,
} from '@/types/enums/space';
import { CustomPopoverItem } from '@/types/interfaces/common';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history } from 'umi';
import ComponentItem from './ComponentItem';
import CreateModel from './CreateModel';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 工作空间 - 组件库
 */
const SpaceLibrary: React.FC = () => {
  // 新建工作流弹窗
  const [openWorkflow, setOpenWorkflow] = useState<boolean>(false);
  // 新建插件弹窗
  const [openPlugin, setOpenPlugin] = useState<boolean>(false);
  // 打开分析弹窗
  const [openAnalyze, setOpenAnalyze] = useState<boolean>(false);
  // 打开创建知识库弹窗
  const [openKnowledge, setOpenKnowledge] = useState<boolean>(false);
  // 打开创建模型弹窗
  const [openModel, setOpenModel] = useState<boolean>(false);
  const [type, setType] = useState<LibraryAllTypeEnum>(
    LibraryAllTypeEnum.All_Type,
  );
  const [status, setStatus] = useState<FilterStatusEnum>(FilterStatusEnum.All);
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );
  const spaceId = localStorage.getItem(SPACE_ID);

  useEffect(() => {
    const unlisten = history.listen(({ location }) => {
      console.log(location.pathname);
    });

    return () => {
      unlisten();
    };
  }, []);

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
        setOpenWorkflow(true);
        break;
      case LibraryAllTypeEnum.Plugin:
        setOpenPlugin(true);
        break;
      case LibraryAllTypeEnum.Knowledge:
        setOpenKnowledge(true);
        break;
      case LibraryAllTypeEnum.Database:
        message.warning('数据库此版本暂时未做');
        break;
      case LibraryAllTypeEnum.Model:
        setOpenModel(true);
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
    // history.push('/space/1101010/plugin/15115');
    history.push('/space/1101010/plugin/15115/cloud-tool');
  };

  const handleCancelCreateKnowledge = () => {
    setOpenKnowledge(false);
    history.push('/space/1101010/knowledge/15115');
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
        <CustomPopover
          list={LIBRARY_ALL_RESOURCE}
          onClick={handleClickPopoverItem}
        >
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
          onClick={handleClickComponent}
          onClickMore={handleClickMore}
        />
        <ComponentItem
          type={LibraryAllTypeEnum.Database}
          title={'这里是插件的名字'}
          desc={'这里是更多的详细的插件描述信息'}
          onClick={handleClickComponent}
          onClickMore={handleClickMore}
        />
        <ComponentItem
          title={'这里是插件的名字'}
          desc={'这里是更多的详细的插件描述信息'}
          onClick={handleClickComponent}
          onClickMore={handleClickMore}
        />
        <ComponentItem
          type={LibraryAllTypeEnum.Workflow}
          title={'这里是插件的名字'}
          desc={'这里是更多的详细的插件描述信息'}
          onClick={handleClickComponent}
          onClickMore={handleClickMore}
        />
        <ComponentItem
          type={LibraryAllTypeEnum.Knowledge}
          title={'这里是插件的名字'}
          desc={'这里是更多的详细的插件描述信息'}
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
      {/*创建知识库弹窗*/}
      <CreateKnowledge
        open={openKnowledge}
        onCancel={handleCancelCreateKnowledge}
        onConfirm={() => setOpenKnowledge(false)}
      />
      {/*创建工作流*/}
      <CreateWorkflow
        spaceId={spaceId}
        open={openWorkflow}
        onCancel={() => setOpenWorkflow(false)}
        onConfirm={() => setOpenWorkflow(false)}
      />
      {/*创建模型*/}
      <CreateModel
        open={openModel}
        onCancel={() => setOpenModel(false)}
        onConfirm={() => setOpenModel(false)}
      />
    </div>
  );
};

export default SpaceLibrary;

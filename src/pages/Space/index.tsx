import CreateAgent from '@/components/CreateAgent';
import SelectList from '@/components/SelectList';
import { CREATE_LIST, FILTER_STATUS } from '@/constants/space.contants';
import {
  ApplicationMoreActionEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { history } from 'umi';
import AgentAnalyze from './AgentAnalyze';
import AgentMove from './AgentMove';
import ApplicationItem from './ApplicationItem';
import styles from './index.less';

const cx = classNames.bind(styles);

const Space: React.FC = () => {
  // 打开分析弹窗
  const [openAnalyze, setOpenAnalyze] = useState<boolean>(false);
  // 迁移弹窗
  const [openMove, setOpenMove] = useState<boolean>(false);
  const [openCreateAgent, setOpenCreateAgent] = useState<boolean>(false);
  const [status, setStatus] = useState<FilterStatusEnum>(FilterStatusEnum.All);
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );

  const handlerChangeStatus = (value: FilterStatusEnum) => {
    setStatus(value);
  };

  const handlerChangeCreate = (value: CreateListEnum) => {
    setCreate(value);
  };

  const handlerConfirmMove = () => {
    setOpenMove(false);
  };

  // 点击更多操作
  const handlerClickMore = (type: ApplicationMoreActionEnum) => {
    console.log(type);
    switch (type) {
      case ApplicationMoreActionEnum.Analyze:
        setOpenAnalyze(true);
        break;
      // 创建副本
      case ApplicationMoreActionEnum.Create_Copy:
        message.success('智能体已复制');
        break;
      case ApplicationMoreActionEnum.Move:
        setOpenMove(true);
        break;
      case ApplicationMoreActionEnum.Del:
        break;
    }
  };

  const handlerConfirmCreateAgent = () => {
    setOpenCreateAgent(false);
    const agentId = '10101010';
    history.push(`/edit-agent?agent_id=${agentId}`);
  };

  return (
    <div className={cx(styles.container, 'h-full')}>
      <div className={cx('flex', 'content-between')}>
        <h3 className={cx(styles.title)}>应用开发</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpenCreateAgent(true)}
        >
          创建智能体
        </Button>
      </div>
      <div className={cx('flex', styles['select-search-area'])}>
        <SelectList
          value={status}
          options={FILTER_STATUS}
          onChange={handlerChangeStatus}
        />
        <SelectList
          value={create}
          options={CREATE_LIST}
          onChange={handlerChangeCreate}
        />
        <Input
          rootClassName={cx(styles.input)}
          placeholder="搜索智能体"
          prefix={<SearchOutlined />}
        />
      </div>
      <div className={cx(styles['main-container'])}>
        <ApplicationItem onClickMore={handlerClickMore} />
        <ApplicationItem onClickMore={handlerClickMore} />
        <ApplicationItem onClickMore={handlerClickMore} />
        <ApplicationItem onClickMore={handlerClickMore} />
        <ApplicationItem onClickMore={handlerClickMore} />
        <ApplicationItem onClickMore={handlerClickMore} />
        <ApplicationItem onClickMore={handlerClickMore} />
        <ApplicationItem onClickMore={handlerClickMore} />
        <ApplicationItem onClickMore={handlerClickMore} />
        <ApplicationItem onClickMore={handlerClickMore} />
      </div>
      <AgentAnalyze open={openAnalyze} onCancel={() => setOpenAnalyze(false)} />
      <AgentMove
        open={openMove}
        title={'智能体名称'}
        onCancel={() => setOpenMove(false)}
        onConfirm={handlerConfirmMove}
      />
      <CreateAgent
        open={openCreateAgent}
        onCancel={() => setOpenCreateAgent(false)}
        onConfirm={handlerConfirmCreateAgent}
      />
    </div>
  );
};

export default Space;

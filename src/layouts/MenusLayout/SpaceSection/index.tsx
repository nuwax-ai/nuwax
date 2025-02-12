import personal from '@/assets/images/personal.png';
import { SPACE_ID } from '@/constants/home.constants';
import { SPACE_APPLICATION_LIST } from '@/constants/space.contants';
import { apiUserDevCollectAgentList } from '@/services/agentDev';
import { SpaceApplicationListEnum } from '@/types/enums/space';
import type { AgentInfo } from '@/types/interfaces/agent';
import type {
  CreateSpaceTeamParams,
  SpaceInfo,
} from '@/types/interfaces/workspace';
import { DownOutlined } from '@ant-design/icons';
import { message, Popover } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useModel, useRequest } from 'umi';
import CreateNewTeam from './CreateNewTeam';
import styles from './index.less';
import PersonalSpaceContent from './PersonalSpaceContent';

const cx = classNames.bind(styles);

const SpaceSection: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [devCollectAgentList, setDevCollectAgentList] = useState<AgentInfo[]>(
    [],
  );
  const { spaceList, setSpaceList } = useModel('spaceModel');

  // 查询用户开发智能体收藏列表
  const { run } = useRequest(apiUserDevCollectAgentList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: AgentInfo[]) => {
      setDevCollectAgentList(result);
    },
  });

  useEffect(() => {
    run({
      page: 1,
      size: 10,
    });
  }, []);

  const handlerApplication = (type: SpaceApplicationListEnum) => {
    const spaceId = localStorage.getItem(SPACE_ID);
    switch (type) {
      // 应用开发
      case SpaceApplicationListEnum.Application_Develop:
        history.push(`/space/${spaceId}/develop`);
        break;
      // 组件库
      case SpaceApplicationListEnum.Component_Library:
        history.push(`/space/${spaceId}/library`);
        break;
      // 团队设置
      case SpaceApplicationListEnum.Team_Setting:
        message.warning('团队设置此版本待完善');
        break;
    }
  };

  // 点击开发收藏的智能体
  const handleDevCollect = (agentId: string) => {
    history.push(`/edit-agent?agent_id=${agentId}`);
  };

  const showModal = () => {
    setOpen(false);
    setOpenModal(true);
  };

  const handleCancel = () => {
    setOpenModal(false);
  };

  const handleConfirm = (info: CreateSpaceTeamParams) => {
    const list = [...spaceList, info] as SpaceInfo[];
    setSpaceList(list);
    setOpenModal(false);
  };

  return (
    <div className={cx('h-full', 'px-6', 'py-16', 'overflow-y')}>
      <Popover
        placement="bottomLeft"
        open={open}
        trigger="click"
        arrow={false}
        onOpenChange={setOpen}
        content={
          <PersonalSpaceContent
            spaceList={spaceList}
            onCreateTeam={showModal}
          />
        }
      >
        <div
          className={cx(
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
            'px-6',
            styles.header,
          )}
        >
          <img
            className={cx(styles.img, 'radius-6')}
            src={personal as string}
            alt=""
          />
          <span className={cx('flex-1', styles.title)}>个人空间</span>
          <DownOutlined className={cx(styles['icon-down'])} />
        </div>
      </Popover>
      <ul>
        {SPACE_APPLICATION_LIST.map((item) => (
          <li
            key={item.type}
            onClick={() => handlerApplication(item.type)}
            className={cx(
              styles['space-item'],
              'hover-box',
              'flex',
              'items-center',
              'cursor-pointer',
            )}
          >
            {item.icon}
            <span className={cx(styles.text)}>{item.text}</span>
          </li>
        ))}
      </ul>
      <h3 className={cx(styles['collection-title'])}>开发收藏</h3>
      {devCollectAgentList?.length > 0 ? (
        <ul>
          {devCollectAgentList?.map((item) => (
            <li
              key={item.id}
              onClick={() => handleDevCollect(item.agentId)}
              className={cx(
                styles.row,
                'flex',
                'items-center',
                'cursor-pointer',
                'hover-box',
              )}
            >
              <img src={item.icon} alt="" />
              <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
                {item.name}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className={cx(styles['no-dev-collect'])}>还没有收藏任何内容</div>
          <div className={cx(styles['no-dev-collect'])}>
            点击⭐️按钮可将内容添加到这里~
          </div>
        </>
      )}
      {/*创建新团队*/}
      <CreateNewTeam
        open={openModal}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default SpaceSection;

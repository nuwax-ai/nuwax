import personal from '@/assets/images/personal.png';
import { SPACE_ID } from '@/constants/home.constants';
import { SPACE_APPLICATION_LIST } from '@/constants/space.contants';
import { apiSpaceList } from '@/services/workspace';
import { SpaceApplicationListEnum } from '@/types/enums/space';
import type {
  CreateSpaceTeamParams,
  SpaceInfo,
} from '@/types/interfaces/workspace';
import { useRequest } from '@@/exports';
import { DownOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history } from 'umi';
import CreateNewTeam from './CreateNewTeam';
import styles from './index.less';
import PersonalSpaceContent from './PersonalSpaceContent';

const cx = classNames.bind(styles);

const SpaceSection: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [spaceList, setSpaceList] = useState<SpaceInfo[]>([]);

  const spaceId = localStorage.getItem(SPACE_ID);
  const handlerApplication = (type: SpaceApplicationListEnum) => {
    console.log(type);
    switch (type) {
      case SpaceApplicationListEnum.Application_Develop:
        history.push(`/space/${spaceId}/develop`);
        break;
      case SpaceApplicationListEnum.Component_Library:
        history.push(`/space/${spaceId}/library`);
        break;
      case SpaceApplicationListEnum.Team_Setting:
        break;
    }
  };

  // 查询用户空间列表
  const { run } = useRequest(apiSpaceList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: SpaceInfo[]) => {
      setSpaceList(result || []);
    },
  });

  useEffect(() => {
    run();
  }, []);

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
      <ul>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736495925&x-signature=Cep9yaOi9FW4Y14KmEY9u366780%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736495925&x-signature=Cep9yaOi9FW4Y14KmEY9u366780%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736495925&x-signature=Cep9yaOi9FW4Y14KmEY9u366780%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
      </ul>
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

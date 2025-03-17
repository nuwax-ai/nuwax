import personal from '@/assets/images/personal.png';
import type {
  SpaceInfo,
  UpdateSpaceTeamParams,
} from '@/types/interfaces/workspace';
import { DownOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useModel } from 'umi';
import CreateNewTeam from './CreateNewTeam';
import styles from './index.less';
import PersonalSpaceContent from './PersonalSpaceContent';

const cx = classNames.bind(styles);

/**
 * Popover弹窗-空间主题
 */
const SpaceTitle: React.FC = () => {
  const { spaceList, setSpaceList, currentSpaceInfo } = useModel('spaceModel');
  const [open, setOpen] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);

  const showModal = () => {
    setOpen(false);
    setOpenModal(true);
  };

  const handleCancel = () => {
    setOpenModal(false);
  };

  const handleConfirm = (info: UpdateSpaceTeamParams) => {
    const list = [...spaceList, info] as SpaceInfo[];
    setSpaceList(list);
    setOpenModal(false);
  };

  return (
    <>
      <Popover
        placement="bottomLeft"
        open={open}
        trigger="click"
        arrow={false}
        onOpenChange={setOpen}
        content={
          <PersonalSpaceContent
            onCreateTeam={showModal}
            onClosePopover={setOpen}
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
            src={currentSpaceInfo?.icon || (personal as string)}
            alt=""
          />
          <span className={cx('flex-1', styles.title)}>
            {currentSpaceInfo?.name || '个人空间'}
          </span>
          <DownOutlined className={cx(styles['icon-down'])} />
        </div>
      </Popover>
      {/*创建新团队*/}
      <CreateNewTeam
        open={openModal}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default SpaceTitle;

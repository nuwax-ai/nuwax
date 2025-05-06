import { DownOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import CreateNewTeam from './CreateNewTeam';
import styles from './index.less';
import PersonalSpaceContent from './PersonalSpaceContent';

const cx = classNames.bind(styles);

interface SpaceTitleProps {
  className?: string;
  name: string;
  avatar: string;
}

/**
 * Popover弹窗-空间主题
 */
const SpaceTitle: React.FC<SpaceTitleProps> = ({ name, avatar }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);

  const showModal = () => {
    setOpen(false);
    setOpenModal(true);
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
          <span className={cx(styles['img-box'])}>
            <img src={avatar} alt="" />
          </span>
          <span className={cx('flex-1', styles.title, 'text-ellipsis')}>
            {name || '个人空间'}
          </span>
          <DownOutlined className={cx(styles['icon-down'])} />
        </div>
      </Popover>
      {/*创建新团队*/}
      <CreateNewTeam open={openModal} onCancel={() => setOpenModal(false)} />
    </>
  );
};

export default SpaceTitle;

import { SvgIcon } from '@/components/base';
import { Popover, Typography } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import CreateNewTeam from './CreateNewTeam';
import styles from './index.less';
import PersonalSpaceContent from './PersonalSpaceContent';

const cx = classNames.bind(styles);

interface SpaceTitleProps {
  className?: string;
  name: string;
}

/**
 * Popover弹窗-空间主题
 */
const SpaceTitle: React.FC<SpaceTitleProps> = ({ name }) => {
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
            styles.header,
          )}
        >
          <div className={cx('flex-1', 'text-ellipsis')}>
            <Typography.Title
              level={5}
              style={{ marginBottom: 0 }}
              ellipsis={{ rows: 1, expandable: false, symbol: '...' }}
            >
              {name || '个人空间'}
            </Typography.Title>
          </div>
          <SvgIcon name="icons-common-caret_down" rotate={open ? 180 : 0} />
        </div>
      </Popover>
      {/*创建团队空间*/}
      <CreateNewTeam open={openModal} onCancel={() => setOpenModal(false)} />
    </>
  );
};

export default SpaceTitle;

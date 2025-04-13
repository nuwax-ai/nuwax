import agentImage from '@/assets/images/agent_image.png';
import { SPACE_ID } from '@/constants/home.constants';
import type { AgentMoveProps } from '@/types/interfaces/space';
import { CheckOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 智能体迁移
 */
const AgentMove: React.FC<AgentMoveProps> = ({
  open,
  title,
  onCancel,
  onConfirm,
}) => {
  const [targetSpaceId, setTargetSpaceId] = useState<string>('');
  const { spaceList } = useModel('spaceModel');
  const spaceId = Number(localStorage.getItem(SPACE_ID));

  const filterSpaceList =
    spaceList?.filter((item) => item.id !== spaceId) || [];

  return (
    <Modal
      open={open}
      destroyOnClose
      onCancel={onCancel}
      title={
        <header>
          <span className={cx('text-ellipsis')}>{`迁移智能体 - ${title}`}</span>
        </header>
      }
      footer={() => (
        <Button
          type="primary"
          block
          onClick={() => onConfirm(targetSpaceId)}
          disabled={!targetSpaceId}
        >
          迁移
        </Button>
      )}
      width={475}
    >
      <>
        <div className={cx(styles['row-line'])} />
        <span className={cx(styles.label)}>选择要迁移到的团队空间</span>
        {filterSpaceList.map((item) => (
          <div
            key={item.id}
            className={cx(
              'flex',
              'items-center',
              'hover-box',
              'cursor-pointer',
              styles.box,
            )}
            onClick={() => setTargetSpaceId(item.id)}
          >
            <img
              className={cx(styles.img)}
              src={item.icon || (agentImage as string)}
              alt=""
            />
            <span className={cx('flex-1')}>{item.name}</span>
            {targetSpaceId === item.id && (
              <CheckOutlined className={cx(styles['selected-ico'])} />
            )}
          </div>
        ))}
      </>
    </Modal>
  );
};

export default AgentMove;

import agentImage from '@/assets/images/agent_image.png';
import { RoleEnum } from '@/types/enums/common';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import type { AgentMoveProps } from '@/types/interfaces/space';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { CheckOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 智能体迁移
 */
const AgentMove: React.FC<AgentMoveProps> = ({
  spaceId,
  // 默认为迁移
  type = ApplicationMoreActionEnum.Move,
  open,
  title,
  onCancel,
  onConfirm,
}) => {
  const [targetSpaceId, setTargetSpaceId] = useState<string>('');
  const { spaceList } = useModel('spaceModel');

  const filterSpaceList = useMemo(() => {
    if (type === ApplicationMoreActionEnum.Move) {
      // 迁移
      return spaceList?.filter((item: SpaceInfo) => item.id !== spaceId) || [];
    } else {
      // 复制
      // 【空间创建者或空间管理员可复制到自己有权限的所有空间（这里涉及到会把关联的插件工作流一并发布到目标空间去），普通用户只能复制到本空间】
      // 找到当前空间的信息
      const currentSpace = spaceList.find(
        (item: SpaceInfo) => item.id === spaceId,
      );
      if (currentSpace?.currentUserRole === RoleEnum.User) {
        // 如果当前空间是普通用户
        return [currentSpace]; // 只显示当前空间
      }
      return spaceList;
    }
  }, [type, spaceId, spaceList]);

  return (
    <Modal
      open={open}
      destroyOnClose
      onCancel={onCancel}
      title={
        <header className={cx(styles.header, 'text-ellipsis')}>
          {`迁移智能体 - ${title}`}
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
        {filterSpaceList.map((item: SpaceInfo) => (
          <div
            key={item.id}
            className={cx(
              'flex',
              'items-center',
              'hover-box',
              'cursor-pointer',
              styles.box,
            )}
            onClick={() => setTargetSpaceId(item.id.toString())}
          >
            <img
              className={cx(styles.img)}
              src={item.icon || (agentImage as string)}
              alt=""
            />
            <span className={cx('flex-1')}>{item.name}</span>
            {targetSpaceId === item.id.toString() && (
              <CheckOutlined className={cx(styles['selected-ico'])} />
            )}
          </div>
        ))}
      </>
    </Modal>
  );
};

export default AgentMove;

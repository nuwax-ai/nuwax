import teamImage from '@/assets/images/team_image.png';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { RoleEnum } from '@/types/enums/common';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import { MoveCopyComponentProps } from '@/types/interfaces/common';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { CheckOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 智能体、插件、工作流等迁移和复制组件
 */
const MoveCopyComponent: React.FC<MoveCopyComponentProps> = ({
  spaceId,
  loading,
  // 默认为迁移
  type = ApplicationMoreActionEnum.Move,
  mode = AgentComponentTypeEnum.Agent,
  isTemplate = false,
  open,
  title,
  onCancel,
  onConfirm,
}) => {
  const [targetSpaceId, setTargetSpaceId] = useState<number>(0);
  const { spaceList } = useModel('spaceModel');
  // 迁移或复制的标题
  const actionText = type === ApplicationMoreActionEnum.Move ? '迁移' : '复制';
  // 组件类型
  const componentType =
    mode === AgentComponentTypeEnum.Agent
      ? '智能体'
      : mode === AgentComponentTypeEnum.Plugin
      ? '插件'
      : '工作流';

  const filterSpaceList = useMemo(() => {
    // 迁移
    if (type === ApplicationMoreActionEnum.Move) {
      return spaceList?.filter((item: SpaceInfo) => item.id !== spaceId) || [];
    }
    // 复制
    else {
      // 如果是模板，直接返回所有空间，否则根据当前空间的角色过滤
      if (isTemplate) {
        return spaceList || [];
      }
      // 非模板：【空间创建者或空间管理员可复制到自己有权限的所有空间（这里涉及到会把关联的插件工作流一并发布到目标空间去），普通用户只能复制到本空间】
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
  }, [type, spaceId, spaceList, isTemplate]);

  useEffect(() => {
    if (open) {
      setTargetSpaceId(0);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      destroyOnClose
      onCancel={onCancel}
      classNames={{
        content: cx(styles['modal-container']),
        body: styles['modal-body'],
      }}
      centered
      title={
        <header className={cx(styles.header, 'text-ellipsis')}>
          {`${actionText}${componentType} - ${title}`}
        </header>
      }
      footer={() => (
        <Button
          type="primary"
          block
          loading={loading}
          onClick={() => onConfirm(targetSpaceId)}
          disabled={!targetSpaceId}
        >
          {actionText}
        </Button>
      )}
    >
      <>
        <div className={cx(styles['row-line'])} />
        <span
          className={cx(styles.label)}
        >{`选择要${actionText}到的空间`}</span>
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
            onClick={() => setTargetSpaceId(item.id)}
          >
            <img
              className={cx(styles.img)}
              src={item.icon || (teamImage as string)}
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

export default MoveCopyComponent;

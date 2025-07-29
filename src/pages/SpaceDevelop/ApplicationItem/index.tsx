import CustomPopover from '@/components/CustomPopover';
import { APPLICATION_MORE_ACTION } from '@/constants/space.constants';
import { apiDevCollectAgent } from '@/services/agentDev';
import { PermissionsEnum } from '@/types/enums/common';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ApplicationItemProps } from '@/types/interfaces/space';
import { MoreOutlined, UserOutlined } from '@ant-design/icons';
import { message } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { useModel, useRequest } from 'umi';
import ApplicationHeader from './ApplicationHeader';
import CollectStar from './CollectStar';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个应用项
 */
const ApplicationItem: React.FC<ApplicationItemProps> = ({
  agentConfigInfo,
  onClick,
  onCollect,
  onClickMore,
}) => {
  const { runCancelCollect, runDevCollect } = useModel('devCollectAgent');

  // 开发智能体收藏
  const { run: runCollect } = useRequest(apiDevCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('收藏成功');
      // 更新开发智能体收藏列表
      runDevCollect({
        page: 1,
        size: 8,
      });
    },
  });

  // 提取权限检查逻辑
  const hasPermission = (permission: PermissionsEnum) => {
    return agentConfigInfo?.permissions?.includes(permission);
  };

  // 更多操作列表
  const actionList = useMemo(() => {
    return APPLICATION_MORE_ACTION.filter((item) => {
      const type = item.type as ApplicationMoreActionEnum;

      switch (type) {
        // 复制到空间
        case ApplicationMoreActionEnum.Copy_To_Space:
          return hasPermission(PermissionsEnum.Copy);
        // 临时会话
        case ApplicationMoreActionEnum.Temporary_Session:
          return hasPermission(PermissionsEnum.TempChat);
        // 迁移
        case ApplicationMoreActionEnum.Move:
          // 迁移操作：仅创建者和管理员展示
          return hasPermission(PermissionsEnum.Transfer);
        case ApplicationMoreActionEnum.Del:
          // 删除操作：只有空间创建者、空间管理员和智能体本身的创建者可删除
          return hasPermission(PermissionsEnum.Delete);
        case ApplicationMoreActionEnum.API_Key:
          // API Key操作：只有空间创建者、空间管理员和智能体本身的创建者可查看
          return hasPermission(PermissionsEnum.AgentApi);
        default:
          // 其他操作默认展示
          return true;
      }
    });
  }, [agentConfigInfo]);

  // 收藏、取消收藏事件
  const handlerCollect = async () => {
    const { id, devCollected } = agentConfigInfo;
    if (devCollected) {
      await runCancelCollect(id);
    } else {
      await runCollect(id);
    }
    onCollect(!devCollected);
  };

  // 点击更多操作
  const handlerClickMore = (item: CustomPopoverItem) => {
    const type = item.type as ApplicationMoreActionEnum;
    onClickMore(type);
  };

  return (
    <div
      className={cx(
        styles.container,
        'w-full',
        'px-16',
        'py-16',
        'radius-6',
        'flex',
        'flex-col',
        'content-between',
        'cursor-pointer',
      )}
      onClick={() => onClick(agentConfigInfo.id)}
    >
      {/*头部信息*/}
      <ApplicationHeader agentConfigInfo={agentConfigInfo} />
      {/*相关信息*/}
      <div className={cx('flex', styles['rel-info'])}>
        <span>最近编辑</span>
        <span>{dayjs(agentConfigInfo.modified).format('MM-DD HH:mm')}</span>
      </div>
      {/*底部*/}
      <footer className={cx(styles.footer, 'flex', 'items-center')}>
        <div className={cx('flex-1', 'flex', 'overflow-hide')}>
          <UserOutlined />
          <span className={cx('flex-1', 'text-ellipsis', styles.author)}>
            {agentConfigInfo.creator?.nickName ||
              agentConfigInfo.creator?.userName}
          </span>
        </div>
        {/*收藏与取消收藏*/}
        <CollectStar
          devCollected={agentConfigInfo.devCollected}
          onClick={handlerCollect}
        />
        {/*更多操作*/}
        <CustomPopover onClick={handlerClickMore} list={actionList}>
          <span
            className={cx(
              styles['icon-box'],
              'flex',
              'content-center',
              'items-center',
              'hover-box',
            )}
          >
            <MoreOutlined />
          </span>
        </CustomPopover>
      </footer>
    </div>
  );
};

export default ApplicationItem;

import agentImage from '@/assets/images/agent_image.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import CustomPopover from '@/components/CustomPopover';
import {
  ICON_MORE,
  ICON_STAR,
  ICON_STAR_FILL,
  ICON_SUCCESS,
} from '@/constants/images.constants';
import { APPLICATION_MORE_ACTION } from '@/constants/space.constants';
import { apiDevCollectAgent } from '@/services/agentDev';
import { PermissionsEnum, PublishStatusEnum } from '@/types/enums/common';
import { AgentTypeEnum, ApplicationMoreActionEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ApplicationItemProps } from '@/types/interfaces/space';
import { Button, message, Tag } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { useModel, useRequest } from 'umi';
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
        case ApplicationMoreActionEnum.Export_Config:
          // 导出配置操作：只有空间创建者、空间管理员和智能体本身的创建者可导出
          return hasPermission(PermissionsEnum.Export);
        default:
          // 其他操作默认展示
          return true;
      }
    });
  }, [agentConfigInfo]);

  // 收藏、取消收藏事件
  const handlerCollect = async (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();

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
    <CardWrapper
      title={agentConfigInfo.name}
      avatar={agentConfigInfo.creator?.avatar || ''}
      name={
        agentConfigInfo.creator?.nickName || agentConfigInfo.creator?.userName
      }
      content={agentConfigInfo.description}
      icon={agentConfigInfo.icon}
      defaultIcon={agentImage}
      onClick={() => onClick(agentConfigInfo.id)}
      extra={
        <>
          <span className={cx('text-ellipsis', 'flex-1')}>
            最近编辑 {dayjs(agentConfigInfo.modified).format('MM-DD HH:mm')}
          </span>
          {agentConfigInfo?.publishStatus === PublishStatusEnum.Published && (
            <span className={cx('flex', 'items-center', 'gap-4')}>
              <ICON_SUCCESS />
              已发布
            </span>
          )}
        </>
      }
      footer={
        <footer
          className={cx(
            styles.footer,
            'flex',
            'items-center',
            'content-between',
          )}
        >
          <div
            className={cx('flex', 'items-center', 'cursor-pointer', 'gap-10')}
          >
            {agentConfigInfo.type === AgentTypeEnum.TaskAgent ? (
              <Tag color="orange">任务型</Tag>
            ) : (
              <Tag color="green">问答型</Tag>
            )}
          </div>
          <div className={cx('flex', 'items-center', 'gap-10')}>
            <span onClick={handlerCollect}>
              {agentConfigInfo.devCollected ? (
                <ICON_STAR_FILL />
              ) : (
                <ICON_STAR />
              )}
            </span>
            {/*更多操作*/}
            <CustomPopover onClick={handlerClickMore} list={actionList}>
              <Button size="small" type="text" icon={<ICON_MORE />}></Button>
            </CustomPopover>
          </div>
        </footer>
      }
    />
  );
};

export default ApplicationItem;

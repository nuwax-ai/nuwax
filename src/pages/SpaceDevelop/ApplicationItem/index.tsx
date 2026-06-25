import agentImage from '@/assets/images/agent_image.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import CustomPopover from '@/components/CustomPopover';
import { AGENT_SUB_TYPE_OPTIONS } from '@/constants/agent.constants';
import { ICON_MORE, ICON_SUCCESS } from '@/constants/images.constants';
import { APPLICATION_MORE_ACTION } from '@/constants/space.constants';
import { dict } from '@/services/i18nRuntime';
import { PermissionsEnum, PublishStatusEnum } from '@/types/enums/common';
import {
  AgentSubTypeEnum,
  AgentTypeEnum,
  ApplicationMoreActionEnum,
} from '@/types/enums/space';
import type { AgentConfigInfo } from '@/types/interfaces/agent';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ApplicationItemProps } from '@/types/interfaces/space';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 子类型 Tag 颜色（与原先 type 展示风格对齐） */
const AGENT_SUB_TYPE_TAG_COLOR: Record<AgentSubTypeEnum, string> = {
  [AgentSubTypeEnum.ChatBot]: 'green',
  [AgentSubTypeEnum.General]: 'orange',
  [AgentSubTypeEnum.Custom]: 'gold',
  [AgentSubTypeEnum.Flow]: 'purple',
  [AgentSubTypeEnum.Group]: 'blue',
};

/** 无 subType 时按 type 兜底，兼容旧数据 */
const resolveAgentSubType = (
  agentConfigInfo: AgentConfigInfo,
): AgentSubTypeEnum | undefined => {
  if (agentConfigInfo.subType) {
    return agentConfigInfo.subType;
  }
  if (agentConfigInfo.type === AgentTypeEnum.TaskAgent) {
    return AgentSubTypeEnum.General;
  }
  if (agentConfigInfo.type === AgentTypeEnum.AgentFlow) {
    return AgentSubTypeEnum.Flow;
  }
  if (agentConfigInfo.type === AgentTypeEnum.ChatBot) {
    return AgentSubTypeEnum.ChatBot;
  }
  return undefined;
};

/**
 * 单个应用项
 */
const ApplicationItem: React.FC<ApplicationItemProps> = ({
  agentConfigInfo,
  onClick,
  onClickMore,
}) => {
  // 提取权限检查逻辑
  const hasPermission = (permission: PermissionsEnum) => {
    return agentConfigInfo?.permissions?.includes(permission);
  };

  // 更多操作列表
  const actionList = useMemo(() => {
    const list: CustomPopoverItem[] = APPLICATION_MORE_ACTION.filter((item) => {
      const type = item.type as ApplicationMoreActionEnum;

      switch (type) {
        // 复制到空间
        case ApplicationMoreActionEnum.Copy_To_Space:
          return hasPermission(PermissionsEnum.Copy);
        // 临时会话
        case ApplicationMoreActionEnum.Temporary_Session:
          return (
            hasPermission(PermissionsEnum.TempChat) &&
            agentConfigInfo.type !== AgentTypeEnum.TaskAgent &&
            agentConfigInfo.type !== AgentTypeEnum.AgentFlow
          );
        // 独立会话
        case ApplicationMoreActionEnum.Independent_Session:
          return agentConfigInfo?.publishStatus === PublishStatusEnum.Published;
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

    return list;
  }, [agentConfigInfo]);

  // 智能体子类型标签
  const subTypeTag = useMemo(() => {
    const subType = resolveAgentSubType(agentConfigInfo);
    // 如果子类型为空，则不显示标签
    if (!subType) {
      return null;
    }
    // 根据子类型获取标签
    const option = AGENT_SUB_TYPE_OPTIONS.find(
      (item) => item.value === subType,
    );
    if (!option) {
      return null;
    }
    return {
      label: option.label,
      color: AGENT_SUB_TYPE_TAG_COLOR[subType] ?? 'default',
    };
  }, [agentConfigInfo]);

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
      onClick={() => onClick(agentConfigInfo.id, agentConfigInfo.type)}
      extra={
        <>
          <span className={cx('text-ellipsis', 'flex-1')}>
            {dict('PC.Pages.SpaceDevelop.ApplicationItem.lastEdited')}{' '}
            {dayjs(agentConfigInfo.modified).format('MM-DD HH:mm')}
          </span>
          {agentConfigInfo?.publishStatus === PublishStatusEnum.Published && (
            <span className={cx('flex', 'items-center', 'gap-4')}>
              <ICON_SUCCESS />
              {dict('PC.Pages.SpaceDevelop.ApplicationItem.published')}
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
            {subTypeTag && (
              <Tag color={subTypeTag.color}>{subTypeTag.label}</Tag>
            )}
            {/* 个人电脑 */}
            {agentConfigInfo?.extra?.private && (
              <Tag color="blue">
                {dict('PC.Pages.SpaceDevelop.ApplicationItem.privateComputer')}
              </Tag>
            )}
          </div>
          <div className={cx('flex', 'items-center', 'gap-10')}>
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

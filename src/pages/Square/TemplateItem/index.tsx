import agentImage from '@/assets/images/agent_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import AgentType from '@/components/base/AgentType';
import CardWrapper from '@/components/business-component/CardWrapper';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { TemplateItemProps } from '@/types/interfaces/square';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

const cx = classNames;

// 模板组件
const TemplateItem: React.FC<TemplateItemProps> = ({
  publishedItemInfo,
  onClick,
  extra,
}) => {
  const { targetType, icon, name, publishUser, description, created } =
    publishedItemInfo;
  // 组件图标
  const [componentIcon, setComponentIcon] = useState<string>('');

  useEffect(() => {
    // 根据 targetType 设置组件图标和类型名称
    let defaultIcon = agentImage;
    switch (targetType) {
      case SquareAgentTypeEnum.Plugin:
        defaultIcon = pluginImage;
        break;
      case SquareAgentTypeEnum.Workflow:
        defaultIcon = workflowImage;
        break;
      default:
        defaultIcon = agentImage;
        break;
    }
    setComponentIcon(defaultIcon);
  }, [targetType]);

  return (
    <CardWrapper
      title={name}
      avatar={publishUser?.avatar || ''}
      name={publishUser?.nickName || publishUser?.userName}
      content={description}
      icon={icon}
      defaultIcon={componentIcon}
      onClick={onClick}
      extra={
        <span className={cx('text-ellipsis', 'flex-1')}>
          发布于 {dayjs(created).format('YYYY-MM-DD')}
        </span>
      }
      footer={
        <footer className={cx('flex', 'items-center')}>
          <AgentType
            type={targetType as unknown as AgentComponentTypeEnum}
            className="mr-auto"
          />
          {extra}
        </footer>
      }
    />
  );
};

export default TemplateItem;

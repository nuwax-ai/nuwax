import agentImage from '@/assets/images/agent_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { TemplateItemProps } from '@/types/interfaces/square';
import classNames from 'classnames';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 模板组件
const TemplateItem: React.FC<TemplateItemProps> = ({
  publishedItemInfo,
  onClick,
}) => {
  const { targetType, icon, name, publishUser, description, created } =
    publishedItemInfo;
  // 组件图标
  const [componentIcon, setComponentIcon] = useState<string>('');
  //   组件类型名称
  const [typeName, setTypeName] = useState<string>('');

  useEffect(() => {
    // 根据 targetType 设置组件图标和类型名称
    let defaultIcon = agentImage;
    switch (targetType) {
      case SquareAgentTypeEnum.Agent:
        setTypeName('智能体');
        break;
      case SquareAgentTypeEnum.Plugin:
        setTypeName('插件');
        defaultIcon = pluginImage;
        break;
      case SquareAgentTypeEnum.Workflow:
        setTypeName('工作流');
        defaultIcon = workflowImage;
        break;
      default:
        setTypeName('智能体');
    }
    setComponentIcon(icon || defaultIcon);
  }, [icon, targetType]);

  return (
    <div
      className={cx(styles.container, 'cursor-pointer', 'flex')}
      onClick={onClick}
    >
      <img className={cx(styles['a-logo'])} src={icon || pluginImage} alt="" />
      <div
        className={cx(styles['info-container'], 'flex-1', 'flex', 'flex-col')}
      >
        <div className={cx('flex', styles.header)}>
          <span className={cx(styles['a-name'], 'text-ellipsis')}>{name}</span>
          <span className={cx('flex', 'items-center', styles['type-name'])}>
            <img src={componentIcon} className={cx(styles.icon)} alt="" />
            <span>{typeName}</span>
          </span>
        </div>
        <div className={cx(styles.nickname, 'text-ellipsis')}>
          {publishUser?.nickName || publishUser?.userName}发布于
          {moment(created).format('YYYY-MM-DD')}
        </div>
        <p className={cx(styles.desc, 'text-ellipsis-3')}>{description}</p>
      </div>
    </div>
  );
};

export default TemplateItem;

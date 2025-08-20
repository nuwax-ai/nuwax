import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import { ICON_STAR, ICON_STAR_FILL } from '@/constants/images.constants';
import {
  apiPublishedPluginCollect,
  apiPublishedPluginUnCollect,
} from '@/services/plugin';
import {
  apiPublishedWorkflowCollect,
  apiPublishedWorkflowUnCollect,
} from '@/services/square';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { SquareComponentInfoProps } from '@/types/interfaces/square';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个广场插件、工作量组件
 */
const SquareComponentInfo: React.FC<SquareComponentInfoProps> = ({
  onClick,
  publishedItemInfo,
  onToggleCollectSuccess,
}) => {
  const {
    targetType,
    targetId,
    icon,
    name,
    publishUser,
    description,
    collect,
    statistics,
    created,
  } = publishedItemInfo;

  // 根据类型（目标对象（工作流、插件））显示不同的默认图标
  const defaultImage =
    targetType === SquareAgentTypeEnum.Plugin ? pluginImage : workflowImage;

  // 收藏插件接口
  const { run: runPluginCollect } = useRequest(apiPublishedPluginCollect, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      onToggleCollectSuccess(targetId, true);
    },
  });

  // 取消收藏插件接口
  const { run: runPluginUnCollect } = useRequest(apiPublishedPluginUnCollect, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      onToggleCollectSuccess(targetId, false);
    },
  });

  // 收藏工作流接口
  const { run: runWorkflowCollect } = useRequest(apiPublishedWorkflowCollect, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      onToggleCollectSuccess(targetId, true);
    },
  });

  // 取消收藏工作流接口
  const { run: runWorkflowUnCollect } = useRequest(
    apiPublishedWorkflowUnCollect,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: () => {
        onToggleCollectSuccess(targetId, false);
      },
    },
  );

  // 切换收藏与取消收藏
  const handleToggleCollect = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    // 插件
    if (targetType === SquareAgentTypeEnum.Plugin) {
      if (collect) {
        runPluginUnCollect(targetId);
      } else {
        runPluginCollect(targetId);
      }
    }
    // 工作流
    if (targetType === SquareAgentTypeEnum.Workflow) {
      if (collect) {
        runWorkflowUnCollect(targetId);
      } else {
        runWorkflowCollect(targetId);
      }
    }
  };

  return (
    <CardWrapper
      title={name}
      avatar={publishUser?.avatar || ''}
      name={publishUser?.nickName || publishUser?.userName}
      content={description}
      icon={icon}
      defaultIcon={defaultImage}
      onClick={onClick}
      extra={
        <span className={cx('text-ellipsis', 'flex-1', styles.time)}>
          发布于 {dayjs(created).format('YYYY-MM-DD')}
        </span>
      }
      footer={
        <footer className={cx('flex', 'items-center', styles.footer)}>
          {/*收藏次数*/}
          <span className={cx(styles.text)} onClick={handleToggleCollect}>
            {collect ? <ICON_STAR_FILL /> : <ICON_STAR />}
            {!!statistics?.collectCount && (
              <span>{statistics?.collectCount}</span>
            )}
          </span>
        </footer>
      }
    />
  );
};

export default SquareComponentInfo;

import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
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
import { StarFilled, StarOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个智能体组件
 */
const SquareComponentInfo: React.FC<SquareComponentInfoProps> = ({
  publishedAgentInfo,
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
  } = publishedAgentInfo;

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

  // 点击单项
  const handleClick = async () => {
    if (targetType === SquareAgentTypeEnum.Plugin) {
      history.push(`/square/publish/plugin/${targetId}`);
    }
    // 工作流
    if (targetType === SquareAgentTypeEnum.Workflow) {
      console.log('workflow');
    }
  };

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
    <div
      className={cx(styles.container, 'cursor-pointer', 'flex')}
      onClick={handleClick}
    >
      <img
        className={cx(styles['a-logo'])}
        src={icon || (defaultImage as string)}
        alt=""
      />
      <div
        className={cx(styles['info-container'], 'flex-1', 'flex', 'flex-col')}
      >
        <div className={cx('flex', styles.header)}>
          <span className={cx('flex-1', styles['a-name'], 'text-ellipsis')}>
            {name}
          </span>
          {/*收藏次数*/}
          <span
            className={cx(
              styles.collect,
              'flex',
              'items-center',
              'cursor-pointer',
            )}
            onClick={handleToggleCollect}
          >
            {collect ? (
              <StarFilled className={cx(styles['collected-star'])} />
            ) : (
              <StarOutlined />
            )}
            <span>{statistics?.collectCount || 0}</span>
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

export default SquareComponentInfo;

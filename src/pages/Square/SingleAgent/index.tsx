import agentImage from '@/assets/images/agent_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import ConditionRender from '@/components/ConditionRender';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import { apiCollectAgent, apiUnCollectAgent } from '@/services/agentDev';
import {
  apiPublishedPluginCollect,
  apiPublishedPluginUnCollect,
} from '@/services/plugin';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { SingleAgentProps } from '@/types/interfaces/square';
import {
  PlayCircleOutlined,
  StarFilled,
  UserOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个智能体组件
 */
const SingleAgent: React.FC<SingleAgentProps> = ({
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
    statistics,
    collect,
  } = publishedAgentInfo;

  // 根据类型（目标对象（智能体、工作流、插件））显示不同的默认图标
  const defaultImage =
    targetType === SquareAgentTypeEnum.Agent ? agentImage : pluginImage;
  // 创建会话
  const { run: runConversationCreate } = useRequest(
    apiAgentConversationCreate,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (result: ConversationInfo) => {
        history.push(`/home/chat/${result.id}`);
      },
    },
  );

  // 智能体收藏
  const { run: runCollectAgent } = useRequest(apiCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      onToggleCollectSuccess(targetId, true);
    },
  });

  // 智能体取消收藏
  const { run: runUnCollectAgent } = useRequest(apiUnCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      onToggleCollectSuccess(targetId, false);
    },
  });

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

  const handleClick = () => {
    runConversationCreate({
      agentId: targetId,
    });
  };

  const handleToggleCollect = (e) => {
    e.stopPropagation();
    if (targetType === SquareAgentTypeEnum.Agent) {
      if (collect) {
        runUnCollectAgent(targetId);
      } else {
        runCollectAgent(targetId);
      }
    } else if (targetType === SquareAgentTypeEnum.Plugin) {
      if (collect) {
        runPluginUnCollect(targetId);
      } else {
        runPluginCollect(targetId);
      }
    }
  };

  return (
    <div
      className={cx(styles.container, 'cursor-pointer')}
      onClick={handleClick}
    >
      <div className={cx(styles.header, 'flex')}>
        <img
          className={cx(styles['a-logo'])}
          src={icon || (defaultImage as string)}
          alt=""
        />
        <div className={cx(styles['info-container'], 'flex-1')}>
          <div className={cx('flex')}>
            <span className={cx('flex-1', styles['a-name'], 'text-ellipsis')}>
              {name}
            </span>
          </div>
          <div className={cx('flex', 'items-center', styles['info-author'])}>
            <ConditionRender condition={publishUser?.avatar}>
              <img
                className={cx(styles.avatar)}
                src={publishUser?.avatar}
                alt=""
              />
            </ConditionRender>
            <span className={cx(styles.author)}>{publishUser?.userName}</span>
            <span className={cx(styles.nickname)}>{publishUser?.nickName}</span>
          </div>
          <p className={cx(styles.desc, 'text-ellipsis-3')}>{description}</p>
        </div>
      </div>
      <div className={cx(styles['divider-horizontal'])} />
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <div className={cx('flex', styles.left)}>
          {/*用户人数*/}
          <span className={cx(styles.text, 'flex')}>
            <UserOutlined />
            <span>{statistics?.userCount || 0}</span>
          </span>
          {/*会话次数*/}
          <span className={cx(styles.text, 'flex')}>
            <PlayCircleOutlined />
            <span>{statistics?.convCount || 0}</span>
          </span>
          {/*收藏次数*/}
          <span
            className={cx(styles.text, styles.collect, 'flex')}
            onClick={handleToggleCollect}
          >
            <StarFilled
              className={cx({ [styles['collected-star']]: collect })}
            />
            <span>{statistics?.collectCount || 0}</span>
          </span>
        </div>
        <div className={cx(styles.right)}>
          <span className={cx('cursor-pointer')}>立即使用</span>
        </div>
      </div>
    </div>
  );
};

export default SingleAgent;

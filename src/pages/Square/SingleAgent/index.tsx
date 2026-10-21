import agentImage from '@/assets/images/agent_image.png';
import defaultAvatar from '@/assets/images/avatar.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import {
  ICON_MESSAGE,
  ICON_STAR,
  ICON_STAR_FILL,
  ICON_USER,
} from '@/constants/images.constants';
import { apiCollectAgent, apiUnCollectAgent } from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import {
  apiUserProjectCollect,
  apiUserProjectUnCollect,
} from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { SingleAgentProps } from '@/types/interfaces/square';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个智能体组件
 */
const SingleAgent: React.FC<SingleAgentProps> = ({
  title,
  onClick,
  onStartUse,
  extra,
  publishedItemInfo,
  onToggleCollectSuccess,
  showUserCount = true,
  showConvCount = true,
  showCollectCount = true,
  iconShape = 'square',
}) => {
  const {
    targetId,
    icon,
    name,
    publishUser,
    description,
    statistics,
    collect,
    targetType,
    targetSubType,
  } = publishedItemInfo;
  /** 网页应用、网站应用、三方应用用「打开」，不进智能体详情。 */
  const isOpenApp =
    (targetType === AgentComponentTypeEnum.Agent &&
      targetSubType === AgentComponentTypeEnum.PageApp) ||
    targetType === AgentComponentTypeEnum.UserApp ||
    targetType === AgentComponentTypeEnum.ThirdApp;
  /** 普通智能体才提供「进入独立页面」。 */
  const canEnterAgentPage =
    targetType === AgentComponentTypeEnum.Agent && !isOpenApp;
  /** 网站项目、三方应用走项目收藏；普通智能体和网页应用走智能体收藏。 */
  const useProjectCollect =
    targetType === AgentComponentTypeEnum.UserApp ||
    targetType === AgentComponentTypeEnum.ThirdApp;

  // 收藏
  const { run: runCollectAgent } = useRequest(
    (id: number) =>
      useProjectCollect
        ? apiUserProjectCollect(id, String(targetType))
        : apiCollectAgent(id),
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: () => {
        onToggleCollectSuccess(targetId, true);
      },
    },
  );

  // 取消收藏
  const { run: runUnCollectAgent } = useRequest(
    (id: number) =>
      useProjectCollect
        ? apiUserProjectUnCollect(id, String(targetType))
        : apiUnCollectAgent(id),
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
    if (collect) {
      runUnCollectAgent(targetId);
    } else {
      runCollectAgent(targetId);
    }
  };

  return (
    <CardWrapper
      className={cx(styles['card-wrapper'])}
      // 智能体 tab 卡片图标裁圆（网页应用 tab 保持方形）
      iconShape={iconShape}
      title={title || name}
      avatar={publishUser?.avatar || defaultAvatar}
      name={publishUser?.nickName || publishUser?.userName}
      content={description}
      icon={icon}
      defaultIcon={agentImage}
      onClick={onClick}
      footer={
        <>
          <footer className={cx('flex', 'items-center', styles.footer)}>
            <div className={cx('flex', 'items-center', styles['count-box'])}>
              {/*用户人数*/}
              {showUserCount && (
                <span className={cx(styles.text)}>
                  <ICON_USER />
                  <span>{statistics?.userCount || 0}</span>
                </span>
              )}
              {/*会话次数*/}
              {showConvCount && (
                <span className={cx(styles.text)}>
                  <ICON_MESSAGE />
                  <span>{statistics?.convCount || 0}</span>
                </span>
              )}
              {/*收藏次数*/}
              {showCollectCount && (
                <span className={cx(styles.text)}>
                  {collect ? <ICON_STAR_FILL /> : <ICON_STAR />}
                  <span>{statistics?.collectCount || 0}</span>
                </span>
              )}
            </div>
            {extra}
          </footer>
          <div className={cx(styles['action-box'], 'flex', 'items-center')}>
            {isOpenApp ? (
              <Button
                type="primary"
                className={cx(styles['action-btn'])}
                onClick={(e) => {
                  e.stopPropagation();
                  onStartUse?.(e);
                }}
              >
                {dict('PC.Pages.Square.SingleAgent.open')}
              </Button>
            ) : (
              <>
                <Button
                  type="primary"
                  className={cx(styles['action-btn'])}
                  icon={<ICON_MESSAGE />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartUse?.(e);
                  }}
                >
                  {dict('PC.Pages.Square.SingleAgent.summon')}
                </Button>
                {canEnterAgentPage ? (
                  <Button
                    className={cx(styles['action-btn'])}
                    onClick={(e) => {
                      e.stopPropagation();
                      history.push(`/agent/${targetId}`);
                    }}
                  >
                    {dict('PC.Pages.Square.SingleAgent.enterStandalone')}
                  </Button>
                ) : null}
              </>
            )}
            <span
              className={cx(styles['star-box'])}
              onClick={handleToggleCollect}
            >
              {collect ? <ICON_STAR_FILL /> : <ICON_STAR />}
            </span>
            {extra}
          </div>
        </>
      }
    />
  );
};

export default SingleAgent;

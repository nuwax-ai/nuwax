import agentImage from '@/assets/images/agent_image.png';
import defaultAvatar from '@/assets/images/avatar.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import {
  ICON_MESSAGE,
  ICON_STAR,
  ICON_STAR_FILL,
  ICON_USER,
} from '@/constants/images.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiPublishedSkillCollect,
  apiPublishedSkillUnCollect,
} from '@/services/square';
import type { SingleAgentProps } from '@/types/interfaces/square';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 广场技能卡片。主按钮仍是开始使用，收藏固定走技能接口。 */
export type SingleSkillProps = Omit<
  SingleAgentProps,
  'collectApi' | 'unCollectApi'
>;

/**
 * 广场技能卡片。
 * 卡片点击与开始使用沿用外部回调；收藏固定调用技能收藏接口。
 *
 * @param props 卡片数据与点击回调
 * @returns 技能卡片
 */
const SingleSkill: React.FC<SingleSkillProps> = ({
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
  } = publishedItemInfo;

  /** 收藏技能。 */
  const { run: runCollectAgent } = useRequest(apiPublishedSkillCollect, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      onToggleCollectSuccess(targetId, true);
    },
  });

  /** 取消收藏技能。 */
  const { run: runUnCollectAgent } = useRequest(apiPublishedSkillUnCollect, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      onToggleCollectSuccess(targetId, false);
    },
  });

  /** 切换收藏。阻止冒泡，避免同时触发卡片点击。 */
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
              {showUserCount && (
                <span className={cx(styles.text)}>
                  <ICON_USER />
                  <span>{statistics?.userCount || 0}</span>
                </span>
              )}
              {showConvCount && (
                <span className={cx(styles.text)}>
                  <ICON_MESSAGE />
                  <span>{statistics?.convCount || 0}</span>
                </span>
              )}
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
            <Button
              type="primary"
              block
              icon={<ICON_MESSAGE />}
              onClick={(e) => {
                e.stopPropagation();
                onStartUse?.(e);
              }}
            >
              {dict('PC.Pages.Square.SingleAgent.startUsing')}
            </Button>
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

export default SingleSkill;

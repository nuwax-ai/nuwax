/**
 * 资源卡片（纯展示）
 * @description 专家/技能/连接器通用的聚合卡片，容器复用 CardWrapper，
 * 与广场（Square/SingleAgent）卡片样式保持一致：
 * 图标 + 标题 + 发布者（头像/昵称）+ 两行描述 + 底部统计行；
 * 专家&专家团卡片 hover 时右上角浮现「召唤」按钮（点击逻辑暂未接入，仅展示）。
 */

import agentImage from '@/assets/images/agent_image.png';
import defaultAvatar from '@/assets/images/avatar.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import {
  ICON_MESSAGE,
  ICON_STAR,
  ICON_USER,
} from '@/constants/images.constants';
import { dict } from '@/services/i18nRuntime';
import { ToolOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { ResourceItem, ResourceStatType } from '../../../../types';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 统计项图标（与广场卡片同款，连接器工具数沿用 Outline 图标） */
const STAT_ICON_MAP: Record<ResourceStatType, React.ReactNode> = {
  user: <ICON_USER />,
  link: <ICON_MESSAGE />,
  star: <ICON_STAR />,
  tool: <ToolOutlined />,
};

interface ResourceCardProps {
  item: ResourceItem;
  /** 是否显示召唤按钮（专家&专家团卡片） */
  showSummon?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ item, showSummon }) => {
  const { name, description, icon, publishUser, stats } = item;

  return (
    <CardWrapper
      className={cx(styles['card-wrapper'])}
      title={name}
      // 发布者信息（与广场卡片一致：头像兜底默认头像，昵称缺失回退用户名；
      // 团队空间/连接器数据无发布者时不渲染该行）
      avatar={publishUser ? publishUser.avatar || defaultAvatar : undefined}
      name={publishUser?.nickName || publishUser?.userName || ''}
      content={description || ''}
      icon={icon || ''}
      defaultIcon={agentImage}
      footer={
        <>
          <footer className={cx('flex', 'items-center', styles.footer)}>
            <div className={cx('flex', 'items-center', styles['count-box'])}>
              {(stats || []).map((stat) => (
                <span key={stat.type} className={cx(styles.text)}>
                  {STAT_ICON_MAP[stat.type]}
                  <span>{stat.value}</span>
                </span>
              ))}
            </div>
          </footer>
          {showSummon ? (
            <div className={cx(styles['summon-box'])}>
              <Button
                type="primary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO 召唤逻辑暂未接入，按钮仅展示
                }}
              >
                {dict('PC.Pages.ExpertSkillConnector.summon')}
              </Button>
            </div>
          ) : null}
        </>
      }
    />
  );
};

export default React.memo(ResourceCard);

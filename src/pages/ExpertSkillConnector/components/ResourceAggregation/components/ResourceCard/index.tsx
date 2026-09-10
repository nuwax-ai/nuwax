/**
 * 资源卡片（纯展示）
 * @description 专家/技能/连接器通用的聚合卡片，容器复用 CardWrapper，
 * 与广场（Square/SingleAgent）卡片样式保持一致：
 * 图标 + 标题 + 发布者（头像/昵称）+ 两行描述 + 底部统计行；
 * 专家&专家团卡片 hover 时右上角浮现「召唤」按钮（经 onSummon 回调携带专家信息
 * 透传跳转 /home 首页）、技能卡片浮现「选择」按钮及右侧 pin 图标按钮
 * （点击逻辑暂未接入，仅展示）；
 * 连接器卡片标题下方展示 分类 + 连接状态（no_auth 无连接概念不展示），
 * hover 右上角浮现「连接/断开」按钮（点击逻辑暂未接入，仅展示）。
 */

import agentImage from '@/assets/images/agent_image.png';
import defaultAvatar from '@/assets/images/avatar.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import {
  ICON_MESSAGE,
  ICON_STAR,
  ICON_USER,
} from '@/constants/images.constants';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import { dict } from '@/services/i18nRuntime';
import { PushpinOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { ResourceItem, ResourceStatType } from '../../../../types';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 统计项图标（与广场卡片同款） */
const STAT_ICON_MAP: Record<ResourceStatType, React.ReactNode> = {
  user: <ICON_USER />,
  link: <ICON_MESSAGE />,
  star: <ICON_STAR />,
};

interface ResourceCardProps {
  item: ResourceItem;
  /** 是否显示召唤按钮（专家&专家团卡片） */
  showSummon?: boolean;
  /** 召唤按钮点击回调（携带卡片条目；仅专家卡片传入） */
  onSummon?: (item: ResourceItem) => void;
  /** 是否显示选择按钮与 pin 图标按钮（技能卡片） */
  showUse?: boolean;
  /** 是否显示底部统计行（使用用户数等） */
  showStats?: boolean;
  /** 是否按连接器卡片展示（分类 + 连接状态行、hover 连接/断开按钮） */
  showConnect?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  item,
  showSummon,
  onSummon,
  showUse,
  showStats = true,
  showConnect,
}) => {
  const { name, description, icon, publishUser, stats } = item;
  /**
   * 连接器卡片状态行：no_auth（免鉴权）无连接概念，
   * 不展示连接状态与连接按钮（与连接器详情抽屉口径一致）
   */
  const showConnectState = showConnect && item.authType !== 'no_auth';
  /**
   * 图标展示地址：连接器 icon 为 /api/f/ 受保护文件地址，img 直接请求
   * 不带 Authorization 会被拒（ORB 拦截 → onError 回退默认图），
   * 走 Bearer fetch + blob object URL 展示；公开 URL 原样返回
   */
  const { displaySrc: iconDisplaySrc } = useAuthProtectedImageSrc(icon);

  return (
    <CardWrapper
      className={cx(styles['card-wrapper'], {
        // 无统计行的紧凑卡片（技能/连接器页）
        [styles['card-compact']]: !showStats,
      })}
      title={name}
      // 发布者信息（与广场卡片一致：头像兜底默认头像，昵称缺失回退用户名；
      // 团队空间/连接器数据无发布者时不渲染该行）
      avatar={publishUser ? publishUser.avatar || defaultAvatar : undefined}
      name={publishUser?.nickName || publishUser?.userName || ''}
      content={description || ''}
      icon={iconDisplaySrc || ''}
      defaultIcon={agentImage}
      extra={
        showConnectState ? (
          // 连接器卡片：分类 + 连接状态（单包装节点保证在 extra-box 内左对齐）
          <div className={cx('flex', 'items-center', styles['connect-info'])}>
            {item.category && (
              <span className={cx(styles['category-text'])}>
                {item.category}
              </span>
            )}
            <span
              className={cx(
                styles['connect-status'],
                item.connected
                  ? styles['status-connected']
                  : styles['status-disconnected'],
              )}
            >
              {/* 分类为空时，连接状态前的圆点不展示 */}
              {item.category && <span className={cx(styles['status-dot'])} />}
              {item.connected ? '已连接' : '未连接'}
            </span>
          </div>
        ) : undefined
      }
      footer={
        <>
          {showStats && (
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
          )}
          {(showSummon || showUse) && (
            <div className={cx(styles['action-box'])}>
              <Button
                type="primary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  if (showSummon) {
                    onSummon?.(item);
                    return;
                  }
                  // TODO 技能「选择」逻辑暂未接入，按钮仅展示
                }}
              >
                {showSummon
                  ? dict('PC.Pages.ExpertSkillConnector.summon')
                  : dict('PC.Pages.ExpertSkillConnector.select')}
              </Button>
              {showUse && (
                // 技能卡片：选择按钮右侧 pin 图标按钮，hover 高亮；
                // 提示按常驻状态切换（未常驻→常驻 / 已常驻→取消常驻）
                <Button
                  type="text"
                  size="small"
                  className={cx(styles['pin-btn'])}
                  icon={<PushpinOutlined />}
                  aria-label={dict(
                    item.pinned
                      ? 'PC.Pages.ExpertSkillConnector.unpin'
                      : 'PC.Pages.ExpertSkillConnector.pin',
                  )}
                  title={dict(
                    item.pinned
                      ? 'PC.Pages.ExpertSkillConnector.unpin'
                      : 'PC.Pages.ExpertSkillConnector.pin',
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO pin/取消 pin 接口未定，点击逻辑暂未接入，按钮仅展示
                  }}
                />
              )}
            </div>
          )}
          {showConnectState && (
            <div className={cx(styles['action-box'])}>
              {/* 已连接 → 断开（红色）；未连接 → 连接。逻辑暂未接入，仅展示 */}
              <Button
                type="primary"
                size="small"
                danger={item.connected}
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO 连接/断开逻辑暂未接入，按钮仅展示
                }}
              >
                {item.connected ? '断开' : '连接'}
              </Button>
            </div>
          )}
        </>
      }
    />
  );
};

export default React.memo(ResourceCard);

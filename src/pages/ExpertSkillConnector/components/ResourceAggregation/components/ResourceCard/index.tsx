/**
 * 资源卡片（纯展示）
 * @description 专家/技能/连接器通用的聚合卡片，容器复用 CardWrapper，
 * 与广场（Square/SingleAgent）卡片样式保持一致：
 * 图标 + 标题 + 发布者（头像/昵称）+ 两行描述 + 底部统计行；
 * 专家&专家团卡片 hover 时右上角浮现「召唤」按钮（经 onSummon 回调
 * 携带专家信息透传跳转 /home 首页）、右下角浮现收藏图标（位置参考
 * 广场智能体卡片的 star-box，经 onToggleCollect 回调切换收藏/取消收藏，
 * 已收藏金色实心星/未收藏空心星，统计行收藏数图标随之联动）、
 * 技能卡片浮现「选择」按钮及右侧 pin 图标按钮
 * （点击逻辑暂未接入，仅展示），需付费的技能卡片左上角悬挂
 * 「付费」Ribbon 角标（点击逻辑暂未接入，仅展示）；
 * 连接器卡片标题下方展示 分类 + 连接状态（按 connected 展示已连接/未连接）；
 * 已连接卡片右上角常驻「启用开关」（checked 绑 connectionEnabled，切换经
 * onToggleEnabled 调启用状态接口），hover 时开关左侧浮现「断开」按钮
 * （经 onDisconnect 回调，DELETE 连接后更新卡片状态）；未连接卡片 hover
 * 右上角浮现「连接」按钮，经 onConnect 回调，上层按认证方式分流
 * （oauth2 → 授权弹窗；api_key/bearer/custom → 凭据抽屉；
 * no_auth 免鉴权直接建连）——免鉴权与非免鉴权卡片交互口径一致。
 */

import agentImage from '@/assets/images/agent_image.png';
import defaultAvatar from '@/assets/images/avatar.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import {
  ICON_MESSAGE,
  ICON_STAR,
  ICON_STAR_FILL,
  ICON_USER,
} from '@/constants/images.constants';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import { dict } from '@/services/i18nRuntime';
import { PushpinOutlined } from '@ant-design/icons';
import { Badge, Button, Switch, Tag } from 'antd';
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
  /** 收藏图标点击回调（携带卡片条目；仅专家卡片传入，收藏/取消收藏） */
  onToggleCollect?: (item: ResourceItem) => void;
  /** 选择按钮点击回调（携带卡片条目；仅技能卡片传入） */
  onSelect?: (item: ResourceItem) => void;
  /** 是否显示选择按钮与 pin 图标按钮（技能卡片） */
  showUse?: boolean;
  /** 是否显示底部统计行（使用用户数等） */
  showStats?: boolean;
  /**
   * 是否展示付费角标（订阅功能开启时传入，专家/技能卡片消费）：
   * 专家卡片右下角展示「付费/已订阅」Tag；技能卡片左上角展示「付费」Ribbon
   */
  showPayment?: boolean;
  /**
   * 付费角标点击回调（携带卡片条目；仅专家卡片传入）：跳转智能体详情页，
   * 未订阅的付费智能体由详情页自动弹订阅套餐弹窗（与空间广场卡片同口径）
   */
  onPaymentClick?: (item: ResourceItem) => void;
  /** 是否按连接器卡片展示（分类 + 连接状态行、hover 连接/断开按钮） */
  showConnect?: boolean;
  /** 断开按钮点击回调（携带卡片条目；仅连接器卡片且已连接时生效） */
  onDisconnect?: (item: ResourceItem) => void;
  /** 断开请求中（按钮 loading 防重复点击） */
  disconnecting?: boolean;
  /** 连接按钮点击回调（携带卡片条目；仅连接器卡片且未连接时生效） */
  onConnect?: (item: ResourceItem) => void;
  /** 连接请求中（按钮 loading 防重复点击） */
  connecting?: boolean;
  /** 启用开关切换回调（携带卡片条目与目标开关状态；仅连接器卡片且已连接时生效） */
  onToggleEnabled?: (item: ResourceItem, enabled: boolean) => void;
  /** 启用开关请求中（Switch loading 防重复点击） */
  toggling?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  item,
  showSummon,
  onSummon,
  onToggleCollect,
  onSelect,
  showUse,
  showStats = true,
  showPayment,
  onPaymentClick,
  showConnect,
  onDisconnect,
  disconnecting,
  onConnect,
  connecting,
  onToggleEnabled,
  toggling,
}) => {
  const { name, description, icon, publishUser, stats } = item;
  /** 连接器卡片状态行（分类 + 已连接/未连接） */
  const showConnectStatus = showConnect;
  /**
   * 连接/断开/开关：免鉴权（no_auth）同样参与——未连接 hover 浮现连接
   * 按钮（上层直接 POST api-key 仅传 providerService 建连，无凭据弹窗），
   * 已连接与非免鉴权同口径（常驻启用开关 + hover 断开）
   */
  const showConnectAction = showConnect;
  /**
   * 已连接卡片：右上角常驻启用开关（替代原 hover 浮现的断开按钮位置），
   * hover 时开关左侧浮现断开按钮；未连接卡片保持 hover 浮现连接按钮不变
   */
  const showEnabledSwitch = showConnectAction && !!item.connected;
  /** 状态点亮口径：按 connected（免鉴权连接后同样点亮） */
  const connectStatusOn = !!item.connected;
  /**
   * 图标展示地址：连接器 icon 为 /api/f/ 受保护文件地址，img 直接请求
   * 不带 Authorization 会被拒（ORB 拦截 → onError 回退默认图），
   * 走 Bearer fetch + blob object URL 展示；公开 URL 原样返回
   */
  const { displaySrc: iconDisplaySrc } = useAuthProtectedImageSrc(icon);

  /**
   * 技能卡片付费角标（badge ant-ribbon，悬挂卡片左上角）：需付费且订阅
   * 功能开启时展示「付费」文案；点击逻辑暂未接入，仅展示
   */
  const showSkillPaymentRibbon =
    showUse && showPayment && !!item.paymentRequired;

  const cardNode = (
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
        showConnectStatus ? (
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
                connectStatusOn
                  ? styles['status-connected']
                  : styles['status-disconnected'],
              )}
            >
              {/* 分类为空时，连接状态前的圆点不展示 */}
              {item.category && <span className={cx(styles['status-dot'])} />}
              {connectStatusOn ? '已连接' : '未连接'}
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
                    {/* 专家卡片收藏数图标跟随收藏态切实心星（与广场卡片一致） */}
                    {stat.type === 'star' && item.collected ? (
                      <ICON_STAR_FILL />
                    ) : (
                      STAT_ICON_MAP[stat.type]
                    )}
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
                  // 技能卡「选择」：透传技能信息并跳转（上层未传时仅展示）
                  onSelect?.(item);
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
          {showSummon && (
            // 专家卡片右下角：收藏图标 + 付费角标同行右对齐（付费 Tag
            // 最右、收藏图标在其左侧，与广场智能体卡片 action-box 内
            // star 与 extra 的相邻排布一致）；收藏图标 hover 卡片时浮现，
            // 付费角标常驻
            <div className={cx(styles['corner-box'])}>
              <span
                className={cx(styles['star-box'], styles['hover-reveal-btn'])}
                aria-label={dict(
                  item.collected
                    ? 'PC.Pages.HomeDrag.cancelCollect'
                    : 'PC.Pages.HomeDrag.collect',
                )}
                title={dict(
                  item.collected
                    ? 'PC.Pages.HomeDrag.cancelCollect'
                    : 'PC.Pages.HomeDrag.collect',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollect?.(item);
                }}
              >
                {item.collected ? <ICON_STAR_FILL /> : <ICON_STAR />}
              </span>
              {/* 付费角标（与广场智能体卡片同款）：需付费卡片展示
                  「付费/已订阅」，点击跳转智能体详情页（未订阅时详情页
                  自动弹订阅套餐弹窗，与空间广场卡片同口径） */}
              {showPayment && item.paymentRequired && (
                <Tag
                  color={item.subscribed ? 'success' : 'processing'}
                  style={{ marginRight: 0, flexShrink: 0, cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPaymentClick?.(item);
                  }}
                >
                  {dict(
                    item.subscribed
                      ? 'PC.Pages.Square.SingleAgent.subscribed'
                      : 'PC.Pages.Square.SingleAgent.paid',
                  )}
                </Tag>
              )}
            </div>
          )}
          {showConnectAction && (
            <div
              className={cx(styles['action-box'], {
                // 已连接：开关常驻右上角（容器不随 hover 隐现）
                [styles['action-box-pinned']]: showEnabledSwitch,
              })}
            >
              {showEnabledSwitch ? (
                <>
                  {/* 断开：hover 当前卡片时浮现于开关左侧，hover 离开隐藏
                      （DELETE 连接后更新卡片状态） */}
                  <Button
                    type="primary"
                    size="small"
                    danger
                    className={cx(styles['hover-reveal-btn'])}
                    loading={disconnecting}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDisconnect?.(item);
                    }}
                  >
                    断开
                  </Button>
                  {/* 启用开关：checked 绑 connectionEnabled（已开启展示打开状态），
                      切换经 onToggleEnabled 调启用状态接口后就地更新回弹
                      （用法同能力弹窗连接器卡片） */}
                  <Switch
                    size="small"
                    checked={item.connectionEnabled === true}
                    loading={toggling}
                    aria-label={name}
                    onClick={(_, event) => {
                      event.stopPropagation();
                      onToggleEnabled?.(item, !item.connectionEnabled);
                    }}
                  />
                </>
              ) : (
                /* 未连接：hover 浮现「连接」按钮（上层按认证方式分流：
                   oauth2 授权弹窗 / 凭据型凭据抽屉），交互与样式保持不变 */
                <Button
                  type="primary"
                  size="small"
                  loading={connecting}
                  onClick={(e) => {
                    e.stopPropagation();
                    onConnect?.(item);
                  }}
                >
                  连接
                </Button>
              )}
            </div>
          )}
        </>
      }
    />
  );

  // 技能卡片需付费时用 Ribbon 包裹卡片（角标悬挂卡片左上角；
  // 与专家卡片的右下角「付费/已订阅」Tag 区分，二者互不共存）
  if (showSkillPaymentRibbon) {
    return (
      <Badge.Ribbon
        text={dict('PC.Pages.Square.SingleAgent.paid')}
        placement="start"
      >
        {cardNode}
      </Badge.Ribbon>
    );
  }
  return cardNode;
};

export default React.memo(ResourceCard);

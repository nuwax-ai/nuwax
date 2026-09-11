/** 四类能力卡片：技能钉住、连接状态、专家标签/统计/收藏、创建人及紧凑资料行。 */
import defaultAvatar from '@/assets/images/avatar.png';
import SvgIcon from '@/components/base/SvgIcon';
import {
  ICON_MESSAGE,
  ICON_STAR,
  ICON_STAR_FILL,
  ICON_USER,
} from '@/constants/images.constants';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import { t } from '@/services/i18nRuntime';
import {
  CheckOutlined,
  PushpinFilled,
  PushpinOutlined,
} from '@ant-design/icons';
import { Button, Card, Switch, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import type { CapabilityItem } from './types';

const cx = classNames.bind(styles);
/**
 * 图标底色板：按 antd 预设色相的半透明 tint，浅色下呈粉彩、深色下呈微光，
 * 两种主题均可读（色相与 themeTokens 的 blue/green/purple/orange/cyan/magenta 一致）。
 */
const ICON_BACKGROUNDS = [
  'rgba(24, 144, 255, 12%)',
  'rgba(82, 196, 26, 12%)',
  'rgba(114, 46, 209, 12%)',
  'rgba(250, 140, 22, 12%)',
  'rgba(19, 194, 194, 12%)',
  'rgba(235, 47, 150, 12%)',
];

export interface CapabilityCardProps {
  item: CapabilityItem;
  index: number;
  focused: boolean;
  pinned: boolean;
  onSelect: (item: CapabilityItem) => void;
  onHover: (index: number) => void;
  onTogglePin: (item: CapabilityItem) => void;
  /** 连接器「连接」发起（共享 useConnectorConnect 分流：oauth2 授权 / 凭据弹窗） */
  onConnectorConnect?: (item: CapabilityItem) => void;
  /** 连接器「断开」 */
  onConnectorDisconnect?: (item: CapabilityItem) => void;
  /** 连接/断开请求中的条目 key（按钮 loading 防重复） */
  connectorBusyKeys?: string[];
  /** 专家收藏/取消收藏（与广场卡同链路：targetId 调智能体收藏接口） */
  onToggleCollect?: (item: CapabilityItem) => void;
}

const CapabilityCard: React.FC<CapabilityCardProps> = ({
  item,
  index,
  focused,
  pinned,
  onSelect,
  onHover,
  onTogglePin,
  onConnectorConnect,
  onConnectorDisconnect,
  connectorBusyKeys,
  onToggleCollect,
}) => {
  const { name, description, icon, category, resourceType } = item;
  const pinLabel = t(
    pinned
      ? 'PC.Components.CapabilityModal.unpin'
      : 'PC.Components.CapabilityModal.pin',
  );
  const isKnowledge = resourceType === 'knowledge';
  const isConnector = resourceType === 'connector';
  const fileType =
    item.fileType ||
    name.match(/\.(pdf|xlsx?|docx?|md|csv|txt|pptx?)$/i)?.[1]?.toUpperCase();
  // 图标地址加载失败（连接器 logo 常见 404/防盗链）时回退为名称首字
  const [iconFailed, setIconFailed] = React.useState(false);
  // 连接器 icon 常为 /api/f/ 受保护地址，直接 img 会被 ORB 拦截，走 Bearer 解析
  const { displaySrc: protectedIconSrc } = useAuthProtectedImageSrc(icon);
  const effectiveIcon = iconFailed ? undefined : protectedIconSrc;
  const iconContent = !effectiveIcon ? (
    name.charAt(0)
  ) : /^(?:https?:\/\/|\/|blob:|data:)/.test(effectiveIcon) ? (
    <img src={effectiveIcon} alt="" onError={() => setIconFailed(true)} />
  ) : /^icons?-/.test(effectiveIcon) ? (
    <SvgIcon name={effectiveIcon} style={{ fontSize: 22 }} />
  ) : (
    effectiveIcon
  );
  const selectLabel = t(
    resourceType === 'expert'
      ? 'PC.Components.CapabilityModal.hire'
      : 'PC.Components.CapabilityModal.select',
  );
  // 操作按钮按聚焦态（鼠标悬停或键盘聚焦）条件渲染：不渲染即不占位，标题可拉通整行
  const showPin = focused || pinned;
  // 创建人/发布者（技能/专家/资料库）：小头像 + 人物名，与广场卡 AuthorInfo 同款信息；
  // 头像空/加载失败回退默认头像（avatar.png），名称超长省略
  const authorInfo = item.publisherName ? (
    <span className={styles['card-author']} title={item.publisherName}>
      <img
        src={item.publisherAvatar || defaultAvatar}
        alt=""
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = defaultAvatar;
        }}
      />
      <span className={styles['card-author-name']}>{item.publisherName}</span>
    </span>
  ) : null;
  // 选择按钮（技能/专家/资料库同款）：主按钮 + 对勾图标，悬停/键盘聚焦时浮现
  const selectButton = (
    <Button
      type="primary"
      size="small"
      icon={<CheckOutlined />}
      className={styles['card-hire']}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(item);
      }}
    >
      {selectLabel}
    </Button>
  );
  return (
    <Card
      id={`capability-option-${index}`}
      data-capability-key={item.key}
      role="option"
      aria-selected={focused}
      className={cx(styles.card, styles[`card-${resourceType}`], {
        [styles['card-focused']]: focused,
      })}
      onClick={() => onSelect(item)}
      onMouseMove={() => onHover(index)}
      onMouseLeave={() => onHover(-1)}
    >
      {isKnowledge ? (
        <>
          <span className={styles['card-name']} title={name}>
            {name}
          </span>
          {fileType && <span className={styles['file-type']}>{fileType}</span>}
          {authorInfo}
          {/* 选择按钮与其他卡片同款（主按钮 + 对勾图标，悬停/聚焦浮现） */}
          <div className={styles['card-head-actions']}>{selectButton}</div>
        </>
      ) : (
        <>
          <div className={styles['card-head']}>
            <span
              className={styles['card-icon']}
              style={{
                backgroundColor:
                  ICON_BACKGROUNDS[index % ICON_BACKGROUNDS.length],
              }}
            >
              {iconContent}
            </span>
            <div className={styles['card-heading']}>
              <span className={styles['card-name']} title={name}>
                {name}
              </span>
              <div className={styles['card-meta']}>
                {/* 官方标识（已发布智能体） */}
                {resourceType === 'expert' && item.official && (
                  <span
                    className={cx(
                      styles['card-badge'],
                      styles['card-badge-official'],
                    )}
                  >
                    {t('PC.Components.CapabilityModal.official')}
                  </span>
                )}
                {/* 创建人/发布者（技能/专家）：同款小头像 + 人物名 */}
                {(resourceType === 'skill' || resourceType === 'expert') &&
                  authorInfo}
                {/* 分类：仅连接器展示（技能/专家该行由「头像+人物名」取代，
                    不再叠加分类文案） */}
                {category && resourceType === 'connector' && (
                  <span className={styles['card-category']}>{category}</span>
                )}
                {isConnector &&
                  (item.authType === 'no_auth' ||
                    item.connected !== undefined) && (
                    <span
                      className={cx(styles['connection-status'], {
                        [styles.connected]:
                          item.authType === 'no_auth' || item.connected,
                      })}
                    >
                      {t(
                        item.authType === 'no_auth' || item.connected
                          ? 'PC.Components.CapabilityModal.connected'
                          : 'PC.Components.CapabilityModal.disconnected',
                      )}
                    </span>
                  )}
              </div>
            </div>
            {/* 连接器连接/断开开关：选中态绑真实 connected，切换走共享
                useConnectorConnect 分流（oauth2 授权 / 凭据型 / 断开寻址），
                成功后上层就地更新 connected 驱动开关回弹；免鉴权不渲染开关 */}
            {isConnector && item.authType !== 'no_auth' && (
              <Switch
                className={styles['card-switch']}
                size="small"
                checked={item.connected === true}
                loading={connectorBusyKeys?.includes(item.key)}
                aria-label={name}
                onClick={(_, event) => {
                  event.stopPropagation();
                  if (item.connected) {
                    onConnectorDisconnect?.(item);
                  } else {
                    onConnectorConnect?.(item);
                  }
                }}
              />
            )}
            {/* 技能/专家操作簇：与标题同行右端，悬停/键盘聚焦时浮现
                （常驻占位，避免浮现时标题宽度跳动）；技能的钉住按钮
                位于选择按钮右侧同簇对齐 */}
            {(resourceType === 'skill' || resourceType === 'expert') && (
              <div className={styles['card-head-actions']}>
                {selectButton}
                {resourceType === 'skill' && showPin && (
                  <Tooltip title={pinLabel}>
                    <Button
                      type="text"
                      size="small"
                      aria-label={pinLabel}
                      aria-pressed={pinned}
                      className={cx(styles['card-pin'], {
                        [styles['card-pin-active']]: pinned,
                      })}
                      onClick={(event) => {
                        event.stopPropagation();
                        onTogglePin(item);
                      }}
                    >
                      {pinned ? <PushpinFilled /> : <PushpinOutlined />}
                    </Button>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
          {/* 描述：专家/技能卡常驻（无描述保留空块撑住中段，footer 落底一致）；
              其余类型有内容才渲染 */}
          {(resourceType === 'expert' ||
            resourceType === 'skill' ||
            !!description) && (
            <div className={styles['card-desc']} title={description}>
              {description}
            </div>
          )}
          {/* 统计行（与广场卡同款）：专家=用户/会话/收藏数，技能仅收藏数
              （广场技能卡同口径隐藏用户/会话数）；右端付费/已订阅标识常驻，
              收藏星标悬停/键盘聚焦时浮现 */}
          {(resourceType === 'expert' || resourceType === 'skill') && (
            <div className={styles['card-stats']}>
              <div
                className={cx(
                  'flex',
                  'items-center',
                  styles['card-stats-counts'],
                )}
              >
                {resourceType === 'expert' && (
                  <>
                    <span className={styles['card-stat']}>
                      <ICON_USER />
                      <span>{item.userCount || 0}</span>
                    </span>
                    <span className={styles['card-stat']}>
                      <ICON_MESSAGE />
                      <span>{item.convCount || 0}</span>
                    </span>
                  </>
                )}
                <span className={styles['card-stat']}>
                  {item.collect ? <ICON_STAR_FILL /> : <ICON_STAR />}
                  <span>{item.collectCount || 0}</span>
                </span>
              </div>
              <div className={styles['card-stats-actions']}>
                {onToggleCollect && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={t(
                      item.collect
                        ? 'PC.Components.CapabilityModal.uncollect'
                        : 'PC.Components.CapabilityModal.collect',
                    )}
                    className={cx(styles['card-collect'], {
                      [styles['card-collect-active']]: item.collect,
                    })}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleCollect(item);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        onToggleCollect(item);
                      }
                    }}
                  >
                    {item.collect ? <ICON_STAR_FILL /> : <ICON_STAR />}
                  </span>
                )}
                {/* 付费标识：antd Tag 蓝色（需付费时展示「付费/已订阅」，与广场卡同文案） */}
                {item.paymentRequired && (
                  <Tag color="blue" className={styles['card-paid-tag']}>
                    {t(
                      item.subscribed
                        ? 'PC.Pages.Square.SingleAgent.subscribed'
                        : 'PC.Pages.Square.SingleAgent.paid',
                    )}
                  </Tag>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};
export default React.memo(CapabilityCard);

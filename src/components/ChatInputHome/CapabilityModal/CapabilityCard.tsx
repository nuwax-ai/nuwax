/** 四类能力卡片：技能置顶、连接状态、专家标签及紧凑资料行。 */
import SvgIcon from '@/components/base/SvgIcon';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import { t } from '@/services/i18nRuntime';
import { PushpinFilled, PushpinOutlined } from '@ant-design/icons';
import { Button, Card, Switch, Tooltip } from 'antd';
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
  const showActions = focused;
  const showPin = focused || pinned;
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
    >
      {isKnowledge ? (
        <>
          <span className={styles['card-name']} title={name}>
            {name}
          </span>
          {fileType && <span className={styles['file-type']}>{fileType}</span>}
          <Button
            type="text"
            size="small"
            className={styles['card-action']}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(item);
            }}
          >
            {selectLabel}
          </Button>
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
                {category && (
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
            {(resourceType === 'skill' || resourceType === 'expert') &&
              showActions && (
                <Button
                  type="text"
                  size="small"
                  className={styles['card-action']}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(item);
                  }}
                >
                  {selectLabel}
                </Button>
              )}
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
            {/* 连接器连接/断开开关：选中态绑真实 connected，切换走共享
                useConnectorConnect 分流（oauth2 授权 / 凭据型弹窗 / 断开寻址），
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
          </div>
          {description && (
            <div className={styles['card-desc']} title={description}>
              {description}
            </div>
          )}
          {resourceType === 'expert' && !!item.tags?.length && (
            <div className={styles['card-tags']}>
              {item.tags.map((tag) => (
                <span key={tag} className={styles['card-tag']}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
};
export default React.memo(CapabilityCard);

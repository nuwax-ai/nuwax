/**
 * grid 变体卡片：两栏网格连接器卡（与技能/专家卡同款简化布局，总高 70px）
 * ——圆形图标 + 名称/单行描述 + 连接状态槽（已连接/未连接标 + hover「断开」
 * 覆盖）+ 常驻连接开关。无选中交互（纯连接管理）。
 */
import { t } from '@/services/i18nRuntime';
import { Button, Switch } from 'antd';
import classNames from 'classnames';
import React from 'react';
import ConnectorIcon from './ConnectorIcon';
import styles from './index.less';
import type { ConnectorListItem } from './types';

const cx = classNames.bind(styles);

/** 图标底色板（与技能/专家列表同款 tint 序列） */
export const CONNECTOR_ICON_BACKGROUNDS = [
  'rgba(24, 144, 255, 12%)',
  'rgba(82, 196, 26, 12%)',
  'rgba(114, 46, 209, 12%)',
  'rgba(250, 140, 22, 12%)',
  'rgba(19, 194, 194, 12%)',
  'rgba(235, 47, 150, 12%)',
];

export interface ConnectorCardBaseProps {
  item: ConnectorListItem;
  index: number;
  onToggleConnect: (item: ConnectorListItem) => void;
  onDisconnect: (item: ConnectorListItem) => void;
  /** 连接/断开请求中的条目 key（开关/按钮 loading 防重复） */
  busyKeys?: string[];
}

/** 连接状态槽：常驻「已连接/未连接」标（圆点+文字）；已连接 hover 时
    「断开」按钮绝对定位等宽盖住状态标（不挤开开关） */
const ConnectSlot: React.FC<{
  item: ConnectorListItem;
  busy: boolean;
  onDisconnect: (item: ConnectorListItem) => void;
}> = ({ item, busy, onDisconnect }) => (
  <span className={cx(styles['connect-slot'])}>
    <span
      className={cx(styles['connection-status'], {
        [styles.connected]: item.connected === true,
      })}
    >
      {t(
        item.connected
          ? 'PC.Components.CapabilityModal.connected'
          : 'PC.Components.CapabilityModal.disconnected',
      )}
    </span>
    {item.connected === true && (
      <Button
        size="small"
        danger
        className={cx(styles['disconnect-btn'])}
        loading={busy}
        aria-label={t('PC.Components.CapabilityModal.disconnect')}
        onClick={(event) => {
          event.stopPropagation();
          onDisconnect(item);
        }}
      >
        {t('PC.Components.CapabilityModal.disconnect')}
      </Button>
    )}
  </span>
);

const ConnectorGridCard: React.FC<ConnectorCardBaseProps> = ({
  item,
  index,
  onToggleConnect,
  onDisconnect,
  busyKeys,
}) => {
  const busy = busyKeys?.includes(item.key);
  return (
    <div data-connector-key={item.key} className={cx(styles.card)}>
      <div className={cx(styles['card-head'])}>
        <ConnectorIcon
          icon={item.icon}
          name={item.name}
          background={
            CONNECTOR_ICON_BACKGROUNDS[
              index % CONNECTOR_ICON_BACKGROUNDS.length
            ]
          }
          className={cx(styles['card-icon'])}
        />
        <div className={cx(styles['card-heading'])}>
          <span className={cx(styles['card-name'])} title={item.name}>
            {item.name}
          </span>
          <div className={cx(styles['card-desc'])} title={item.description}>
            {item.description}
          </div>
        </div>
        <div className={cx(styles['card-actions'])}>
          <ConnectSlot item={item} busy={!!busy} onDisconnect={onDisconnect} />
          <Switch
            className={cx(styles['card-switch'])}
            size="small"
            checked={item.connected === true}
            loading={busy}
            aria-label={item.name}
            onClick={(_, event) => {
              event.stopPropagation();
              onToggleConnect(item);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ConnectorGridCard);

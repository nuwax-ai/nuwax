/**
 * list 变体行：单栏横排紧凑行——圆形小图标 + 名称/描述上下两行 +
 * 连接状态槽 + 右端开关。无边线，悬停方形圆角灰底；hover「断开」覆盖
 * 状态标。与 grid 变体功能一致，仅布局不同；无选中交互。
 */
import { t } from '@/services/i18nRuntime';
import { Button, Switch } from 'antd';
import classNames from 'classnames';
import React from 'react';
import {
  CONNECTOR_ICON_BACKGROUNDS,
  type ConnectorCardBaseProps,
} from './ConnectorGridCard';
import ConnectorIcon from './ConnectorIcon';
import styles from './index.less';

const cx = classNames.bind(styles);

const ConnectorListRow: React.FC<ConnectorCardBaseProps> = ({
  item,
  index,
  onToggleConnect,
  onDisconnect,
  busyKeys,
}) => {
  const busy = busyKeys?.includes(item.key);
  return (
    <div data-connector-key={item.key} className={cx(styles['list-row'])}>
      <ConnectorIcon
        icon={item.icon}
        name={item.name}
        background={
          CONNECTOR_ICON_BACKGROUNDS[index % CONNECTOR_ICON_BACKGROUNDS.length]
        }
        className={cx(styles['list-icon'])}
      />
      <div className={cx(styles['card-heading'])}>
        <span className={cx(styles['card-name'])} title={item.name}>
          {item.name}
        </span>
        <div className={cx(styles['card-desc'])} title={item.description}>
          {item.description}
        </div>
      </div>
      <div className={cx(styles['list-actions'])}>
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
  );
};

export default React.memo(ConnectorListRow);

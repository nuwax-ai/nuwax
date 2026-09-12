/**
 * list 变体行：单栏横排紧凑行——圆形小图标 + 名称/描述上下两行 +
 * 右端悬停「选择」+ 常驻启用开关。无边线，悬停方形圆角灰底。
 * 与 grid 变体功能一致（选中/开关/付费角标），仅布局不同。
 */
import { t } from '@/services/i18nRuntime';
import { Badge, Button, Switch } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import {
  SKILL_ICON_BACKGROUNDS,
  type SkillCardBaseProps,
} from './SkillGridCard';
import SkillIcon from './SkillIcon';

const cx = classNames.bind(styles);

const SkillListRow: React.FC<SkillCardBaseProps> = ({
  item,
  index,
  onSelect,
  onToggleEnable,
  enableBusyKeys,
}) => {
  const row = (
    <div
      data-skill-key={item.key}
      className={cx(styles['list-row'])}
      onClick={() => onSelect(item)}
    >
      <SkillIcon
        icon={item.icon}
        name={item.name}
        background={
          SKILL_ICON_BACKGROUNDS[index % SKILL_ICON_BACKGROUNDS.length]
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
        <Button
          size="small"
          className={cx(styles['card-hire'], styles['card-select'])}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(item);
          }}
        >
          {t('PC.Components.CapabilityModal.select')}
        </Button>
        <Switch
          className={cx(styles['card-switch'])}
          size="small"
          checked={item.enabled === true}
          loading={enableBusyKeys?.includes(item.key)}
          aria-label={t(
            item.enabled
              ? 'PC.Components.CapabilityModal.unEnable'
              : 'PC.Components.CapabilityModal.enable',
          )}
          onClick={(_, event) => {
            event.stopPropagation();
            onToggleEnable(item);
          }}
        />
      </div>
    </div>
  );
  if (item.paymentRequired) {
    return (
      <Badge.Ribbon
        placement="start"
        className={cx(styles['paid-ribbon'])}
        text={t(
          item.subscribed
            ? 'PC.Pages.Square.SingleAgent.subscribed'
            : 'PC.Pages.Square.SingleAgent.paid',
        )}
      >
        {row}
      </Badge.Ribbon>
    );
  }
  return row;
};

export default React.memo(SkillListRow);

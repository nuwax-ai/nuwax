/**
 * list 变体行：单栏横排紧凑行——圆角方小图标 + 名称/描述上下两行 +
 * 右端相对时间。无边线，悬停方形圆角灰底；整行点击即选中（list 紧凑
 * 场景不渲染悬停操作按钮，选中/付费角标与 grid 变体一致）。
 */
import { t } from '@/services/i18nRuntime';
import { formatTimeAgo } from '@/utils/common';
import { Badge } from 'antd';
import classNames from 'classnames';
import React from 'react';
import {
  EXPERT_ICON_BACKGROUNDS,
  type ExpertCardBaseProps,
} from './ExpertGridCard';
import ExpertIcon from './ExpertIcon';
import styles from './index.less';

const cx = classNames.bind(styles);

const ExpertListRow: React.FC<ExpertCardBaseProps> = ({
  item,
  index,
  onSelect,
}) => {
  const row = (
    <div
      data-expert-key={item.key}
      className={cx(styles['list-row'])}
      onClick={() => onSelect(item)}
    >
      <ExpertIcon
        icon={item.icon}
        name={item.name}
        background={
          EXPERT_ICON_BACKGROUNDS[index % EXPERT_ICON_BACKGROUNDS.length]
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
      {item.usedTime && (
        <span className={cx(styles['card-used-time'])} title={item.usedTime}>
          {formatTimeAgo(item.usedTime)}
        </span>
      )}
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

export default React.memo(ExpertListRow);

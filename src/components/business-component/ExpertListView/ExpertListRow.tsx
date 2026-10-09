/**
 * list 变体行：单栏横排紧凑行——圆角方小图标 + 名称/描述上下两行 +
 * 右端相对时间。无边线，悬停方形圆角灰底；整行点击即选中（list 紧凑
 * 场景不渲染悬停操作按钮，选中/付费角标与 grid 变体一致）。
 * simple 模式：无背景圆形图标 + 标题单行，不渲染描述与时间；付费标识
 * 经行尾内联小 Tag 展示（左上角 Ribbon 会被弹层滚动容器裁切且压住图标，
 * 同 AppDev CombinedMentionSelector 口径）。
 */
import { t } from '@/services/i18nRuntime';
import { formatTimeAgo } from '@/utils/common';
import { Badge, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import {
  EXPERT_ICON_BACKGROUNDS,
  type ExpertCardBaseProps,
} from './ExpertGridCard';
import ExpertIcon from './ExpertIcon';
import styles from './index.less';

const cx = classNames.bind(styles);

const ExpertListRow: React.FC<ExpertCardBaseProps & { simple?: boolean }> = ({
  item,
  index,
  onSelect,
  simple = false,
}) => {
  const row = (
    <div
      data-expert-key={item.key}
      className={cx(styles['list-row'], simple && styles['row-simple'])}
      onClick={() => onSelect(item)}
    >
      <ExpertIcon
        icon={item.icon}
        name={item.name}
        background={
          simple
            ? 'transparent'
            : EXPERT_ICON_BACKGROUNDS[index % EXPERT_ICON_BACKGROUNDS.length]
        }
        className={cx(styles['list-icon'], simple && styles['icon-simple'])}
      />
      <div className={cx(styles['card-heading'])}>
        <span className={cx(styles['card-name'])} title={item.name}>
          {item.name}
        </span>
        {!simple && (
          <div className={cx(styles['card-desc'])} title={item.description}>
            {item.description}
          </div>
        )}
      </div>
      {!simple && item.usedTime && (
        <span className={cx(styles['card-used-time'])} title={item.usedTime}>
          {formatTimeAgo(item.usedTime)}
        </span>
      )}
      {simple && item.paymentRequired && (
        <Tag
          className={cx(styles['paid-tag'])}
          color={item.subscribed ? 'success' : 'processing'}
        >
          {t(
            item.subscribed
              ? 'PC.Pages.Square.SingleAgent.subscribed'
              : 'PC.Pages.Square.SingleAgent.paid',
          )}
        </Tag>
      )}
    </div>
  );
  if (item.paymentRequired && !simple) {
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

import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { getImg } from '@/utils/workflow';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface SelectedAgentCardProps {
  /** 已选智能体信息 */
  item: SquarePublishedItemInfo;
  /** 点击卡片回调（打开选择弹窗） */
  onClick?: () => void;
}

/**
 * 已选智能体展示卡片
 * 左右布局：左侧图标，右侧名称与描述上下排列
 */
const SelectedAgentCard: React.FC<SelectedAgentCardProps> = ({
  item,
  onClick,
}) => {
  return (
    <div className={cx(styles['card'])} onClick={onClick}>
      <img
        src={item.icon || getImg(AgentComponentTypeEnum.Agent)}
        alt=""
        className={cx(styles['icon'])}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = getImg(AgentComponentTypeEnum.Agent) || '';
        }}
      />
      <div className={cx(styles['content'])}>
        <EllipsisTooltip
          className={cx(styles['name'])}
          text={item.name}
          maxLines={2}
        />
        {item.description?.trim() ? (
          <EllipsisTooltip
            className={cx(styles['desc'])}
            text={item.description}
          />
        ) : null}
      </div>
    </div>
  );
};

export default SelectedAgentCard;

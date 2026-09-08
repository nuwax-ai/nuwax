/**
 * 资源卡片（纯展示）
 * @description 专家/技能/连接器通用的聚合卡片：图标 + 名称 + 分类标签 + 描述 + 底部统计
 */

import SvgIcon from '@/components/base/SvgIcon';
import {
  LinkOutlined,
  StarOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { ResourceItem, ResourceStatType } from '../../../../types';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 首字回退头像的背景色板（按名称哈希取色，保证同名同色） */
const AVATAR_COLORS = [
  '#7C5CFF',
  '#3B82F6',
  '#14B8A6',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
  '#84CC16',
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const STAT_ICON_MAP: Record<ResourceStatType, React.ReactNode> = {
  user: <UserOutlined />,
  link: <LinkOutlined />,
  star: <StarOutlined />,
  tool: <ToolOutlined />,
};

const ResourceCard: React.FC<{ item: ResourceItem }> = ({ item }) => {
  const { name, description, icon, category, stats } = item;

  return (
    <div className={cx(styles.card)}>
      <div className={cx('flex', 'items-center', styles['card-head'])}>
        {icon ? (
          <SvgIcon name={icon} className={cx(styles['card-icon'])} />
        ) : (
          <div
            className={cx(
              'flex',
              'items-center',
              'content-center',
              styles['card-avatar'],
            )}
            style={{ backgroundColor: getAvatarColor(name) }}
          >
            {name?.charAt(0)}
          </div>
        )}
        <Tooltip title={name}>
          <span className={cx('text-ellipsis', 'flex-1', styles['card-name'])}>
            {name}
          </span>
        </Tooltip>
      </div>

      {category ? (
        <div className={cx(styles['card-category'])}>{category}</div>
      ) : null}

      <Tooltip title={description} placement="topLeft">
        <div className={cx(styles['card-desc'])}>{description || '-'}</div>
      </Tooltip>

      {stats && stats.length > 0 ? (
        <div className={cx('flex', 'items-center', styles['card-stats'])}>
          {stats.map((stat) => (
            <span
              key={stat.type}
              className={cx('flex', 'items-center', styles['card-stat'])}
            >
              {STAT_ICON_MAP[stat.type]}
              <span>{stat.value}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default React.memo(ResourceCard);

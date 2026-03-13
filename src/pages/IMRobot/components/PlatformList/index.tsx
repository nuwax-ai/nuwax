import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export type PlatformType = 'all' | 'dingtalk' | 'lark' | 'wechat';

interface PlatformItem {
  id: PlatformType;
  name: string;
  count: number;
  icon: string;
  color: string;
  char: string;
}

interface PlatformListProps {
  value: PlatformType;
  onChange: (value: PlatformType) => void;
  counts?: Record<string, number>;
}

const PlatformList: React.FC<PlatformListProps> = ({
  value,
  onChange,
  counts = {},
}) => {
  const totalCount = useMemo(() => {
    return Object.values(counts).reduce((acc, cur) => acc + cur, 0);
  }, [counts]);

  const platforms: PlatformItem[] = useMemo(
    () => [
      {
        id: 'all',
        name: '全部',
        count: totalCount,
        icon: '',
        color: '#666',
        char: '全',
      },
      {
        id: 'lark',
        name: '飞书',
        count: counts.lark || 0,
        icon: '',
        color: '#3370FF',
        char: '飞',
      },
      {
        id: 'dingtalk',
        name: '钉钉',
        count: counts.dingtalk || 0,
        icon: '',
        color: '#0089FF',
        char: '钉',
      },
      {
        id: 'wechat',
        name: '企业微信',
        count: counts.wechat || 0,
        icon: '',
        color: '#1E7E34',
        char: '企',
      },
    ],
    [counts, totalCount],
  );

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.header)}>平台列表</div>
      <div className={cx(styles.listWrapper)}>
        {platforms.map((item) => {
          const isActive = value === item.id;
          return (
            <div
              key={item.id}
              className={cx(styles.item, { [styles.active]: isActive })}
              onClick={() => onChange(item.id)}
            >
              <div
                className={cx(styles.icon)}
                style={{ backgroundColor: item.color }}
              >
                {item.char}
              </div>
              <div className={cx(styles.info)}>
                <div className={cx(styles.name)}>{item.name}</div>
                <div className={cx(styles.count)}>{item.count} 个机器人</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlatformList;

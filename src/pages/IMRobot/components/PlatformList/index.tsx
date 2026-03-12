import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export type PlatformType =
  | 'all'
  | 'dingtalk'
  | 'lark'
  | 'wechat'
  | 'slack'
  | 'teams'
  | 'telegram'
  | 'discord'
  | 'whatsapp'
  | 'wechat_personal'
  | 'line'
  | 'kakaotalk'
  | 'zoom'
  | 'rcs';

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
  const platforms: PlatformItem[] = useMemo(
    () => [
      {
        id: 'dingtalk',
        name: '钉钉',
        count: counts.dingtalk || 9,
        icon: '',
        color: '#0089FF',
        char: '钉',
      },
      {
        id: 'lark',
        name: '飞书',
        count: counts.lark || 9,
        icon: '',
        color: '#3370FF',
        char: '飞',
      },
      {
        id: 'wechat',
        name: '企业微信',
        count: counts.wechat || 7,
        icon: '',
        color: '#1E7E34',
        char: '企',
      },
      {
        id: 'slack',
        name: 'Slack',
        count: counts.slack || 0,
        icon: '',
        color: '#4A154B',
        char: 'S',
      },
      {
        id: 'teams',
        name: 'Microsoft Teams',
        count: counts.teams || 0,
        icon: '',
        color: '#6264A7',
        char: 'T',
      },
      {
        id: 'telegram',
        name: 'Telegram',
        count: counts.telegram || 0,
        icon: '',
        color: '#0088CC',
        char: 'T',
      },
      {
        id: 'discord',
        name: 'Discord',
        count: counts.discord || 0,
        icon: '',
        color: '#5865F2',
        char: 'D',
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        count: counts.whatsapp || 0,
        icon: '',
        color: '#25D366',
        char: 'W',
      },
      {
        id: 'wechat_personal',
        name: '微信',
        count: counts.wechat_personal || 0,
        icon: '',
        color: '#07C160',
        char: '微',
      },
      {
        id: 'line',
        name: 'LINE',
        count: counts.line || 0,
        icon: '',
        color: '#00B900',
        char: 'L',
      },
      {
        id: 'kakaotalk',
        name: 'KakaoTalk',
        count: counts.kakaotalk || 0,
        icon: '',
        color: '#FFCD00',
        char: 'K',
      },
      {
        id: 'zoom',
        name: 'Zoom',
        count: counts.zoom || 0,
        icon: '',
        color: '#2D8CFF',
        char: 'Z',
      },
      {
        id: 'rcs',
        name: 'RCS',
        count: counts.rcs || 0,
        icon: '',
        color: '#4A5CF2',
        char: 'R',
      },
    ],
    [counts],
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

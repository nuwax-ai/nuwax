import {
  IM_PLATFORM_ICON_MAP,
  IM_PLATFORM_LABEL_MAP,
  IMPlatformEnum,
} from '@/constants/imRobot.constants';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export type PlatformType = IMPlatformEnum | undefined;

interface PlatformItem {
  id: IMPlatformEnum;
  name: string;
  count: number;
  icon: string;
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
        id: IMPlatformEnum.Feishu,
        name: IM_PLATFORM_LABEL_MAP[IMPlatformEnum.Feishu],
        count: counts.feishu || 0,
        icon: IM_PLATFORM_ICON_MAP[IMPlatformEnum.Feishu],
      },
      {
        id: IMPlatformEnum.Dingding,
        name: IM_PLATFORM_LABEL_MAP[IMPlatformEnum.Dingding],
        count: counts.dingding || 0,
        icon: IM_PLATFORM_ICON_MAP[IMPlatformEnum.Dingding],
      },
      {
        id: IMPlatformEnum.Wework,
        name: IM_PLATFORM_LABEL_MAP[IMPlatformEnum.Wework],
        count: counts.wework || 0,
        icon: IM_PLATFORM_ICON_MAP[IMPlatformEnum.Wework],
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
              <div className={cx(styles.icon)}>
                <img src={item.icon} alt={item.name} />
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

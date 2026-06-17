import SelectionList, {
  type SelectionListItem,
} from '@/components/SelectionList';
import {
  IM_PLATFORM_ICON_MAP,
  IMPlatformEnum,
} from '@/constants/imChannel.constants';
import { dict } from '@/services/i18nRuntime';
import React, { useMemo } from 'react';

export type PlatformType = IMPlatformEnum | undefined;

interface PlatformListProps {
  value: PlatformType;
  onChange: (value: PlatformType) => void;
  list?: { channel: string; channelName: string; count: number }[];
}

const PlatformList: React.FC<PlatformListProps> = ({
  value,
  onChange,
  list = [],
}) => {
  const selectionItems = useMemo<SelectionListItem<PlatformType>[]>(
    () =>
      list.map((item) => ({
        icon: IM_PLATFORM_ICON_MAP[item.channel as IMPlatformEnum],
        label: item.channelName,
        description: dict(
          'PC.Pages.IMChannel.PlatformList.robotCount',
          String(item.count || 0),
        ),
        value: item.channel as IMPlatformEnum,
      })),
    [list],
  );

  return (
    <SelectionList
      title={dict('PC.Pages.IMChannel.PlatformList.platformList')}
      list={selectionItems}
      value={value}
      onChange={onChange}
    />
  );
};

export default PlatformList;

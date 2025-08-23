import Icon from '@ant-design/icons';
import React from 'react';
import CHAT_ICON_MAP from './chat.constants';
import COMMON_ICON_MAP from './common.constants';
import NAV_ICON_MAP from './nav.constants';

const nameToComponent: Record<string, React.FC> = {
  ...NAV_ICON_MAP,
  ...CHAT_ICON_MAP,
  ...COMMON_ICON_MAP,
};

export interface SvgIconProps
  extends Omit<React.ComponentProps<typeof Icon>, 'component'> {
  /** 图标名称（内部静态映射） */
  name: string;
  style?: React.CSSProperties;
}

const DEFAULT_FONT_SIZE = 20;
const SvgIcon: React.FC<SvgIconProps> = ({ name, style, ...rest }) => {
  const mergedStyle = {
    ...style,
    ...(!style?.fontSize && { fontSize: DEFAULT_FONT_SIZE }),
  };

  if (typeof name === 'string' && name.includes('://')) {
    return <img src={name} alt="" style={mergedStyle} />;
  }

  const Comp = nameToComponent[name];
  if (!Comp) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`SvgIcon 未找到名称为 "${name}" 的图标组件`);
    }
    return null;
  }

  return <Icon component={Comp as React.FC} style={mergedStyle} {...rest} />;
};

export default SvgIcon;

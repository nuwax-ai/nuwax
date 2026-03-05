import Icon from '@ant-design/icons';
import React from 'react';
import CHAT_ICON_MAP from './chat.constants';
import COMMON_ICON_MAP from './common.constants';
import NAV_ICON_MAP from './nav.constants';
import WORKSPACE_ICON_MAP from './workspace.constants';

const nameToComponent: Record<string, React.FC> = {
  ...NAV_ICON_MAP,
  ...CHAT_ICON_MAP,
  ...COMMON_ICON_MAP,
  ...WORKSPACE_ICON_MAP,
};

export interface SvgIconProps
  extends Omit<React.ComponentProps<typeof Icon>, 'component'> {
  /** 图标名称（内部静态映射） */
  name: string;
  style?: React.CSSProperties;
}

const DEFAULT_FONT_SIZE = 20;
const SvgIcon: React.FC<SvgIconProps> = ({
  name,
  style,
  className,
  ...rest
}) => {
  const mergedStyle = {
    ...style,
    ...(!style?.fontSize && { fontSize: DEFAULT_FONT_SIZE }),
  };

  if (typeof name === 'string' && name.includes('://')) {
    /**
     * 远程 SVG 图标：
     * 使用 CSS mask + currentColor 的方式渲染，这样可以通过外层的 color 控制图标颜色，
     * 包括 :hover 时改变颜色。
     */
    if (name.toLowerCase().endsWith('.svg')) {
      return (
        <div
          // 将图标形状作为 mask，实际用背景色渲染，这样 color/currentColor 可以生效
          className={className}
          style={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            mask: `url(${name}) no-repeat center center`,
            WebkitMask: `url(${name}) no-repeat center center`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            // 使用 currentColor，让父元素的 color（含 hover）控制图标颜色
            backgroundColor: 'currentColor',
            width: '1em',
            height: '1em',
            ...mergedStyle,
          }}
        />
      );
    }

    // 其它远程图片（png/jpg 等），直接 img 渲染，无法通过 color 改色
    return (
      <img
        src={name}
        alt=""
        style={{ ...mergedStyle, width: '1em', height: '1em' }}
      />
    );
  }

  const Comp = nameToComponent[name];
  if (!Comp) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`SvgIcon 未找到名称为 "${name}" 的图标组件`);
    }
    return null;
  }

  return (
    <Icon
      component={Comp as React.FC}
      style={mergedStyle}
      className={className}
      {...rest}
    />
  );
};

export default SvgIcon;

import { ReactComponent as DocSvgFile } from '@/assets/icons/nav/doc.svg';
import { ReactComponent as EcosystemSvgFile } from '@/assets/icons/nav/ecosystem.svg';
import { ReactComponent as HomeSvgFile } from '@/assets/icons/nav/home.svg';
import { ReactComponent as NewChatSvgFile } from '@/assets/icons/nav/new_chat.svg';
import { ReactComponent as NotificationSvgFile } from '@/assets/icons/nav/notification.svg';
import { ReactComponent as PluginsSvgFile } from '@/assets/icons/nav/plugins.svg';
import { ReactComponent as SettingsSvgFile } from '@/assets/icons/nav/settings.svg';
import { ReactComponent as SquareSvgFile } from '@/assets/icons/nav/square.svg';
import { ReactComponent as StarsSvgFile } from '@/assets/icons/nav/stars.svg';
import { ReactComponent as TemplateSvgFile } from '@/assets/icons/nav/template.svg';
import { ReactComponent as WorkflowSvgFile } from '@/assets/icons/nav/workflow.svg';
import { ReactComponent as WorkspaceSvgFile } from '@/assets/icons/nav/workspace.svg';
import Icon from '@ant-design/icons';
import { theme } from 'antd';
import React from 'react';
import './index.less';

/**
 * SvgIcon（基于 antd Icon 的自定义实现）
 * - 目的：支持通过 style 或 props 动态设置颜色(color)与大小(size)
 * - 使用：
 *   <SvgIcon name="icons-nav-home" size={24} color="#1677ff" />
 *   <SvgIcon name="icons-nav-home" style={{ fontSize: 24, color: '#1677ff' }} />
 */

// 使用文件方式（SVGR）导入 SVG，并包装以便注入统一的 className
type SvgFactory = React.FC<React.SVGProps<SVGSVGElement>>;
const wrapSvg =
  (Comp: SvgFactory): SvgFactory =>
  (props) =>
    (
      <Comp
        {...props}
        viewBox="0 0 24 24"
        className={`xagi-svg-icon ${props.className || ''}`.trim()}
        style={{ ...(props.style || {}) }}
      />
    );

const HomeSvg = wrapSvg(HomeSvgFile);
const WorkspaceSvg = wrapSvg(WorkspaceSvgFile);
const SquareSvg = wrapSvg(SquareSvgFile);
const EcosystemSvg = wrapSvg(EcosystemSvgFile);
const DocSvg = wrapSvg(DocSvgFile);
const SettingsSvg = wrapSvg(SettingsSvgFile);
const StarsSvg = wrapSvg(StarsSvgFile);
const PluginsSvg = wrapSvg(PluginsSvgFile);
const TemplateSvg = wrapSvg(TemplateSvgFile);
const WorkflowSvg = wrapSvg(WorkflowSvgFile);
const NewChatSvg = wrapSvg(NewChatSvgFile);
const NotificationSvg = wrapSvg(NotificationSvgFile);

const nameToComponent: Record<string, React.FC> = {
  'icons-nav-home': HomeSvg,
  'icons-nav-workspace': WorkspaceSvg,
  'icons-nav-ecosystem': EcosystemSvg,
  'icons-nav-square': SquareSvg,
  'icons-nav-doc': DocSvg,
  'icons-nav-settings': SettingsSvg,
  'icons-nav-stars': StarsSvg,
  'icons-nav-plugins': PluginsSvg,
  'icons-nav-template': TemplateSvg,
  'icons-nav-workflow': WorkflowSvg,
  'icons-nav-new_chat': NewChatSvg,
  'icons-nav-notification': NotificationSvg,
};

export interface SvgIconProps
  extends Omit<React.ComponentProps<typeof Icon>, 'component'> {
  /** 图标名称（内部静态映射） */
  name: string;
  style?: React.CSSProperties;
  active?: boolean;
}

const SvgIcon: React.FC<SvgIconProps> = ({
  name,
  style,
  active = false,
  ...rest
}) => {
  const Comp = nameToComponent[name];
  const {
    token: { colorPrimary },
  } = theme.useToken();
  console.log('colorPrimary', colorPrimary);

  if (!Comp) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`SvgIcon 未找到名称为 "${name}" 的图标组件`);
    }
    return null;
  }
  const mergedStyle = {
    ...style,
    ...(!style?.fontSize && { fontSize: 24 }),
    ...(active && { color: colorPrimary }),
  };

  return <Icon component={Comp as React.FC} style={mergedStyle} {...rest} />;
};

export default SvgIcon;

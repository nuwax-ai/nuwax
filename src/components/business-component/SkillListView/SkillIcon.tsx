/**
 * 技能图标：受保护地址解析（Bearer 解码）+ 失败/为空回退名称首字，
 * 双变体卡片共用；圆形 tinted 底。
 */
import SvgIcon from '@/components/base/SvgIcon';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import React from 'react';

interface SkillIconProps {
  icon?: string;
  name: string;
  /** tinted 底色（外部按序号取色板传入） */
  background: string;
  className?: string;
}

const SkillIcon: React.FC<SkillIconProps> = ({
  icon,
  name,
  background,
  className,
}) => {
  const [iconFailed, setIconFailed] = React.useState(false);
  const { displaySrc } = useAuthProtectedImageSrc(icon);
  const effectiveIcon = iconFailed ? undefined : displaySrc;
  let content: React.ReactNode = name.charAt(0);
  if (effectiveIcon) {
    if (/^(?:https?:\/\/|\/|blob:|data:)/.test(effectiveIcon)) {
      content = (
        <img src={effectiveIcon} alt="" onError={() => setIconFailed(true)} />
      );
    } else if (/^icons?-/.test(effectiveIcon)) {
      content = <SvgIcon name={effectiveIcon} style={{ fontSize: 22 }} />;
    } else {
      content = effectiveIcon;
    }
  }
  return (
    <span className={className} style={{ backgroundColor: background }}>
      {content}
    </span>
  );
};

export default SkillIcon;

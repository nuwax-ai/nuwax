import { SvgIcon } from '@/components/base';
import React from 'react';
import styles from './MobileMenu.less';

type MobileMenuProps = {
  isOpen: boolean; // 菜单是否展开
  onToggle: () => void; // 切换菜单展开/收起
  menuWidth: number; // 动态菜单宽度
};

/**
 * 移动端菜单按钮和遮罩层组件
 * @param isOpen 菜单是否展开
 * @param onToggle 切换菜单展开/收起
 * @param menuWidth 动态菜单宽度
 */
const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onToggle,
  menuWidth,
}) => (
  <>
    {/* 菜单按钮始终显示 */}
    <div
      className={styles.mobileMenuBtn}
      style={{
        left: menuWidth,
        marginLeft: isOpen ? '-14px' : '-10px', // 建议迁移到less
        transition: 'margin-left 0.3s',
      }}
    >
      <SvgIcon
        name="icons-common-caret_left"
        onClick={onToggle}
        rotate={isOpen ? 0 : 180}
      />
    </div>
    {/* 遮罩层，仅在菜单展开时显示 */}
    {isOpen && (
      <div
        className={styles.mobileMenuMask}
        aria-label="菜单遮罩/Menu Mask"
        tabIndex={-1}
        onClick={onToggle}
        role="button"
        aria-hidden={!isOpen}
      />
    )}
  </>
);

export default MobileMenu;

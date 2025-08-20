import menuIcon from '@/assets/images/menu.png';
import { Button } from 'antd';
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
        marginLeft: isOpen ? '-36px' : '6px', // 建议迁移到less
        transition: 'margin-left 0.3s',
      }}
    >
      <Button
        type="text"
        aria-label={isOpen ? '关闭菜单/Close menu' : '展开菜单/Open menu'}
        onClick={onToggle}
        icon={
          <img src={menuIcon} style={{ width: 20, height: 20 }} alt="menu" />
        }
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

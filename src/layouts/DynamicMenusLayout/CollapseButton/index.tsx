import SvgIcon from '@/components/base/SvgIcon';
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import { dict } from '@/services/i18nRuntime';
import { isImmersiveShell } from '@/utils/nuwaClawBridge';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useLocation, useModel, useSearchParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 二级菜单收起/展开切换按钮
 * @description 支持三级优先级：用户操作 > URL参数hideMenu > 默认展开
 */
const CollapseButton: React.FC = () => {
  const { isSecondMenuCollapsed, setIsSecondMenuCollapsed } =
    useModel('layout');
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // 生成localStorage的key（基于当前页面路径）
  const getStorageKey = () => {
    return `menu-collapsed-user-preference`;
  };

  // 存储用户操作状态
  const saveUserPreference = (collapsed: boolean) => {
    try {
      const key = getStorageKey();
      const data = {
        collapsed,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // localStorage可能不可用，安静处理
      console.warn('Failed to save menu preference:', error);
    }
  };

  // 读取用户操作状态
  const getUserPreference = () => {
    try {
      const key = getStorageKey();
      const data = sessionStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.collapsed as boolean;
      }
    } catch (error) {
      console.warn('Failed to read menu preference:', error);
    }
    return null;
  };

  // 初始化菜单状态（三级优先级）
  useEffect(() => {
    // 桌面端：收起能力转移到 nuwaclaw 工具栏，跳过 sessionStorage/URL 初始化，保持 model 初值（false）
    if (isImmersiveShell()) return;
    // 优先级1: 检查用户操作记录
    const userPreference = getUserPreference();
    if (userPreference !== null) {
      setIsSecondMenuCollapsed(userPreference);
      return;
    }

    // 优先级2: 检查URL参数
    const hideMenu = searchParams.get('hideMenu');
    if (hideMenu === 'true') {
      setIsSecondMenuCollapsed(true);
      return;
    }

    // 优先级3: 默认展开（false）
    setIsSecondMenuCollapsed(false);
  }, [searchParams, setIsSecondMenuCollapsed, location.pathname]);

  // 计算按钮贴边位置：单栏模式（主导航改造）下无一级竖栏，
  // 展开时贴侧栏右缘，收起时贴窗口左缘
  const menuTotalWidth = NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH;

  // 处理点击事件（保存用户操作到localStorage）
  const handleToggleCollapse = () => {
    const newState = !isSecondMenuCollapsed;
    //当用户手动展开时 去除 用户操作标记
    if (!newState) {
      sessionStorage.removeItem(getStorageKey());
    } else {
      // 保存用户操作状态
      saveUserPreference(newState);
    }
    // 更新状态
    setIsSecondMenuCollapsed(newState);
  };

  // 桌面端：收起按钮隐藏，能力转移到 nuwaclaw 工具栏
  if (isImmersiveShell()) return null;

  return (
    <Tooltip
      title={
        isSecondMenuCollapsed
          ? dict('PC.Layouts.DynamicMenusLayout.CollapseButton.expandMenu')
          : dict('PC.Layouts.DynamicMenusLayout.CollapseButton.collapseMenu')
      }
      placement="right"
      arrow={false}
    >
      <div
        className={cx(styles['collapse-button'], {
          [styles.collapsed]: isSecondMenuCollapsed,
        })}
        onClick={handleToggleCollapse}
        style={{
          left: isSecondMenuCollapsed ? 0 : menuTotalWidth,
        }}
      >
        <SvgIcon
          name="icons-common-caret_left"
          rotate={isSecondMenuCollapsed ? 180 : 0}
          className={cx(styles.icon)}
        />
      </div>
    </Tooltip>
  );
};

export default CollapseButton;

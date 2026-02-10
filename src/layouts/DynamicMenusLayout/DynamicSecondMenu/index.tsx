/**
 * 动态二级/三级菜单组件
 * @description 直接复用现有 SecondMenuItem 组件，保持样式一致
 * 支持特殊菜单（主页、工作空间）注入默认内容
 */
import SecondMenuItem from '@/components/base/SecondMenuItem';
import SvgIcon from '@/components/base/SvgIcon';
import type { MenuItemDto } from '@/types/interfaces/menu';
import React, { useCallback, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
// 导入特殊内容组件
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum, SpaceTypeEnum } from '@/types/enums/space';
import EcosystemMarketSection from '../EcosystemMarketSection';
import HomeSection from '../HomeSection';
import SquareSection from '../SquareSection';

export interface DynamicSecondMenuProps {
  /** 父级菜单的 code */
  parentCode: string;
  /** 覆盖容器样式 */
  overrideContainerStyle?: React.CSSProperties;
}

/**
 * 动态二级/三级菜单组件
 * 复用现有的 SecondMenuItem 组件实现，保持 UI 样式一致
 * 特殊处理：主页显示最近使用+会话记录，工作空间显示最近编辑+开发收藏
 */
const DynamicSecondMenu: React.FC<DynamicSecondMenuProps> = ({
  parentCode,
  overrideContainerStyle,
}) => {
  const location = useLocation();
  const params = useParams();

  // 展开的菜单 code 列表
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const { getSecondLevelMenus } = useModel('menuModel');

  const { currentSpaceInfo } = useModel('spaceModel');
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

  // 获取二级菜单
  const secondMenus: MenuItemDto[] = getSecondLevelMenus(parentCode);

  /**
   * 切换展开状态
   */
  const toggleExpand = useCallback((code: string) => {
    setExpandedMenus((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }, []);

  /**
   * 处理动态路径，从当前路由参数中提取值并替换路径中的动态参数
   * @param path 包含动态参数的路径，如 /space/:spaceId/develop
   * @returns 替换后的路径，如 /space/123/develop
   */
  const resolveDynamicPath = useCallback(
    (path: string): string => {
      if (!path.includes(':')) {
        // 没有动态参数，直接返回
        return path;
      }

      let resolvedPath = path;

      // 提取路径中的所有动态参数（如 :spaceId, :agentId）
      // 使用 match 方法获取所有匹配项
      const paramMatches = path.matchAll(/:(\w+)/g);
      const matchesArray = Array.from(paramMatches);

      // 遍历所有匹配的动态参数
      matchesArray.forEach((match) => {
        const paramName = match[1]; // 参数名，如 spaceId
        const paramValue = params[paramName]; // 从当前路由参数中获取值

        if (paramValue) {
          // 替换路径中的动态参数
          resolvedPath = resolvedPath.replace(
            `:${paramName}`,
            String(paramValue),
          );
        } else {
          // 如果找不到对应的参数值，保持原样或返回原路径
          console.warn(
            `[DynamicSecondMenu] 无法从路由参数中找到 ${paramName}，路径: ${path}`,
          );
        }
      });

      return resolvedPath;
    },
    [params],
  );

  /**
   * 点击菜单项
   * - 有子菜单：仅展开/折叠，不导航
   * - 无子菜单：直接路由跳转
   */
  const handleMenuClick = useCallback(
    (menu: MenuItemDto) => {
      const hasChildren = menu.children && menu.children.length > 0;

      if (hasChildren) {
        // 有子菜单，仅切换展开状态
        toggleExpand(menu.code as string);
      } else if (menu.path) {
        // 处理动态路径
        const resolvedPath = resolveDynamicPath(menu.path);
        // 无子菜单，直接路由跳转
        history.push(resolvedPath, { _t: Date.now() });
      }
    },
    [toggleExpand, resolveDynamicPath],
  );

  /**
   * 判断菜单是否激活
   * 支持动态路径匹配，如果路径包含动态参数，会先解析后再比较
   */
  const isActive = useCallback(
    (path?: string) => {
      if (!path) return false;

      let targetPath = path;

      // 如果路径包含动态参数，先解析路径
      if (targetPath.includes(':')) {
        const resolvedPath = resolveDynamicPath(targetPath);

        // 如果解析后仍然包含 ':'，说明有参数未找到，使用正则表达式匹配
        if (resolvedPath.includes(':')) {
          // 将动态路径转换为正则表达式进行匹配
          // 例如: /space/:spaceId/develop -> /space/[^/]+/develop
          const pattern = targetPath.replace(/:(\w+)/g, '[^/]+');
          const regex = new RegExp(`^${pattern}(/.*)?$`);
          return regex.test(location.pathname);
        }

        // 使用解析后的路径进行匹配
        targetPath = resolvedPath;
      }

      // 精确匹配或前缀匹配
      return (
        location.pathname === targetPath ||
        location.pathname.startsWith(targetPath + '/')
      );
    },
    [location.pathname, resolveDynamicPath],
  );

  /**
   * 判断是否有任何子菜单激活（递归）
   */
  // const hasActiveChild = useCallback(
  //   (menu: MenuItemDto): boolean => {
  //     if (!menu.children?.length) return false;
  //     return menu.children.some(
  //       (child) =>
  //         isActive(child.path) ||
  //         (child.children?.length && hasActiveChild(child)),
  //     );
  //   },
  //   [isActive],
  // );

  /**
   * 递归渲染菜单项
   * @param menu 菜单项数据
   * @param level 菜单层级（从0开始，用于缩进）
   * @param isFirst 是否是同级第一个
   * @returns 渲染的菜单项
   */
  const renderMenuItem = useCallback(
    (menu: MenuItemDto, level: number = 0): React.ReactNode => {
      const hasChildren = menu.children && menu.children.length > 0;
      const menuCode = menu.code || '';
      const isExpanded = expandedMenus.includes(menuCode);
      const menuActive = isActive(menu.path);
      // 根据层级计算缩进，每级缩进 16px
      const indent = level * 16;

      // 个人空间时，不显示"成员与设置"(编码：member_setting) , 普通用户也不显示"成员与设置"
      if (
        (currentSpaceInfo?.type === SpaceTypeEnum.Personal ||
          currentSpaceInfo?.currentUserRole === RoleEnum.User) &&
        menuCode === 'member_setting'
      ) {
        return null;
      }

      // “开发者功能”【tips：关闭后，用户将无法看见“智能体开发”和“组件库”(编码：agent_dev, component_lib_dev)，创建者和管理员不受影响】
      if (
        currentSpaceInfo?.currentUserRole === RoleEnum.User &&
        currentSpaceInfo?.allowDevelop === AllowDevelopEnum.Not_Allow &&
        (menuCode === 'agent_dev' || menuCode === 'component_lib_dev')
      ) {
        return null;
      }

      // 如果没有子菜单，使用 SubItem 组件
      if (!hasChildren) {
        return (
          <SecondMenuItem.SubItem
            key={menuCode}
            icon={menu.icon ? <SvgIcon name={menu.icon} /> : undefined}
            name={menu.name}
            style={{ marginLeft: indent }}
            isActive={menuActive}
            onClick={() => {
              if (menu.path) {
                // 关闭移动端菜单
                handleCloseMobileMenu();
                // 处理动态路径
                const resolvedPath = resolveDynamicPath(menu.path);
                history.push(resolvedPath, { _t: Date.now() });
              }
            }}
          />
        );
      }

      // 如果有子菜单，使用 SecondMenuItem 组件，并递归渲染子菜单
      return (
        <div key={menuCode} className="flex flex-col gap-4">
          <SecondMenuItem
            icon={menu.icon ? <SvgIcon name={menu.icon} /> : undefined}
            name={menu.name}
            style={{ marginLeft: indent }}
            isActive={menuActive}
            isDown={true} // 有子菜单时显示折叠展开图标
            isOpen={isExpanded}
            onClick={() => handleMenuClick(menu)}
            onToggle={() => toggleExpand(menuCode)}
          />
          {/* 递归渲染子菜单 */}
          {isExpanded &&
            menu.children?.map((child) => renderMenuItem(child, level + 1))}
        </div>
      );
    },
    [
      expandedMenus,
      isActive,
      resolveDynamicPath,
      handleMenuClick,
      toggleExpand,
      currentSpaceInfo,
    ],
  );

  /**
   * 渲染特殊内容区域
   */
  // 主页、系统广场、生态市场特殊处理：直接渲染对应的 Section 组件
  // 主页 homepage: 最近使用 + 会话记录
  if (parentCode === 'homepage') {
    return <HomeSection style={overrideContainerStyle} />;
  }

  // 系统广场
  if (parentCode === 'system_square') {
    return <SquareSection style={overrideContainerStyle} />;
  }

  // 生态市场
  if (parentCode === 'eco_market') {
    return <EcosystemMarketSection style={overrideContainerStyle} />;
  }

  // 如果没有二级菜单，不渲染
  if (!secondMenus.length) {
    return null;
  }

  return (
    <div className={'flex flex-col gap-4'}>
      {secondMenus.map((menu: MenuItemDto) => renderMenuItem(menu))}
    </div>
  );
};

export default DynamicSecondMenu;

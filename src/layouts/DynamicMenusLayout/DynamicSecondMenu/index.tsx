/**
 * 动态二级/三级菜单组件
 * @description 直接复用现有 SecondMenuItem 组件，保持样式一致
 * 支持特殊菜单（主页、工作空间）注入默认内容
 */
import SecondMenuItem from '@/components/base/SecondMenuItem';
import type { MenuItemDto } from '@/types/interfaces/menu';
import React, { useCallback, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
// 导入特殊内容组件
import { PATH_URL } from '@/constants/home.constants';
import { OpenTypeEnum } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum, SpaceTypeEnum } from '@/types/enums/space';
import { message } from 'antd';

export interface DynamicSecondMenuProps {
  /** 父级菜单的 code */
  parentCode: string;
}

/**
 * 动态二级/三级菜单组件
 * 复用现有的 SecondMenuItem 组件实现，保持 UI 样式一致
 * 特殊处理：主页显示最近使用+会话记录，工作空间显示最近编辑+开发收藏
 */
const DynamicSecondMenu: React.FC<DynamicSecondMenuProps> = ({
  parentCode,
}) => {
  const location = useLocation();
  const params = useParams();

  // 展开的菜单 code 列表
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const { getSecondLevelMenus } = useModel('menuModel');

  const { currentSpaceInfo, spaceList } = useModel('spaceModel');
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
   * 从路径中提取 spaceId
   * 例如：从 /space/42/develop 中提取 42
   */
  const extractSpaceIdFromPath = useCallback((path: string): string | null => {
    if (!path) return null;
    // 去掉查询参数
    const cleanPath = path.split('?')[0];
    // 匹配 /space/{spaceId}/... 格式
    const match = cleanPath.match(/\/space\/([^/]+)/);
    return match ? match[1] : null;
  }, []);

  /**
   * 处理动态路径，从当前路由参数中提取值并替换路径中的动态参数
   * @param path 包含动态参数的路径，如 /space/:spaceId/develop
   * @returns 替换后的路径，如 /space/123/develop
   */
  const resolveDynamicPath = useCallback(
    (path: string): string => {
      if (!path || !path.includes(':')) {
        // 没有动态参数，直接返回
        return path;
      }

      // 判断 params 是否为空对象
      const isParamsEmpty = Object.keys(params).length === 0;

      // 如果 params 为空对象，且 path 包含动态参数，且 parentCode 是 workspace
      if (isParamsEmpty && parentCode === 'workspace') {
        let spaceId: string | null = null;

        try {
          // 从缓存中获取 workspace 的路径
          const pathUrl = localStorage.getItem(PATH_URL);
          if (pathUrl) {
            const pathUrlObj = JSON.parse(pathUrl) as Record<string, string>;
            const workspacePath = pathUrlObj['workspace'];
            if (workspacePath) {
              spaceId = extractSpaceIdFromPath(workspacePath);
            }
          }
        } catch {
          // 忽略缓存解析错误
        }

        // 如果缓存中没有找到 spaceId，从空间列表中获取第一个空间的 id
        if (!spaceId && spaceList && spaceList.length > 0) {
          spaceId = String(spaceList[0].id);
        }

        // 如果找到了 spaceId，替换 path 中的 :spaceId
        if (spaceId) {
          return path.replace(/:spaceId/g, spaceId);
        }
      }

      let resolvedPath: string = '';

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
          resolvedPath = path.replace(`:${paramName}`, String(paramValue));
        }
      });

      return resolvedPath;
    },
    [params, parentCode, spaceList, extractSpaceIdFromPath],
  );

  // 处理路径URL路径跳转
  const handlePathUrl = (path: string, openType?: OpenTypeEnum) => {
    if (!path) return;
    // http开头的路径，直接打开
    if (path?.includes('http')) {
      const targetOpenType =
        openType === OpenTypeEnum.NewTab ? '_blank' : '_self';
      window.open(path, targetOpenType);
      return;
    }
    // 关闭移动端菜单
    handleCloseMobileMenu();
    // 处理动态路径
    const resolvedPath = resolveDynamicPath(path);

    if (!resolvedPath) {
      message.warning('处理路径URL路径跳转失败，请刷新页面重试');
      return;
    }

    try {
      const pathUrl = localStorage.getItem(PATH_URL);
      if (pathUrl) {
        const pathUrlObj = JSON.parse(pathUrl);
        pathUrlObj[parentCode] = resolvedPath;

        // 存储当前路径
        localStorage.setItem(PATH_URL, JSON.stringify(pathUrlObj));
      } else {
        const pathUrlObj = {
          [parentCode]: resolvedPath,
        };
        // 存储当前路径
        localStorage.setItem(PATH_URL, JSON.stringify(pathUrlObj));
      }
    } catch {}
    // 无子菜单，直接路由跳转
    history.push(resolvedPath, { _t: Date.now() });
  };

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
      } else {
        // 无子菜单，处理路径URL路径跳转
        handlePathUrl(menu?.path || '', menu?.openType);
      }
    },
    [toggleExpand, handlePathUrl],
  );

  /**
   * 判断菜单是否激活
   * 支持动态路径匹配，如果路径包含动态参数或查询参数，会先解析并去掉查询串再比较
   *
   * 例如：
   * - 配置路径：/space/:spaceId/space-square?activeKey=Agent
   * - 解析后： /space/42/space-square?activeKey=Agent
   * - 实际 pathname：/space/42/space-square
   * 需要在比较前去掉 ? 及其后的查询参数
   */
  const isActive = useCallback(
    (path?: string) => {
      if (!path) return false;

      let targetPath = path;

      // 如果路径包含动态参数，先解析路径
      if (targetPath.includes(':')) {
        const resolvedPath = resolveDynamicPath(targetPath);

        if (!resolvedPath) return false;

        // 如果解析后仍然包含 ':'，说明有参数未找到，使用正则表达式匹配
        if (resolvedPath.includes(':')) {
          // 只取路径部分（去掉查询参数），例如 /space/:spaceId/develop
          const rawPattern = targetPath.split('?')[0];
          // 将动态路径转换为正则表达式进行匹配
          const pattern = rawPattern.replace(/:(\w+)/g, '[^/]+');
          const regex = new RegExp(`^${pattern}(/.*)?$`);
          return regex.test(location.pathname);
        }

        // 使用解析后的路径进行匹配
        targetPath = resolvedPath;
      }

      // 去掉查询参数，只保留路径部分
      const [pathWithoutQuery] = targetPath.split('?');
      const pathname = location.pathname;

      // 精确匹配或前缀匹配
      return (
        pathname === pathWithoutQuery ||
        pathname.startsWith(pathWithoutQuery + '/')
      );
    },
    [location.pathname, resolveDynamicPath],
  );

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
            icon={menu.icon}
            name={menu.name}
            style={{ marginLeft: indent }}
            isActive={menuActive}
            onClick={() => {
              // 处理路径URL路径跳转
              handlePathUrl(menu?.path || '', menu?.openType);
            }}
          />
        );
      }

      // 如果有子菜单，使用 SecondMenuItem 组件，并递归渲染子菜单
      return (
        <div key={menuCode} className="flex flex-col gap-4">
          <SecondMenuItem
            icon={menu.icon}
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
      handleMenuClick,
      handlePathUrl,
      toggleExpand,
      currentSpaceInfo,
    ],
  );

  // 如果没有二级菜单，不渲染
  if (!secondMenus.length) {
    return null;
  }

  return (
    <div className={'flex flex-col gap-4 overflow-auto'}>
      {secondMenus.map((menu: MenuItemDto) => renderMenuItem(menu))}
    </div>
  );
};

export default DynamicSecondMenu;

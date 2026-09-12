/**
 * 导航状态机 hook（ClassicLayout / SidebarNavLayout 双布局单源，2026-09-12 抽取）。
 *
 * 收编此前两布局逐字节相同的一份实现（~290 行 × 2）：
 * - activeTab / isClickNewConversation 状态与 isClickMenu ref
 * - handlerClick（租户默认智能体建会话）
 * - handleNewConversation（新对话菜单跳下一个菜单）
 * - activeTab 路径同步大 effect（agent/square/more-page/system 特判树 + 匹配回退）
 * - handleRefreshEditAndCollect / findFirstChildWithPath（handleTabClick 内部依赖）
 * - handleTabClick（一级菜单点击：缓存路径回跳/iframe/新对话特判）
 *
 * 布局差异留在各自文件内：SECOND_MENU_SECTION_TABS 只被 shouldShowSecondMenu 使用、
 * 未进入本 hook，无需参数化；JSX/二级列/handleUserClick 不合并。
 */
import useConversation from '@/hooks/useConversation';
import { MenuItemDto } from '@/types/interfaces/menu';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { history, useLocation, useModel, useParams } from 'umi';

import { PATH_URL } from '@/constants/home.constants';
import { OTHER_MENU_CODES } from '@/constants/menus.constants';
import {
  findFirstLevelCodeByMenuCode,
  findFirstLevelCodeByPath,
  isMenuMatch,
} from './menuMatching';
import {
  handleOpenUrl,
  isHttpMenuPath,
  isOpenIframePath,
  navigateOpenIframePath,
  normalizeMenuPathname,
  removePathUrlFromLocalStorage,
} from './utils';

/** useMenuNavigation 返回值（布局侧仍需消费的面） */
export interface UseMenuNavigationResult {
  /** 当前激活的一级菜单 code */
  activeTab: string;
  setActiveTab: (tab: string) => void;
  /** 是否点击了新对话菜单（title 显示特殊处理用） */
  isClickNewConversation: boolean;
  /** 是否点击了一级菜单（刷新同步 effect 的跳过标记） */
  isClickMenu: MutableRefObject<boolean>;
  /** 租户默认智能体建会话（新建任务入口/新对话菜单共用） */
  handlerClick: () => Promise<void>;
  /** 新对话菜单特殊处理：activeTab 跳到下一个菜单 */
  handleNewConversation: () => void;
  /** 一级菜单点击 */
  handleTabClick: (menu: MenuItemDto) => void;
}

export function useMenuNavigation(): UseMenuNavigationResult {
  const location = useLocation();
  const params = useParams();
  const { handleCloseMobileMenu } = useModel('layout');
  const { firstLevelMenus, hasPathUnderFirstLevelMenu } = useModel('menuModel');
  const { runEdit } = useModel('devCollectAgent');
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const { handleCreateConversation } = useConversation();

  // 当前激活的一级菜单 code
  const [activeTab, setActiveTab] = useState<string>('');

  // 是否点击了新对话菜单，特殊处理，用于显示title时使用
  const [isClickNewConversation, setIsClickNewConversation] =
    useState<boolean>(false);

  // 是否点击菜单
  const isClickMenu = useRef<boolean>(false);

  const handlerClick = async () => {
    if (tenantConfigInfo) {
      // 创建智能体会话
      await handleCreateConversation(tenantConfigInfo.defaultAgentId);
    }
  };

  // 新对话菜单特殊处理
  const handleNewConversation = useCallback(() => {
    // 找到新对话菜单在同级别菜单中的位置，然后设置 activeTab 为下一个菜单
    const currentIndex = firstLevelMenus.findIndex(
      (m: MenuItemDto) => m.code === 'new_conversation',
    );
    if (currentIndex !== -1 && currentIndex < firstLevelMenus.length - 1) {
      // 如果存在下一个菜单，设置为下一个菜单
      const nextMenu = firstLevelMenus[currentIndex + 1];
      setActiveTab(nextMenu.code as string);
    }
  }, [firstLevelMenus]);

  // 刷新的时候触发，如果点击了一级菜单，则不触发
  // 根据路径匹配当前激活的一级菜单
  useEffect(() => {
    /**
     * 这里特殊处理，如果路径是/agent/xxx，则设置为首页
     * 场景：从工作空间-空间广场，点击智能体，跳转至智能体详情页，此时路径为/agent/xxx，但是需要显示为首页，不然二级菜单点击会因为无法匹配动态路径而报错
     */
    const pathname = normalizeMenuPathname(location.pathname);

    if (pathname.startsWith('/agent/') && params?.agentId) {
      setActiveTab('homepage');
      return;
    }

    // 广场特殊处理，如果路径是/square?cate_type=Agent，则设置为广场
    if (
      pathname.startsWith('/square') &&
      location.search.includes('cate_type=')
    ) {
      setActiveTab('system_square');
      return;
    }

    // 更多页面特殊处理，如果路径是/more-page，则设置为更多页面
    if (pathname.startsWith('/more-page')) {
      setActiveTab('more_page');
      return;
    }

    // 多语言内容特殊处理，如果路径是/system/config/lang-content/:lang，则设置一级菜单选中系统管理
    // 积分流水查询特殊处理，如果路径是/system/subscription-credits/credit-records，则设置一级菜单选中系统管理
    if (
      pathname.startsWith('/system/config/lang-content') ||
      pathname.startsWith('/system/subscription-credits/credit-records')
    ) {
      setActiveTab('system_manage');
      return;
    }

    // 如果点击了一级菜单，并且没有悬浮菜单，则不触发刷新
    // if (isClickMenu.current && !showHoverMenu) {
    if (isClickMenu.current) {
      isClickMenu.current = false;
      return;
    }

    if (!firstLevelMenus.length) return;

    // 查找匹配当前路径的菜单
    const matchedMenu = firstLevelMenus.find((menu: MenuItemDto) =>
      isMenuMatch(menu, pathname),
    );

    if (matchedMenu && matchedMenu.code !== 'new_conversation') {
      setActiveTab(matchedMenu.code);
    }
    // 根路径如果是新对话菜单,新对话菜单不显示
    else if (pathname === '' || pathname === '/') {
      if (firstLevelMenus[0].code !== 'new_conversation') {
        setActiveTab(firstLevelMenus[0].code);
      } else {
        // 新对话菜单特殊处理
        handleNewConversation();
      }
    }
    // 首页
    else if (pathname === '/home') {
      // 默认选中首页
      setActiveTab('homepage');
    } else {
      // 获取菜单码
      const menuCode = params?.menuCode || location.state?.menuCode;
      // 根据菜单码或路径获取第一级菜单的 code
      let firstLevelCode = null;
      // 如果菜单码存在，则根据菜单码获取第一级菜单的 code
      if (menuCode) {
        firstLevelCode = findFirstLevelCodeByMenuCode(
          firstLevelMenus,
          menuCode,
        );
      } else {
        // 递归查找匹配的子菜单，并获取其第一级父菜单的 code
        firstLevelCode = findFirstLevelCodeByPath(firstLevelMenus, pathname);
      }

      // 存在第一级菜单 of the code 且不是新对话菜单，则设置为第一级菜单的 code
      if (firstLevelCode && firstLevelCode !== 'new_conversation') {
        setActiveTab(firstLevelCode);
      } else if (OTHER_MENU_CODES.includes(menuCode || '')) {
        // 其它需要单独分离的菜单（如我的电脑、更多页面）直接设置为当前 code
        setActiveTab(menuCode as string);
      }
      // 新对话菜单特殊处理：如果第一级菜单的 code 是 new_conversation，则设置为 new_conversation
      else if (firstLevelCode === 'new_conversation') {
        handleNewConversation();
      } else {
        // 如果第一级菜单没有匹配到，则获取除新对话菜单外的第一个菜单
        const filteredNewConversationFirstLevelMenus = firstLevelMenus.filter(
          (menu: MenuItemDto) => menu.code !== 'new_conversation',
        );
        setActiveTab(filteredNewConversationFirstLevelMenus[0]?.code || '');
      }
    }
  }, [location.pathname, params, firstLevelMenus, handleNewConversation]);

  const handleRefreshEditAndCollect = useCallback(() => {
    // 最近编辑
    runEdit({
      size: 5,
    });
  }, []);

  /**
   * 递归查找第一个有 path 的子菜单
   * 如果第一个子菜单没有 path 但有 children，继续递归查找
   */
  const findFirstChildWithPath = useCallback(
    (menu: MenuItemDto): MenuItemDto | null => {
      // 如果当前菜单有 path，直接返回
      if (menu.path) {
        return menu;
      }

      // 如果没有子菜单，返回 null
      if (!menu.children?.length) {
        return null;
      }

      // 获取第一个子菜单
      const firstChild = menu.children[0];

      // 递归查找第一个子菜单的 path
      return findFirstChildWithPath(firstChild);
    },
    [],
  );

  /**
   * 点击一级菜单
   */
  const handleTabClick = useCallback(
    (menu: MenuItemDto) => {
      // 是否点击了一级菜单
      isClickMenu.current = true;
      // 关闭移动端菜单
      handleCloseMobileMenu();

      // 新对话,特殊处理，因为新对话时，不能选中新对话的菜单，需要跳转到下一个菜单
      if (menu.code === 'new_conversation') {
        // 如果用户匹配了路径，则处理路径，否则按照原逻辑创建智能体会话
        if (menu.path) {
          if (isHttpMenuPath(menu.path)) {
            handleOpenUrl(menu);
          } else {
            history.push(menu.path);
          }
        } else {
          handlerClick();

          setIsClickNewConversation(true);

          // 新对话菜单特殊处理
          handleNewConversation();
        }
        return;
      }

      // 设置当前激活的菜单
      setActiveTab(menu.code || '');
      // http 或 %siteUrl% 开头的路径，直接打开
      if (menu.path && isHttpMenuPath(menu.path)) {
        handleOpenUrl(menu);
        return;
      }

      // 点击其他菜单，则设置为 false
      setIsClickNewConversation(false);

      if (menu.code === 'workspace') {
        handleRefreshEditAndCollect();

        // 防止系统设置中工作空间没有设置路径，导致跳转失败
        const url = menu.path || '/space';
        history.push(url, { _t: Date.now(), menuCode: menu.code });
        return;
      }

      try {
        // 从缓存中获取当前路径，如果存在且匹配当前菜单，则直接跳转
        const pathUrl = localStorage.getItem(PATH_URL);
        if (pathUrl && menu.code) {
          const pathUrlObj = JSON.parse(pathUrl);
          const pathUrlValue = pathUrlObj[menu.code];

          // 判断指定一级菜单及其所有子菜单中，是否存在与传入路径匹配的菜单
          const hasPath = hasPathUnderFirstLevelMenu(menu.code, pathUrlValue);
          if (hasPath) {
            if (pathUrlValue && !pathUrlValue.includes(':')) {
              if (isOpenIframePath(pathUrlValue)) {
                navigateOpenIframePath(pathUrlValue, { menuCode: menu.code });
              } else {
                history.push(pathUrlValue, {
                  _t: Date.now(),
                  menuCode: menu.code,
                });
              }
              return;
            }
          } else {
            // 缓存路径已不在当前菜单树中，清除无效的 workspace 记录
            removePathUrlFromLocalStorage(menu.code);
          }
        }
      } catch {}

      if (menu.path) {
        if (isOpenIframePath(menu.path)) {
          navigateOpenIframePath(menu.path, { menuCode: menu.code });
        } else {
          history.push(menu.path, { _t: Date.now(), menuCode: menu.code });
        }
      } else if (menu.children?.length) {
        // 递归查找第一个有 path 的子菜单
        const firstPathMenu = findFirstChildWithPath(menu);
        if (firstPathMenu) {
          // http 或 %siteUrl% 开头的路径，直接打开
          if (firstPathMenu.path && isHttpMenuPath(firstPathMenu.path)) {
            handleOpenUrl(firstPathMenu);
            return;
          }
          // 其他路径，跳转路由
          history.push(firstPathMenu.path, {
            _t: Date.now(),
            menuCode: firstPathMenu.code,
          });
        }
      }
    },
    [
      handleCloseMobileMenu,
      findFirstChildWithPath,
      handleRefreshEditAndCollect,
      handlerClick,
      handleNewConversation,
    ],
  );

  return {
    activeTab,
    setActiveTab,
    isClickNewConversation,
    isClickMenu,
    handlerClick,
    handleNewConversation,
    handleTabClick,
  };
}

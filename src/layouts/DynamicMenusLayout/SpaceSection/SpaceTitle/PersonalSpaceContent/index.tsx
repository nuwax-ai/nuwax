import { SvgIcon } from '@/components/base';
import { LimitedTooltip } from '@/components/ProComponents';
import { SPACE_ID } from '@/constants/home.constants';
import { updatePathUrlToLocalStorage } from '@/layouts/DynamicMenusLayout/utils';
import { dict } from '@/services/i18nRuntime';
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum, SpaceTypeEnum } from '@/types/enums/space';
import type { PersonalSpaceContentType } from '@/types/interfaces/layouts';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { CheckOutlined, SearchOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import { Divider, Input } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 空间列表超过该数量时显示搜索框 */
const SPACE_LIST_SEARCH_THRESHOLD = 10;

/**
 * 个人空间Popover内容组件
 */
const PersonalSpaceContent: React.FC<PersonalSpaceContentType> = ({
  onCreateTeam,
  onClosePopover,
  currentSpaceName,
}) => {
  const location = useLocation();
  const params = useParams();

  const { pathname } = location;
  // 空间列表
  const { spaceList, currentSpaceInfo } = useModel('spaceModel');
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

  const { hasPermission } = useModel('menuModel');
  const [spaceSearchKeyword, setSpaceSearchKeyword] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<InputRef>(null);
  const listItemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const showSpaceSearchRef = useRef(false);
  const isKeyboardNavigatingRef = useRef(false);

  const setKeyboardNavigating = useCallback((value: boolean) => {
    isKeyboardNavigatingRef.current = value;
    setIsKeyboardNavigating(value);
  }, []);

  const resetSearchState = useCallback(() => {
    setSpaceSearchKeyword('');
    setHighlightedIndex(-1);
    setIsSearchFocused(false);
    setKeyboardNavigating(false);
  }, [setKeyboardNavigating]);

  // 过滤当前工作空间
  const filterSpaceList = useMemo(() => {
    return (
      spaceList?.filter(
        (item: SpaceInfo) => item.id !== currentSpaceInfo?.id,
      ) || []
    );
  }, [spaceList, currentSpaceInfo]);

  const showSpaceSearch = filterSpaceList.length > SPACE_LIST_SEARCH_THRESHOLD;

  showSpaceSearchRef.current = showSpaceSearch;

  /** Popover 可见性：关闭时清空搜索，打开且存在搜索框时自动聚焦 */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let wasVisible = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting ?? false;
        if (wasVisible && !isVisible) {
          resetSearchState();
        }
        if (!wasVisible && isVisible && showSpaceSearchRef.current) {
          requestAnimationFrame(() => {
            searchInputRef.current?.focus();
          });
        }
        wasVisible = isVisible;
      },
      { threshold: 0 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [resetSearchState, showSpaceSearch]);

  /** 按名称本地过滤空间列表 */
  const displayedSpaceList = useMemo(() => {
    const keyword = spaceSearchKeyword.trim().toLowerCase();
    if (!keyword) {
      return filterSpaceList;
    }
    return filterSpaceList.filter((item: SpaceInfo) =>
      item.name?.toLowerCase().includes(keyword),
    );
  }, [filterSpaceList, spaceSearchKeyword]);

  useEffect(() => {
    if (!showSpaceSearch) {
      resetSearchState();
    }
  }, [showSpaceSearch, resetSearchState]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [spaceSearchKeyword, displayedSpaceList]);

  useEffect(() => {
    if (highlightedIndex >= 0 && isSearchFocused && isKeyboardNavigating) {
      listItemRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [highlightedIndex, isSearchFocused, isKeyboardNavigating]);

  // 点击空间列表事件
  const handleClick = useCallback(
    (info: SpaceInfo) => {
      const spaceId = info.id;
      localStorage.setItem(SPACE_ID, spaceId.toString());
      resetSearchState();
      onClosePopover(false);
      // 关闭移动端菜单
      handleCloseMobileMenu();

      // 普通用户开发者功能如果关闭，首次进入空间菜单选中“空间广场”；
      const isUser_NotAllowDevelop =
        info?.currentUserRole === RoleEnum.User &&
        info?.allowDevelop === AllowDevelopEnum.Not_Allow;

      // 解析后的路径
      let resolvedPath = '';

      // 智能体开发页以及子页
      if (pathname.includes('develop') && !pathname.includes('page-develop')) {
        const defaultUrl = isUser_NotAllowDevelop ? 'space-square' : 'develop';
        resolvedPath = `/space/${spaceId}/${defaultUrl}`;
      }
      // 网页应用开发
      else if (pathname.includes('page-develop')) {
        resolvedPath = `/space/${spaceId}/page-develop`;
      }
      // 技能管理
      else if (pathname.includes('skill-manage')) {
        resolvedPath = `/space/${spaceId}/skill-manage`;
      }
      // mcp管理
      else if (pathname.includes('mcp')) {
        resolvedPath = `/space/${spaceId}/mcp`;
      }
      // 任务中心
      else if (pathname.includes('task-center')) {
        resolvedPath = `/space/${spaceId}/task-center`;
      }
      // 日志查询
      else if (pathname.includes('library-log')) {
        resolvedPath = `/space/${spaceId}/library-log`;
      }
      // 空间广场页
      else if (pathname.includes('space-square')) {
        resolvedPath = `/space/${spaceId}/space-square`;
      }
      // 成员与设置
      else if (pathname.includes('team')) {
        // 如果团队空间切换到个人空间，需要隐藏团队设置，同样需要切换到默认页'智能体开发'
        if (info.type === SpaceTypeEnum.Personal) {
          const defaultUrl = isUser_NotAllowDevelop
            ? 'space-square'
            : 'develop';
          resolvedPath = `/space/${spaceId}/${defaultUrl}`;
        } else {
          // 个人空间时，不显示"成员与设置", 普通用户也不显示"成员与设置"
          const isUser = info?.currentUserRole === RoleEnum.User;
          // 如果不是普通用户，则跳转到本页面, 否则跳转
          const defaultUrl = !isUser
            ? 'team'
            : isUser_NotAllowDevelop
            ? 'space-square'
            : 'develop';
          // 团队空间互相切换时，只更新空间id即可
          resolvedPath = `/space/${spaceId}/${defaultUrl}`;
        }
      }
      // 组件库
      else if (
        pathname.includes('library') &&
        !pathname.includes('library-log')
      ) {
        const defaultUrl = isUser_NotAllowDevelop ? 'space-square' : 'library';
        resolvedPath = `/space/${spaceId}/${defaultUrl}`;
      } else {
        // 其他路径的通用处理：
        // 如果没有路由参数（params 为空对象），直接跳转到当前路径
        // 如果有路由参数，则只更新 spaceId，保持当前页面不变
        const hasParams =
          params && Object.keys(params as Record<string, unknown>).length > 0;

        if (!hasParams) {
          // 没有动态参数，直接跳转当前路径（仅更新本地 SPACE_ID）
          resolvedPath = pathname;
        } else {
          const spaceParams = params as Record<string, string | undefined>;
          const currentSpaceId = spaceParams.spaceId;

          if (currentSpaceId) {
            // 将当前路径中的 spaceId 替换为新的 spaceId，保持在同一页面
            const newPathname = pathname.replace(
              String(currentSpaceId),
              String(spaceId),
            );
            resolvedPath = newPathname;
          } else {
            // 没有 spaceId 参数时，退回到当前路径
            resolvedPath = pathname;
          }
        }
      }

      // 修改或保存当前路径到本地缓存
      updatePathUrlToLocalStorage('workspace', resolvedPath);

      // 跳转
      history.push(resolvedPath);
    },
    [pathname, params, onClosePopover, handleCloseMobileMenu, resetSearchState],
  );

  /** 搜索框聚焦时：上下键选择空间，Enter 切换 */
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!displayedSpaceList.length) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setKeyboardNavigating(true);
      setHighlightedIndex((prev) => {
        if (prev < 0) {
          return 0;
        }
        return Math.min(prev + 1, displayedSpaceList.length - 1);
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setKeyboardNavigating(true);
      setHighlightedIndex((prev) => {
        if (prev < 0) {
          return displayedSpaceList.length - 1;
        }
        return Math.max(prev - 1, 0);
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex < 0) {
        return;
      }
      const target = displayedSpaceList[highlightedIndex];
      if (target) {
        handleClick(target);
      }
    }
  };

  /** 搜索框获得焦点：启用键盘导航与列表高亮交互 */
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  /** 搜索框失去焦点：关闭键盘/鼠标高亮状态 */
  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    setHighlightedIndex(-1);
    setKeyboardNavigating(false);
  };

  /** 清除搜索关键字并重置列表选中状态 */
  const handleClearKeyword = useCallback(() => {
    setSpaceSearchKeyword('');
    setHighlightedIndex(-1);
    setKeyboardNavigating(false);
  }, [setKeyboardNavigating]);

  /**
   * 列表区域鼠标移动：退出键盘导航模式，恢复 hover 选中
   * 避免 scrollIntoView 滚动后 mouseEnter 与方向键冲突
   */
  const handleListMouseMove = useCallback(() => {
    if (isKeyboardNavigatingRef.current) {
      setKeyboardNavigating(false);
    }
  }, [setKeyboardNavigating]);

  /**
   * 鼠标移入空间项：同步高亮索引
   * 键盘导航期间忽略，防止 hover 覆盖方向键选中项
   */
  const handleListItemMouseEnter = useCallback(
    (index: number) => {
      if (isSearchFocused && !isKeyboardNavigatingRef.current) {
        setHighlightedIndex(index);
      }
    },
    [isSearchFocused],
  );

  return (
    <div
      ref={containerRef}
      className={cx(styles.container, 'flex', 'flex-col', 'overflow-hide')}
    >
      <div className={cx(styles['p-header'], 'flex')}>
        <CheckOutlined className={styles.icon} />
        <LimitedTooltip className={cx('flex-1', styles.title)}>
          {currentSpaceName ||
            currentSpaceInfo?.name ||
            dict('PC.Layouts.DynamicMenusLayout.SpaceSection.personalSpace')}
        </LimitedTooltip>
      </div>
      <Divider className={styles['divider']} />

      {/* 搜索框 */}
      {showSpaceSearch && (
        <div className={cx(styles['space-search'])}>
          <Input
            ref={searchInputRef}
            rootClassName={cx(styles.input)}
            placeholder={dict(
              'PC.Layouts.DynamicMenusLayout.SpaceSection.searchSpacePlaceholder',
            )}
            value={spaceSearchKeyword}
            onChange={(e) => setSpaceSearchKeyword(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
            onClear={handleClearKeyword}
            onKeyDown={handleSearchKeyDown}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
        </div>
      )}

      {/* 空间列表 */}
      <ul
        className={cx('flex-1', 'overflow-y', {
          [styles['space-list-keyboard']]:
            isSearchFocused && isKeyboardNavigating,
        })}
        onMouseMove={handleListMouseMove}
        onMouseLeave={() => {
          if (isSearchFocused) {
            setHighlightedIndex(-1);
            setKeyboardNavigating(false);
          }
        }}
      >
        {/* 空间列表 */}
        {displayedSpaceList.length > 0 ? (
          displayedSpaceList.map((item: SpaceInfo, index: number) => (
            <li
              key={item.id}
              ref={(el) => {
                listItemRefs.current[index] = el;
              }}
              className={cx(styles['team-info'], 'flex', 'items-center', {
                [styles['team-info-active']]:
                  isSearchFocused && highlightedIndex === index,
              })}
              onClick={() => handleClick(item)}
              onMouseEnter={() => handleListItemMouseEnter(index)}
            >
              <LimitedTooltip className={cx('flex-1')}>
                {item.name}
              </LimitedTooltip>
            </li>
          ))
        ) : (
          <li className={cx(styles['empty-search'], 'flex', 'items-center')}>
            {dict('PC.Layouts.DynamicMenusLayout.SpaceSection.noSpaceMatch')}
          </li>
        )}
      </ul>
      {hasPermission('space_create') && (
        <div
          className={cx(styles['create-team'], 'flex', 'cursor-pointer')}
          onClick={() => {
            resetSearchState();
            onCreateTeam();
          }}
        >
          <SvgIcon name="icons-common-plus" style={{ fontSize: 16 }} />
          <span className={cx('flex-1', 'text-ellipsis')}>
            {dict(
              'PC.Layouts.DynamicMenusLayout.CreateNewTeam.createTeamSpace',
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default PersonalSpaceContent;

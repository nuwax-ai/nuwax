import {
  apiSkillCollectListForAt,
  apiSkillListForAt,
} from '@/components/ChatInputHome/MentionPopup/atSkill';
import type { SkillInfoForAt } from '@/components/ChatInputHome/MentionPopup/types';
import { t } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import type { Page } from '@/types/interfaces/request';
import {
  DatabaseOutlined,
  FileOutlined,
  FolderOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Empty, Input, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  MentionSelectorHandle,
  MentionSelectorProps,
  ViewType,
} from '../MentionSelector/types';
import {
  flattenFiles,
  flattenFolders,
  getRecentDataSources,
  getRecentFiles,
  getRecentSkills,
  saveRecentDataSource,
  saveRecentFile,
  saveRecentSkill,
} from '../MentionSelector/utils';
import styles from './index.less';

const CombinedMentionSelector = React.forwardRef<
  MentionSelectorHandle,
  MentionSelectorProps
>(
  (
    {
      visible,
      position,
      searchText,
      files,
      dataSources,
      onSelectFile,
      onSelectDataSource,
      onSelectSkill,
      selectedIndex,
      containerRef,
      onSelectedIndexChange,
      projectId,
    },
    ref,
  ) => {
    // 视图状态：recent-最近使用, files-文件/文件夹, datasources-数据资源, skills-技能, favorite-我的收藏
    const [activeTab, setActiveTab] = useState<ViewType>('recent');
    // 内部搜索输入框的值
    const [searchInputValue, setSearchInputValue] = useState<string>('');

    // 当 visible 变为 false 时，重置视图状态
    useEffect(() => {
      if (!visible) {
        setActiveTab('recent');
        setSearchInputValue('');
        onSelectedIndexChange?.(0);
      }
    }, [visible, onSelectedIndexChange]);

    // 搜索值变化逻辑
    const effectiveSearchText = searchInputValue || searchText || '';

    // 技能列表加载
    const {
      data: skillsData,
      loading: skillsLoading,
      run: fetchSkills,
    } = useRequest(apiSkillListForAt, {
      manual: true,
      debounceWait: 300,
    });

    // 收藏技能加载
    const {
      data: favoritesData,
      loading: favoritesLoading,
      run: fetchFavorites,
    } = useRequest(apiSkillCollectListForAt, {
      manual: true,
      debounceWait: 300,
    });

    useEffect(() => {
      if (visible) {
        if (activeTab === 'skills') {
          fetchSkills({
            page: 1,
            pageSize: 50,
            kw: effectiveSearchText,
            targetType: AgentComponentTypeEnum.Skill,
            usageScenarios: [AgentTypeEnum.PageApp],
          });
        }
        if (activeTab === 'favorite') {
          fetchFavorites({
            kw: effectiveSearchText,
            targetType: AgentComponentTypeEnum.Skill,
            usageScenarios: [AgentTypeEnum.PageApp],
          });
        }
      }
    }, [activeTab, effectiveSearchText, visible, fetchSkills, fetchFavorites]);

    const searchInputRef = useRef<any>(null);

    // 自动聚焦搜索框
    useEffect(() => {
      if (visible) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [visible]);
    const recentFiles = useMemo(
      () => getRecentFiles(projectId),
      [projectId, visible],
    );
    const recentDataSources = useMemo(
      () => getRecentDataSources(projectId),
      [projectId, visible],
    );
    const recentSkills = useMemo(
      () => getRecentSkills(projectId),
      [projectId, visible],
    );

    // 合并后的最近使用列表
    const combinedRecentItems = useMemo(() => {
      const items: any[] = [];

      // 处理文件/目录
      recentFiles.forEach((item) => {
        const allFiles = flattenFiles(files, '');
        const allFolders = flattenFolders(files, '');
        const fileNode =
          allFiles.find((f) => f.id === item.id) ||
          allFolders.find((f) => f.id === item.id);
        if (fileNode) {
          items.push({
            type: fileNode.type === 'folder' ? 'folder' : 'file',
            data: fileNode,
            timestamp: item.timestamp,
          });
        }
      });

      // 处理数据资源
      recentDataSources.forEach((item) => {
        const ds = dataSources.find((d) => d.id === item.id);
        if (ds) {
          items.push({
            type: 'datasource',
            data: ds,
            timestamp: item.timestamp,
          });
        }
      });

      // 处理技能
      recentSkills.forEach((item) => {
        items.push({
          type: 'skill',
          data: {
            id: item.id,
            name: item.name,
            icon: item.icon,
            description: item.description,
          },
          timestamp: item.timestamp,
        });
      });

      // 按时间排序
      const sortedItems = items.sort((a, b) => b.timestamp - a.timestamp);

      // 搜索过滤
      if (effectiveSearchText && effectiveSearchText.trim()) {
        const kw = effectiveSearchText.trim().toLowerCase();
        return sortedItems.filter((item) => {
          const name = item.data?.name || '';
          const desc = item.data?.description || '';
          const path = item.data?.path || '';
          return (
            name.toLowerCase().includes(kw) ||
            desc.toLowerCase().includes(kw) ||
            path.toLowerCase().includes(kw)
          );
        });
      }

      return sortedItems.slice(0, 15);
    }, [
      recentFiles,
      recentDataSources,
      recentSkills,
      files,
      dataSources,
      effectiveSearchText,
    ]);

    // 获取当前视图的列表项
    const currentItems = useMemo(() => {
      switch (activeTab) {
        case 'recent':
          return combinedRecentItems;
        case 'files':
          return [
            ...flattenFiles(files, effectiveSearchText).map((f) => ({
              type: 'file',
              data: f,
            })),
            ...flattenFolders(files, effectiveSearchText).map((f) => ({
              type: 'folder',
              data: f,
            })),
          ];
        case 'datasources':
          return dataSources
            .filter(
              (ds) =>
                !effectiveSearchText ||
                ds.name
                  .toLowerCase()
                  .includes(effectiveSearchText.toLowerCase()),
            )
            .map((ds) => ({ type: 'datasource', data: ds }));
        case 'skills': {
          const skillRecords =
            (skillsData?.data as Page<SkillInfoForAt>)?.records || [];
          return skillRecords.map((s) => ({ type: 'skill', data: s }));
        }
        case 'favorite': {
          const favRecords = (favoritesData?.data as SkillInfoForAt[]) || [];
          return favRecords.map((s) => ({ type: 'skill', data: s }));
        }
        default:
          return [];
      }
    }, [
      activeTab,
      combinedRecentItems,
      files,
      dataSources,
      effectiveSearchText,
      skillsData,
      favoritesData,
    ]);

    const handleItemSelect = useCallback(
      (item: any) => {
        if (item.type === 'file' || item.type === 'folder') {
          saveRecentFile(item.data, projectId);
          onSelectFile(item.data);
        } else if (item.type === 'datasource') {
          saveRecentDataSource(item.data, projectId);
          onSelectDataSource(item.data);
        } else if (item.type === 'skill') {
          saveRecentSkill(item.data, projectId);
          onSelectSkill(item.data);
        }
      },
      [onSelectFile, onSelectDataSource, onSelectSkill, projectId],
    );

    // 使用 Ref 存储最新的列表项，避免 useImperativeHandle 频繁重载
    const currentItemsRef = useRef(currentItems);
    currentItemsRef.current = currentItems;

    // 确保索引始终在有效范围内
    useEffect(() => {
      if (
        visible &&
        currentItems.length > 0 &&
        selectedIndex >= currentItems.length
      ) {
        onSelectedIndexChange?.(currentItems.length - 1);
      }
    }, [currentItems.length, selectedIndex, visible, onSelectedIndexChange]);

    // 自动滚动到选中项
    useEffect(() => {
      if (!visible) return;

      // 延迟确保渲染完成
      const timer = setTimeout(() => {
        const container = containerRef?.current;
        if (!container) return;

        const selectedElement = container.querySelector(
          `.${styles['mention-item']}.${styles.selected}`,
        ) as HTMLElement;

        if (selectedElement) {
          selectedElement.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
          });
        }
      }, 0);

      return () => clearTimeout(timer);
    }, [selectedIndex, visible, containerRef]);

    // 暴露方法给键盘导航 Hook
    useImperativeHandle(
      ref,
      () => ({
        handleSelectCurrentItem: () => {
          if (currentItemsRef.current[selectedIndex]) {
            handleItemSelect(currentItemsRef.current[selectedIndex]);
          }
        },
        handleEscapeKey: () => false, // 顶层不处理 ESC
        handleArrowRightKey: () => {
          // Tab 切换逻辑
          const tabs: ViewType[] = [
            'recent',
            'files',
            'datasources',
            'skills',
            'favorite',
          ];
          const nextIdx = (tabs.indexOf(activeTab) + 1) % tabs.length;
          setActiveTab(tabs[nextIdx]);
          onSelectedIndexChange?.(0);
          return true;
        },
        handleArrowLeftKey: () => {
          const tabs: ViewType[] = [
            'recent',
            'files',
            'datasources',
            'skills',
            'favorite',
          ];
          const prevIdx =
            (tabs.indexOf(activeTab) - 1 + tabs.length) % tabs.length;
          setActiveTab(tabs[prevIdx]);
          onSelectedIndexChange?.(0);
          return true;
        },
        handleArrowUpKey: () => {
          onSelectedIndexChange?.((prev: number) => (prev > 0 ? prev - 1 : 0));
        },
        handleArrowDownKey: () => {
          onSelectedIndexChange?.((prev: number) => {
            const maxIdx = currentItemsRef.current.length - 1;
            return prev < maxIdx ? prev + 1 : maxIdx;
          });
        },
      }),
      [activeTab, selectedIndex, onSelectedIndexChange, handleItemSelect],
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onSelectedIndexChange?.((prev: number) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onSelectedIndexChange?.((prev: number) => {
          const maxIdx = currentItemsRef.current.length - 1;
          return prev < maxIdx ? prev + 1 : maxIdx;
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const tabs: ViewType[] = [
          'recent',
          'files',
          'datasources',
          'skills',
          'favorite',
        ];
        const prevIdx =
          (tabs.indexOf(activeTab) - 1 + tabs.length) % tabs.length;
        setActiveTab(tabs[prevIdx]);
        onSelectedIndexChange?.(0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const tabs: ViewType[] = [
          'recent',
          'files',
          'datasources',
          'skills',
          'favorite',
        ];
        const nextIdx = (tabs.indexOf(activeTab) + 1) % tabs.length;
        setActiveTab(tabs[nextIdx]);
        onSelectedIndexChange?.(0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentItemsRef.current[selectedIndex]) {
          handleItemSelect(currentItemsRef.current[selectedIndex]);
        }
      }
    };

    const renderIcon = (item: any) => {
      switch (item.type) {
        case 'file':
          return <FileOutlined />;
        case 'folder':
          return <FolderOutlined />;
        case 'datasource':
          return <DatabaseOutlined />;
        case 'skill':
          return (
            <img
              src={item.data.icon}
              style={{ width: 16, height: 16 }}
              alt=""
            />
          );
        default:
          return null;
      }
    };

    const TABS = [
      { key: 'recent', label: t('PC.Pages.AppDevMentionSelector.tabRecent') },
      { key: 'files', label: t('PC.Pages.AppDevMentionSelector.tabFiles') },
      {
        key: 'datasources',
        label: t('PC.Pages.AppDevMentionSelector.tabDataSources'),
      },
      { key: 'skills', label: t('PC.Pages.AppDevMentionSelector.tabSkills') },
      {
        key: 'favorite',
        label: t('PC.Pages.AppDevMentionSelector.tabFavorite'),
      },
    ];

    if (!visible) return null;

    return (
      <div
        ref={containerRef}
        className={styles['mention-selector']}
        style={{
          position: 'fixed',
          left: position.left,
          top: position.top,
        }}
        onMouseDown={(e) => {
          // 点击搜索区域时不阻止默认行为，否则输入框无法获得焦点
          if ((e.target as HTMLElement).closest?.('[data-mention-search]'))
            return;
          e.preventDefault();
        }}
      >
        {/* 搜索输入框 */}
        <div className={styles['mention-search-wrap']} data-mention-search>
          <Input
            ref={searchInputRef}
            className={styles['mention-search-input']}
            placeholder={t(
              'PC.Components.ChatInputHomeManualComponentItem.keywordSearch',
            )}
            allowClear
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            prefix={
              <SearchOutlined className={styles['mention-search-icon']} />
            }
            variant="borderless"
          />
        </div>

        <div className={styles['mention-tabs']}>
          {TABS.map((tab) => (
            <div
              key={tab.key}
              className={classNames(styles['mention-tab'], {
                [styles.active]: activeTab === tab.key,
              })}
              onClick={() => {
                setActiveTab(tab.key as ViewType);
                onSelectedIndexChange?.(0);
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>
        <div className={styles['mention-content']}>
          {(skillsLoading || favoritesLoading) && currentItems.length === 0 ? (
            <div className={styles['mention-loading']}>
              <Spin size="small" />
            </div>
          ) : currentItems.length === 0 ? (
            <div className={styles['mention-empty']}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('PC.Pages.AppDevMentionSelector.empty')}
              />
            </div>
          ) : (
            <div className={styles['mention-list']}>
              {currentItems.map((item, index) => (
                <div
                  key={`${item.type}-${item.data.id}`}
                  className={classNames(styles['mention-item'], {
                    [styles.selected]: index === selectedIndex,
                  })}
                  onClick={() => handleItemSelect(item)}
                  onMouseEnter={() => onSelectedIndexChange?.(index)}
                >
                  <span className={styles['mention-item-icon']}>
                    {renderIcon(item)}
                  </span>
                  <div className={styles['mention-item-content']}>
                    <div className={styles['mention-item-title']}>
                      {item.type === 'file' || item.type === 'folder'
                        ? item.data.name
                        : item.data.name}
                    </div>
                    {(item.type === 'file' || item.type === 'folder') && (
                      <div className={styles['mention-item-desc']}>
                        {item.data.path}
                      </div>
                    )}
                    {item.type === 'datasource' && (
                      <div className={styles['mention-item-desc']}>
                        {item.data.description}
                      </div>
                    )}
                    {item.type === 'skill' && item.data.description && (
                      <div className={styles['mention-item-desc']}>
                        {item.data.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default CombinedMentionSelector;

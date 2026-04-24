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
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Empty, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
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

    // 当 visible 变为 false 时，重置视图状态
    useEffect(() => {
      if (!visible) {
        setActiveTab('recent');
        onSelectedIndexChange?.(0);
      }
    }, [visible, onSelectedIndexChange]);

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
            kw: searchText,
            targetType: AgentComponentTypeEnum.Skill,
            usageScenarios: [AgentTypeEnum.PageApp],
          });
        } else if (activeTab === 'favorite') {
          fetchFavorites({
            kw: searchText,
            targetType: AgentComponentTypeEnum.Skill,
            usageScenarios: [AgentTypeEnum.PageApp],
          });
        }
      }
    }, [activeTab, searchText, visible, fetchSkills, fetchFavorites]);

    // 最近使用的项（按 projectId 区分）
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
      return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
    }, [recentFiles, recentDataSources, recentSkills, files, dataSources]);

    // 获取当前视图的列表项
    const currentItems = useMemo(() => {
      switch (activeTab) {
        case 'recent':
          return combinedRecentItems;
        case 'files':
          return [
            ...flattenFiles(files, searchText).map((f) => ({
              type: 'file',
              data: f,
            })),
            ...flattenFolders(files, searchText).map((f) => ({
              type: 'folder',
              data: f,
            })),
          ];
        case 'datasources':
          return dataSources
            .filter(
              (ds) =>
                !searchText ||
                ds.name.toLowerCase().includes(searchText.toLowerCase()),
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
      searchText,
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

    // 暴露方法给键盘导航 Hook
    useImperativeHandle(ref, () => ({
      handleSelectCurrentItem: () => {
        if (currentItems[selectedIndex]) {
          handleItemSelect(currentItems[selectedIndex]);
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
    }));

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
      >
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

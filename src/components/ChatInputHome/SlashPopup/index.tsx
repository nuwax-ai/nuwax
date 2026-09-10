import { SUCCESS_CODE } from '@/constants/codes.constants';
import { getList } from '@/services/created';
import { t } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiSkillCollectListForAt,
  apiSkillListForAt,
  apiSkillRecentlyUsedListForAt,
} from '../MentionPopup/atSkill';
import styles from '../MentionPopup/index.less';
import PopupList from '../MentionPopup/PopupList';
import type {
  MentionPopupHandle,
  MentionPopupProps,
  SlashItem,
  TabType,
} from '../MentionPopup/types';

interface Props extends Omit<MentionPopupProps, 'onSelect'> {
  onSelect: (item: SlashItem) => void;
  enablePlugins?: boolean;
}
const DEFAULT_SCENARIOS = [AgentTypeEnum.TaskAgent];
const PAGE_SIZE = 12;

const SlashPopup = React.forwardRef<MentionPopupHandle, Props>((props, ref) => {
  const {
    visible,
    usageScenarios = DEFAULT_SCENARIOS,
    showSearchInput,
    enablePlugins = true,
  } = props;
  const [tab, setTab] = useState<'skill' | 'plugin'>('skill');
  const [skillTab, setSkillTab] = useState<TabType>('all');
  const [input, setInput] = useState('');
  const search = showSearchInput ? input : props.searchText ?? '';
  const requestSearch = tab === 'skill' && skillTab !== 'all' ? '' : search;
  const [items, setItems] = useState<SlashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(0);
  const requestId = useRef(0);
  const busyRef = useRef(false);
  const load = useCallback(
    async (page: number) => {
      const token = ++requestId.current;
      busyRef.current = true;
      setLoading(true);
      setError(false);
      try {
        const params = {
          page,
          pageSize: PAGE_SIZE,
          kw: requestSearch,
          targetType: AgentComponentTypeEnum.Skill,
          usageScenarios,
        };
        const response =
          tab === 'plugin'
            ? await getList(AgentComponentTypeEnum.Plugin, {
                page,
                pageSize: PAGE_SIZE,
                kw: requestSearch,
              })
            : skillTab === 'recent'
            ? await apiSkillRecentlyUsedListForAt(params)
            : skillTab === 'favorite'
            ? await apiSkillCollectListForAt(params)
            : await apiSkillListForAt(params);
        if (token !== requestId.current) return;
        if (response.code !== SUCCESS_CODE) throw new Error('命令列表加载失败');
        const paged = tab === 'plugin' || skillTab === 'all';
        const records = paged
          ? response.data?.records ?? []
          : response.data ?? [];
        const mapped: SlashItem[] = records.map((item: SlashItem) => ({
          ...item,
          kind: tab,
        }));
        setItems((prev) =>
          page === 1
            ? mapped
            : [
                ...prev,
                ...mapped.filter(
                  (item) => !prev.some((old) => old.targetId === item.targetId),
                ),
              ],
        );
        pageRef.current = page;
        setHasMore(
          paged &&
            (response.data?.total !== undefined
              ? page * PAGE_SIZE < response.data.total
              : records.length === PAGE_SIZE),
        );
      } catch {
        if (token === requestId.current) {
          setError(true);
          setHasMore(false);
        }
      } finally {
        if (token === requestId.current) {
          busyRef.current = false;
          setLoading(false);
        }
      }
    },
    [requestSearch, tab, skillTab, usageScenarios],
  );
  useEffect(() => {
    if (!visible) {
      setTab('skill');
      setSkillTab('all');
      setInput('');
      return;
    }
    setItems([]);
    setHasMore(false);
    setLoading(true);
    const timer = setTimeout(() => {
      void load(1);
    }, 150);
    return () => {
      clearTimeout(timer);
      requestId.current += 1;
      busyRef.current = false;
    };
  }, [visible, load]);
  const filtered =
    tab === 'skill' && skillTab !== 'all'
      ? items.filter((item) =>
          `${item.name} ${item.description ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
      : items;
  const switchTab = () =>
    enablePlugins &&
    setTab((current) => (current === 'skill' ? 'plugin' : 'skill'));
  const header = (
    <>
      <div className={styles['mention-tabs']} role="tablist">
        {(
          ['skill', ...(enablePlugins ? (['plugin'] as const) : [])] as const
        ).map((key) => (
          <div
            role="tab"
            aria-selected={tab === key}
            key={key}
            className={`${styles['mention-tab']} ${
              tab === key ? styles.active : ''
            }`}
            onClick={() => setTab(key)}
          >
            {t(`PC.Components.ChatInputCommands.${key}`)}
          </div>
        ))}
      </div>
      {tab === 'skill' && (
        <div className={styles['mention-tabs']}>
          {(['all', 'recent', 'favorite'] as const).map((key) => (
            <div
              key={key}
              className={`${styles['mention-tab']} ${
                skillTab === key ? styles.active : ''
              }`}
              onClick={() => setSkillTab(key)}
            >
              {t(
                `PC.Components.ChatInputHomeMentionPopup.${
                  key === 'all'
                    ? 'tabAll'
                    : key === 'recent'
                    ? 'tabRecent'
                    : 'tabFavorite'
                }`,
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
  return (
    <PopupList
      {...props}
      ref={ref}
      header={header}
      resetKey={`${tab}:${skillTab}`}
      items={filtered}
      loading={loading}
      error={error}
      searchText={search}
      onSearchChange={setInput}
      onPreviousTab={switchTab}
      onNextTab={switchTab}
      onSelect={(item) => {
        if (item.kind !== 'file') props.onSelect(item);
      }}
      onLoadMore={
        hasMore
          ? () => {
              if (!busyRef.current) void load(pageRef.current + 1);
            }
          : undefined
      }
    />
  );
});
export default SlashPopup;

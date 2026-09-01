/**
 * 会话场景综合验收画廊（/mock-gallery，dev-only）：
 * 39 个故障注入场景按组展示，勾选后一键批播（错峰 + 并发上限），每卡独立
 * runtime 会话与断言 verdict，顶部汇总 N/M 通过、失败项一键重播。
 *
 * 边界（有意设计）：
 * - 仅 runtime 轨——legacy 轨依赖全局 conversationInfo model，无法多实例并存，
 *   legacy 验收请走单页 /mock-chat（卡片「深看」直达）；
 * - 汇总快照写 window.__MOCK_GALLERY_ASSERTIONS__，不触碰单页 e2e 合同
 *   （window.__MOCK_CHAT_ASSERTIONS__）；
 * - mock 服务端按 conversationId 键控（mock/conversationMock.ts Map 改造）。
 */
import { useConversationRendererPreference } from '@/hooks/useConversationRendererPreference';
import {
  setConversationRendererUrlOverride,
  type ConversationRendererVersion,
} from '@/utils/conversationRendererPreference';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import GalleryCard, { type GalleryCardSnapshot } from './GalleryCard';
import type { GalleryScenarioMeta } from './computeScenarioVerdict';
import styles from './index.less';

const cx = classNames.bind(styles);
const { Text, Title } = Typography;

/** 每卡会话 id：910000 + 场景序号（与场景表顺序稳定映射，重播复用同 id） */
const GALLERY_CONVERSATION_BASE = 910000;
/** 批播错峰间隔与同时在飞上限（mock 服务端轻，但渲染与会话 UI 有成本） */
const STAGGER_MS = 600;
const MAX_CONCURRENT_PLAYING = 6;

/** 场景分组（按 id 前缀归组；命中顺序取先） */
const SCENARIO_GROUPS: Array<{ name: string; match: (id: string) => boolean }> =
  [
    { name: '正常收敛', match: (id) => id.startsWith('NORMAL_') },
    {
      name: '流/网络故障',
      match: (id) =>
        /^(ERROR_MID|LATE_CHUNK|SUB_ONLY|NETWORK_ERROR|SUB_NETWORK|HEARTBEAT|CANCELLED_BY)/.test(
          id,
        ),
    },
    {
      name: 'PROCESSING 清理',
      match: (id) => /^(PROCESSING_|MULTI_TOOL)/.test(id),
    },
    {
      name: '取消/冲突/轮询',
      match: (id) => /^(USER_CANCEL|TASK_CONFLICT|IDLE_POLL)/.test(id),
    },
    {
      name: '渲染类型全景',
      match: (id) =>
        /^(PLAN_PROCESSING|RENDER_SHOWCASE|RENDERER_SHOWCASE|COLLAPSE_SHOWCASE|TERMINAL_|LONG_TASK)/.test(
          id,
        ),
    },
    {
      name: '干预（权限/问答/OpenUI）',
      match: (id) => /^(PERMISSION_|ASK_|INTERVENTION_|OPENUI_)/.test(id),
    },
    { name: '历史/续接/队列/其它', match: () => true },
  ];

/** 进页默认勾选：渲染类型全景组（排除真实时长场景） */
const DEFAULT_GROUP_NAME = '渲染类型全景';

declare global {
  interface Window {
    __MOCK_GALLERY_ASSERTIONS__?: GalleryCardSnapshot[];
  }
}

const SPEED_OPTIONS = [1, 2, 4, 8].map((value) => ({
  value,
  label: `${value}×`,
}));

const MockChatGallery: React.FC = () => {
  const [scenarios, setScenarios] = useState<GalleryScenarioMeta[]>([]);
  const [lastError, setLastError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [speed, setSpeed] = useState(4);
  const [playTokens, setPlayTokens] = useState<Record<string, number>>({});
  const [stopTokens, setStopTokens] = useState<Record<string, number>>({});
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());
  const [summaryTick, setSummaryTick] = useState(0);

  const playingIdsRef = useRef<Set<string>>(new Set());
  const verdictsRef = useRef<Map<string, GalleryCardSnapshot>>(new Map());
  const batchRunningRef = useRef(false);

  const { renderer } = useConversationRendererPreference();

  useEffect(() => {
    fetch('/api/mock/conversation/scenarios')
      .then((response) => response.json())
      .then((result: { data?: GalleryScenarioMeta[] }) => {
        const list = result.data || [];
        setScenarios(list);
        const defaultGroup = list.filter(
          (item) =>
            SCENARIO_GROUPS.find((group) => group.match(item.id))?.name ===
              DEFAULT_GROUP_NAME && !item.realTiming,
        );
        setSelected(new Set(defaultGroup.map((item) => item.id)));
      })
      .catch((error: unknown) =>
        setLastError(error instanceof Error ? error.message : String(error)),
      );
  }, []);

  const scenarioIndex = useMemo(() => {
    const map = new Map<string, number>();
    scenarios.forEach((item, index) => map.set(item.id, index));
    return map;
  }, [scenarios]);

  const groups = useMemo(() => {
    const grouped = SCENARIO_GROUPS.map((group) => ({
      name: group.name,
      items: [] as GalleryScenarioMeta[],
    }));
    scenarios.forEach((item) => {
      const index = SCENARIO_GROUPS.findIndex((group) => group.match(item.id));
      grouped[index === -1 ? grouped.length - 1 : index].items.push(item);
    });
    return grouped.filter((group) => group.items.length > 0);
  }, [scenarios]);

  const conversationIdOf = useCallback(
    (scenarioId: string) =>
      GALLERY_CONVERSATION_BASE + (scenarioIndex.get(scenarioId) ?? 0),
    [scenarioIndex],
  );

  const batchPlay = useCallback(async (ids: string[]) => {
    if (!ids.length || batchRunningRef.current) return;
    batchRunningRef.current = true;
    try {
      const queue = [...ids];
      while (queue.length) {
        const startedAt = Date.now();
        // 并发上限：在飞卡满时等待（30s 防御，避免悬挂场景永久阻塞队列）
        while (
          playingIdsRef.current.size >= MAX_CONCURRENT_PLAYING &&
          Date.now() - startedAt < 30000
        ) {
          await new Promise((resolve) => {
            setTimeout(resolve, 200);
          });
        }
        const id = queue.shift()!;
        setPlayTokens((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
        await new Promise((resolve) => {
          setTimeout(resolve, STAGGER_MS);
        });
      }
    } finally {
      batchRunningRef.current = false;
    }
  }, []);

  const handlePlayingChange = useCallback(
    (scenarioId: string, playing: boolean) => {
      if (playing) playingIdsRef.current.add(scenarioId);
      else playingIdsRef.current.delete(scenarioId);
      setPlayingIds(new Set(playingIdsRef.current));
    },
    [],
  );

  const handleVerdict = useCallback((snapshot: GalleryCardSnapshot) => {
    verdictsRef.current.set(snapshot.scenarioId, snapshot);
  }, []);

  const stopAll = useCallback(() => {
    setStopTokens((prev) => {
      const next = { ...prev };
      scenarios.forEach((item) => {
        next[item.id] = (next[item.id] ?? 0) + 1;
      });
      return next;
    });
    playingIdsRef.current.clear();
    setPlayingIds(new Set());
  }, [scenarios]);

  // 汇总快照：播放期间 500ms 聚合刷一次（避免每卡每帧 setState 风暴）
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSummaryTick((value) => value + 1);
      window.__MOCK_GALLERY_ASSERTIONS__ = [...verdictsRef.current.values()];
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  const summary = useMemo(() => {
    void summaryTick;
    const snapshots = [...verdictsRef.current.values()];
    const settled = snapshots.filter((item) => item.settled);
    const passed = settled.filter((item) => item.allPassed);
    const failed = settled.filter((item) => !item.allPassed);
    return {
      total: snapshots.length,
      settled: settled.length,
      passed: passed.length,
      failedIds: failed.map((item) => item.scenarioId),
    };
    // summaryTick 驱动重算（verdict 存 ref）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryTick]);

  const playSelected = useCallback(() => {
    const ids = scenarios
      .filter((item) => selected.has(item.id))
      .map((item) => item.id);
    void batchPlay(ids);
  }, [batchPlay, scenarios, selected]);

  const replayFailed = useCallback(() => {
    void batchPlay(summary.failedIds);
  }, [batchPlay, summary.failedIds]);

  const toggleScenario = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleGroup = (groupName: string, checked: boolean) => {
    const group = groups.find((item) => item.name === groupName);
    if (!group) return;
    setSelected((prev) => {
      const next = new Set(prev);
      group.items.forEach((item) => {
        if (checked) next.add(item.id);
        else next.delete(item.id);
      });
      return next;
    });
  };

  if (!scenarios.length) {
    return (
      <div style={{ minHeight: '100vh', padding: 24 }}>
        {lastError ? (
          <Alert type="error" showIcon message={lastError} />
        ) : (
          <Spin tip="加载场景表…" />
        )}
      </div>
    );
  }

  return (
    <div className={cx(styles['gallery-page'])}>
      <Card size="small" className={cx(styles['gallery-header'])}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space wrap align="center">
            <Title level={4} style={{ margin: 0 }}>
              会话场景综合验收 · Mock Gallery
            </Title>
            <Tag color="geekblue">runtime 轨</Tag>
            <Text type="secondary">
              {scenarios.length} 个场景按组批播（错峰 {STAGGER_MS}ms · 并发上限{' '}
              {MAX_CONCURRENT_PLAYING}）；legacy 轨请走单页深看
            </Text>
          </Space>
          <Space wrap align="center">
            <span data-testid="gallery-summary">
              汇总：{summary.passed}/{summary.settled} 通过
              {summary.failedIds.length
                ? ` · 失败 ${
                    summary.failedIds.length
                  }：${summary.failedIds.join(', ')}`
                : ''}
              {playingIds.size ? ` · 播放中 ${playingIds.size}` : ''}
            </span>
            <Segmented
              options={SPEED_OPTIONS}
              value={speed}
              onChange={(value) => setSpeed(Number(value))}
            />
            <Segmented
              data-testid="gallery-renderer-toggle"
              options={[
                { value: 'v1', label: '渲染 V1 Markdown' },
                { value: 'v2', label: '渲染 V2 工作轨迹' },
              ]}
              value={renderer}
              onChange={(value) =>
                setConversationRendererUrlOverride(
                  value as ConversationRendererVersion,
                )
              }
            />
            <Button
              type="primary"
              onClick={playSelected}
              disabled={!selected.size}
              data-testid="gallery-play-selected"
            >
              播放所选（{selected.size}）
            </Button>
            <Button
              danger
              onClick={stopAll}
              disabled={!playingIds.size}
              data-testid="gallery-stop-all"
            >
              停止全部
            </Button>
            <Button
              onClick={replayFailed}
              disabled={!summary.failedIds.length}
              data-testid="gallery-replay-failed"
            >
              只重播失败项
            </Button>
          </Space>
        </Space>
      </Card>

      {lastError ? <Alert type="error" showIcon message={lastError} /> : null}

      <Card size="small" title="场景选择（按组）">
        <Space direction="vertical" size={6} style={{ width: '100%' }} wrap>
          {groups.map((group) => {
            const groupIds = group.items.map((item) => item.id);
            const checkedCount = groupIds.filter((id) =>
              selected.has(id),
            ).length;
            return (
              <div key={group.name} className={cx(styles['gallery-group-row'])}>
                <Checkbox
                  checked={checkedCount === groupIds.length}
                  indeterminate={
                    checkedCount > 0 && checkedCount < groupIds.length
                  }
                  onChange={(event) =>
                    toggleGroup(group.name, event.target.checked)
                  }
                >
                  <Text strong>{group.name}</Text>
                  <Text type="secondary">（{groupIds.length}）</Text>
                </Checkbox>
                <Space size={4} wrap>
                  {group.items.map((item) => (
                    <Checkbox
                      key={item.id}
                      checked={selected.has(item.id)}
                      onChange={(event) =>
                        toggleScenario(item.id, event.target.checked)
                      }
                    >
                      {item.realTiming ? `${item.id}（真实时长）` : item.id}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            );
          })}
        </Space>
      </Card>

      <div className={cx(styles['gallery-grid'])}>
        {scenarios.map((item) => (
          <GalleryCard
            key={item.id}
            scenario={item}
            conversationId={conversationIdOf(item.id)}
            speed={speed}
            renderer={renderer}
            playToken={playTokens[item.id] ?? 0}
            stopToken={stopTokens[item.id] ?? 0}
            onPlayingChange={handlePlayingChange}
            onVerdict={handleVerdict}
          />
        ))}
      </div>
    </div>
  );
};

export default MockChatGallery;

/**
 * 综合验收画廊卡片：一个场景一张卡（独立 runtime 会话 + 独立 conversationId，
 * 会话状态天然隔离）。播放编排语义照单页 MockChat 的 runtime 线子集：
 * prepare（POST /scenario 带 conversationId+speed → store.reset+load）→
 * play（entry=resume / sub-only / 普通三分派 + IDLE_POLL_TERMINAL 轮询特判）→ stop。
 * 播放/停止由父页面经 playToken/stopToken 递增触发（错峰与并发上限在页面层）。
 */
import { UnifiedChatSession } from '@/components/business-component';
import { useConversationRuntimeSession } from '@/features/conversation/react/useConversationRuntimeSession';
import { apiAgentConversation } from '@/services/agentConfig';
import { DefaultSelectedEnum } from '@/types/enums/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { Button, Card, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  computeScenarioVerdict,
  isTerminalTaskStatus,
  type GalleryScenarioMeta,
  type GalleryServerStatus,
} from './computeScenarioVerdict';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 汇总到页面的单卡快照（页面聚合后写 window.__MOCK_GALLERY_ASSERTIONS__） */
export interface GalleryCardSnapshot {
  scenarioId: string;
  conversationId: number;
  playing: boolean;
  settled: boolean;
  allPassed: boolean;
  serverTaskStatus: string;
  elapsedMs: number;
  messageCount: number;
  lastError: string;
  assertions: Array<{ label: string; passed: boolean }>;
}

interface GalleryCardProps {
  scenario: GalleryScenarioMeta;
  conversationId: number;
  speed: number;
  renderer: 'v1' | 'v2';
  /** 递增触发播放（0 不触发） */
  playToken: number;
  /** 递增触发停止 */
  stopToken: number;
  onPlayingChange: (scenarioId: string, playing: boolean) => void;
  onVerdict: (snapshot: GalleryCardSnapshot) => void;
}

const GalleryCard: React.FC<GalleryCardProps> = ({
  scenario,
  conversationId,
  speed,
  renderer,
  playToken,
  stopToken,
  onPlayingChange,
  onVerdict,
}) => {
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const allowAutoScrollRef = useRef(true);
  const scrollTimeoutRef = useRef<number | null>(null);
  const subTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const sawRef = useRef({ sawActive: false, sawExecutingTools: false });

  const runtimeLine = useConversationRuntimeSession({
    conversationId,
    messageViewRef,
    allowAutoScrollRef,
  });
  const runtimeProps = (runtimeLine?.conversationProps ?? {}) as Record<
    string,
    unknown
  >;
  const messageList = (runtimeLine?.messageList ?? []) as MessageInfo[];
  const isConversationActive = Boolean(runtimeProps.isConversationActive);
  const conversationInfo = runtimeProps.conversationInfo as
    | { id?: number; taskStatus?: string }
    | undefined;

  const [serverStatus, setServerStatus] = useState<GalleryServerStatus>();
  const [lastError, setLastError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/mock/conversation/status?conversationId=${conversationId}`,
      );
      const result = await response.json();
      setServerStatus(result.data || {});
    } catch {
      // 轮询失败保留上次快照，不打断卡片
    }
  }, [conversationId]);

  const prepare = useCallback(async () => {
    setLastError('');
    runtimeLine?.session.abortResumeStream();
    runtimeLine?.session.store.reset();
    const response = await fetch('/api/mock/conversation/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: scenario.id, speed, conversationId }),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      throw new Error(
        `场景初始化失败：HTTP ${response.status}` +
          (detail?.code === 'MOCK_SCENARIO_NOT_FOUND'
            ? '（mock 场景表未热重载，请 touch mock/conversationMock.ts）'
            : ''),
      );
    }
    await runtimeLine?.session.load(conversationId);
    await refreshStatus();
  }, [conversationId, refreshStatus, runtimeLine, scenario.id, speed]);

  const play = useCallback(async () => {
    if (subTimerRef.current) clearTimeout(subTimerRef.current);
    setPlaying(true);
    setStartedAt(Date.now());
    sawRef.current = { sawActive: false, sawExecutingTools: false };
    try {
      await prepare();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : String(error));
      setPlaying(false);
      return;
    }

    // 会话续接：不发送新消息，详情快照装载后直接 sub 续接剩余输出
    if (scenario.entry === 'resume') {
      subTimerRef.current = setTimeout(() => {
        (
          runtimeProps.onResumeConversationStream as (
            ...args: unknown[]
          ) => void
        )(conversationId, messageList, refreshStatus, `mock:${scenario.id}`);
      }, 400);
      return;
    }

    (
      runtimeProps.onSendMessage as
        | ((
            text: string,
            files?: UploadFileInfo[],
            skillIds?: number[],
            modelId?: number,
            agentMode?: string,
          ) => void)
        | undefined
    )?.(`执行 Mock 场景：${scenario.label}`);

    if (scenario.transport === 'sub-only') {
      subTimerRef.current = setTimeout(() => {
        (
          runtimeProps.onResumeConversationStream as (
            ...args: unknown[]
          ) => void
        )(conversationId, messageList, refreshStatus, `mock:${scenario.id}`);
      }, 400);
    }

    if (scenario.id === 'IDLE_POLL_TERMINAL') {
      subTimerRef.current = setTimeout(async () => {
        const result = await apiAgentConversation(conversationId);
        if (result?.data) {
          (runtimeProps.onConversationSnapshot as (s: unknown) => void)(
            result.data,
          );
          if (isTerminalTaskStatus(result.data.taskStatus)) {
            (runtimeProps.onTerminalTaskStatus as (s: string) => void)(
              result.data.taskStatus,
            );
          }
        }
        await refreshStatus();
      }, 600);
    }
    // runtimeProps 每帧重建但会话归属恒定；播放闭包取当帧即可
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    conversationId,
    messageList,
    prepare,
    refreshStatus,
    runtimeProps,
    scenario,
  ]);

  const stop = useCallback(() => {
    if (subTimerRef.current) clearTimeout(subTimerRef.current);
    (runtimeProps.runStopConversation as ((id: string) => void) | undefined)?.(
      String(
        (runtimeProps.getCurrentConversationId as () => number | null)() ??
          conversationId,
      ),
    );
    setPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, runtimeProps]);

  useEffect(() => {
    if (playToken > 0) void play();
    // 播放只由 token 递增显式触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken]);

  useEffect(() => {
    if (stopToken > 0) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopToken]);

  // 卸载清理：断开本卡回放连接
  useEffect(
    () => () => {
      if (subTimerRef.current) clearTimeout(subTimerRef.current);
      runtimeLine?.session.abortResumeStream();
    },
    // 会话归属恒定，仅卸载时清理
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 播放中轮询 mock 服务端状态；终态 + 回放落定 + 本地流式释放后自动收卡
  // （悬挂 keep-open 场景保持播放，等待用户处理或停止）
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      void refreshStatus();
      if (startedAt) setElapsedMs(Date.now() - startedAt);
    }, 250);
    return () => window.clearInterval(timer);
  }, [playing, refreshStatus, startedAt]);

  const verdict = useMemo(
    () =>
      computeScenarioVerdict({
        conversationId,
        loadedConversationId: conversationInfo?.id,
        isConversationActive,
        messageList,
        serverStatus,
        scenario,
        previous: sawRef.current,
      }),
    [
      conversationId,
      conversationInfo?.id,
      isConversationActive,
      messageList,
      scenario,
      serverStatus,
    ],
  );
  sawRef.current.sawActive = verdict.sawActive;
  sawRef.current.sawExecutingTools = verdict.sawExecutingTools;

  useEffect(() => {
    if (
      playing &&
      !verdict.allPassed &&
      isTerminalTaskStatus(serverStatus?.taskStatus)
    ) {
      // 终态但断言未绿：保留播放态供人工查看，不自动收（失败项可重播）
    }
    if (
      playing &&
      isTerminalTaskStatus(serverStatus?.taskStatus) &&
      serverStatus?.replaySettled &&
      !isConversationActive &&
      scenario.transport !== 'keep-open'
    ) {
      setPlaying(false);
    }
  }, [
    playing,
    serverStatus,
    isConversationActive,
    scenario.transport,
    verdict.allPassed,
  ]);

  useEffect(() => {
    onPlayingChange(scenario.id, playing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, scenario.id]);

  useEffect(() => {
    onVerdict({
      scenarioId: scenario.id,
      conversationId,
      playing,
      settled: !playing && startedAt !== null,
      allPassed: startedAt !== null ? verdict.allPassed : true,
      serverTaskStatus: serverStatus?.taskStatus ?? '',
      elapsedMs,
      messageCount: messageList.length,
      lastError,
      assertions: verdict.assertions,
    });
    // 快照随播放/状态每帧刷新（页面聚合幂等）
  });

  const deepLink = `/mock-chat?scenario=${scenario.id}&speed=${speed}&autoplay=1&conversationRuntime=1&conversationRenderer=${renderer}`;

  return (
    <Card
      size="small"
      className={cx(styles['gallery-card'])}
      title={
        <div className={cx(styles['gallery-card-title'])}>
          <span className={cx(styles['gallery-card-name'])}>
            {scenario.id} · {scenario.label}
          </span>
          <span className={cx(styles['gallery-card-meta'])}>
            {playing ? (
              <Tag color="processing" data-testid="gallery-card-playing">
                播放中 {(elapsedMs / 1000).toFixed(1)}s
              </Tag>
            ) : startedAt === null ? (
              <Tag data-testid="gallery-card-idle">未播放</Tag>
            ) : verdict.allPassed ? (
              <Tag color="success" data-testid="gallery-card-pass">
                通过
              </Tag>
            ) : (
              <Tag color="error" data-testid="gallery-card-fail">
                未通过
              </Tag>
            )}
            <Tag>{serverStatus?.taskStatus || '—'}</Tag>
          </span>
        </div>
      }
      extra={
        <span className={cx(styles['gallery-card-actions'])}>
          <Button
            size="small"
            onClick={() => void play()}
            data-testid="gallery-card-replay"
          >
            重播
          </Button>
          <Tooltip title="在新窗口打开单页深看（可切 legacy 轨）">
            <a
              href={deepLink}
              target="_blank"
              rel="noreferrer"
              data-testid="gallery-card-deeplink"
            >
              深看
            </a>
          </Tooltip>
        </span>
      }
    >
      <div className={cx(styles['gallery-card-assertions'])}>
        {verdict.assertions.map((item) => (
          <Tag
            key={item.label}
            color={
              startedAt === null ? 'default' : item.passed ? 'success' : 'error'
            }
          >
            {item.passed ? '✓' : '✗'} {item.label}
          </Tag>
        ))}
        {scenario.realTiming ? <Tag color="orange">真实时长场景</Tag> : null}
        {lastError ? <Tag color="error">{lastError}</Tag> : null}
      </div>
      <div
        ref={messageViewRef}
        className={cx(styles['gallery-card-session'], 'scroll-container')}
      >
        <UnifiedChatSession
          conversationId={conversationId}
          messageList={messageList}
          messageRenderer={renderer}
          isLoading={false}
          isConversationActive={isConversationActive}
          isLocallyStreaming={isConversationActive}
          messageBottomMode="chat"
          agentInfo={{
            id: 44,
            name: '会话验收 Mock Agent',
            type: 'TaskAgent',
            allowChooseMode: DefaultSelectedEnum.Yes,
            hasPermission: true,
            sandboxId: 'mock-sandbox',
          }}
          initialAgentMode="yolo"
          messageViewRef={messageViewRef}
          allowAutoScrollRef={allowAutoScrollRef}
          scrollTimeoutRef={scrollTimeoutRef as never}
          resumeDebugSource={`mock:${scenario.id}`}
          enableMention={false}
          showClearIcon={false}
          showAnnouncement={false}
          queueContext={{
            streamActive: isConversationActive,
            taskExecuting: conversationInfo?.taskStatus === 'EXECUTING',
          }}
          {...(runtimeProps as object)}
        />
      </div>
    </Card>
  );
};

export default GalleryCard;

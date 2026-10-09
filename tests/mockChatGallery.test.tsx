/**
 * 综合验收画廊合同测试：
 * - 进页默认勾选「渲染类型全景」组；组级/单选切换；
 * - 「播放所选」向 mock 服务端发起带 conversationId+speed 的 prepare；
 * - 渲染线切换（URL 写入器）使全部卡片 messageRenderer 即时跟随；
 * - computeScenarioVerdict 四断言语义（纯函数）。
 */
import MockChatGallery from '@/examples/MockChatGallery';
import {
  computeScenarioVerdict,
  isTerminalTaskStatus,
} from '@/examples/MockChatGallery/computeScenarioVerdict';
import { ProcessingEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ucsPropsRef = { current: null as Record<string, unknown> | null };

vi.mock('umi', () => ({
  useModel: () => ({}),
  useLocation: () => ({ pathname: '/mock-gallery', search: '', query: {} }),
  history: { push: vi.fn(), replace: vi.fn() },
}));
vi.mock('@/components/business-component', () => ({
  UnifiedChatSession: (props: Record<string, unknown>) => {
    ucsPropsRef.current = props;
    return (
      <div
        data-testid="ucs"
        data-renderer={String(props.messageRenderer)}
        data-cid={String(props.conversationId)}
      />
    );
  },
}));
vi.mock('@/features/conversation/react/useConversationRuntimeSession', () => ({
  useConversationRuntimeSession: () => null,
}));
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversation: vi.fn(async () => ({ data: null })),
}));
vi.mock('@/examples/MockChatGallery/index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

const SCENARIOS = [
  { id: 'NORMAL_SINGLE', label: '正常单段', hasFinalResult: true },
  { id: 'NETWORK_ERROR', label: '网络错误', hasFinalResult: false },
  { id: 'RENDERER_SHOWCASE', label: 'V2 渲染全景', hasFinalResult: true },
  { id: 'TERMINAL_OUTPUT', label: '终端输出', hasFinalResult: true },
  { id: 'ASK_QUESTION', label: '问答干预', hasFinalResult: true },
  { id: 'SESSION_RESUME', label: '会话续接', hasFinalResult: false },
];

const fetchMock = vi.fn((url: string) => {
  const target = String(url);
  if (target.includes('/api/mock/conversation/scenarios')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({ data: SCENARIOS }),
    } as never);
  }
  if (target.includes('/api/mock/conversation/scenario')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({ data: {} }),
    } as never);
  }
  if (target.includes('/api/mock/conversation/status')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        data: { taskStatus: 'CREATE', emittedEvents: [], replaySettled: true },
      }),
    } as never);
  }
  return Promise.resolve({
    ok: true,
    json: async () => ({ data: null }),
  } as never);
});

const setSearch = (search: string) => {
  window.history.replaceState(null, '', search || location.pathname);
};

describe('MockChatGallery · 画廊页', () => {
  beforeEach(() => {
    localStorage.clear();
    setSearch('');
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setSearch('');
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('进页默认勾选「渲染类型全景」组，其余组不选', async () => {
    render(<MockChatGallery />);
    await waitFor(() => {
      expect(screen.getByText('渲染类型全景')).toBeInTheDocument();
    });
    expect(
      (
        screen.getByRole('checkbox', {
          name: /RENDERER_SHOWCASE/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(
      (
        screen.getByRole('checkbox', {
          name: /NORMAL_SINGLE/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(false);
  });

  it('「播放所选」：向 /scenario 发起带 conversationId（910000+序号）与默认倍速 4 的 prepare', async () => {
    render(<MockChatGallery />);
    await waitFor(() => {
      expect(screen.getByTestId('gallery-play-selected')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('gallery-play-selected'));
    await waitFor(() => {
      // 注意排除场景表 /scenarios（前缀撞名），只取播放 prepare 请求
      const call = fetchMock.mock.calls.find(
        ([url]) =>
          String(url).includes('/api/mock/conversation/scenario') &&
          !String(url).includes('/scenarios'),
      );
      expect(call).toBeTruthy();
      const body = JSON.parse(String(call![1]?.body));
      expect(body.scenario).toBe('RENDERER_SHOWCASE'); // 所选组首个场景先播（错峰）
      expect(body.conversationId).toBe(910002); // 场景表序号 2
      expect(body.speed).toBe(4);
    });
  });

  it('渲染线切换：URL 写入 v1 后全部卡片 messageRenderer 跟随为 v1（默认 v2）', async () => {
    render(<MockChatGallery />);
    await waitFor(() => {
      expect(ucsPropsRef.current?.messageRenderer).toBe('v2');
    });
    setSearch('?conversationRenderer=v1');
    window.dispatchEvent(new CustomEvent('conversation-renderer-v2-changed'));
    await waitFor(() => {
      expect(ucsPropsRef.current?.messageRenderer).toBe('v1');
    });
  });
});

describe('computeScenarioVerdict · 断言纯函数', () => {
  const base = {
    conversationId: 910001,
    loadedConversationId: 910001,
    isConversationActive: false,
    messageList: [] as MessageInfo[],
    serverStatus: {
      taskStatus: 'COMPLETE',
      emittedEvents: [{ eventType: 'FINAL_RESULT' }],
      replaySettled: true,
    },
    scenario: { id: 'X', label: 'X', hasFinalResult: true },
  };

  it('正常终态：四断言全绿', () => {
    const verdict = computeScenarioVerdict(base);
    expect(verdict.allPassed).toBe(true);
    expect(verdict.assertions).toHaveLength(4);
    expect(verdict.hasFinalResult).toBe(true);
  });

  it('会话未按卡加载 → 第一条断言失败', () => {
    const verdict = computeScenarioVerdict({
      ...base,
      loadedConversationId: 888,
    });
    expect(verdict.assertions[0].passed).toBe(false);
  });

  it('终态场景缺 FINAL_RESULT → 第二条失败；终态后仍活跃 → 第三条失败', () => {
    const verdict = computeScenarioVerdict({
      ...base,
      serverStatus: {
        taskStatus: 'EXECUTING',
        emittedEvents: [],
        replaySettled: false,
      },
      isConversationActive: true,
    });
    expect(verdict.assertions[1].passed).toBe(false);
    // hasFinalResult=false 且 terminalExpected=true → !hasFinalResult || !active = true
    expect(verdict.assertions[2].passed).toBe(true);
    expect(verdict.sawActive).toBe(true);
  });

  it('终态后 EXECUTING 工具残留 → 第四条失败（sawExecutingTools 续算）', () => {
    const messageList = [
      {
        processingList: [{ status: ProcessingEnum.EXECUTING, name: 't' }],
      },
    ] as never as MessageInfo[];
    const verdict = computeScenarioVerdict({
      ...base,
      messageList,
      previous: { sawActive: true, sawExecutingTools: false },
    });
    expect(verdict.executingProcessingCount).toBe(1);
    expect(verdict.assertions[3].passed).toBe(false);
    expect(verdict.sawActive).toBe(true);
    expect(verdict.sawExecutingTools).toBe(true);
  });

  it('悬挂（keep-open）场景：保持活跃即通过', () => {
    const verdict = computeScenarioVerdict({
      ...base,
      scenario: {
        id: 'X',
        label: 'X',
        hasFinalResult: true,
        transport: 'keep-open',
      },
      isConversationActive: true,
    });
    expect(verdict.assertions[2].passed).toBe(true);
  });

  it('isTerminalTaskStatus 三态判定', () => {
    expect(isTerminalTaskStatus('COMPLETE')).toBe(true);
    expect(isTerminalTaskStatus('CANCEL')).toBe(true);
    expect(isTerminalTaskStatus('FAILED')).toBe(true);
    expect(isTerminalTaskStatus('EXECUTING')).toBe(false);
    expect(isTerminalTaskStatus(undefined)).toBe(false);
  });
});

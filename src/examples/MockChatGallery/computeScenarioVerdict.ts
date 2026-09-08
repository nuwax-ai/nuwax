/**
 * 综合验收画廊的每卡断言（语义照单页 MockChat 的 assertion 组装收拢为纯函数）：
 * 1) 会话已按卡加载；2) FINAL_RESULT 有无符合场景预期；3) 悬挂场景保持活跃 /
 * 终态场景流式释放；4) 终态后无 EXECUTING 工具残留。
 * 「曾经」语义（sawActive/sawExecutingTools）由调用方经 previous 传入续算。
 */
import { ProcessingEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

export interface GalleryScenarioMeta {
  id: string;
  label: string;
  description?: string;
  verifies?: string;
  hasFinalResult?: boolean;
  transport?: string;
  entry?: string;
  realTiming?: boolean;
}

export interface GalleryServerStatus {
  scenario?: string;
  taskStatus?: string;
  emittedEvents?: Array<{ eventType: string }>;
  scriptLength?: number;
  replaySettled?: boolean;
}

export interface ScenarioVerdictInput {
  conversationId: number;
  loadedConversationId?: number | null;
  isConversationActive: boolean;
  messageList: MessageInfo[];
  serverStatus?: GalleryServerStatus;
  scenario?: GalleryScenarioMeta;
  previous?: { sawActive?: boolean; sawExecutingTools?: boolean };
}

export interface ScenarioAssertion {
  label: string;
  passed: boolean;
}

export interface ScenarioVerdict {
  assertions: ScenarioAssertion[];
  allPassed: boolean;
  hasFinalResult: boolean;
  executingProcessingCount: number;
  sawActive: boolean;
  sawExecutingTools: boolean;
}

export const isTerminalTaskStatus = (status?: string | null): boolean =>
  status === 'COMPLETE' || status === 'CANCEL' || status === 'FAILED';

export function computeScenarioVerdict(
  input: ScenarioVerdictInput,
): ScenarioVerdict {
  const executingProcessingCount = input.messageList.reduce(
    (count, message) =>
      count +
      (message.processingList || []).filter(
        (item) => item.status === ProcessingEnum.EXECUTING,
      ).length,
    0,
  );
  // 活跃信号：本卡流式活跃 或 服务端快照 EXECUTING（悬挂/续接链路补充信号）
  const sawActive =
    Boolean(input.previous?.sawActive) ||
    input.isConversationActive ||
    input.serverStatus?.taskStatus === 'EXECUTING';
  const sawExecutingTools =
    Boolean(input.previous?.sawExecutingTools) || executingProcessingCount > 0;
  const hasFinalResult = Boolean(
    input.serverStatus?.emittedEvents?.some(
      (event) => event.eventType === 'FINAL_RESULT',
    ),
  );
  const terminalExpected = input.scenario?.hasFinalResult ?? false;
  const hangingExpected = input.scenario?.transport === 'keep-open';
  const assertions: ScenarioAssertion[] = [
    {
      label: '会话已加载',
      passed: input.loadedConversationId === input.conversationId,
    },
    {
      label: terminalExpected
        ? '已收到协议 FINAL_RESULT'
        : '事件脚本按预期无 FINAL_RESULT',
      passed: terminalExpected ? hasFinalResult : !hasFinalResult,
    },
    {
      label: hangingExpected ? '悬挂场景保持活跃' : '终态后本地流式状态已释放',
      passed: hangingExpected
        ? input.isConversationActive
        : terminalExpected
        ? !hasFinalResult || !input.isConversationActive
        : !input.isConversationActive,
    },
    {
      label: terminalExpected
        ? '终态后无 EXECUTING 工具残留'
        : '工具状态与当前脚本一致',
      passed:
        terminalExpected && hasFinalResult
          ? executingProcessingCount === 0
          : true,
    },
  ];
  return {
    assertions,
    allPassed: assertions.every((item) => item.passed),
    hasFinalResult,
    executingProcessingCount,
    sawActive,
    sawExecutingTools,
  };
}

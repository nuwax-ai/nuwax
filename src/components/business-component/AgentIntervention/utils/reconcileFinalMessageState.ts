import {
  AgentComponentTypeEnum,
  ConversationEventTypeEnum,
} from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  ConversationFinalResult,
  ExecuteResultInfo,
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import { processInterventionSsePatch } from './processInterventionSsePatch';

function inferProcessingStatus(result: ExecuteResultInfo): ProcessingEnum {
  return result.success === false
    ? ProcessingEnum.FAILED
    : ProcessingEnum.FINISHED;
}

function inferSubEventType(
  result: ExecuteResultInfo,
): ProcessingInfo['subEventType'] | 'ASK_QUESTION' | 'REQUEST_PERMISSION' {
  if (result.name === 'Backend.Sandbox.Event.AskQuestion') {
    return 'ASK_QUESTION';
  }
  if (result.name === 'Backend.Sandbox.Event.RequestPermission') {
    return 'REQUEST_PERMISSION';
  }
  return null;
}

function toProcessingData(result: ExecuteResultInfo) {
  return {
    targetId: -1,
    name: result.name,
    originalTitle: null,
    type: result.type,
    status: inferProcessingStatus(result),
    executingMessage: null,
    result,
    cardBindConfig: null,
    cardData: null,
    pageArgConfig: null,
    subEventType: inferSubEventType(result),
  };
}

function patchInterventionsFromExecuteResults(
  currentMessage: MessageInfo,
  finalResult: ConversationFinalResult,
): MessageInfo {
  return (finalResult.componentExecuteResults || []).reduce((message, item) => {
    const patch = processInterventionSsePatch(
      {
        completed: false,
        data: toProcessingData(item),
        error: '',
        eventType: ConversationEventTypeEnum.PROCESSING,
        requestId: '',
      } as ConversationChatResponse,
      message,
    );
    return patch || message;
  }, currentMessage);
}

function reconcileProcessingList(
  currentList: ProcessingInfo[] | undefined,
  finalResult: ConversationFinalResult,
): ProcessingInfo[] {
  const nextList = [...(currentList || [])];
  const resultMap = new Map(
    (finalResult.componentExecuteResults || [])
      .filter((item) => item.executeId)
      .map((item) => [item.executeId as string, item]),
  );

  const seenExecuteIds = new Set<string>();

  for (let i = 0; i < nextList.length; i += 1) {
    const item = nextList[i];
    const executeId = item.executeId;
    if (executeId && resultMap.has(executeId)) {
      const executeResult = resultMap.get(executeId)!;
      seenExecuteIds.add(executeId);
      nextList[i] = {
        ...item,
        name: executeResult.name,
        type: executeResult.type as AgentComponentTypeEnum,
        status: inferProcessingStatus(executeResult),
        result: executeResult,
        subEventType: inferSubEventType(
          executeResult,
        ) as ProcessingInfo['subEventType'],
      };
      continue;
    }

    if (item.status === ProcessingEnum.EXECUTING) {
      nextList[i] = {
        ...item,
        status: ProcessingEnum.FAILED,
      };
    }
  }

  resultMap.forEach((executeResult, executeId) => {
    if (seenExecuteIds.has(executeId)) {
      return;
    }
    nextList.push({
      ...toProcessingData(executeResult),
      executeId,
    } as ProcessingInfo);
  });

  return nextList;
}

export function reconcileFinalMessageState(
  currentMessage: MessageInfo,
  finalResult: ConversationFinalResult,
): MessageInfo {
  const messageWithInterventions = patchInterventionsFromExecuteResults(
    currentMessage,
    finalResult,
  );

  return {
    ...messageWithInterventions,
    processingList: reconcileProcessingList(
      messageWithInterventions.processingList,
      finalResult,
    ),
  };
}

/**
 * 「会话结束未读」蓝点 hook 层：事件接线 + React 订阅。
 *
 * 「会话结束」共接三个信号（均模块级接线——registry 是页面级内存态，事件监听
 * 与之间生命周期，面板卸载窗口内结束的会话也不漏记；接线挂 import 期，不随
 * 面板挂载/卸载）：
 * 1. ChatFinished（后端 notify 轮询）：任意会话结束的推送——当前 testagent
 *    实测对普通聊天不下发（2026-09-17 高频竞速探测实证），仅部分场景可用；
 * 2. UpdateConversationListTaskStatus 终态补丁：会话页 SSE 收敛/轮询链发出的
 *    本地终态事件（项目子会话同样经此链）；
 * 3. 列表 EXECUTING→终态 跃迁检测：任务列表 useHomeSectionData / 项目 ProjectPanel。
 * 三路幂等汇入同一 store；「结束时在场」也登记本轮已处理但不记蓝点。
 * EXECUTING 补丁解除完成去重，重复终态轮询不代表新一次执行结束。
 *
 * useFinishedConversationUnread 经 useSyncExternalStore 暴露未读 id 快照，
 * 供列表区块订阅重渲染（快照读法见 finishedConversationUnread.ts 头注释）。
 */
import { useSyncExternalStore } from 'react';

import { EVENT_TYPE } from '@/constants/event.constants';
import { TaskStatus } from '@/types/enums/agent';
import {
  isTerminalTaskStatus,
  subscribeChatFinished,
} from '@/utils/conversationTaskStatusSync';
import eventBus from '@/utils/eventBus';

import {
  getFinishedConversationUnreadSnapshot,
  markConversationExecuting,
  markConversationFinished,
  subscribeFinishedConversationUnread,
} from './finishedConversationUnread';

// 信号 1：ChatFinished 后端通知
subscribeChatFinished((payload) => {
  const conversationId = payload?.conversationId;
  if (!conversationId) return;
  markConversationFinished(conversationId);
});

// 信号 2：本 tab 终态补丁（会话页 SSE 收敛/轮询链；项目子会话共用此链）
eventBus.on(
  EVENT_TYPE.UpdateConversationListTaskStatus,
  (payload: { conversationId: string | number; taskStatus?: TaskStatus }) => {
    const id = payload?.conversationId;
    if (!id) return;
    if (payload?.taskStatus === TaskStatus.EXECUTING) {
      markConversationExecuting(id);
    } else if (isTerminalTaskStatus(payload?.taskStatus)) {
      markConversationFinished(id);
    }
  },
);

/** 订阅「会话结束未读」蓝点 id 快照（进入即清除、24h 失效、整页刷新重置） */
export function useFinishedConversationUnread(): ReadonlySet<string> {
  return useSyncExternalStore(
    subscribeFinishedConversationUnread,
    getFinishedConversationUnreadSnapshot,
  );
}

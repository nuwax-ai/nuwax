/**
 * 弹窗状态管理 Hook
 * 管理历史会话弹窗、定时任务弹窗等状态
 */

import { CreateUpdateModeEnum } from '@/types/enums/common';
import { useCallback, useState } from 'react';
import type { DialogStateReturn } from '../types';

export const useDialogState = (): DialogStateReturn => {
  // 历史会话弹窗状态
  const [isHistoryConversationOpen, setIsHistoryConversationOpen] =
    useState<boolean>(false);
  // 定时任务弹窗状态
  const [isTimedTaskOpen, setIsTimedTaskOpen] = useState<boolean>(false);
  // 定时任务模式
  const [timedTaskMode, setTimedTaskMode] = useState<CreateUpdateModeEnum>();

  /**
   * 打开历史会话弹窗
   */
  const openHistoryConversation = useCallback(() => {
    setIsHistoryConversationOpen(true);
  }, []);

  /**
   * 关闭历史会话弹窗
   */
  const closeHistoryConversation = useCallback(() => {
    setIsHistoryConversationOpen(false);
  }, []);

  /**
   * 打开定时任务弹窗
   */
  const openTimedTask = useCallback((taskMode: CreateUpdateModeEnum) => {
    setIsTimedTaskOpen(true);
    setTimedTaskMode(taskMode);
  }, []);

  /**
   * 关闭定时任务弹窗
   */
  const closeTimedTask = useCallback(() => {
    setIsTimedTaskOpen(false);
  }, []);

  return {
    isHistoryConversationOpen,
    openHistoryConversation,
    closeHistoryConversation,
    isTimedTaskOpen,
    timedTaskMode,
    openTimedTask,
    closeTimedTask,
  };
};

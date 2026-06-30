import { AgentSidebarRef } from '@/components/AgentSidebar';
import { AllowCopyEnum } from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import { MessageInfo } from '@/types/interfaces/conversationInfo';
import React, { useMemo } from 'react';

interface UseChatViewModeProps {
  effectiveAgent: any;
  messageList: MessageInfo[];
  isFileTreeVisible: boolean;
  viewMode: string;
  id: number;
  sidebarRef: React.RefObject<AgentSidebarRef>;
  openPreviewView: (id: number) => void;
  closePreviewView: () => void;
  openDesktopView: (id: number) => void;
  pagePreviewData?: any;
}

export const useChatViewMode = ({
  effectiveAgent,
  isFileTreeVisible,
  viewMode,
  id,
  sidebarRef,
  openPreviewView,
  closePreviewView,
  openDesktopView,
  pagePreviewData,
}: UseChatViewModeProps) => {
  /**
   * 是否显示文件预览 / 智能体电脑切换按钮：
   * 1. 仅通用型智能体 (TaskAgent)
   */
  const isShowFilePanel = useMemo(() => {
    return effectiveAgent?.type === AgentTypeEnum.TaskAgent;
  }, [effectiveAgent?.type]);

  // 判断是否显示复制按钮（智能体允许复制即可显示，支持复制智能体或工作流模板）
  const showCopyButton = useMemo(() => {
    return effectiveAgent?.allowCopy === AllowCopyEnum.Yes;
  }, [effectiveAgent?.allowCopy, effectiveAgent?.agentId, pagePreviewData]);

  /**
   * 切换文件树「预览」视图
   */
  const handleFileTreeVisible = () => {
    if (!isFileTreeVisible) {
      // 文件树当前未显示：关闭 AgentSidebar，打开预览视图
      sidebarRef.current?.close();
      openPreviewView(id);
      return;
    }

    // 文件树已显示
    if (viewMode === 'preview') {
      // 当前就是预览视图：再次点击关闭视图
      closePreviewView();
    } else {
      // 当前是其他模式（例如 desktop）：切换为预览视图但保持文件树显示
      openPreviewView(id);
    }
  };

  /**
   * 切换「智能体电脑」视图
   */
  const handleOpenDesktopView = () => {
    if (!isFileTreeVisible) {
      // 文件树当前未显示：关闭 AgentSidebar，打开智能体电脑视图
      sidebarRef.current?.close();
      openDesktopView(id);
      return;
    }

    // 文件树已显示
    if (viewMode === 'desktop') {
      // 当前就是智能体电脑视图：再次点击关闭视图
      closePreviewView();
    } else {
      // 当前是其他模式（例如 preview）：切换为智能体电脑视图但保持文件树显示
      openDesktopView(id);
    }
  };

  return {
    isShowFilePanel,
    showCopyButton,
    handleFileTreeVisible,
    handleOpenDesktopView,
  };
};

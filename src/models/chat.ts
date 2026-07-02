import { ExpandPageAreaEnum, HideChatAreaEnum } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import { ProcessingInfo } from '@/types/interfaces/conversationInfo';
import { useCallback, useState } from 'react';

/**
 * 页面预览数据接口
 */
export interface PagePreviewData {
  name: string; // 页面名称
  uri: string; // 页面路径
  params: Record<string, any>; // URL 参数
  executeId: string; // 执行ID
}

/**
 * 智能体页面配置
 */
export interface AgentPageConfig {
  expandPageArea: ExpandPageAreaEnum; // 是否默认展开页面预览
  hideChatArea: HideChatAreaEnum; // 是否隐藏聊天输入区域
}

/**
 *
 * 使用 会在 chatTemp 中使用
 */
export default () => {
  const [processingList, setProcessingList] = useState<ProcessingInfo[]>([]);

  // 页面预览状态管理
  const [pagePreviewData, setPagePreviewData] =
    useState<PagePreviewData | null>(null);

  // 页面预览标题
  const [previewPageTitle, setPreviewPageTitle] = useState<string>('');

  // 智能体页面配置
  const [agentPageConfig, setAgentPageConfig] = useState<AgentPageConfig>({
    expandPageArea: ExpandPageAreaEnum.No,
    hideChatArea: HideChatAreaEnum.No,
  });

  // 判断是否应该替换现有的 ProcessingInfo
  const shouldReplaceProcessingItem = (
    existing: ProcessingInfo,
    newItem: ProcessingInfo,
  ): boolean => {
    // 如果现有项是 EXECUTING 状态，新项不是 EXECUTING，则替换
    if (
      existing.status === ProcessingEnum.EXECUTING &&
      newItem.status !== ProcessingEnum.EXECUTING
    ) {
      return true;
    }

    // 如果现有项是 FAILED，新项是 FINISHED，则替换（优先保留成功）
    if (
      existing.status === ProcessingEnum.FAILED &&
      newItem.status === ProcessingEnum.FINISHED
    ) {
      return true;
    }

    // 如果现有项是 FINISHED，新项是 FAILED，则不替换（保留成功）
    if (
      existing.status === ProcessingEnum.FINISHED &&
      newItem.status === ProcessingEnum.FAILED
    ) {
      return false;
    }

    // 其他情况保持现有项
    return false;
  };

  const handleChatProcessingList = (incomingList: ProcessingInfo[]) => {
    // 采用「合并 upsert」而非「清空 + 整体替换」。
    // 原因：chat model 是全局单例，conversationInfo（主会话）与 conversationAgent
    // （开发预览/多智能体）等多个 model 都会写入同一个 processingList。
    // 若每次加载都整体替换，后加载的会话会覆盖先加载会话的执行明细，
    // 导致被覆盖会话里的 MarkdownCustomProcess 通过 getProcessingById 找不到条目，
    // 详情数据为空、「查看详情」按钮被禁用、点击无反应。
    // 改为按 executeId+type 合并后，跨会话/跨 model 的历史明细可共存且不丢失。
    setProcessingList((prevList) => {
      // 去重逻辑：同一 executeId+type 仅保留一条；EXECUTING 被最终态替换，
      // 成功(FINISHED)优先于失败(FAILED)。
      const processedMap = new Map<string, ProcessingInfo>();

      const upsert = (item: ProcessingInfo) => {
        const key = `${item.executeId || ''}_${item.type || ''}`;
        const existing = processedMap.get(key);
        if (!existing) {
          processedMap.set(key, item);
        } else if (shouldReplaceProcessingItem(existing, item)) {
          processedMap.set(key, item);
        }
      };

      // 先放入已有条目（保留历史会话明细），再用本次传入的条目做 upsert 更新
      prevList.forEach(upsert);
      incomingList.forEach(upsert);

      return Array.from(processedMap.values());
    });
  };
  const getProcessingById = useCallback(
    (executeId: string, type?: string) => {
      return processingList.find(
        (item: ProcessingInfo) =>
          item?.executeId === executeId && (!type || item?.type === type),
      );
    },
    [processingList],
  );

  // 显示页面预览
  const showPagePreview = useCallback((data: PagePreviewData) => {
    setPagePreviewData(data);
  }, []);

  // 隐藏页面预览
  const hidePagePreview = useCallback(() => {
    setPagePreviewData(null);
  }, []);

  return {
    processingList,
    handleChatProcessingList,
    getProcessingById,
    // 页面预览相关
    pagePreviewData,
    showPagePreview,
    hidePagePreview,
    // 智能体页面配置
    agentPageConfig,
    setAgentPageConfig,
    // 预览标题
    previewPageTitle,
    setPreviewPageTitle,
  };
};

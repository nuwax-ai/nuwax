import { ProcessingEnum } from '@/types/enums/common';
import { ProcessingInfo } from '@/types/interfaces/conversationInfo';
import { useCallback, useState } from 'react';
/**
 *
 * 使用 会在 chatTemp 中使用
 */
export default () => {
  const [processingList, setProcessingList] = useState<ProcessingInfo[]>([]);

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

  const handleChatProcessingList = (processingList: ProcessingInfo[]) => {
    //先清空
    setProcessingList([]);

    // 去重逻辑：保留一条，如果status状态不是 EXECUTING，如果成功或者失败都有就仅保留成功
    const processedMap = new Map<string, ProcessingInfo>();

    processingList.forEach((item) => {
      const key = item.executeId || '';
      const existing = processedMap.get(key);

      if (!existing) {
        // 如果不存在，直接添加
        processedMap.set(key, item);
      } else {
        // 如果已存在，根据状态优先级决定保留哪一个
        const shouldReplace = shouldReplaceProcessingItem(existing, item);
        if (shouldReplace) {
          processedMap.set(key, item);
        }
      }
    });

    const newProcessingList = Array.from(processedMap.values());
    setProcessingList(newProcessingList);
  };
  const getProcessingById = useCallback(
    (executeId: string) => {
      return processingList.find(
        (item: ProcessingInfo) => item?.executeId === executeId,
      );
    },
    [processingList],
  );

  return {
    processingList,
    handleChatProcessingList,
    getProcessingById,
  };
};

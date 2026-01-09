/**
 * 卡片处理工具函数
 * 纯函数，用于处理卡片数据
 */

import { BindCardStyleEnum } from '@/types/enums/plugin';
import type {
  CardDataInfo,
  CardInfo,
} from '@/types/interfaces/conversationInfo';
import { isEmptyObject } from '@/utils/common';

/**
 * 处理卡片数据
 * @param data SSE 事件数据
 * @param currentCardList 当前卡片列表
 * @param currentRequestId 当前请求 ID
 * @param newRequestId 新请求 ID
 * @returns 更新后的卡片列表
 */
export const processCardData = (
  data: any,
  currentCardList: CardInfo[],
  currentRequestId: string,
  newRequestId: string,
): CardInfo[] | null => {
  // 检查是否有卡片配置和数据
  if (!data?.cardBindConfig || !data?.cardData) {
    return null;
  }

  // 竖向列表模式
  if (data.cardBindConfig?.bindCardStyle === BindCardStyleEnum.LIST) {
    // 过滤掉空对象
    const _cardData =
      data?.cardData?.filter((item: CardDataInfo) => !isEmptyObject(item)) ||
      [];

    const cardDataList =
      _cardData?.map((item: CardDataInfo) => ({
        ...item,
        cardKey: data.cardBindConfig.cardKey,
      })) || [];

    // 如果是同一次会话请求，则追加，否则更新
    return newRequestId === currentRequestId
      ? [...currentCardList, ...cardDataList]
      : [...cardDataList];
  }

  // 单张卡片模式
  const cardInfo = {
    ...data?.cardData,
    cardKey: data.cardBindConfig?.cardKey,
  };

  // 如果是同一次会话请求，则追加，否则更新
  return newRequestId === currentRequestId
    ? [...currentCardList, cardInfo]
    : [cardInfo];
};

/**
 * 检查卡片数据是否有效（非空列表）
 * @param data SSE 事件数据
 * @returns 是否有有效卡片数据
 */
export const hasValidCardData = (data: any): boolean => {
  if (!data?.cardBindConfig || !data?.cardData) {
    return false;
  }

  if (data.cardBindConfig?.bindCardStyle === BindCardStyleEnum.LIST) {
    const _cardData =
      data?.cardData?.filter((item: CardDataInfo) => !isEmptyObject(item)) ||
      [];
    return _cardData.length > 0;
  }

  return !isEmptyObject(data?.cardData);
};

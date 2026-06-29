import {
  CHATBOX_SINGLE_INSTANCE_FUNCTION_TYPES,
  RECOMMEND_PAGE_CONFIG_MAP,
} from '../constants';
import {
  DisplayRecommendFunctionTypeEnum,
  DisplayRecommendInfo,
  DisplayRecTypeEnum,
} from '../types';

/**
 * 获取列表中已占用的「单子类型」functionType 集合
 * @param records 当前推荐列表
 * @param excludeRecordId 编辑时排除当前记录 ID
 */
export const getUsedChatboxSingleInstanceTypes = (
  records: DisplayRecommendInfo[],
  excludeRecordId?: number,
): Set<DisplayRecommendFunctionTypeEnum> => {
  const used = new Set<DisplayRecommendFunctionTypeEnum>();
  records.forEach((record) => {
    if (excludeRecordId !== undefined && record.id === excludeRecordId) {
      return;
    }
    const functionType =
      record.functionType as DisplayRecommendFunctionTypeEnum;
    if (CHATBOX_SINGLE_INSTANCE_FUNCTION_TYPES.includes(functionType)) {
      used.add(functionType);
    }
  });
  return used;
};

/**
 * 子类型下拉是否禁用（智能体 Chat 始终可选；编辑时当前子类型保持可选）
 */
export const isChatboxFunctionTypeDisabled = (
  type: DisplayRecommendFunctionTypeEnum,
  usedTypes: Set<DisplayRecommendFunctionTypeEnum>,
  currentFunctionType?: string,
): boolean => {
  if (type === DisplayRecommendFunctionTypeEnum.Chat) {
    return false;
  }
  if (!CHATBOX_SINGLE_INSTANCE_FUNCTION_TYPES.includes(type)) {
    return false;
  }
  if (currentFunctionType && type === currentFunctionType) {
    return false;
  }
  return usedTypes.has(type);
};

/**
 * 获取首个可选的子类型（新增时默认选中）
 */
export const getFirstAvailableChatboxFunctionType = (
  records: DisplayRecommendInfo[],
  excludeRecordId?: number,
): DisplayRecommendFunctionTypeEnum => {
  const usedTypes = getUsedChatboxSingleInstanceTypes(records, excludeRecordId);
  const allTypes =
    RECOMMEND_PAGE_CONFIG_MAP[DisplayRecTypeEnum.ChatBoxNav].functionTypes ||
    [];
  const available = allTypes.find(
    (type) => !isChatboxFunctionTypeDisabled(type, usedTypes),
  );
  return available ?? DisplayRecommendFunctionTypeEnum.Chat;
};

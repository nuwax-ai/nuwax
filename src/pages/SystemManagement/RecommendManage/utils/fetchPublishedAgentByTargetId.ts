import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiPublishedAgentList } from '@/services/square';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';

/**
 * 根据 targetId 从广场已发布智能体列表中解析智能体信息（含原始 icon）
 */
export async function fetchPublishedAgentByTargetId(
  targetId: number,
  nameHint?: string,
): Promise<SquarePublishedItemInfo | null> {
  try {
    const res = await apiPublishedAgentList({
      page: 1,
      pageSize: 50,
      category: '',
      kw: nameHint,
      targetType: AgentComponentTypeEnum.Agent,
      targetSubType: 'ChatBot',
    });
    if (res?.code !== SUCCESS_CODE) {
      return null;
    }
    return (
      res.data?.records?.find((item) => item.targetId === targetId) ?? null
    );
  } catch {
    return null;
  }
}

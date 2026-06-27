import type { QANodeOption } from '@/types/interfaces/node';

import { HitlAnswerTypeEnum } from '../enums/hitlAnswerType';

/**
 * HumanInteraction ask 模式历史配置结构（v1 嵌套形态，运行时代码已扁平化）
 * @deprecated 请使用 nodeConfig 扁平字段 options / answerType / formArgs
 */
export interface HitlAskConfig {
  question: string;
  answerType: HitlAnswerTypeEnum;
  options?: QANodeOption[];
  answerKey: string;
  required?: boolean;
}

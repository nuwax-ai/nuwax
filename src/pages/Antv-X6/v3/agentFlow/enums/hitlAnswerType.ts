/**
 * HumanInteraction 回答类型（对齐后端 nodeConfig.answerType）
 * TEXT / SELECT 与 Workflow QA 共用；FORM 为 AgentFlow 表单回复扩展
 */
export enum HitlAnswerTypeEnum {
  TEXT = 'TEXT',
  SELECT = 'SELECT',
  FORM = 'FORM',
}

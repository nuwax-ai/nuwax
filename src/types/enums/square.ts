// 目标对象（智能体、工作流、插件）ID,可用值:Agent,Plugin,Workflow,KNOWLEDGE
export enum SquareAgentTypeEnum {
  Agent = 'Agent',
  // 注释掉，因为ChatBot已经废弃，不再使用
  // ChatBot = 'ChatBot',
  // 网页应用
  PageApp = 'PageApp',
  Plugin = 'Plugin',
  Workflow = 'Workflow',
  Knowledge = 'Knowledge',
  // 模板
  Template = 'Template',
  // 技能
  Skill = 'Skill',
}

// 自定义广场-模板目标类型（全部、智能体、工作流、页面应用）
export enum SquareTemplateTargetTypeEnum {
  // 全部
  // All = 'All',
  // 智能体
  ChatBot = 'ChatBot',
  // 网页应用
  PageApp = 'PageApp',
  // 工作流
  Workflow = 'Workflow',
  // 技能
  Skill = 'Skill',
}

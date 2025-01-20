interface SubArgs {
  key: string;
  name: string;
  description: string;
  dataType: string;
  require: boolean;
  systemVariable: boolean;
  bindValueType: string;
  bindValue: string;
}

interface InputAndOutConfig {
  key: string;
  name: string;
  description: string;
  dataType: string;
  require: boolean;
  systemVariable: boolean;
  bindValueType: string;
  bindValue: string;
  subArgs: SubArgs[];
}

// 技能列表配置
export interface SkillComponent {
  name: string;
  icon: string;
  description: string;
  type: string;
  typeId: number;
}

// 大模型节点
export interface LLMNodeConfig {
  extension: any;
  // 入参
  inputArgs: InputAndOutConfig[] | [];
  // 出参
  outputArgs: InputAndOutConfig[] | [];
  // 选定大模型
  mode?: string;
  // 模型id
  modelId?: number;
  // 出参的方式
  outputType?: string;
  // 技能列表配置
  skillComponentConfigs?: SkillComponent[];
  // 系统提示词
  systemPrompt: string;
  // 用户提示词
  userPrompt: string;
  // 最大回复长度
  maxTokens: number;
  // 生成随机性
  temperature: number;
  //
  topP: number;
}

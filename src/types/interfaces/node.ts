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
  name: string;
  description: string;
  dataType: string;
  require: boolean;
  systemVariable: boolean;
  bindValueType: string;
  bindValue: string;
  subArgs?: SubArgs[];
  key?: string | null;
}

// 技能列表配置
export interface SkillComponent {
  name: string;
  icon: string;
  description: string;
  type: string;
  typeId: number;
}

interface Extension {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}
// 节点内部的config
export interface NodeConfig {
  extension?: Extension | null;
  inputArgs?: InputAndOutConfig[] | null;
  outputArgs?: InputAndOutConfig[] | null;
  outputType?: string;
  // 模型id
  modelId?: number;
  // 选定技能
  mode?: string;
  // 技能列表配置
  skillComponentConfigs?: SkillComponent[];
  // 系统提示词
  systemPrompt?: string;
  // 用户提示词
  userPrompt?: string;
  // 最大回复长度
  maxTokens?: number;
  // 生成随机性
  temperature?: number;
  //
  topP?: number;
  // 插件的id
  pluginId?: number;
}

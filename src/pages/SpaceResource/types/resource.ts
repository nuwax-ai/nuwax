// 资源定价 - 模型定价信息
export interface ModelPricingInfo {
  // 档位ID
  id?: number;
  // 模型ID
  modelId: number;
  // 上下文长度（如32代表32k）
  contextLength: number;
  // 输入价格
  inputPrice: number;
  // 输出价格
  outputPrice: number;
  // 缓存价格
  cachePrice: number;
  // 创建时间
  created?: string;
  // 修改时间
  modified?: string;
}

// ======================= 工具定价 =======================

/*定价对象类型,可用值:AGENT,SKILL,PLUGIN,WORKFLOW,MCP,MODEL */
export enum ToolPricingTargetType {
  AGENT = 'AGENT',
  SKILL = 'SKILL',
  PLUGIN = 'PLUGIN',
  WORKFLOW = 'WORKFLOW',
  MCP = 'MCP',
  MODEL = 'MODEL',
}

// 定价类型：ONE_TIME-单次，BUYOUT-买断，MONTHLY-包月，SUBSCRIPTION_PLAN-订阅计划，TIERED-阶梯计费,可用值:ONE_TIME,BUYOUT,MONTHLY,TIERED
export enum ResourcePricingType {
  ONE_TIME = 'ONE_TIME',
  BUYOUT = 'BUYOUT',
  MONTHLY = 'MONTHLY',
  // SUBSCRIPTION_PLAN = 'SUBSCRIPTION_PLAN',
  TIERED = 'TIERED',
}

// 状态：0-禁用（关闭付费），1-启用（开启收费）
export enum ResourcePricingStatus {
  DISABLED = 0, // 禁用
  ENABLED = 1, // 启用
}

// 资源定价 - 工具定价信息
export interface ToolPricingInfo {
  /*定价对象类型,可用值:AGENT,SKILL,PLUGIN,WORKFLOW,MCP,MODEL */
  targetType: ToolPricingTargetType;

  /*定价对象ID */
  targetId: string;

  // 定价类型：ONE_TIME-单次，BUYOUT-买断，MONTHLY-包月，SUBSCRIPTION_PLAN-订阅计划，TIERED-阶梯计费,可用值:ONE_TIME,BUYOUT,MONTHLY,TIERED
  pricingType: ResourcePricingType;

  /*价格 */
  price?: number;

  /*可试用次数，0=不支持试用 */
  trialCount?: number;

  // 状态：0-禁用（关闭付费），1-启用（开启收费）
  status?: ResourcePricingStatus;

  /*工作空间ID，默认-1，工作空间下的定价管理时，该字段为必须 */
  spaceId?: number;
}

// 参数接口
export interface QueryPricingInfoParams {
  /*业务类型,可用值:AGENT,SKILL,PLUGIN,WORKFLOW,MCP,MODEL */
  targetType: ToolPricingTargetType;

  /*业务对象ID */
  targetId: string;
}

/**
 * 查询定价配置结果
 */
export interface ResourcePricingConfigInfo extends ToolPricingInfo {
  // 配置ID
  id: number;
  // 修改时间
  modified: string;
  // 创建时间
  created: string;
  // 定价对象信息
  targetObjectInfo?: {
    // 名称
    name: string;
    // 描述
    description: string;
    // 图标
    icon: string;
  };
  // 模型阶梯价格配置
  modelPriceTiers?: Array<{
    // 档位ID
    id: number;
    // 模型ID
    modelId: number;
    // 上下文长度（如32代表32k）
    contextLength: number;
    // 输入价格
    inputPrice: number;
    // 输出价格
    outputPrice: number;
    // 缓存价格
    cachePrice: number;
    // 创建时间
    created: string;
    // 修改时间
    modified: string;
  }>;
  // 订阅计划
  plans?: Array<Record<string, unknown>>;
}

// 参数接口
export interface ListPricingConfigsParams {
  /*定价对象类型,可用值:AGENT,SKILL,PLUGIN,WORKFLOW,MCP,MODEL */
  targetType?: ToolPricingTargetType;

  /*定价对象类型列表，比如查询工具列表下面包含了 MCP、PLUGIN、WORKFLOW */
  targetTypes?: ToolPricingTargetType[];

  /*定价对象ID */
  targetId?: string;

  /*定价类型,可用值:ONE_TIME,BUYOUT,MONTHLY,TIERED */
  pricingType?: ResourcePricingType;

  /*状态：0-禁用，1-启用 */
  status?: ResourcePricingStatus;

  /*工作空间ID，系统管理端传-1 */
  spaceId: number;
}

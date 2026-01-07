// 修改请求状态码

class Constant {
  //request succeed
  static success = '0000';
  static warning = 99;
}

export default Constant;

export const SUCCESS_CODE = '0000';
// 用户未登录
export const USER_NO_LOGIN = '4010';
// 重定向登录
export const REDIRECT_LOGIN = '4011';
// 智能体不存在或已下架
export const AGENT_NOT_EXIST = '0001';

/**
 * 智能体页面开发聊天服务错误状态码 --start
 */

// 智能体服务运行中的错误状态
export const AGENT_SERVICE_RUNNING = '9010';
// 智能体没有配置默认聊天模型（0001与上面的状态码重复了, 为了语义化清晰, 所以这里单独定义）
export const AGENT_NO_CONFIG_MODEL = '0001';
// 智能体AI聊天错误（普通错误）
export const AGENT_AI_CHAT_ERROR = '9999';

/**
 * 智能体服务错误状态码 --end
 */

/**
 * 工作流错误状态码 --start
 */

// 工作流版本冲突（工作流已在其他窗口被修改）
export const WORKFLOW_VERSION_CONFLICT = '1011';

/**
 * 工作流错误状态码 --end
 */

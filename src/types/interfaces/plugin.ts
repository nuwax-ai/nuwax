// 插件试运行输入参数
export interface PluginTestParams {
  requestId: string;
  pluginId: string;
  params: object;
}

// 插件试运行输出结果
export interface PluginTestResult {
  // 	执行结果状态
  success: boolean;
  // 执行结果
  result: object;
  // 执行日志
  logs: string[];
  // 执行错误信息
  error: string;
  // 请求ID
  requestId: string;
  // 请求耗时
  costTime: string;
}
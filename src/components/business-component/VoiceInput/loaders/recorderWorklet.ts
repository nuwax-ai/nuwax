/**
 * 录音 AudioWorklet 静态资源定位
 *
 * recorder-worklet.js 位于 public/，随本前端构建部署、由前端站点自身服务，
 * 因此必须按前端 origin 解析，而不能按 API 域名（process.env.BASE_URL）：
 * - audioWorklet.addModule 加载跨域模块要求响应带 CORS 头，API 域的静态资源
 *   通常没有——本地开发（BASE_URL 指向远端测试环境）会直接加载失败；
 * - 按 API 域加载还会出现「本地新代码 + 远端旧 worklet」的版本漂移。
 *
 * 应用当前以根路径（publicPath '/'）部署；若未来引入子路径需同步调整这里。
 * 模块加载与缓存由 loaders/recorderContext 的会话级单例负责。
 */
export function resolveRecorderWorkletUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/recorder-worklet.js`;
  }
  return '/recorder-worklet.js';
}

/** 宿主提供的当前鉴权域信息；不包含 token 等凭据。 */
export interface HostAuthContext {
  businessOrigin: string;
  gatewayOrigin: string | null;
  loadMode: 'gateway' | 'direct';
}

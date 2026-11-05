export interface QrLoginCode {
  sceneId: string;
  pollToken: string;
  qrContent: string;
  expireSeconds: number;
}

export type QrLoginStatus = 'WAITING' | 'SCANNED' | 'CONFIRMED' | 'EXPIRED';

export interface QrLoginResult {
  status: QrLoginStatus;
  // 浏览器线上登录只依赖 Cookie，确认后 token 可以为空。
  token?: string | null;
  expireDate?: string | null;
  resetPass?: number | null;
}

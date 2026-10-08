/** License 状态由 provider 决定，前端不根据本地时钟或文件内容判签。 */
export type LicenseState = 'NOT_INSTALLED' | 'VALID' | 'EXPIRED' | 'INVALID';

export interface LicenseFeature {
  readonly code: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly reason?: string;
}

/** 前端展示投影，不包含原始授权内容、签名或未脱敏编号。 */
export interface LicenseSnapshot {
  readonly state: LicenseState;
  readonly subject?: string;
  readonly maskedId?: string;
  readonly validFrom?: string;
  readonly expiresAt?: string;
  readonly updatedAt?: string;
  readonly canImport: boolean;
  readonly features: readonly LicenseFeature[];
}

export type LicenseErrorKind =
  | 'unavailable'
  | 'unauthenticated'
  | 'forbidden'
  | 'network'
  | 'invalid-response';

/** 只暴露可翻译的类别，不将 provider 异常文本或原始授权内容传给页面。 */
export interface LicenseFailure {
  readonly kind: LicenseErrorKind;
}

export type LicenseRequestStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | LicenseErrorKind;

export interface LicenseControllerState {
  readonly status: LicenseRequestStatus;
  /** 刷新/导入失败可保留上次展示值，执行授权必须同时检查 status。 */
  readonly snapshot: LicenseSnapshot | null;
  readonly error: LicenseFailure | null;
  readonly providerAvailable: boolean;
  readonly importAvailable: boolean;
  readonly operation: 'read' | 'import' | null;
}

/** 真实 API 未就绪时由接入层提供 available=false，不静默回退到 mock。 */
export interface LicenseReader {
  readonly available: boolean;
  read(signal?: AbortSignal): Promise<unknown>;
}

export interface LicenseProvider extends LicenseReader {
  /** 原始 File 只交给明确的 provider；不能走通用 CDN 上传或记录其内容。 */
  importLicense?(file: File, signal?: AbortSignal): Promise<unknown>;
}

export interface LicenseController {
  getState(): LicenseControllerState;
  /** 不在注册时回调；消费方用 getState 读取初始值。 */
  subscribe(listener: () => void): () => void;
  /** 仅 true 表示本次成功结果仍有效且已应用；迟到、重复或卸载返回 false。 */
  reload(): Promise<boolean>;
  importLicense(file: File): Promise<boolean>;
  /** 账号变化等上下文切换时清除旧授权，令在途响应失效。 */
  reset(): void;
  dispose(): void;
}

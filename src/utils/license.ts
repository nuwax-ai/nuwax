import type {
  LicenseControllerState,
  LicenseErrorKind,
  LicenseFailure,
  LicenseFeature,
  LicenseSnapshot,
  LicenseState,
} from '@/types/interfaces/license';

const LICENSE_STATES: readonly LicenseState[] = [
  'NOT_INSTALLED',
  'VALID',
  'EXPIRED',
  'INVALID',
];

/** provider 可明确报告错误类别；错误文本不携带原始授权内容。 */
export class LicenseRequestError extends Error {
  readonly kind: LicenseErrorKind;

  constructor(kind: LicenseErrorKind) {
    super(`License request failed: ${kind}`);
    this.name = 'LicenseRequestError';
    this.kind = kind;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidResponse(): never {
  throw new LicenseRequestError('invalid-response');
}

function optionalString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return invalidResponse();
  return value;
}

/** 校验已知字段并创建只读投影，未知字段不会流入 UI/订阅状态。 */
export function projectLicenseSnapshot(value: unknown): LicenseSnapshot {
  if (!isRecord(value)) return invalidResponse();
  if (
    typeof value.state !== 'string' ||
    !LICENSE_STATES.includes(value.state as LicenseState) ||
    typeof value.canImport !== 'boolean' ||
    !Array.isArray(value.features)
  ) {
    return invalidResponse();
  }

  const codes = new Set<string>();
  const features = value.features.map((item: unknown): LicenseFeature => {
    if (
      !isRecord(item) ||
      typeof item.code !== 'string' ||
      item.code.trim().length === 0 ||
      item.code !== item.code.trim() ||
      codes.has(item.code) ||
      typeof item.name !== 'string' ||
      item.name.trim().length === 0 ||
      typeof item.enabled !== 'boolean'
    ) {
      return invalidResponse();
    }
    codes.add(item.code);
    return Object.freeze({
      code: item.code,
      name: item.name,
      enabled: item.enabled,
      reason: optionalString(item, 'reason'),
    });
  });

  return Object.freeze({
    state: value.state as LicenseState,
    subject: optionalString(value, 'subject'),
    maskedId: optionalString(value, 'maskedId'),
    validFrom: optionalString(value, 'validFrom'),
    expiresAt: optionalString(value, 'expiresAt'),
    updatedAt: optionalString(value, 'updatedAt'),
    canImport: value.canImport,
    features: Object.freeze(features),
  });
}

/** 只按明确的 HTTP 状态或 provider 错误分类，不从自由文本猜过期/权限。 */
export function classifyLicenseError(error: unknown): LicenseFailure {
  if (error instanceof LicenseRequestError) {
    return Object.freeze({ kind: error.kind });
  }
  if (isRecord(error)) {
    const status = isRecord(error.response)
      ? error.response.status
      : error.status;
    if (status === 401) return Object.freeze({ kind: 'unauthenticated' });
    if (status === 403) return Object.freeze({ kind: 'forbidden' });
  }
  return Object.freeze({ kind: 'network' });
}

/** 已注册功能的执行边界：读取成功 + provider 可用 + VALID + 明确启用的 code。 */
export function canExecuteLicenseFeature(
  state: LicenseControllerState,
  code: string,
): boolean {
  if (
    state.providerAvailable !== true ||
    state.status !== 'ready' ||
    state.snapshot?.state !== 'VALID' ||
    typeof code !== 'string' ||
    code.trim().length === 0
  ) {
    return false;
  }
  return state.snapshot.features.some(
    (feature) => feature.code === code && feature.enabled === true,
  );
}

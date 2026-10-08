import { describe, expect, it } from 'vitest';
import type {
  LicenseControllerState,
  LicenseSnapshot,
} from '../../src/types/interfaces/license';
import {
  canExecuteLicenseFeature,
  classifyLicenseError,
  LicenseRequestError,
  projectLicenseSnapshot,
} from '../../src/utils/license';

const source = () => ({
  state: 'VALID',
  subject: '示例企业',
  maskedId: 'mock-****-0930',
  validFrom: '2030-01-01T00:00:00Z',
  expiresAt: '2000-01-01T00:00:00Z',
  canImport: true,
  features: [{ code: 'example_feature', name: '示例功能', enabled: true }],
});

function ready(snapshot: LicenseSnapshot): LicenseControllerState {
  return {
    status: 'ready',
    snapshot,
    error: null,
    providerAvailable: true,
    importAvailable: true,
    operation: null,
  };
}

describe('License 展示投影与功能授权', () => {
  it.each(['NOT_INSTALLED', 'VALID', 'EXPIRED', 'INVALID'])(
    '保留 provider 的 %s 状态，不按本地时钟改写',
    (state) => {
      const projected = projectLicenseSnapshot({ ...source(), state });
      expect(projected.state).toBe(state);
      expect(projected.validFrom).toBe('2030-01-01T00:00:00Z');
      expect(projected.expiresAt).toBe('2000-01-01T00:00:00Z');
    },
  );

  it('投影不保留未知/原始字段，且 provider 后续修改不会改动已读快照', () => {
    const raw = {
      ...source(),
      rawLicense: 'raw-private-content',
      signature: 'secret-signature',
      features: [
        {
          code: 'example_feature',
          name: '示例功能',
          enabled: true,
          rawPermission: 'raw-private-content',
        },
      ],
    };
    const projected = projectLicenseSnapshot(raw);
    raw.features[0].enabled = false;
    expect(projected.features[0].enabled).toBe(true);
    expect(projected).not.toHaveProperty('rawLicense');
    expect(projected).not.toHaveProperty('signature');
    expect(projected.features[0]).not.toHaveProperty('rawPermission');
    expect(Object.isFrozen(projected)).toBe(true);
    expect(Object.isFrozen(projected.features)).toBe(true);
    expect(Object.isFrozen(projected.features[0])).toBe(true);
  });

  it.each([
    ['未知状态', { ...source(), state: 'ACTIVE' }],
    ['缺少能力表', { ...source(), features: undefined }],
    ['字符串布尔', { ...source(), canImport: 'true' }],
    [
      '未知启用值',
      { ...source(), features: [{ code: 'a', name: 'A', enabled: 1 }] },
    ],
    [
      '空能力标识',
      { ...source(), features: [{ code: '', name: 'A', enabled: true }] },
    ],
    [
      '含空格标识',
      { ...source(), features: [{ code: ' a ', name: 'A', enabled: true }] },
    ],
    ['能力名称缺失', { ...source(), features: [{ code: 'a', enabled: true }] }],
    ['已知字段形态错误', { ...source(), maskedId: { id: 'raw' } }],
    [
      '能力原因形态错误',
      {
        ...source(),
        features: [{ code: 'a', name: 'A', enabled: true, reason: 403 }],
      },
    ],
    [
      '重复能力标识',
      {
        ...source(),
        features: [
          { code: 'a', name: 'A', enabled: false },
          { code: 'a', name: 'A', enabled: true },
        ],
      },
    ],
    ['空响应', null],
  ])('%s 不能产生可执行快照', (_name, raw) => {
    expect(() => projectLicenseSnapshot(raw)).toThrow(LicenseRequestError);
    try {
      projectLicenseSnapshot(raw);
    } catch (error) {
      expect(classifyLicenseError(error)).toEqual({ kind: 'invalid-response' });
    }
  });

  it('仅明确启用的 code 可执行；未知/空白/不同大小写 code 不授权', () => {
    const state = ready(projectLicenseSnapshot(source()));
    expect(canExecuteLicenseFeature(state, 'example_feature')).toBe(true);
    for (const code of [
      '',
      ' ',
      'other_feature',
      'EXAMPLE_FEATURE',
      ' example_feature ',
    ]) {
      expect(canExecuteLicenseFeature(state, code)).toBe(false);
    }
  });

  it.each(['NOT_INSTALLED', 'EXPIRED', 'INVALID'])(
    '%s 即使能力 enabled=true 也不能执行',
    (licenseState) => {
      expect(
        canExecuteLicenseFeature(
          ready(projectLicenseSnapshot({ ...source(), state: licenseState })),
          'example_feature',
        ),
      ).toBe(false);
    },
  );

  it('VALID 不绕过 enabled=false 或 provider 未接入', () => {
    const disabled = projectLicenseSnapshot({
      ...source(),
      features: [{ code: 'example_feature', name: '示例功能', enabled: false }],
    });
    expect(canExecuteLicenseFeature(ready(disabled), 'example_feature')).toBe(
      false,
    );
    expect(
      canExecuteLicenseFeature(
        {
          ...ready(projectLicenseSnapshot(source())),
          providerAvailable: false,
        },
        'example_feature',
      ),
    ).toBe(false);
  });

  it.each([
    'idle',
    'loading',
    'unavailable',
    'unauthenticated',
    'forbidden',
    'network',
    'invalid-response',
  ] as const)('%s 时保留的 VALID 展示值不授予执行权', (status) => {
    expect(
      canExecuteLicenseFeature(
        { ...ready(projectLicenseSnapshot(source())), status },
        'example_feature',
      ),
    ).toBe(false);
  });

  it('首次读取前不存在可执行授权', () => {
    expect(
      canExecuteLicenseFeature(
        { ...ready(projectLicenseSnapshot(source())), snapshot: null },
        'example_feature',
      ),
    ).toBe(false);
  });
});

describe('License 请求错误分类', () => {
  it.each([
    'unavailable',
    'unauthenticated',
    'forbidden',
    'network',
    'invalid-response',
  ] as const)('保留 provider 明确的 %s 类别', (kind) => {
    expect(classifyLicenseError(new LicenseRequestError(kind))).toEqual({
      kind,
    });
  });

  it.each([
    [{ status: 401 }, 'unauthenticated'],
    [{ response: { status: 401 } }, 'unauthenticated'],
    [{ status: 403 }, 'forbidden'],
    [{ response: { status: 403 } }, 'forbidden'],
  ])('按 HTTP 状态区分认证/权限，普通 403 不是授权过期', (error, kind) => {
    expect(classifyLicenseError(error)).toEqual({ kind });
  });

  it('未知错误不读取自由文本、原始内容或猜过期，默认 network', () => {
    const error = { message: 'license expired raw-private-content', code: 403 };
    expect(classifyLicenseError(error)).toEqual({ kind: 'network' });
    expect(classifyLicenseError(new Error('raw-private-content'))).toEqual({
      kind: 'network',
    });
    expect(classifyLicenseError(null)).toEqual({ kind: 'network' });
  });
});

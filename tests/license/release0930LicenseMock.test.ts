import { describe, expect, it } from 'vitest';
import { createRelease0930Mock } from '../../mock/release0930Remaining';

const PREFIX = '/api/mock/release0930';
const valid = {
  state: 'VALID',
  subject: '本地授权样例',
  maskedId: 'MOCK-****-NEXT',
  canImport: true,
  features: [{ code: 'demo_feature', name: '样例功能', enabled: true }],
};
function client() {
  const handlers = createRelease0930Mock();
  return (
    method: string,
    path: string,
    body: unknown = {},
    loggedIn = true,
  ) => {
    let response: any;
    handlers[`${method} ${path}`](
      {
        body,
        path,
        headers: loggedIn
          ? { authorization: 'Bearer release0930-mock-token' }
          : {},
      },
      {
        json: (value: unknown) => {
          response = JSON.parse(JSON.stringify(value));
        },
      },
    );
    return response;
  };
}

describe('本地 License provider 供数边界', () => {
  it('读写均要求登录，读权限与导入权限独立', () => {
    const request = client();
    expect(request('GET', `${PREFIX}/license/info`, {}, false).code).toBe(
      '4010',
    );
    expect(request('POST', `${PREFIX}/license/import`, {}, false).code).toBe(
      '4010',
    );
    request('POST', `${PREFIX}/configure`, { permissionMode: 'read-only' });
    expect(request('GET', `${PREFIX}/license/info`).code).toBe('0000');
    expect(request('POST', `${PREFIX}/license/import`).code).toBe('4033');
    request('POST', `${PREFIX}/configure`, { permissionMode: 'no-access' });
    expect(request('GET', `${PREFIX}/license/info`).code).toBe('4033');
  });
  it('更新只用 provider 判定状态，过期文件不能被客户端伪装有效', () => {
    const request = client();
    const next = { ...valid, state: 'EXPIRED' };
    expect(
      request('POST', `${PREFIX}/license/import`, {
        licenseContent: JSON.stringify(next),
      }).data.state,
    ).toBe('EXPIRED');
    expect(request('GET', `${PREFIX}/license/info`).data.state).toBe('EXPIRED');
    expect(
      request('POST', `${PREFIX}/license/import`, {
        licenseContent: JSON.stringify(valid),
      }).data.state,
    ).toBe('VALID');
  });
  it.each([
    '',
    '{invalid',
    JSON.stringify({ ...valid, state: 'UNKNOWN' }),
    'x'.repeat(1024 * 1024 + 1),
  ])('无效内容不会替换现有快照 (%#)', (content) => {
    const request = client();
    const previous = request('GET', `${PREFIX}/license/info`).data;
    expect(
      request('POST', `${PREFIX}/license/import`, { licenseContent: content })
        .code,
    ).toBe('0001');
    expect(request('GET', `${PREFIX}/license/info`).data).toEqual(previous);
  });
  it('canImport 撤销时导入失败且不改变状态', () => {
    const request = client();
    request('POST', `${PREFIX}/configure`, {
      license: { ...valid, canImport: false },
    });
    expect(
      request('POST', `${PREFIX}/license/import`, {
        licenseContent: JSON.stringify(valid),
      }).code,
    ).toBe('4033');
    expect(request('GET', `${PREFIX}/license/info`).data.canImport).toBe(false);
  });
  it('原始授权内容及未知字段不出现在快照或请求记录中', () => {
    const request = client();
    request('POST', `${PREFIX}/license/import`, {
      fileName: 'fixture.json',
      licenseContent: JSON.stringify({
        ...valid,
        signature: 'PRIVATE-FIXTURE-CONTENT',
      }),
    });
    const state = request('GET', `${PREFIX}/state`).data;
    expect(JSON.stringify(state)).not.toContain('PRIVATE-FIXTURE-CONTENT');
    expect(
      state.requests.find((item: any) => item.path.endsWith('/license/import'))
        .body.licenseContent,
    ).toBe('[redacted]');
    expect(state.license).not.toHaveProperty('signature');
  });
  it('失败注入可重试，失败不改授权状态', () => {
    const request = client();
    const previous = request('GET', `${PREFIX}/license/info`).data;
    request('POST', `${PREFIX}/configure`, {
      failNext: { path: `${PREFIX}/license/import`, code: '4033' },
    });
    expect(
      request('POST', `${PREFIX}/license/import`, {
        licenseContent: JSON.stringify(valid),
      }).code,
    ).toBe('4033');
    expect(request('GET', `${PREFIX}/license/info`).data).toEqual(previous);
    expect(
      request('POST', `${PREFIX}/license/import`, {
        licenseContent: JSON.stringify(valid),
      }).data.maskedId,
    ).toBe(valid.maskedId);
  });
});

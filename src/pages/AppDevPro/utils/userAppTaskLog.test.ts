import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...values: (string | number)[]) =>
    values.length ? `${key}:${values.join(',')}` : key,
}));

import {
  getEventTerminalStatus,
  getTaskLogText,
  mergeTaskServiceProgress,
  parseUserAppTaskLogEvent,
  resolveBuildServiceStatus,
} from './userAppTaskLog';

describe('userAppTaskLog service start events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('解析 service_starting / service_start_ok 的 event 与 service', () => {
    expect(
      parseUserAppTaskLogEvent(
        { event: 'service_starting', service: 'backend-go' },
        'service_starting',
      ),
    ).toMatchObject({
      type: 'service_starting',
      serviceId: 'backend-go',
    });
    expect(
      parseUserAppTaskLogEvent(
        { event: 'service_start_ok', service: 'frontend-react-vite' },
        'service_start_ok',
      ),
    ).toMatchObject({
      type: 'service_start_ok',
      serviceId: 'frontend-react-vite',
    });
  });

  it('映射为服务状态，且不是任务终态', () => {
    expect(resolveBuildServiceStatus('service_starting')).toBe(
      'service_starting',
    );
    expect(resolveBuildServiceStatus('service_start_ok')).toBe(
      'service_start_ok',
    );
    expect(
      getEventTerminalStatus({ type: 'service_starting', serviceId: 'api' }),
    ).toBeNull();
    expect(
      getEventTerminalStatus({ type: 'service_start_ok', serviceId: 'api' }),
    ).toBeNull();
  });

  it('合并服务状态：starting 记日志，start_ok 记成功', () => {
    const starting = mergeTaskServiceProgress(
      [],
      parseUserAppTaskLogEvent(
        { event: 'service_starting', service: 'backend-go' },
        'service_starting',
      )!,
    );
    expect(starting).toEqual([
      {
        serviceId: 'backend-go',
        status: 'service_starting',
        logs: ['PC.Pages.AppDevPro.serviceStarting:backend-go'],
      },
    ]);

    const started = mergeTaskServiceProgress(
      starting,
      parseUserAppTaskLogEvent(
        { event: 'service_start_ok', service: 'backend-go' },
        'service_start_ok',
      )!,
    );
    expect(started).toEqual([
      {
        serviceId: 'backend-go',
        status: 'service_start_ok',
        logs: [
          'PC.Pages.AppDevPro.serviceStarting:backend-go',
          'PC.Pages.AppDevPro.serviceStartOk:backend-go',
        ],
      },
    ]);
  });

  it('两个服务各自独立推进', () => {
    let services = mergeTaskServiceProgress([], {
      type: 'service_starting',
      serviceId: 'backend-go',
    });
    services = mergeTaskServiceProgress(services, {
      type: 'service_starting',
      serviceId: 'frontend-react-vite',
    });
    services = mergeTaskServiceProgress(services, {
      type: 'service_start_ok',
      serviceId: 'backend-go',
    });
    services = mergeTaskServiceProgress(services, {
      type: 'service_start_ok',
      serviceId: 'frontend-react-vite',
    });

    expect(services.map((item) => item.serviceId)).toEqual([
      'backend-go',
      'frontend-react-vite',
    ]);
    expect(services.every((item) => item.status === 'service_start_ok')).toBe(
      true,
    );
  });

  it('无服务名时仍有兜底日志', () => {
    expect(getTaskLogText({ type: 'service_starting' })).toBe(
      'PC.Pages.AppDevPro.startingService',
    );
    expect(getTaskLogText({ type: 'service_start_ok' })).toBe(
      'PC.Pages.AppDevPro.startSuccess',
    );
  });
});

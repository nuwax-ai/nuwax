import { describe, expect, it } from 'vitest';

import {
  isEngineInternalErrorText,
  mapEngineInternalErrorText,
} from './engineErrorFallback';

describe('引擎内部错误兜底（NW-108）', () => {
  it('裸文本与代码块包裹的引擎错误整句都命中', () => {
    expect(isEngineInternalErrorText('AcpEngine not initialized')).toBe(true);
    expect(isEngineInternalErrorText('```\nAcpEngine not initialized\n```')).toBe(
      true,
    );
    expect(isEngineInternalErrorText('```text\nAcpEngine not initialized\n```')).toBe(
      true,
    );
    expect(isEngineInternalErrorText('WorkflowEngine not initialized.')).toBe(true);
  });

  it('正常回答（即使顺带提到引擎错误词）不受影响', () => {
    expect(isEngineInternalErrorText('')).toBe(false);
    expect(isEngineInternalErrorText(null)).toBe(false);
    expect(isEngineInternalErrorText('初始化引擎的步骤如下……')).toBe(false);
    expect(
      isEngineInternalErrorText(
        '遇到 AcpEngine not initialized 时可以重启会话。此外还有其他建议……',
      ),
    ).toBe(false);
    // 多段正文（错误后还有内容）不整体替换
    expect(
      isEngineInternalErrorText('AcpEngine not initialized\n\n已自动重试成功'),
    ).toBe(false);
  });

  it('mapEngineInternalErrorText：命中换兜底文案，未命中原样返回', () => {
    const fallback = '智能体引擎启动异常，请稍后重试或重新进入会话';
    expect(mapEngineInternalErrorText('```\nAcpEngine not initialized\n```', fallback)).toBe(
      fallback,
    );
    expect(mapEngineInternalErrorText('正常回答', fallback)).toBe('正常回答');
    expect(mapEngineInternalErrorText(null, fallback)).toBe('');
  });
});

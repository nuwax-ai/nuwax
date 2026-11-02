import {
  extractLastTaskResultFile,
  extractTaskResult,
} from '@/utils/taskResult';
import { describe, expect, it } from 'vitest';

describe('extractTaskResult 统一口径', () => {
  it('多个 task-result 时取最后一个，段内多个 file 时取第一个', () => {
    const text = [
      '<task-result><description>一</description><file>a.md</file><file>b.md</file></task-result>',
      '<task-result><description>二</description><file>c.md</file><file>d.md</file></task-result>',
    ].join('\n');

    expect(extractTaskResult(text)).toEqual({
      hasTaskResult: true,
      description: '二',
      file: 'c.md',
    });
    expect(extractLastTaskResultFile(text)).toBe('c.md');
  });

  it('没有 task-result 时返回空结果', () => {
    expect(extractTaskResult('普通文本')).toEqual({ hasTaskResult: false });
    expect(extractLastTaskResultFile('普通文本')).toBeNull();
  });

  it('有 task-result 但没有 file 时只标记存在', () => {
    expect(
      extractTaskResult(
        '<task-result><description>仅说明</description></task-result>',
      ),
    ).toEqual({
      hasTaskResult: true,
      description: '仅说明',
    });
    expect(
      extractLastTaskResultFile(
        '<task-result><description>仅说明</description></task-result>',
      ),
    ).toBeNull();
  });
});

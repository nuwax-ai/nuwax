import { setNodeConfigFieldsValue } from '@/pages/Antv-X6/v3/utils/nodeConfigForm';
import type { NodeConfig } from '@/types/interfaces/node';
import { act, cleanup, render } from '@testing-library/react';
import type { FormInstance } from 'antd';
import { Form, Input } from 'antd';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let activeForm: FormInstance<NodeConfig>;
const watchedQuestions: unknown[] = [];

function FormProbe() {
  const [form] = Form.useForm<NodeConfig>();
  activeForm = form;
  const question = Form.useWatch('question', form);
  useEffect(() => {
    watchedQuestions.push(question);
  }, [question]);
  return (
    <Form form={form}>
      <Form.Item name="question">
        <Input aria-label="question" />
      </Form.Item>
      <Form.Item name="text">
        <Input aria-label="text" />
      </Form.Item>
    </Form>
  );
}

beforeEach(() => {
  watchedQuestions.length = 0;
  render(<FormProbe />);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('NodeConfig 到真实 AntD Form store 的窄适配', () => {
  it('一次透传 null/primitive/array/nested 不透明配置，不改变输入对象和字段存在性', () => {
    const config: NodeConfig = {
      question: '提问',
      contextParams: {
        nil: null,
        number: 3,
        flag: false,
        text: 'value',
        array: [null, 1, { nested: 'yes' }],
        nested: { left: null, right: { value: 5 } },
      },
      askConfig: { nil: null, format: 'text', values: [1, 2] },
    };
    const inputSnapshot = JSON.parse(JSON.stringify(config));
    const inputKeys = Object.keys(config);
    Object.freeze(config);
    Object.freeze(config.contextParams);
    Object.freeze(config.askConfig);
    const setFieldsValue = vi.spyOn(activeForm, 'setFieldsValue');
    act(() => setNodeConfigFieldsValue(activeForm, config));

    expect(setFieldsValue).toHaveBeenCalledTimes(1);
    expect(setFieldsValue.mock.calls[0][0]).toBe(config);
    expect(activeForm.getFieldsValue(true)).toEqual(config);
    expect(config).toEqual(inputSnapshot);
    expect(Object.keys(config)).toEqual(inputKeys);
  });

  it('沿用原生深合并与数组替换，未提供的 key 留在 store', () => {
    act(() =>
      setNodeConfigFieldsValue(activeForm, {
        question: '原问题',
        contextParams: {
          preserved: null,
          nested: { left: 1, right: 2 },
          array: [1, 2, 3],
        },
        askConfig: { format: 'text', values: ['A', 'B'] },
      }),
    );
    const patch: NodeConfig = {
      contextParams: { nested: { right: 4 }, array: ['new'] },
    };
    const patchSnapshot = JSON.parse(JSON.stringify(patch));
    act(() => setNodeConfigFieldsValue(activeForm, patch));

    expect(activeForm.getFieldValue('contextParams')).toEqual({
      preserved: null,
      nested: { left: 1, right: 4 },
      array: ['new'],
    });
    expect(activeForm.getFieldValue('askConfig')).toEqual({
      format: 'text',
      values: ['A', 'B'],
    });
    expect(activeForm.getFieldValue('question')).toBe('原问题');
    expect(patch).toEqual(patchSnapshot);
    expect(Object.keys(patch)).toEqual(['contextParams']);
  });

  it('省略配置字段保留已有值，显式 undefined 保留原生清空语义', () => {
    act(() =>
      setNodeConfigFieldsValue(activeForm, {
        contextParams: { nil: null, value: 1 },
        askConfig: { value: 'keep' },
      }),
    );
    const patch: NodeConfig = { question: '新问题' };
    act(() => setNodeConfigFieldsValue(activeForm, patch));
    expect(activeForm.getFieldValue('contextParams')).toEqual({
      nil: null,
      value: 1,
    });
    expect(activeForm.getFieldValue('askConfig')).toEqual({ value: 'keep' });
    expect(Object.hasOwn(patch, 'contextParams')).toBe(false);
    expect(Object.hasOwn(patch, 'askConfig')).toBe(false);

    act(() =>
      setNodeConfigFieldsValue(activeForm, { contextParams: undefined }),
    );
    expect(activeForm.getFieldValue('contextParams')).toBeUndefined();
    expect(activeForm.getFieldValue('askConfig')).toEqual({ value: 'keep' });
  });

  it('变化字段清除错误、同值字段保留错误，并一次更新外部 watcher', () => {
    act(() =>
      setNodeConfigFieldsValue(activeForm, {
        question: '旧问题',
        text: '不变',
      }),
    );
    act(() =>
      activeForm.setFields([
        {
          name: 'question',
          errors: ['question error'],
          warnings: ['question warning'],
        },
        { name: 'text', errors: ['text error'], warnings: ['text warning'] },
      ]),
    );
    expect(activeForm.getFieldError('question')).toEqual(['question error']);
    expect(activeForm.getFieldError('text')).toEqual(['text error']);
    watchedQuestions.length = 0;
    const setFieldsValue = vi.spyOn(activeForm, 'setFieldsValue');
    act(() =>
      setNodeConfigFieldsValue(activeForm, {
        question: '新问题',
        text: '不变',
        contextParams: { nil: null },
      }),
    );

    expect(setFieldsValue).toHaveBeenCalledTimes(1);
    expect(watchedQuestions).toEqual(['新问题']);
    expect(activeForm.getFieldError('question')).toEqual([]);
    expect(activeForm.getFieldWarning('question')).toEqual([]);
    expect(activeForm.isFieldTouched('question')).toBe(true);
    expect(activeForm.getFieldError('text')).toEqual(['text error']);
    expect(activeForm.getFieldWarning('text')).toEqual(['text warning']);
  });
});

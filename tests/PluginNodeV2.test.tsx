import PluginNodeV2 from '@/pages/Antv-X6/v2/components/drawer/nodeConfig/PluginNodeV2';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import { act, render, screen } from '@testing-library/react';
import { Form } from 'antd';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

const mockCreatedProps: {
  onAdded?: (item: CreatedNodeItem) => void;
  open?: boolean;
} = {};

vi.mock('@/components/Created', () => ({
  __esModule: true,
  default: (props: any) => {
    mockCreatedProps.onAdded = props.onAdded;
    mockCreatedProps.open = props.open;
    return (
      <div data-testid="created-mock">
        <button
          type="button"
          onClick={() => props.onAdded?.(props.mockItem || props.item)}
        >
          select
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/FormListItem/TreeInput', () => ({
  __esModule: true,
  default: () => <div data-testid="tree-input" />,
}));

vi.mock('./commonNodeV2', () => ({
  TreeOutputV2: ({ treeData }: any) => (
    <div data-testid="tree-output">{treeData?.length ?? 0}</div>
  ),
}));

const Wrapper = ({
  type,
  onFormReady,
}: {
  type: string;
  onFormReady: (form: any) => void;
}) => {
  const [form] = Form.useForm();
  React.useEffect(() => {
    onFormReady(form);
  }, [form, onFormReady]);
  return (
    <Form form={form}>
      <PluginNodeV2 form={form} type={type} id={1} />
    </Form>
  );
};

describe('PluginNodeV2', () => {
  test('选择组件后写入表单并展示已选名称', async () => {
    let form: any;
    const { container } = render(
      <Wrapper type="Plugin" onFormReady={(f) => (form = f)} />,
    );

    const addBtn = container.querySelector('button');
    addBtn?.click();

    const item: CreatedNodeItem = {
      targetId: 'plugin-1',
      name: 'Test Plugin',
      description: 'desc',
      inputArgBindConfigs: [{ name: 'arg1' } as any],
      outputArgBindConfigs: [{ name: 'out1' } as any],
    };

    await act(async () => {
      mockCreatedProps.onAdded?.(item);
    });

    expect(form.getFieldValue('typeId')).toBe('plugin-1');
    expect(form.getFieldValue('pluginId')).toBe('plugin-1');
    expect(form.getFieldValue('toolName')).toBe('Test Plugin');
    expect(form.getFieldValue('inputArgs')).toHaveLength(1);
    expect(form.getFieldValue('outputArgs')).toHaveLength(1);

    expect(await screen.findByText('Test Plugin')).toBeInTheDocument();
  });

  test('清除已选组件重置表单字段', async () => {
    let form: any;
    const { container } = render(
      <Wrapper type="Workflow" onFormReady={(f) => (form = f)} />,
    );

    const item: CreatedNodeItem = {
      targetId: 'wf-1',
      name: 'WF',
    } as any;
    await act(async () => {
      mockCreatedProps.onAdded?.(item);
    });
    expect(form.getFieldValue('typeId')).toBe('wf-1');

    const clearBtn = container.querySelector('.skill-item-style button');
    expect(clearBtn).toBeTruthy();
    clearBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(form.getFieldValue('typeId')).toBeUndefined();
    expect(form.getFieldValue('pluginId')).toBeUndefined();
    expect(form.getFieldValue('toolName')).toBeUndefined();
    expect(form.getFieldValue('workflowName')).toBeUndefined();
  });
});

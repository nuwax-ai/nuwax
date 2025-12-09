import DatabaseNodeV2 from '@/pages/Antv-X6/v2/components/drawer/nodeConfig/DatabaseNodeV2';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import { act, render, screen } from '@testing-library/react';
import { Form } from 'antd';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

const mockCreated = { onAdded: undefined as any, open: false };

vi.mock('@/components/Created', () => ({
  __esModule: true,
  default: (props: any) => {
    mockCreated.onAdded = props.onAdded;
    mockCreated.open = props.open;
    return (
      <div data-testid="created-mock">
        <button type="button" onClick={() => props.onAdded?.(props.mockItem)}>
          select
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/Skill/database', () => ({
  __esModule: true,
  default: ({ name }: any) => <div data-testid="datatable">{name}</div>,
}));

vi.mock('@/components/FormListItem/TreeInput', () => ({
  __esModule: true,
  default: () => <div data-testid="tree-input" />,
}));

vi.mock('@/components/FormListItem/NestedForm', () => ({
  __esModule: true,
  default: () => <div data-testid="custom-tree" />,
}));

vi.mock('@/components/ExpandTextArea', () => ({
  __esModule: true,
  default: () => <div data-testid="expand-text" />,
}));

vi.mock('@/components/SqlOptimizeModal', () => ({
  __esModule: true,
  default: () => <div data-testid="sql-modal" />,
}));

vi.mock('../../common/InputOrReferenceV2', () => ({
  __esModule: true,
  default: () => <div data-testid="input-ref" />,
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
      <DatabaseNodeV2 form={form} type={type} id={1} />
    </Form>
  );
};

describe('DatabaseNodeV2', () => {
  test('选择数据表后写入表单并展示 DataTable，清除后恢复空态', async () => {
    let form: any;
    const { container } = render(
      <Wrapper type="TableDataQuery" onFormReady={(f) => (form = f)} />,
    );

    expect(screen.getByText('请先选择数据表')).toBeInTheDocument();

    const addBtn = container.querySelector('.node-item-style-v2 button');
    addBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const tableItem: CreatedNodeItem = {
      targetId: 'tb-1',
      name: 'Users',
      description: 'desc',
      inputArgBindConfigs: [{ name: 'id' } as any],
      outputArgBindConfigs: [{ name: 'name' } as any],
    };
    act(() => {
      mockCreated.onAdded?.(tableItem);
    });

    expect(form.getFieldValue('tableId')).toBe('tb-1');
    expect(form.getFieldValue('inputArgs')).toHaveLength(1);
    expect(form.getFieldValue('tableFields')).toHaveLength(1);
    const tables = screen.getAllByTestId('datatable');
    expect(tables[0]).toHaveTextContent('Users');

    const buttons = container.querySelectorAll('.node-item-style-v2 button');
    const clearBtn = buttons[0];
    await act(async () => {
      clearBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(form.getFieldValue('tableId')).toBeUndefined();
    expect(await screen.findByText('请先选择数据表')).toBeInTheDocument();
  });
});

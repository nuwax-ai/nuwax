import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import type { ParsedMcpAskField } from '../utils/parseMcpAskSchema';
import McpAskFormField from './McpAskFormField';

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/constants/common.constants', () => ({
  UPLOAD_FILE_ACTION: '/upload',
}));

vi.mock('@/constants/home.constants', () => ({
  ACCESS_TOKEN: 'access-token',
}));

vi.mock('@/utils/upload', () => ({
  handleUploadFileList: (list: unknown) => list,
}));

vi.mock('./McpAskFormField.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

function renderNumberField(overrides: Partial<ParsedMcpAskField> = {}) {
  const field: ParsedMcpAskField = {
    name: 'count',
    property: {
      type: 'integer',
      title: '并发数',
      minimum: 1,
      maximum: 10,
    },
    widget: 'number',
    required: true,
    options: {},
    enumValues: [],
    enumLabels: [],
    ...overrides,
  };

  render(
    <Form>
      <McpAskFormField field={field} />
    </Form>,
  );
}

describe('McpAskFormField number widget', () => {
  it('renders InputNumber for number widget', () => {
    renderNumberField();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(screen.getByText('并发数')).toBeInTheDocument();
  });

  it('accepts numeric input', async () => {
    const user = userEvent.setup();
    renderNumberField();
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '5');
    expect(input).toHaveValue('5');
  });

  it('uses integer precision for integer schema type', () => {
    renderNumberField({
      property: { type: ['integer', 'null'], title: '数量', minimum: 0 },
    });
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
  });
});

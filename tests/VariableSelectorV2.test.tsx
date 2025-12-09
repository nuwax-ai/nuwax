import VariableSelectorV2 from '@/pages/Antv-X6/v2/components/common/VariableSelectorV2';
import {
  DataTypeEnumV2,
  type NodePreviousAndArgMapV2,
} from '@/pages/Antv-X6/v2/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

const buildReferenceData = (): NodePreviousAndArgMapV2 => ({
  previousNodes: [
    {
      id: 1,
      name: 'Start',
      type: 'Start' as any,
      icon: '',
      outputArgs: [
        {
          name: 'userInput',
          dataType: DataTypeEnumV2.String,
          description: '用户输入',
          require: true,
          systemVariable: false,
          bindValue: '',
          key: 'userInput',
          subArgs: [],
        },
        {
          name: 'numberArg',
          dataType: DataTypeEnumV2.Number,
          description: '数字',
          require: false,
          systemVariable: false,
          bindValue: '',
          key: 'numberArg',
          subArgs: [],
        },
      ],
    },
    {
      id: 2,
      name: 'VariableNode',
      type: 'Variable' as any,
      icon: '',
      outputArgs: [
        {
          name: 'isSuccess',
          dataType: DataTypeEnumV2.Boolean,
          description: '变量设置结果',
          require: false,
          systemVariable: false,
          bindValue: '',
          key: 'isSuccess',
          subArgs: [],
        },
      ],
    },
  ],
  innerPreviousNodes: [
    {
      id: 10,
      name: 'LoopInner',
      type: 'Code' as any,
      icon: '',
      outputArgs: [
        {
          name: 'loopVar',
          dataType: DataTypeEnumV2.String,
          description: '循环内部变量',
          require: false,
          systemVariable: false,
          bindValue: '',
          key: 'loopVar',
          subArgs: [],
        },
      ],
    },
  ],
  argMap: {
    '1.userInput': {
      name: 'userInput',
      dataType: 'String',
      description: '用户输入',
      require: true,
      systemVariable: false,
      bindValue: '',
      key: 'userInput',
      subArgs: [],
    },
    '1.numberArg': {
      name: 'numberArg',
      dataType: 'Number',
      description: '数字',
      require: false,
      systemVariable: false,
      bindValue: '',
      key: 'numberArg',
      subArgs: [],
    },
    '2.isSuccess': {
      name: 'isSuccess',
      dataType: 'Boolean',
      description: '变量设置结果',
      require: false,
      systemVariable: false,
      bindValue: '',
      key: 'isSuccess',
      subArgs: [],
    },
    '10.loopVar': {
      name: 'loopVar',
      dataType: 'String',
      description: '循环内部变量',
      require: false,
      systemVariable: false,
      bindValue: '',
      key: 'loopVar',
      subArgs: [],
    },
  },
});

describe('VariableSelectorV2', () => {
  test('renders input placeholder when valueType is Input', () => {
    render(<VariableSelectorV2 placeholder="请输入或引用参数" />);
    expect(screen.getByPlaceholderText('请输入或引用参数')).toBeInTheDocument();
  });

  test('shows reference tag and clears when close clicked', async () => {
    const user = userEvent.setup();
    const onClearReference = vi.fn();

    render(
      <VariableSelectorV2
        value="1.userInput"
        valueType="Reference"
        referenceData={buildReferenceData()}
        onClearReference={onClearReference}
      />,
    );

    expect(screen.getByText('userInput')).toBeInTheDocument();
    await user.click(screen.getByLabelText(/close/i));
    expect(onClearReference).toHaveBeenCalledTimes(1);
  });

  test('selecting a variable triggers onReferenceSelect', async () => {
    const user = userEvent.setup();
    const onReferenceSelect = vi.fn();

    render(
      <VariableSelectorV2
        valueType="Reference"
        referenceData={buildReferenceData()}
        onReferenceSelect={onReferenceSelect}
      />,
    );

    await user.click(screen.getByLabelText('setting'));
    await user.click(await screen.findByText('Start'));
    await user.click(await screen.findByText('userInput'));

    expect(onReferenceSelect).toHaveBeenCalledWith('1.userInput');
  });

  test('filterType keeps only matching data types', async () => {
    const user = userEvent.setup();

    render(
      <VariableSelectorV2
        valueType="Reference"
        referenceData={buildReferenceData()}
        filterType={['Number']}
      />,
    );

    await user.click(screen.getByLabelText('setting'));
    await user.click(await screen.findByText('Start'));
    expect(await screen.findByText('numberArg')).toBeInTheDocument();
    expect(screen.queryByText('userInput')).not.toBeInTheDocument();
  });

  test('isLoop shows innerPreviousNodes when provided', async () => {
    const user = userEvent.setup();

    render(
      <VariableSelectorV2
        valueType="Reference"
        isLoop
        referenceData={buildReferenceData()}
      />,
    );

    await user.click(screen.getByLabelText('setting'));
    await user.click(await screen.findByText('LoopInner'));
    expect(await screen.findByText('loopVar')).toBeInTheDocument();
    expect(screen.queryByText('userInput')).not.toBeInTheDocument();
  });
});

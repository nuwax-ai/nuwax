import InputOrReference from '@/components/FormListItem/InputOrReference';
import { ConditionProps } from '@/types/interfaces/workflow';
import { Form, Select } from 'antd';
// import { useModel } from 'umi';

const options = [
  { label: '等于', value: 'EQUAL', displayValue: '=' },
  { label: '不等于', value: 'NOT_EQUAL', displayValue: '≠' },
  { label: '大于', value: 'GREATER_THAN', displayValue: '>' },
  {
    label: '大于等于',
    value: 'GREATER_THAN_OR_EQUAL',
    displayValue: '≥',
  },
  { label: '小于', value: 'LESS_THAN', displayValue: '<' },
  { label: '小于等于', value: 'LESS_THAN_OR_EQUAL', displayValue: '≤' },
  { label: '长度大于', value: 'LENGTH_GREATER_THAN', displayValue: '>' },
  {
    label: '长度大于等于',
    value: 'LENGTH_GREATER_THAN_OR_EQUAL',
    displayValue: '≥',
  },
  { label: '长度小于', value: 'LENGTH_LESS_THAN', displayValue: '<' },
  {
    label: '长度小于等于',
    value: 'LENGTH_LESS_THAN_OR_EQUAL',
    displayValue: '≤',
  },
  { label: '包含', value: 'CONTAINS', displayValue: '⊃' },
  { label: '不包含', value: 'NOT_CONTAINS', displayValue: '⊅' },
  { label: '匹配正则表达式', value: 'MATCH_REGEX', displayValue: '~' },
  { label: '为空', value: 'IS_NULL', displayValue: '∅' },
  { label: '不为空', value: 'NOT_NULL', displayValue: '!∅' },
];

const ConditionItem: React.FC<ConditionProps> = ({
  field,
  onChange,
  form,
  inputItemName,
}) => {
  // const { referenceList } = useModel('workflow');

  // 将referenceList作为参数传递给changeInputValue
  // const changeInputValue = (
  //   e: string,
  //   fieldName: 'firstArg' | 'secondArg',
  //   type?: 'Input' | 'Reference',
  // ) => {
  //   let newValue;
  //   if (type === 'Input') {
  //     newValue = {
  //       bindValue: e,
  //       bindValueType: 'Input',
  //       dataType: 'String',
  //       name: '',
  //     };
  //   } else {
  //     newValue = {
  //       bindValue: referenceList.argMap[e as string].key,
  //       bindValueType: 'Reference',
  //       name: referenceList.argMap[e as string].name,
  //       dataType: referenceList.argMap[e as string].dataType || 'String',
  //     };
  //   }

  //   form.setFieldsValue({
  //     [inputItemName]: {
  //       [field.name]: {
  //         [fieldName]: newValue,
  //       },
  //     },
  //   });
  //   onChange?.();
  // };

  const changeConditionType = (e: string) => {
    form.setFieldsValue({
      [inputItemName]: {
        [field.name]: {
          conditionType: e,
        },
      },
    });
    onChange?.();
  };

  return (
    <div className="condition-right-item" key={field.key}>
      <Form.Item
        style={{ marginRight: '8px' }}
        name={[field.name, 'compareType']}
      >
        <Select
          className="condition-type-select-style"
          popupMatchSelectWidth={false}
          options={options}
          optionLabelProp="displayValue"
          placeholder="请选择"
          style={{ width: 55 }}
          onChange={changeConditionType}
        ></Select>
      </Form.Item>
      <Form.Item style={{ marginRight: '8px', flex: 1 }}>
        <Form.Item name={[field.name, 'firstArg', 'bindValue']}>
          <InputOrReference
            fieldName={['conditionArgs', field.name, 'firstArg', 'bindValue']}
            form={form}
            isDisabled
          />
        </Form.Item>
        <Form.Item name={[field.name, 'secondArg', 'bindValue']}>
          <InputOrReference
            fieldName={['conditionArgs', field.name, 'secondArg', 'bindValue']}
            form={form}
            referenceType={
              // 修正路径，从conditionArgs层级获取
              form.getFieldValue([
                'conditionArgs',
                field.name,
                'secondArg',
                'bindValueType',
              ]) || 'Input'
            }
          />
        </Form.Item>
      </Form.Item>
    </div>
  );
};

export default ConditionItem;

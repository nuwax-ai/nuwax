import InputOrReference from '@/components/FormListItem/InputOrReference';
import { dict } from '@/services/i18nRuntime';
import { ConditionProps } from '@/types/interfaces/workflow';
import { Form, Select } from 'antd';
// import { useModel } from 'umi';

const options = [
  {
    label: dict('PC.Components.FormListItem.conditionEqual'),
    value: 'EQUAL',
    displayValue: '=',
  },
  {
    label: dict('PC.Components.FormListItem.conditionNotEqual'),
    value: 'NOT_EQUAL',
    displayValue: '≠',
  },
  {
    label: dict('PC.Components.FormListItem.conditionGreaterThan'),
    value: 'GREATER_THAN',
    displayValue: '>',
  },
  {
    label: dict('PC.Components.FormListItem.conditionGreaterThanOrEqual'),
    value: 'GREATER_THAN_OR_EQUAL',
    displayValue: '≥',
  },
  {
    label: dict('PC.Components.FormListItem.conditionLessThan'),
    value: 'LESS_THAN',
    displayValue: '<',
  },
  {
    label: dict('PC.Components.FormListItem.conditionLessThanOrEqual'),
    value: 'LESS_THAN_OR_EQUAL',
    displayValue: '≤',
  },
  {
    label: dict('PC.Components.FormListItem.conditionLengthGreaterThan'),
    value: 'LENGTH_GREATER_THAN',
    displayValue: '>',
  },
  {
    label: dict('PC.Components.FormListItem.conditionLengthGreaterThanOrEqual'),
    value: 'LENGTH_GREATER_THAN_OR_EQUAL',
    displayValue: '≥',
  },
  {
    label: dict('PC.Components.FormListItem.conditionLengthLessThan'),
    value: 'LENGTH_LESS_THAN',
    displayValue: '<',
  },
  {
    label: dict('PC.Components.FormListItem.conditionLengthLessThanOrEqual'),
    value: 'LENGTH_LESS_THAN_OR_EQUAL',
    displayValue: '≤',
  },
  {
    label: dict('PC.Components.FormListItem.conditionContains'),
    value: 'CONTAINS',
    displayValue: '⊃',
  },
  {
    label: dict('PC.Components.FormListItem.conditionNotContains'),
    value: 'NOT_CONTAINS',
    displayValue: '⊅',
  },
  {
    label: dict('PC.Components.FormListItem.conditionMatchRegex'),
    value: 'MATCH_REGEX',
    displayValue: '~',
  },
  {
    label: dict('PC.Components.FormListItem.conditionIsNull'),
    value: 'IS_NULL',
    displayValue: '∅',
  },
  {
    label: dict('PC.Components.FormListItem.conditionNotNull'),
    value: 'NOT_NULL',
    displayValue: '!∅',
  },
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
          placeholder={dict('PC.Common.Global.pleaseSelect')}
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

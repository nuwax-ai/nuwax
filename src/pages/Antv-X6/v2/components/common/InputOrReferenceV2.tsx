import type { FormInstance } from 'antd/es/form';
import React, { useMemo } from 'react';
import type { NodePreviousAndArgMapV2 } from '../../types';
import VariableSelectorV2 from './VariableSelectorV2';

export interface InputOrReferenceV2Props {
  value?: string;
  referenceType?: 'Input' | 'Reference' | null;
  placeholder?: string;
  style?: React.CSSProperties;
  isDisabled?: boolean;
  isLoop?: boolean;
  filterType?: string[];
  referenceData?: NodePreviousAndArgMapV2;
  form?: FormInstance;
  fieldName?: (string | number)[];
  onChange?: (val: string) => void;
}

const InputOrReferenceV2: React.FC<InputOrReferenceV2Props> = ({
  value = '',
  referenceType = 'Input',
  placeholder = '请输入或引用参数',
  style,
  isDisabled = false,
  isLoop = false,
  filterType,
  referenceData,
  form,
  fieldName,
  onChange,
}) => {
  const basePath = useMemo(
    () => (fieldName && fieldName.length > 0 ? fieldName.slice(0, -1) : []),
    [fieldName],
  );

  const setBindMeta = (type: 'Input' | 'Reference', refKey?: string) => {
    if (form && basePath.length > 0) {
      form.setFieldValue([...basePath, 'bindValueType'], type);
      if (type === 'Reference') {
        const refArg = referenceData?.argMap?.[refKey || ''];
        if (refArg?.dataType) {
          form.setFieldValue([...basePath, 'dataType'], refArg.dataType);
        }
      }
    }
  };

  const handleInputChange = (val: string) => {
    setBindMeta('Input', val);
    onChange?.(val);
  };

  const handleReferenceSelect = (refKey: string) => {
    setBindMeta('Reference', refKey);
    onChange?.(refKey);
  };

  const handleClearReference = () => {
    setBindMeta('Input', '');
    onChange?.('');
  };

  // 始终使用 VariableSelectorV2，确保下拉按钮可见
  return (
    <VariableSelectorV2
      value={value}
      valueType={referenceType === 'Reference' ? 'Reference' : 'Input'}
      referenceData={referenceData}
      isLoop={isLoop}
      filterType={filterType}
      disabled={isDisabled}
      placeholder={placeholder}
      onChange={handleInputChange}
      onReferenceSelect={handleReferenceSelect}
      onClearReference={handleClearReference}
      style={style}
    />
  );
};

export default InputOrReferenceV2;

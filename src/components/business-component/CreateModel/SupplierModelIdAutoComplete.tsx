import { AutoComplete } from 'antd';
import React, { useCallback, useRef } from 'react';

export type SupplierModelIdAutoCompleteProps = {
  value?: string;
  onChange?: (modelId: string | undefined) => void;
  supplierModelOptionsDisplayed: NonNullable<
    React.ComponentProps<typeof AutoComplete>['options']
  >;
  setSupplierModelOptionsFilter: (v: string) => void;
  applySupplierModelLinkageOnDropdownPick: (modelId: string) => void;
  clearSupplierModelLinkedFields: () => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * 供应商模型标识（modelId）输入；下拉 onSelect 才联动回填。
 * 点清空时跳过紧随其后的 blur，并立即清空名称 / 描述 / 类型等联动字段。
 */
const SupplierModelIdAutoComplete: React.FC<
  SupplierModelIdAutoCompleteProps
> = ({
  value,
  onChange,
  supplierModelOptionsDisplayed,
  setSupplierModelOptionsFilter,
  applySupplierModelLinkageOnDropdownPick,
  clearSupplierModelLinkedFields,
  className,
  placeholder,
  disabled,
}) => {
  /** 点清空后跳过紧随其后的 blur，避免在表单尚未落盘时用旧值判断 */
  const skipNextBlurRef = useRef<boolean>(false);

  const handleClear = useCallback(() => {
    skipNextBlurRef.current = true;
    setSupplierModelOptionsFilter('');
    onChange?.(undefined);
    clearSupplierModelLinkedFields();
  }, [clearSupplierModelLinkedFields, onChange, setSupplierModelOptionsFilter]);

  return (
    <AutoComplete
      className={className}
      allowClear
      disabled={disabled}
      options={supplierModelOptionsDisplayed}
      filterOption={false}
      placeholder={placeholder}
      value={value}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          window.setTimeout(() => setSupplierModelOptionsFilter(''), 0);
        }
      }}
      onSearch={(v) => setSupplierModelOptionsFilter(String(v ?? ''))}
      onChange={(v) => {
        const s = String(v ?? '');
        if (!s.trim()) {
          handleClear();
          return;
        }
        onChange?.(s);
        setSupplierModelOptionsFilter(s);
      }}
      onSelect={(optVal) =>
        applySupplierModelLinkageOnDropdownPick(String(optVal ?? ''))
      }
      onClear={handleClear}
      onBlur={() => {
        if (skipNextBlurRef.current) {
          skipNextBlurRef.current = false;
          return;
        }
        if (!String(value ?? '').trim()) {
          handleClear();
        }
      }}
    />
  );
};

export default SupplierModelIdAutoComplete;

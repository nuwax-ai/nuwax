import type { ModelProviderInfo } from '@/types/interfaces/model';
import { AutoComplete } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export type SupplierModelNameAutoCompleteProps = {
  value?: string;
  onChange?: (name: string | undefined) => void;
  supplierNameOptionsDisplayed: NonNullable<
    React.ComponentProps<typeof AutoComplete>['options']
  >;
  setSupplierNameOptionsFilter: (v: string) => void;
  applySupplierModelLinkageOnDropdownPick: (modelId: string) => void;
  clearSupplierModelLinkedFields: () => void;
  currentProvider: ModelProviderInfo | undefined;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * 表单字段存展示用模型名称；选项 value 为 modelId。
 * onSelect 与标识列一致走联动；失焦时对 id / 唯一名称再解析联动，否则仅落盘手写名称。
 */
const SupplierModelNameAutoComplete: React.FC<
  SupplierModelNameAutoCompleteProps
> = ({
  value,
  onChange,
  supplierNameOptionsDisplayed,
  setSupplierNameOptionsFilter,
  applySupplierModelLinkageOnDropdownPick,
  clearSupplierModelLinkedFields,
  currentProvider,
  className,
  placeholder,
  disabled,
}) => {
  const [display, setDisplay] = useState('');
  /** 点清空后跳过紧随其后的 blur，避免用旧展示名再次联动或写回表单 */
  const skipNextBlurRef = useRef<boolean>(false);

  const handleClear = useCallback(() => {
    skipNextBlurRef.current = true;
    setDisplay('');
    setSupplierNameOptionsFilter('');
    onChange?.(undefined);
    clearSupplierModelLinkedFields();
  }, [clearSupplierModelLinkedFields, onChange, setSupplierNameOptionsFilter]);

  useEffect(() => {
    setDisplay(typeof value === 'string' ? value : '');
  }, [value]);

  const blurCommit = useCallback(() => {
    const t = display.trim();
    if (!t) {
      handleClear();
      return;
    }
    const models = currentProvider?.models ?? [];
    const byId = models.find((m) => m.id === display.trim());
    if (byId) {
      applySupplierModelLinkageOnDropdownPick(byId.id);
      return;
    }
    const nameMatches = models.filter((m) => (m.name || '').trim() === t);
    if (nameMatches.length === 1) {
      applySupplierModelLinkageOnDropdownPick(nameMatches[0]!.id);
      return;
    }
    onChange?.(t);
  }, [
    applySupplierModelLinkageOnDropdownPick,
    currentProvider,
    display,
    handleClear,
    onChange,
  ]);

  return (
    <AutoComplete
      className={className}
      allowClear
      disabled={disabled}
      options={supplierNameOptionsDisplayed}
      filterOption={false}
      placeholder={placeholder}
      value={display}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          window.setTimeout(() => setSupplierNameOptionsFilter(''), 0);
        }
      }}
      onSearch={(v) => setSupplierNameOptionsFilter(String(v ?? ''))}
      onChange={(v) => {
        const s = String(v ?? '');
        if (!s.trim()) {
          handleClear();
          return;
        }
        const picked = currentProvider?.models?.find((m) => m.id === s);
        setDisplay(picked ? (picked.name || '').trim() || picked.id : s);
        setSupplierNameOptionsFilter(s);
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
        blurCommit();
      }}
    />
  );
};

export default SupplierModelNameAutoComplete;

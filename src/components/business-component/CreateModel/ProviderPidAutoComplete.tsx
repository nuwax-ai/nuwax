import type { ModelProviderInfo } from '@/types/interfaces/model';
import { AutoComplete } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export type ProviderPidAutoCompleteProps = {
  value?: string;
  onChange?: (pid: string | undefined) => void;
  providerOptionsDisplayed: NonNullable<
    React.ComponentProps<typeof AutoComplete>['options']
  >;
  setPidOptionsFilter: (v: string) => void;
  applyPidLinkageOnDropdownPick: (pid: string) => void;
  clearPidLinkedFields: () => void;
  modelProviderList: ModelProviderInfo[];
  className?: string;
  placeholder?: string;
};

/**
 * 表单字段存 pid；输入框展示供应商 name（与列表下拉一致）。
 * onSelect：仍由原逻辑联动回填；手写仅更新展示与过滤，失焦时解析为 pid（或清空）。
 */
const ProviderPidAutoComplete: React.FC<ProviderPidAutoCompleteProps> = ({
  value,
  onChange,
  providerOptionsDisplayed,
  setPidOptionsFilter,
  applyPidLinkageOnDropdownPick,
  clearPidLinkedFields,
  modelProviderList,
  className,
  placeholder,
}) => {
  const [display, setDisplay] = useState('');
  /** 点清空后跳过紧随其后的 blur，避免用旧展示名把 pid 写回表单 */
  const skipNextBlurRef = useRef<boolean>(false);

  const handleClear = useCallback(() => {
    skipNextBlurRef.current = true;
    setDisplay('');
    setPidOptionsFilter('');
    onChange?.(undefined);
    clearPidLinkedFields();
  }, [clearPidLinkedFields, onChange, setPidOptionsFilter]);

  useEffect(() => {
    const p = value
      ? modelProviderList.find((item) => item.pid === value)
      : undefined;
    setDisplay(
      typeof p?.name === 'string' && p.name
        ? p.name
        : typeof value === 'string'
        ? value
        : '',
    );
  }, [value, modelProviderList]);

  const resolveInputToStoredPid = useCallback(
    (raw: string) => {
      const t = raw.trim();
      if (!t) return undefined;
      const byPid = modelProviderList.find((p) => p.pid === raw || p.pid === t);
      if (byPid) return byPid.pid;
      const byName = modelProviderList.find(
        (p) => (p.name || '').trim() === t || p.name === raw.trim(),
      );
      if (byName) return byName.pid;
      return t;
    },
    [modelProviderList],
  );

  return (
    <AutoComplete
      className={className}
      allowClear
      options={providerOptionsDisplayed}
      filterOption={false}
      placeholder={placeholder}
      value={display}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          window.setTimeout(() => setPidOptionsFilter(''), 0);
        }
      }}
      onSearch={(v) => setPidOptionsFilter(String(v ?? ''))}
      onChange={(v) => {
        const s = String(v ?? '');
        if (!s.trim()) {
          handleClear();
          return;
        }
        const byPid = modelProviderList.find((p) => p.pid === s);
        setDisplay(byPid?.name ?? s);
        setPidOptionsFilter(s);
      }}
      onSelect={(optVal) => {
        applyPidLinkageOnDropdownPick(String(optVal ?? ''));
      }}
      onClear={handleClear}
      onBlur={() => {
        if (skipNextBlurRef.current) {
          skipNextBlurRef.current = false;
          return;
        }
        const nextStored = resolveInputToStoredPid(display);
        if (!nextStored?.trim()) {
          handleClear();
          return;
        }
        if (nextStored !== value) {
          onChange?.(nextStored);
        }
      }}
    />
  );
};

export default ProviderPidAutoComplete;

import type { ModelProviderInfo } from '@/types/interfaces/model';
import { AutoComplete } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

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
        const byPid = modelProviderList.find((p) => p.pid === s);
        setDisplay(byPid?.name ?? s);
        setPidOptionsFilter(s);
      }}
      onSelect={(optVal) => {
        applyPidLinkageOnDropdownPick(String(optVal ?? ''));
      }}
      onClear={() => clearPidLinkedFields()}
      onBlur={() => {
        const nextStored = resolveInputToStoredPid(display);
        if (!nextStored?.trim()) {
          clearPidLinkedFields();
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

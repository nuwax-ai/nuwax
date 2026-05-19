import type { ProColumns } from '@ant-design/pro-components';
import type { KeyboardEvent } from 'react';

/**
 * ProComponents LightWrapper / FilterDropdown 底部「确认」按钮的 data 标记。
 * @see @ant-design/pro-utils DropdownFooter
 */
const LIGHT_FILTER_CONFIRM_SELECTOR = 'button[data-type="confirm"]';

/**
 * LightFilter 下拉浮层容器 class（FilterDropdown overlay）。
 */
const LIGHT_FILTER_OVERLAY_SELECTOR = '.pro-core-field-dropdown-overlay';

/**
 * 在 LightFilter 下拉内的 Input 按 Enter 时，触发与点击「确认」相同的行为：
 * 将临时输入写入条件标签并关闭 Popover（不直接等价于工具栏「查询」）。
 */
export const triggerLightFilterDropdownConfirm = (
  event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
): void => {
  event.preventDefault();
  event.stopPropagation();

  const target = event.currentTarget;
  const overlay =
    target.closest(LIGHT_FILTER_OVERLAY_SELECTOR) ??
    target.closest('.ant-popover');

  const confirmBtn = overlay?.querySelector<HTMLButtonElement>(
    LIGHT_FILTER_CONFIRM_SELECTOR,
  );

  confirmBtn?.click();
};

/**
 * 条件查询中视为「单行文本输入」的 valueType（LightFilter 内为 Input）。
 */
const TEXT_SEARCH_VALUE_TYPES = new Set<string | undefined>([
  undefined,
  'text',
  'digit',
  'password',
]);

/**
 * 判断列是否参与搜索且为 LightFilter 内可按 Enter 确认的文本输入。
 */
const isLightFilterTextSearchColumn = (
  column: ProColumns<Record<string, any>>,
): boolean => {
  if (column.hideInSearch === true) return false;
  if (column.renderFormItem) return false;
  if (column.valueEnum) return false;
  return TEXT_SEARCH_VALUE_TYPES.has(column.valueType as string | undefined);
};

/**
 * 合并 onPressEnter：优先执行业务自定义逻辑，再触发 LightFilter 下拉「确认」。
 */
const mergeOnPressEnter = (
  existing?: (event: KeyboardEvent<HTMLInputElement>) => void,
) => {
  return (event: KeyboardEvent<HTMLInputElement>) => {
    existing?.(event);
    if (event.defaultPrevented) {
      return;
    }
    triggerLightFilterDropdownConfirm(event);
  };
};

/**
 * 为搜索区文本类列注入 fieldProps.onPressEnter，按 Enter 等同点击该条件下拉的「确认」。
 *
 * @param columns 表格列
 * @returns 增强后的列配置
 */
export const enhanceColumnsForLightFilterEnterConfirm = <
  T extends Record<string, any>,
  ValueType = 'text',
>(
  columns: ProColumns<T, ValueType>[] | undefined,
): ProColumns<T, ValueType>[] => {
  if (!columns?.length) {
    return [];
  }

  return columns.map((column) => {
    const next: ProColumns<T, ValueType> = { ...column };

    if (column.children?.length) {
      next.children = enhanceColumnsForLightFilterEnterConfirm<T, ValueType>(
        column.children as ProColumns<T, ValueType>[],
      );
    }

    if (!isLightFilterTextSearchColumn(column)) {
      return next;
    }

    const existingFieldProps = column.fieldProps;

    if (typeof existingFieldProps === 'function') {
      next.fieldProps = (form, config) => {
        const resolved = existingFieldProps(form, config) || {};
        return {
          ...resolved,
          onPressEnter: mergeOnPressEnter(resolved.onPressEnter),
        };
      };
    } else {
      next.fieldProps = {
        ...existingFieldProps,
        onPressEnter: mergeOnPressEnter(existingFieldProps?.onPressEnter),
      };
    }

    return next;
  });
};

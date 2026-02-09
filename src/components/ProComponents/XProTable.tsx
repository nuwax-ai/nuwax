import { COMMON_PRO_TABLE_PROPS } from '@/constants/dataTable.constants';
import { useTableAutoHeight } from '@/hooks/useTableAutoHeight';
import type { ParamsType, ProTableProps } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { useRef } from 'react';

/**
 * XProTable - 预配置的 ProTable 封装组件
 *
 * 继承所有 ProTable 属性，并自动应用以下默认配置：
 * - 防抖时间 300ms
 * - 隐藏工具栏和选项栏
 * - 统一的分页配置（条/页、共 X 条）
 * - 统一的搜索表单配置（查询/重置/展开收起）
 * - 默认开启自动高度适应 (fullHeight=true)
 *
 * @example
 * <XProTable<DataType>
 *   rowKey="id"
 *   columns={columns}
 *   request={request}
 * />
 */
function XProTable<
  DataType extends Record<string, any>,
  Params extends ParamsType = ParamsType,
  ValueType = 'text',
>(
  props: ProTableProps<DataType, Params, ValueType> & {
    fullHeight?: boolean;
    scrollYOffset?: number;
  },
) {
  const { fullHeight = true, scrollYOffset, ...restProps } = props;
  const tableRef = useRef<HTMLDivElement>(null);
  const scrollY = useTableAutoHeight(tableRef, fullHeight, scrollYOffset);

  // 合并 scroll 配置
  // 如果开启了 fullHeight，则使用计算出的 scrollY
  const scroll = {
    ...restProps.scroll,
    y: fullHeight ? scrollY : restProps.scroll?.y,
  } as ProTableProps<DataType, Params, ValueType>['scroll'];

  return (
    <div ref={tableRef} style={{ width: '100%' }} className="x-pro-table">
      <ProTable<DataType, Params, ValueType>
        {...COMMON_PRO_TABLE_PROPS}
        {...restProps}
        scroll={scroll}
      />
    </div>
  );
}

export default XProTable;

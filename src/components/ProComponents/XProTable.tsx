import { COMMON_PRO_TABLE_PROPS } from '@/constants/dataTable.constants';
import type { ParamsType, ProTableProps } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';

/**
 * XProTable - 预配置的 ProTable 封装组件
 *
 * 继承所有 ProTable 属性，并自动应用以下默认配置：
 * - 防抖时间 300ms
 * - 隐藏工具栏和选项栏
 * - 统一的分页配置（条/页、共 X 条）
 * - 统一的搜索表单配置（查询/重置/展开收起）
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
>(props: ProTableProps<DataType, Params, ValueType>) {
  return (
    <ProTable<DataType, Params, ValueType>
      {...COMMON_PRO_TABLE_PROPS}
      {...props}
    />
  );
}

export default XProTable;

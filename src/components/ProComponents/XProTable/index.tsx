import { COMMON_PRO_TABLE_PROPS } from '@/constants/dataTable.constants';
import { useTableAutoHeight } from '@/hooks/useTableAutoHeight';
import type {
  ActionType,
  FormInstance,
  ParamsType,
  ProTableProps,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button } from 'antd';
import { useMemo, useRef } from 'react';

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
  const { fullHeight = true, scrollYOffset, onReset, ...restProps } = props;
  const tableRef = useRef<HTMLDivElement>(null);
  const scrollY = useTableAutoHeight(tableRef, fullHeight, scrollYOffset);

  // 合并 scroll 配置
  // 如果开启了 fullHeight，则使用计算出的 scrollY
  const scroll = {
    ...restProps.scroll,
    y: fullHeight ? scrollY : restProps.scroll?.y,
  } as ProTableProps<DataType, Params, ValueType>['scroll'];

  // 使用传入的 formRef/actionRef 或内部创建的
  const internalFormRef = useRef<FormInstance>();
  const internalActionRef = useRef<ActionType>();
  const formRef =
    (restProps.formRef as React.MutableRefObject<FormInstance>) ||
    internalFormRef;
  const actionRef =
    (restProps.actionRef as React.MutableRefObject<ActionType>) ||
    internalActionRef;

  // 合并 toolBarRender，添加查询/重置按钮
  const mergedToolBarRender = useMemo(() => {
    return (action: any, rows: any) => {
      const userDom = restProps.toolBarRender
        ? (restProps.toolBarRender as any)(action, rows)
        : [];
      const userDomArray = Array.isArray(userDom) ? userDom : [userDom];

      return [
        ...userDomArray,
        <Button
          key="x-reset"
          onClick={() => {
            if (onReset) {
              // 由外部自行处理重置逻辑（参考 LogProTable 模式）
              onReset();
            } else {
              // 默认重置行为
              actionRef.current?.reset?.();
            }
          }}
        >
          重置
        </Button>,
        <Button
          key="x-query"
          type="primary"
          onClick={() => actionRef.current?.reload()}
        >
          查询
        </Button>,
      ];
    };
  }, [restProps.toolBarRender, formRef, actionRef, onReset]);

  // 合并 search 配置
  const searchConfig = useMemo(() => {
    if (restProps.search === false) return false;
    const baseSearch =
      typeof restProps.search === 'object' ? restProps.search : {};
    const commonSearch = (COMMON_PRO_TABLE_PROPS.search as any) || {};

    return {
      ...commonSearch,
      ...baseSearch,
    };
  }, [restProps.search]);

  return (
    <div ref={tableRef} style={{ width: '100%' }} className="x-pro-table">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .x-pro-table .ant-pro-table-list-toolbar-container {
          padding-block: 8px;
        }
        .x-pro-table .ant-pro-table-list-toolbar-right {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-width: 0;
        }
        .x-pro-table .ant-pro-table-list-toolbar-search {
          display: flex;
          align-items: center;
          min-width: 0;
        }
        /* 强制让搜索框内的 LightFilter 靠左 */
        .x-pro-table .ant-pro-table-list-toolbar-search > div {
          margin-left: 0 !important;
        }
        .x-pro-table .ant-pro-table-list-toolbar-setting {
          margin-left: 8px;
        }
        /* 按钮容器靠右 */
        .x-pro-table .ant-pro-table-list-toolbar-actions {
          display: flex;
          gap: 8px;
        }
      `,
        }}
      />
      <ProTable<DataType, Params, ValueType>
        {...COMMON_PRO_TABLE_PROPS}
        {...restProps}
        formRef={formRef}
        actionRef={actionRef}
        toolBarRender={mergedToolBarRender}
        search={searchConfig}
        scroll={scroll}
      />
    </div>
  );
}

export default XProTable;

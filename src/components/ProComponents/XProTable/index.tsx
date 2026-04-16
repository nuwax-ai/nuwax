import { COMMON_PRO_TABLE_PROPS } from '@/constants/dataTable.constants';
import { useTableAutoHeight } from '@/hooks/useTableAutoHeight';
import { dict, getCurrentLang } from '@/services/i18nRuntime';
import { getUmiLocaleKey } from '@/utils/i18nAdapters';
import type {
  ActionType,
  FormInstance,
  ParamsType,
  ProTableProps,
} from '@ant-design/pro-components';
import { ProConfigProvider, ProTable } from '@ant-design/pro-components';
import { Button } from 'antd';
import { useMemo, useRef } from 'react';
import { useIntl } from 'umi';
import { getProIntlMessage } from './i18n';

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
    /** 是否显示工具栏右侧的操作按钮（查询/重置），默认为 true */
    showQueryButtons?: boolean;
    /** 是否显示序号列（支持自定义），默认为 true。若 columns 中已存在 index 列，以此为准。 */
    showIndex?: boolean;
  },
) {
  const {
    fullHeight = true,
    scrollYOffset,
    onReset,
    showQueryButtons = true,
    showIndex = false,
    ...restProps
  } = props;
  const intl = useIntl();
  const tableRef = useRef<HTMLDivElement>(null);
  const scrollY = useTableAutoHeight(tableRef, fullHeight, scrollYOffset);
  /**
   * 当前语言采用 Umi 的响应式 locale（优先），并回退到运行时语言快照。
   * 这样在语言切换时组件会自动 re-render，确保 memo 内文案可重新计算。
   */
  const currentLang = intl.locale || getCurrentLang();

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

  // 合并 columns 配置，默认加上 ellipsis: true，并处理序号列
  const mergedColumns = useMemo(() => {
    const cols =
      restProps.columns?.map((item) => ({
        ellipsis: true,
        ...item,
      })) || [];

    // 如果开启了 showIndex，且 columns 中没有 index 列，则自动添加
    if (showIndex) {
      const hasIndex = cols.some(
        (col) => col.dataIndex === 'index' || col.valueType === 'index',
      );
      if (!hasIndex) {
        cols.unshift({
          title: dict('PC.Components.XProTable.index'),
          dataIndex: 'index',
          valueType: 'index',
          width: 48,
          fixed: 'left',
          align: 'center',
          ellipsis: true,
        });
      }
    }

    return cols;
  }, [restProps.columns, showIndex, currentLang]);

  // 合并 toolBarRender，添加查询/重置按钮
  const mergedToolBarRender = useMemo(() => {
    return (action: any, rows: any) => {
      const userDom = restProps.toolBarRender
        ? (restProps.toolBarRender as any)(action, rows)
        : [];
      const userDomArray = Array.isArray(userDom) ? userDom : [userDom];

      if (!showQueryButtons) {
        return userDomArray;
      }

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
          {dict('PC.Components.XProTable.reset')}
        </Button>,
        <Button
          key="x-query"
          type="primary"
          onClick={() => formRef.current?.submit()}
        >
          {dict('PC.Components.XProTable.query')}
        </Button>,
      ];
    };
  }, [
    restProps.toolBarRender,
    formRef,
    actionRef,
    onReset,
    showQueryButtons,
    currentLang,
  ]);

  // 合并 search 配置
  const searchConfig = useMemo(() => {
    if (restProps.search === false) return false;
    const baseSearch =
      typeof restProps.search === 'object' ? restProps.search : {};
    const commonSearch = {
      ...(COMMON_PRO_TABLE_PROPS.search as any),
      /**
       * 避免使用模块初始化时的静态文案，改为运行时读取，确保语言切换后可见最新翻译。
       */
      searchText: dict('PC.Constants.DataTable.search'),
      resetText: dict('PC.Constants.DataTable.reset'),
    };

    const merged = {
      ...commonSearch,
      ...baseSearch,
    };

    // LightFilter模式下，searchText和resetText传给底层Form会触发React DOM属性无法识别的警告
    if (merged.filterType === 'light') {
      delete merged.searchText;
      delete merged.resetText;
    }

    return merged;
  }, [restProps.search, currentLang]);

  /**
   * 分页文案同样采用运行时翻译，避免 COMMON_PRO_TABLE_PROPS 的静态快照问题。
   */
  const paginationConfig = useMemo(() => {
    if (restProps.pagination === false) return false;
    const basePagination =
      typeof restProps.pagination === 'object' ? restProps.pagination : {};
    const commonPagination =
      (COMMON_PRO_TABLE_PROPS.pagination as Record<string, any>) || {};

    return {
      ...commonPagination,
      ...basePagination,
      showTotal:
        basePagination.showTotal ||
        ((total: number) =>
          `${dict('PC.Constants.DataTable.totalPrefix')} ${total} ${dict(
            'PC.Constants.DataTable.totalSuffix',
          )}`),
      locale: {
        ...(commonPagination.locale || {}),
        ...(basePagination.locale || {}),
        items_per_page:
          basePagination.locale?.items_per_page ||
          dict('PC.Constants.DataTable.itemsPerPage'),
      },
    };
  }, [restProps.pagination, currentLang]);

  /**
   * ProComponents 的国际化依赖 locale 标识。
   * 使用统一适配层输出的 Umi locale key（如 en-US / zh-CN），
   * 避免 lower-case 语言码导致 Pro 无法命中内置语言包而回退默认中文。
   */
  const proIntl = useMemo(
    () => ({
      locale: getUmiLocaleKey(currentLang),
      /**
       * ProTable 在运行期会直接调用 intl.getMessage。
       * 若未提供该函数会抛出 "intl.getMessage is not a function"。
       * 这里提供一个稳定实现：优先映射到项目 dict，其余回退 defaultMessage。
       */
      getMessage: getProIntlMessage,
    }),
    [currentLang],
  );

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
      <ProConfigProvider intl={proIntl as any}>
        <ProTable<DataType, Params, ValueType>
          {...COMMON_PRO_TABLE_PROPS}
          {...restProps}
          formRef={formRef}
          actionRef={actionRef}
          columns={mergedColumns}
          toolBarRender={mergedToolBarRender}
          search={searchConfig}
          pagination={paginationConfig}
          scroll={scroll}
        />
      </ProConfigProvider>
    </div>
  );
}

export default XProTable;

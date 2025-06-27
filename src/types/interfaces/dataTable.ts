import React from 'react';
import { Page, TablePageRequest } from './request';

export interface SelectOptions {
  label: string;
  value: string | number;
}
export interface TableColumn {
  title: string;
  dataIndex: string;
  type: 'checkbox' | 'tag' | 'text' | 'date' | 'select' | 'time';
  description?: string;
  map?: any;
  width?: number;
  editable?: boolean;
  edit?: boolean;
  options?: SelectOptions[];
  placeholder?: string;
  defaultValue?: string;
  // 当form时是否需要更新展示
  shouldUpdate?: {
    name: string; // 依赖的字段名
    value?: string | number; // 当依赖字段的值为1时，才显示该menu
  };
  onCell?: (record: any) => {
    record: any;
    dataIndex: string;
    title: string;
    editing: boolean;
  };
}

interface ActionColumn {
  icon: React.ComponentType; // 图标
  name: string; // 标题
  func: (record: any) => void; // 操作
  description: string;
}

export interface MyTableProp {
  // 表头
  columns: TableColumn[];
  // 表数据
  tableData: any[];
  // 表格的滚动高度
  scrollHeight: number;
  // 表头是否有描述
  showDescription?: boolean;
  // 操作栏
  actionColumn?: ActionColumn[];
  // 操作栏是否固定在右侧
  actionColumnFixed?: boolean;
  // 是否显示分页
  showPagination?: boolean;
  // 是否显示序号
  showIndex?: boolean;
  // 是否显示新增行数据
  showAddRow?: boolean;
  // 是否要编辑行
  showEditRow?: boolean;
  // 当前数据用什么作为key
  rowKey?: string;
  // 操作栏的宽度
  actionColumnWidth?: number;
  // 分页的数据
  pagination?: {
    current: number; // 当前页码
    pageSize: number; // 每页显示条数
    total: number; // 总条数
  };
  // 分页或者排序发生变更，重新获取数据
  onPageChange?: (page: number, pageSize: number) => void;
  // 当前表格是否有数据
  dataEmptyFlag?: boolean;
  // 当数据发生变化，同步修改数据源
  onDataSourceChange?: (dataSource: any[]) => void;
  // 可编辑表格的formRef
  formRef?: React.Ref<{ submit: () => void }>; // 简化类型，只暴露submit方法
}

// 数据表业务表结构的字段定义信息
export interface TableFieldInfo {
  // 主键ID
  id: number;
  // 字段名
  fieldName: string;
  // 字段描述
  fieldDescription: string;
  // 是否为系统字段,1:系统字段;-1:非系统字段
  systemFieldFlag?: boolean;
  // 字段类型：1:String(VARCHAR(255));2:Integer(INT);3:Number(DECIMAL(20,6));4:Boolean(TINYINT(1));5:Date(DATETIME);6:PrimaryKey(BIGINT);7:MEDIUMTEXT(MEDIUMTEXT)
  fieldType: number;
  // 是否可为空,true:可空;false:非空
  nullableFlag: boolean;
  // 默认值
  defaultValue: string;
  // 是否唯一,true:唯一;false:非唯一
  uniqueFlag: boolean;
  // 是否启用：true:启用;false:禁用
  enabledFlag: boolean;
  // 字段顺序
  sortIndex: number;
}

// 查询表定义详情
export interface TableDefineDetails {
  // 主键ID
  id: number;
  // 租户ID
  tenantId: number;
  // 所属空间ID
  spaceId: number;
  // 图标图片地址
  icon?: string;
  // 表名
  tableName: string;
  // 表描述
  tableDescription: string;
  // Doris数据库名
  dorisDatabase: string;
  // Doris表名
  dorisTable: string;
  // 数据表业务表结构的字段定义
  fieldList: TableFieldInfo[];
  // 原始建表DDL
  createTableDdl: string;
  // 是否存在业务数据,true:存在数据;false:不存在数据
  existTableDataFlag: boolean;
}

// 自定义数据表字段定义
export interface CustomTableFieldDefinitionInfo extends TableFieldInfo {
  // 租户ID
  tenantId: number;
  /*所属空间ID */
  spaceId: number;
  // 关联的表ID
  tableId: number;
  // 创建时间
  created: string;
  // 字符串字段长度,可空,比如字符串,可以指定长度使用
  fieldStrLen: number;
  // 创建人id
  creatorId: number;
  // 创建人
  creatorName: string;
  // 更新时间
  modified: string;
  // 最后修改人id
  modifiedId: number;
  // 最后修改人
  modifiedName: string;
}

// 自定义数据表定义
export interface CustomTableDefinitionInfo {
  /*主键ID */
  id: number;
  /*租户ID */
  tenantId: number;
  /*所属空间ID */
  spaceId: number;
  /*图标图片地址 */
  icon: string;
  /*表名 */
  tableName: string;
  /*表描述 */
  tableDescription: string;
  /*Doris数据库名 */
  dorisDatabase: string;
  /*Doris表名 */
  dorisTable: string;
  /*状态：1-启用 -1-禁用 */
  status: number;
  /*创建时间 */
  created: string;
  /*创建人id */
  creatorId: number;
  /*创建人 */
  creatorName: string;
  /*更新时间 */
  modified: string;
  /*最后修改人id */
  modifiedId: number;
  /*最后修改人 */
  modifiedName: string;
  // 原始建表DDL
  createTableDdl: string;
  // sumCount: number;
  /*自定义字段列表 */
  fieldList: CustomTableFieldDefinitionInfo[];
}

// 更新表名称和描述信息请求参数
export interface UpdateTableNameParams {
  // 表ID
  id: number;
  // 表名称
  tableName: string;
  // 表描述
  tableDescription?: string;
  // 图标
  icon?: string;
}

// 更新表定义请求参数
export interface UpdateTableDefinitionParams {
  // 表ID
  id: number;
  // 数据表业务表结构的字段定义
  fieldList: TableFieldInfo[];
}

//  查询表定义列表请求参数
export type ComposeTableListParams = TablePageRequest<{
  // 表名称
  tableName: string;
  // 表描述
  tableDescription?: string;
  // 空间ID
  spaceId: number;
}>;

// 新增表定义请求参数
export interface tableAddParams {
  // 表名称
  tableName: string;
  // 表描述
  tableDescription?: string;
  // 空间ID
  spaceId: number;
  // 图标
  icon?: string;
}

// 修改业务数据请求参数
export interface UpdateBusinessDataParams {
  // 表ID
  tableId: number;
  // 行ID
  rowId?: number;
  // 行数据
  rowData: any;
}

// 查询数据表业务数据请求参数
export interface GetTableDataParams {
  // 表ID
  tableId: number;
  // 页码
  pageNo: number;
  // 页大小
  pageSize: number;
}

// 查询数据表业务数据
export type ITableData<T> = Page<T> & {
  // 数据表业务表结构的字段定义
  columnDefines: TableFieldInfo[];
};

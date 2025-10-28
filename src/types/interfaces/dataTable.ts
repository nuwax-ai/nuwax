import { Dayjs } from 'dayjs';
import { TableFieldTypeEnum, TableTabsEnum } from '../enums/dataTable';
import { Page, TablePageRequest } from './request';

// 数据表数据
export interface TableRowData {
  [key: string]: string | number | boolean;
}

// 新增和修改的组件属性
export interface AddAndModifyProps {
  open: boolean;
  title: string;
  loading?: boolean;
  onSubmit: (values: { [key: string]: string | number | boolean }) => void; // 提交表单的回调函数
  // 初始化的值
  initialValues?: {
    [key: string]: string | number | boolean;
  } | null;
  formList: TableFieldInfo[];
  onCancel: () => void;
}

export interface DataTableProp {
  // 表头
  columns: TableFieldInfo[];
  // 表数据
  tableData: TableRowData[];
  loading?: boolean;
  // 表格的滚动高度
  scrollHeight: number;
  // 分页的数据
  pagination?: {
    current: number; // 当前页码
    pageSize: number; // 每页显示条数
    total: number; // 总条数
  };
  // 分页或者排序发生变更，重新获取数据
  onPageChange?: (page: number, pageSize: number) => void;
  onEdit: (data: TableRowData) => void;
  onDel: (data: TableRowData) => void;
}

export interface DeleteSureProps {
  title: string;
  sureText: string;
  open: boolean;
  onCancel: () => void;
  onSure: () => void;
  width?: number;
}

export interface StructureTableProps {
  existTableDataFlag?: boolean; // 是否存在业务数据
  tableData: TableFieldInfo[]; // 表格数据
  loading?: boolean; // 表格加载状态
  scrollHeight: number; // 表格高度
  // 输入框值改变
  onChangeValue: (
    id: string | number,
    attr: string,
    value: React.Key | boolean | Dayjs | null,
  ) => void;
  // 删除字段
  onDeleteField: (id: string | number) => void;
}

// 数据表头部组件的props
export interface TableHeaderProps {
  spaceId: number;
  tableDetail: any;
  total: number;
  onClick: () => void;
}

// 表格操作栏组件的Props
export interface TableOperationBarProps {
  tableId: number;
  // 表格当前激活的标签页
  activeKey: TableTabsEnum;
  loading: boolean;
  importLoading: boolean;
  tableData: TableRowData[]; // 表格数据
  disabledCreateBtn: boolean;
  // 切换标签页的回调函数
  onChangeTabs: (key: string) => void;
  onRefresh: () => void;
  onAddField: () => void;
  onSaveTableStructure: () => void;
  onChangeFile: (info: any) => void;
  onExportData: () => void;
  onCreateOrEditData: () => void;
  onClear: () => void;
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
  systemFieldFlag: boolean;
  // 字段类型：1:String(VARCHAR(255));2:Integer(INT);3:Number(DECIMAL(20,6));4:Boolean(TINYINT(1));5:Date(DATETIME);6:PrimaryKey(BIGINT);7:MEDIUMTEXT(MEDIUMTEXT)
  fieldType: TableFieldTypeEnum;
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
  // 自定义字段，用于table操作
  isNew?: boolean;
  dataLength?: TableFieldTypeEnum;
  children?: TableFieldInfo[];
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

// 因为提交新数据时需要新增字段删除id字段，但是table操作中id是必须的（比如删除操作）
export interface UpdateTableFieldInfo extends Omit<TableFieldInfo, 'id'> {
  // 主键ID，新增时不传
  id?: number;
}

// 更新表定义请求参数
export interface UpdateTableDefinitionParams {
  // 表ID
  id: number;
  // 数据表业务表结构的字段定义
  fieldList: UpdateTableFieldInfo[];
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
  rowData: TableRowData;
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

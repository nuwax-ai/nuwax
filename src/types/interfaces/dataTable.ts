import { TableFieldTypeEnum } from '../enums/dataTable';
import { Page, TablePageRequest } from './request';

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

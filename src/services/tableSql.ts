import type { RequestResponse } from '@/types/interfaces/request';
import { AnyObject } from 'antd/es/_util/type';
import { request } from 'umi';

interface FieldList {
  /*主键ID */
  id: number;

  /*字段名 */
  fieldName: string;
  /*字段描述 */
  fieldDescription: string;
  systemFieldFlag?: boolean;
  /*字段类型：1:String;2:Integer;3:Number;4:Boolean;5:Date */
  fieldType: number;
  /*是否可为空：1-可空 -1-非空 */
  nullableFlag: number;
  /*默认值 */
  defaultValue: string;
  /*是否唯一：1-唯一 -1-非唯一 */
  uniqueFlag: number;
  /*是否启用：1-启用 -1-禁用 */
  enabledFlag: number;
}

interface IGetModelList {
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
  created: Record<string, unknown>;
  /*创建人id */
  creatorId: number;
  /*创建人 */
  creatorName: string;
  /*更新时间 */
  modified: Record<string, unknown>;
  /*最后修改人id */
  modifiedId: number;
  /*最后修改人 */
  modifiedName: string;
  /* */
  sumCount: number;
  /*表字段列表 */
  fieldList: FieldList[];
}

// 响应接口
export interface IgetDetails {
  /*主键ID */
  id: number;
  /*租户ID */
  tenantId: number;
  /*所属空间ID */
  spaceId: number;
  /*图标图片地址 */
  icon?: string;
  /*表名 */
  tableName: string;
  /*表描述 */
  tableDescription: string;
  /*Doris数据库名 */
  dorisDatabase: string;
  /*Doris表名 */
  dorisTable: string;
  /*表下面的字段定义列表 */
  fieldList: FieldList[];

  /*原始建表DDL */
  createTableDdl: string;
}

interface IGetList {
  current: number;
  pageSize: number;
  queryFilter?: {
    spaceId: number;
    tableDescription?: string;
    tableName?: string;
  };
}

// 参数接口
export interface IAddTask {
  /*表名称 */
  tableName: string;
  /*表描述 */
  tableDescription?: string;
  /*空间ID */
  spaceId: number;
  id?: number;
}

interface ColumnDefines {
  id: number;
  fieldName: string;
  fieldDescription: string;
  fieldType: number;
  nullableFlag: boolean;
  defaultValue: string;
  uniqueFlag: boolean;
  enabledFlag: boolean;
  sortIndex: number;
  systemFieldFlag: boolean;
}

// 表数据返回参数的结构
export interface ITableData {
  columnDefines: ColumnDefines[];
  records: any[];
}

// 新增和修改表数据
interface IAddTableData {
  tableId: number;
  rowId?: number; // 可选参数，用于修改已有行的ID，新增时可以不传递此参数，由后端自动生成唯一ID
  rowData: AnyObject;
}

// 查询列表
async function getList(
  data: IGetList,
): Promise<RequestResponse<IGetModelList[]>> {
  return request(`/api/compose/db/table/list`, {
    method: 'POST',
    data,
  });
}

// 新增
async function addTask(data: IAddTask): Promise<RequestResponse<number>> {
  return request(`/api/compose/db/table/add`, {
    method: 'POST',
    data,
  });
}

// 修改表单的基本信息
async function modifyTask(data: IAddTask): Promise<RequestResponse<number>> {
  return request(`/api/compose/db/table/update`, {
    method: 'POST',
    data,
  });
}
// 修改表的表结构
async function modifyTableStructure(data: {
  id: number;
  fieldList: FieldList[];
}): Promise<RequestResponse<number>> {
  return request(`/api/compose/db/table/updateTableDefinition`, {
    method: 'POST',
    data,
  });
}

// 删除
async function deleteTask(id: number): Promise<RequestResponse<null>> {
  return request(`/api/compose/db/table/delete${id}`, {
    method: 'POST',
  });
}

// 查询详情
async function getDetail(id: number): Promise<RequestResponse<IgetDetails>> {
  return request(`/api/compose/db/table/detailById`, {
    method: 'GET',
    params: { id },
  });
}

// 查询表的业务数据
async function getTableData(params: {
  tableId: number;
  pageNo: number;
  pageSize: number;
}): Promise<RequestResponse<ITableData>> {
  return request(`/api/compose/db/table/getTableDataById`, {
    method: 'GET',
    params,
  });
}

// 新增表数据
async function addTableData(
  data: IAddTableData,
): Promise<RequestResponse<null>> {
  return request(`/api/compose/db/table/addBusinessData`, {
    method: 'POST',
    data,
  });
}
// 修改表数据
async function modifyTableData(
  data: IAddTableData,
): Promise<RequestResponse<null>> {
  return request(`/api/compose/db/table/updateBusinessData`, {
    method: 'POST',
    data,
  });
}

// 删除表数据
async function deleteTableData(params: {
  tableId: number;
  rowId: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/compose/db/table/deleteBusinessData`, {
    method: 'POST',
    data: params,
  });
}

// 清除表数据
async function clearTableData(id: number): Promise<RequestResponse<null>> {
  return request(`/api/compose/db/table/clearBusinessData/${id}`, {
    method: 'POST',
  });
}

// 导出表数据
async function exportTableData(id: number): Promise<RequestResponse<null>> {
  return request(`/api/compose/db/table/exportExcel/${id}`, {
    method: 'POST',
  });
}

export default {
  getList,
  addTask,
  modifyTask,
  deleteTask,
  getDetail,
  getTableData,
  addTableData,
  modifyTableData,
  deleteTableData,
  clearTableData,
  exportTableData,
  modifyTableStructure,
};

import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

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
  fieldList: {
    /*主键ID */
    id: number;
    /*租户ID */
    tenantId: number;
    /*所属空间ID */
    spaceId: number;
    /*关联的表ID */
    tableId: number;
    /*字段名 */
    fieldName: string;
    /*字段描述 */
    fieldDescription: string;
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
    /*字段顺序 */
    sortIndex: number;
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
  };
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
  fieldList: {
    /*主键ID */
    id: number;
    /*字段名 */
    fieldName: string;
    /*字段描述 */
    fieldDescription: string;

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
  }[];

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
}

// 表数据返回参数的结构
export interface ITableData {
  columnDefines: ColumnDefines[];
  records: any[];
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

// 修改
async function modifyTask(data: IAddTask): Promise<RequestResponse<number>> {
  return request(`/api/compose/db/table/update`, {
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

export default {
  getList,
  addTask,
  modifyTask,
  deleteTask,
  getDetail,
  getTableData,
};

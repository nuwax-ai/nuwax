import {
  ComposeTableListParams,
  CustomTableDefinitionInfo,
  GetTableDataParams,
  ITableData,
  tableAddParams,
  TableDefineDetails,
  UpdateBusinessDataParams,
  UpdateTableDefinitionParams,
  UpdateTableNameParams,
} from '@/types/interfaces/dataTable';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 更新表名称和描述信息
export function apiUpdateTableName(
  data: UpdateTableNameParams,
): Promise<RequestResponse<number>> {
  return request(`/api/compose/db/table/updateTableName`, {
    method: 'POST',
    data,
  });
}

// 更新表定义
export function apiUpdateTableDefinition(
  data: UpdateTableDefinitionParams,
): Promise<RequestResponse<number>> {
  return request(`/api/compose/db/table/updateTableDefinition`, {
    method: 'POST',
    data,
  });
}

// 查询表定义列表
export function apiComposeTableList(
  data: ComposeTableListParams,
): Promise<RequestResponse<CustomTableDefinitionInfo[]>> {
  return request(`/api/compose/db/table/list`, {
    method: 'POST',
    data,
  });
}

// 删除表定义
export function apiTableDelete(id: number): Promise<RequestResponse<null>> {
  return request(`/api/compose/db/table/delete/${id}`, {
    method: 'POST',
  });
}

// 复制表结构定义
export function apiTableCopyDefinition(): Promise<RequestResponse<number>> {
  return request('/api/compose/db/table/copyTableDefinition', {
    method: 'POST',
  });
}

// 新增表定义
export function apiTableAdd(
  data: tableAddParams,
): Promise<RequestResponse<number>> {
  return request('/api/compose/db/table/add', {
    method: 'POST',
    data,
  });
}

// 查询表是否存在业务数据
export function apiTableExistData(
  tableId: number,
): Promise<RequestResponse<boolean>> {
  return request('/api/compose/db/table/existTableData', {
    method: 'GET',
    params: {
      tableId,
    },
  });
}

// 查询表定义详情
export function apiTableDetail(
  id: number,
): Promise<RequestResponse<TableDefineDetails>> {
  return request(`/api/compose/db/table/detailById`, {
    method: 'GET',
    params: {
      id,
    },
  });
}

// 修改业务数据
export function apiUpdateBusinessData(
  data: UpdateBusinessDataParams,
): Promise<RequestResponse<null>> {
  return request('/api/compose/db/table/updateBusinessData', {
    method: 'POST',
    data,
  });
}

// 导入业务表数据Excel
export function apiImportExcel(
  tableId: number,
  file: File,
): Promise<RequestResponse<null>> {
  const formData = new FormData();
  formData.append('file', file); // 假设文件名为 'file'，根据实际情况调整
  return request(`/api/compose/db/table/importExcel/${tableId}`, {
    method: 'POST',
    data: formData,
  });
}

// 删除表数据
export function apiTableDeleteBusinessData(
  tableId: number,
  rowId: number,
): Promise<RequestResponse<null>> {
  return request('/api/compose/db/table/deleteBusinessData', {
    method: 'POST',
    data: {
      tableId,
      rowId,
    },
  });
}

// 新增业务数据
export function apiTableAddBusinessData(
  data: UpdateBusinessDataParams,
): Promise<RequestResponse<null>> {
  return request('/api/compose/db/table/addBusinessData', {
    method: 'POST',
    data,
  });
}

// 查询表的业务数据
export function apiGetTableData(
  params: GetTableDataParams,
): Promise<RequestResponse<ITableData<unknown>>> {
  return request('/api/compose/db/table/getTableDataById', {
    method: 'GET',
    params,
  });
}

// 导出业务表数据为Excel
export function apiExportExcel(tableId: number): Promise<Blob> {
  return request(`/api/compose/db/table/exportExcel/${tableId}`, {
    method: 'GET',
    responseType: 'blob', // 指定响应类型为blob
    getResponse: true, // 获取完整响应对象
  });
}

// 清空业务数据
export function apiClearBusinessData(
  tableId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/compose/db/table/clearBusinessData/${tableId}`, {
    method: 'GET',
  });
}

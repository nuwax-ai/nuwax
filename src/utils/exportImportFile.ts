import { apiTemplateExport } from '@/services/agentDev';
import { apiExportExcel } from '@/services/dataTable';
import { AgentComponentTypeEnum } from '@/types/enums/agent';

/**
 * 模板导出配置文件，支持Agent、Workflow、Plugin、Table
 * @param targetId 目标ID
 * @param targetType 目标类型
 * @param fileName 文件名称
 */
export const exportConfigFile = async (
  id: number,
  fileName: string,
  type: AgentComponentTypeEnum = AgentComponentTypeEnum.Agent,
) => {
  try {
    const _res = await apiTemplateExport(id, type);
    console.log('导出配置', _res);
    // 当使用 getResponse: true 时，_res 是一个包含 data 属性的响应对象
    const blob = new Blob([_res.data]); // 将响应数据转换为 Blob 对象
    const objectURL = URL.createObjectURL(blob); // 创建一个 URL 对象
    const link = document.createElement('a'); // 创建一个 a 标签
    link.href = objectURL;
    link.download = `${fileName}.txt`; // 设置下载文件的名称
    link.click(); // 模拟点击下载
    URL.revokeObjectURL(objectURL); // 释放 URL 对象
  } finally {
  }
};

/**
 * 导出业务表数据为Excel
 * @param tableId 业务表ID
 * @param fileName 文件名称
 */
export const exportTableExcel = async (tableId: number, fileName: string) => {
  try {
    const _res = await apiExportExcel(tableId);
    // 当使用 getResponse: true 时，_res 是一个包含 data 属性的响应对象
    const blob = new Blob([_res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }); // 将响应数据转换为 Blob 对象
    const objectURL = URL.createObjectURL(blob); // 创建一个 URL 对象
    const link = document.createElement('a'); // 创建一个 a 标签
    link.href = objectURL;
    link.download = `${fileName}.xlsx`; // 设置下载文件的名称
    link.click(); // 模拟点击下载
    URL.revokeObjectURL(objectURL); // 释放 URL 对象
  } finally {
  }
};

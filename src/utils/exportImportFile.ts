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
  type: AgentComponentTypeEnum = AgentComponentTypeEnum.Agent,
) => {
  try {
    const res = await apiTemplateExport(id, type);
    // 从响应头中获取文件名
    const contentDisposition = res.headers['content-disposition'];
    // 解码文件名
    const fileName = decodeURIComponent(
      contentDisposition.split('filename=')[1].replace(/"/g, ''),
    );

    // 当使用 getResponse: true 时，_res 是一个包含 data 属性的响应对象
    const blob = new Blob([res.data]); // 将响应数据转换为 Blob 对象
    const objectURL = URL.createObjectURL(blob); // 创建一个 URL 对象
    const link = document.createElement('a'); // 创建一个 a 标签
    link.href = objectURL;
    link.download = fileName; // 设置下载文件的名称
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
    const res = await apiExportExcel(tableId);
    // 当使用 getResponse: true 时，_res 是一个包含 data 属性的响应对象
    const blob = new Blob([res.data], {
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

/**
 * 导出整个项目压缩包
 * @param result 下载接口响应结果
 * @param name 文件名称
 */
export const exportWholeProjectZip = async (result: any, name: string) => {
  // 从响应头中获取文件名
  const contentDisposition = result.headers?.['content-disposition'];
  let filename = name;

  if (contentDisposition) {
    // 解析 Content-Disposition 头中的文件名
    const filenameMatch = contentDisposition.match(
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
    );
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }

  // 创建下载链接
  const blob = new Blob([result.data], { type: 'application/zip' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // 触发下载
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 清理URL对象
  window.URL.revokeObjectURL(url);
};

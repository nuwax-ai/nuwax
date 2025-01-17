import customRequest from '@/utils/customRequest';
// 工作流的接口

// 根据id查询工作流节点列表
const getNodeList = async (id: number) => {
  // 发送GET请求，使用相对路径
  return customRequest({
    url: `/api/workflow/node/list/${id}`, // 注意这里的斜杠，表示相对于 baseUrl
    method: 'GET',
  }).then((response) => {
    console.log(response);
  });
};

export default { getNodeList };

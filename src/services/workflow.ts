import customRequest from '@/utils/customRequest';
// 工作流的接口

interface IGetModelList {
  modelType?: string;
  apiProtocol?: string;
  scope?: string;
  spaceId?: number;
}

export interface IUpdateDetails {
  id?: number;
  name: string;
  description: string;
  icon: string;
}

interface IAddNode {
  workflowId: number;
  type: string;
  loopNodeId?: number;
  typeId?: number;
  extension?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
}

// 获取工作流的详细信息
const getDetails = (id: number) => {
  return customRequest({
    url: `/api/workflow/${id}`,
    method: 'GET',
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to get node list:', error);
    });
};

// 更改工作流基础信息
const updateDetails = (data: IUpdateDetails) => {
  return customRequest({
    url: `/api/workflow/update`,
    method: 'POST',
    data,
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to get node list:', error);
    });
};

// 根据id查询工作流节点列表
const getNodeList = async (id: number) => {
  // 发送GET请求，使用相对路径
  return customRequest({
    url: `/api/workflow/node/list/${id}`,
    method: 'GET',
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to get node list:', error);
    });
};

// 给工作流添加节点
const addNode = async (params: IAddNode) => {
  // 发送GET请求，使用相对路径
  return customRequest({
    url: `/api/workflow/node/add`,
    method: 'POST',
    data: params,
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to get node list:', error);
    });
};

// 复制工作流
const copyNode = async (id: string) => {
  // 发送GET请求，使用相对路径
  return customRequest({
    url: `/api/workflow/node/copy/${id}`,
    method: 'POST',
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to get node list:', error);
    });
};

// 删除工作流的节点
const deleteNode = async (id: number | string) => {
  // 发送GET请求，使用相对路径
  return customRequest({
    url: `/api/workflow/node/delete/${id}`,
    method: 'POST',
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to get node list:', error);
    });
};

interface IAddEdge {
  nodeId: number | string;
  integers: number[];
}
// 添加连线
const addEdge = async (params: IAddEdge) => {
  // 发送GET请求，使用相对路径
  return customRequest({
    url: `/api/workflow/node/${params.nodeId}/nextIds/update`,
    method: 'POST',
    data: params.integers,
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to get node list:', error);
    });
};

interface IgetModelList {
  modelType: string;
}
// 查询当前工作流可以使用的模型
const getModelListByWorkflowId = async (params: IgetModelList) => {
  // 发送GET请求，使用相对路径
  return customRequest({
    url: `/api/model/list`,
    method: 'POST',
    data: params,
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to getmodel list:', error);
    });
};

// 查询模型列表
const getModelList = async (params: IGetModelList) => {
  // 发送GET请求，使用相对路径
  return customRequest({
    url: `/api/model/list`,
    method: 'POST',
    data: params,
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to get model list:', error);
    });
};

export default {
  getDetails,
  updateDetails,
  getNodeList,
  addNode,
  getModelList,
  deleteNode,
  copyNode,
  addEdge,
  getModelListByWorkflowId,
};

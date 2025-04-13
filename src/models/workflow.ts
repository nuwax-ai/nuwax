// import service from '@/services/workflow';
// import { NodeTypeEnum } from '@/types/enums/common';
// import { ChildNode } from '@/types/interfaces/graph';
import { NodePreviousAndArgMap } from '@/types/interfaces/node';
// import { message } from 'antd';
import { useState } from 'react';
const useWorkflow = () => {
  // 是否要校验当前的数据
  const [volid, setVolid] = useState<boolean>(false);

  const [spaceId, setSpaceId] = useState<number>(0);
  // 当前节点是否修改了参数
  const [isModified, setIsModified] = useState(false);

  const [referenceList, setReferenceList] = useState<NodePreviousAndArgMap>({
    previousNodes: [],
    innerPreviousNodes: [],
    argMap: {},
  });

  // 获取父节点名称
  const getName = (value: string) => {
    let _id = value.split('.')[0];
    if (_id.includes('-')) {
      _id = _id.split('-')[0];
    }
    const parentNode = referenceList.previousNodes.find(
      (item) => item.id === Number(_id),
    );
    return parentNode?.name;
  };

  const getLoopName = (value: string) => {
    let _id = value.split('.')[0];
    if (_id.includes('-')) {
      _id = _id.split('-')[0];
    }
    const parentNode = referenceList.innerPreviousNodes.find(
      (item) => item.id === Number(_id),
    );
    return parentNode?.name;
  };

  // 提取当前的数据
  const getValue = (val: string) => {
    if (referenceList.previousNodes?.length && referenceList.argMap[val]) {
      return `${getName(val)} - ${referenceList.argMap[val].name}`;
    }
    return '';
  };

  // 单独处理循环的数据
  const getLoopValue = (val: string) => {
    if (referenceList.innerPreviousNodes?.length && referenceList.argMap[val]) {
      return `${getLoopName(val)} - ${referenceList.argMap[val].name}`;
    }
    return '';
  };

  // // 重新获取当前节点的数据
  // const getCurrentNodeData = async () => {
  //   try {
  //     const _res = await service.getNodeConfig(foldWrapItem?.id as number);
  //     setFoldWrapItem(_res.data);
  //     return _res.data; // 返回当前节点的配置数据，以便外部使用或更新状态
  //   } catch (error) {
  //     message.error('获取当前节点数据失败');
  //   }
  // };

  return {
    volid,
    setVolid,
    referenceList,
    setReferenceList,
    getValue,
    getLoopValue,
    isModified,
    setIsModified,
    spaceId,
    setSpaceId,
    // foldWrapItem,
    // setFoldWrapItem,
    // getCurrentNodeData,
  };
};

export default useWorkflow;

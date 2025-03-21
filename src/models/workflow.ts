// import { NodeTypeEnum } from '@/types/enums/common';
import { NodePreviousAndArgMap } from '@/types/interfaces/node';
import { useState } from 'react';

const useWorkflow = () => {
  // 是否要校验当前的数据
  const [volid, setVolid] = useState<boolean>(false);

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

  return {
    volid,
    setVolid,
    referenceList,
    setReferenceList,
    getValue,
    getLoopValue,
  };
};

export default useWorkflow;

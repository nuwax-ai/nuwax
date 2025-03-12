import { NodeTypeEnum } from '@/types/enums/common';
import { NodePreviousAndArgMap } from '@/types/interfaces/node';
import { useState } from 'react';

const useWorkflow = () => {
  // 是否要校验当前的数据
  const [volid, setVolid] = useState<boolean>(false);

  const [referenceList, setReferenceList] = useState<NodePreviousAndArgMap>({
    previousNodes: [
      {
        id: 1,
        name: '测试',
        outputArgs: [],
        icon: '',
        type: NodeTypeEnum.Start,
      },
    ],
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

  // 提取当前的数据
  const getValue = (val: string) => {
    if (referenceList.previousNodes?.length && referenceList.argMap[val]) {
      return `${getName(val)} - ${referenceList.argMap[val].name}`;
    }
    return '';
  };

  return {
    volid,
    setVolid,
    referenceList,
    setReferenceList,
    getValue,
  };
};

export default useWorkflow;

// import service from '@/services/workflow';
// import { NodeTypeEnum } from '@/types/enums/common';
// import { ChildNode } from '@/types/interfaces/graph';
import { NodePreviousAndArgMap } from '@/types/interfaces/node';
// import { message } from 'antd';
import { useRef, useState } from 'react';
const useWorkflow = () => {
  // 是否要校验当前的数据
  const [volid, setVolid] = useState<boolean>(false);

  const [spaceId, setSpaceId] = useState<number>(0);

  // 使用 useState 触发组件重新渲染
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, forceUpdate] = useState<boolean>(false);

  const [referenceList, setReferenceList] = useState<NodePreviousAndArgMap>({
    previousNodes: [],
    innerPreviousNodes: [],
    argMap: {},
  });

  // 使用 useRef 存储 isModified 的状态
  const isModifiedRef = useRef<boolean>(false);
  // 获取 isModified 的最新值
  const getIsModified = () => isModifiedRef.current;

  // 设置 isModified 的值并触发重新渲染
  const setIsModified = (value: boolean) => {
    isModifiedRef.current = value;
    forceUpdate((prev) => !prev); // 触发重新渲染
  };

  const [skillChange, setSkillChange] = useState<boolean>(false);

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
    isModified: isModifiedRef.current, // 返回最新的 isModified 值
    getIsModified, // 导出
    setIsModified,
    spaceId,
    setSpaceId,
    skillChange,
    setSkillChange,
    // foldWrapItem,
    // setFoldWrapItem,
    // getCurrentNodeData,
  };
};

export default useWorkflow;

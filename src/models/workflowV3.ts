/**
 * V3 专属的 Workflow Model
 * 从 workflow.ts 迁移而来，修复了 skillChange 存储 bug
 * 在 V3 中使用 useModel('workflowV3') 代替 useModel('workflow')
 */

import { DEFAULT_DRAWER_FORM } from '@/constants/node.constants';
import { NodeShapeEnum, NodeTypeEnum } from '@/types/enums/common';
import { NodePreviousAndArgMap } from '@/types/interfaces/node';
import { useCallback, useEffect, useRef, useState } from 'react';

/** 保存状态枚举 */
export enum SaveStatusEnum {
  /** 已保存 */
  Saved = 'saved',
  /** 保存中 */
  Saving = 'saving',
  /** 保存失败 */
  Failed = 'failed',
  /** 有未保存的更改 */
  Unsaved = 'unsaved',
}

const useWorkflowV3 = () => {
  // 是否要校验当前的数据
  const [volid, setVolid] = useState<boolean>(false);
  const [globalLoadingTime, setGlobalLoadingTime] = useState<number>(0);

  const [visible, setVisible] = useState<boolean>(false); // 显示隐藏右侧节点抽屉

  // 保存状态管理
  const [saveStatus, setSaveStatus] = useState<SaveStatusEnum>(
    SaveStatusEnum.Saved,
  );
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [spaceId, setSpaceId] = useState<number>(0);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const storeWorkflowRef = useRef<any>({
    drawerForm: DEFAULT_DRAWER_FORM,
  });

  // 使用 useState 触发组件重新渲染
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, forceUpdate] = useState<boolean>(false);

  const [referenceList, setReferenceList] = useState<NodePreviousAndArgMap>({
    previousNodes: [],
    innerPreviousNodes: [],
    argMap: {},
  });

  // 使用 useRef 存储 isModified 的状态
  const [isModified, setIsModified] = useState<boolean>(false);

  const [skillChange, setSkillChange] = useState<boolean>(false);
  const [drawerForm, setDrawerForm] = useState<any>({
    type: NodeTypeEnum.Start,
    shape: NodeShapeEnum.General,
    nodeConfig: {
      inputArgs: [],
    },
    id: 0,
    name: '测试',
    description: '测试',
    workflowId: 0,
    icon: '',
  });

  // 安全的更新 drawerForm 函数
  const updateDrawerForm = (newForm: any) => {
    setDrawerForm((prevForm: any) => {
      // 避免不必要的更新
      if (JSON.stringify(prevForm) === JSON.stringify(newForm)) {
        return prevForm;
      }
      return newForm;
    });
  };

  // 获取父节点名称
  const getName = (value: string) => {
    let _id = value.split('.')[0];
    if (_id.includes('-')) {
      _id = _id.split('-')[0];
    }
    const numericId = Number(_id);
    const parentNode = referenceList.previousNodes.find(
      (item) => item.id === numericId,
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
      if (!referenceList.argMap[val].name) {
        return '';
      }
      return `${getName(val)} - ${referenceList.argMap[val].name}`;
    }
    return '';
  };

  // 单独处理循环的数据
  const getLoopValue = (val: string) => {
    if (referenceList.innerPreviousNodes?.length && referenceList.argMap[val]) {
      if (!referenceList.argMap[val].name) {
        return '';
      }
      return `${getLoopName(val)} - ${referenceList.argMap[val].name}`;
    }
    return '';
  };

  const storeWorkflow = useCallback((key: string, value: any) => {
    storeWorkflowRef.current[key] = value;
  }, []);

  useEffect(() => {
    // 存储工作流数据
    storeWorkflow('isModified', isModified);
  }, [isModified]);
  useEffect(() => {
    storeWorkflow('visible', visible);
  }, [visible]);

  // V3 修复: 正确存储 skillChange 而非 visible
  useEffect(() => {
    storeWorkflow('skillChange', skillChange);
  }, [skillChange]);

  const getWorkflow = useCallback((key: string) => {
    return storeWorkflowRef.current[key];
  }, []);

  const clearWorkflow = useCallback(() => {
    storeWorkflowRef.current = {
      drawerForm: DEFAULT_DRAWER_FORM,
    };
  }, []);
  const [expanded, setExpanded] = useState<string>('');

  useEffect(() => {
    setGlobalLoadingTime(new Date().getTime()); //初始化

    return () => {
      setGlobalLoadingTime(0); //清除
    };
  }, []);

  const handleInitLoading = useCallback(() => {
    const loadingTime = new Date().getTime() - globalLoadingTime;
    const duration = 800; //保证loading时间大于800ms
    if (loadingTime > duration) {
      setGlobalLoadingTime(0);
    } else {
      setTimeout(() => {
        setGlobalLoadingTime(0);
      }, duration - loadingTime);
    }
  }, [globalLoadingTime]);

  return {
    volid,
    setVolid,
    referenceList,
    setReferenceList,
    getValue,
    getLoopValue,
    isModified, // 导出
    setIsModified,
    spaceId,
    setSpaceId,
    skillChange,
    setSkillChange,
    drawerForm,
    updateDrawerForm,
    storeWorkflow,
    getWorkflow,
    clearWorkflow,
    visible,
    setVisible,
    expanded,
    setExpanded,
    updateLoading,
    setUpdateLoading,
    globalLoadingTime,
    handleInitLoading,
    // 保存状态
    saveStatus,
    setSaveStatus,
    lastSaveTime,
    setLastSaveTime,
    saveError,
    setSaveError,
  };
};

export default useWorkflowV3;

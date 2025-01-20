import type {
  GroupModelItem,
  ModelListItemProps,
} from '@/types/interfaces/model';
import { groupModelsByApiProtocol } from '@/utils/model';
import { useEffect, useState } from 'react';

const useModelSetting = () => {
  const [open, setOpen] = useState<boolean>(false);
  // 展开收起模型设置的弹窗
  const [show, setShow] = useState<boolean>(false);
  // 展开收起提示词
  const [expand, setExpand] = useState<boolean>(false);
  // 展开收起试运行
  const [testRun, setTestRun] = useState<boolean>(false);
  // 当前模型的列表
  const [modelList, setModelList] = useState<ModelListItemProps[]>([]);
  // 分组后的模型列表
  const [groupedOptionsData, setGroupedOptionsData] = useState<
    GroupModelItem[]
  >([]);

  useEffect(() => {
    if (modelList.length > 0) {
      // 更新分组后的模型列表
      const updatedGroupedOptionsData = groupModelsByApiProtocol(modelList);
      setGroupedOptionsData(updatedGroupedOptionsData);
    }
    // 如果 modelList 为空，则不更新 groupedOptionsData
  }, [modelList]);

  return {
    open,
    setOpen,
    show,
    setShow,
    expand,
    setExpand,
    testRun,
    setTestRun,
    modelList,
    setModelList,
    groupedOptionsData,
  };
};

export default useModelSetting;

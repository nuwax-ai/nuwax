/**
 * AppDev 模型选择器 Hook
 * 管理模型列表加载和选择逻辑
 */
import { listModels } from '@/services/appDev';
import type { ModelLisDto } from '@/types/interfaces/appDev';
import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

export const useAppDevModelSelector = (projectId: string) => {
  const [models, setModels] = useState<ModelLisDto>();
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  /**
   * 加载模型列表
   */
  const loadModels = useCallback(async () => {
    if (!projectId) return;

    setIsLoadingModels(true);
    try {
      const { data, message, success } = await listModels(projectId);
      if (success) {
        setModels(data);
      } else {
        throw new Error(message || '获取模型列表失败');
      }
    } catch (error) {
      console.error(' 加载模型列表失败:', error);
      message.error('加载模型列表失败，请刷新页面重试');
    } finally {
      setIsLoadingModels(false);
    }
  }, [projectId]);

  /**
   * 选择模型
   */
  const selectModel = (modelId: number) => {
    setSelectedModelId(modelId);
  };

  /**
   * 获取当前选中的模型信息
   */
  const selectedModel =
    models?.chatModelList?.find((m) => m.id === selectedModelId) || null;

  // 组件初始化时加载模型列表
  useEffect(() => {
    if (projectId) {
      loadModels();
    }
  }, [projectId]); // 移除 loadModels 依赖，避免重复执行

  return {
    models,
    selectedModelId,
    selectedModel,
    isLoadingModels,
    selectModel,
    reloadModels: loadModels,
  };
};

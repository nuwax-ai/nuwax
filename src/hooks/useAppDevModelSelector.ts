/**
 * AppDev 模型选择器 Hook
 * 管理模型列表加载和选择逻辑
 */

import { listModels } from '@/services/appDev';
import type { ModelLisDto } from '@/types/interfaces/appDev';
import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

const MODEL_STORAGE_KEY = 'appdev_selected_model_id';

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
      const response = await listModels(projectId);

      if (response.success && response.data) {
        const modelInfo: ModelLisDto = response.data;
        const { chatModelList, multiModelList } = modelInfo;
        setModels(modelInfo);

        console.log(multiModelList, 'multiModelList');

        // 获取上次使用的模型ID
        const lastUsedModelId = localStorage.getItem(MODEL_STORAGE_KEY);

        if (lastUsedModelId) {
          const modelExists = chatModelList.find(
            (m) => m.id === parseInt(lastUsedModelId),
          );
          if (modelExists) {
            setSelectedModelId(parseInt(lastUsedModelId));
            return;
          }
        }

        // 没有上次使用的模型时，优先使用 Anthropic 的第一个
        const anthropicModel = chatModelList.find(
          (m) => m.apiProtocol === 'Anthropic',
        );

        if (anthropicModel) {
          setSelectedModelId(anthropicModel.id);
          localStorage.setItem(MODEL_STORAGE_KEY, anthropicModel.id.toString());
        } else if (chatModelList.length > 0) {
          // 如果没有 Anthropic 模型，使用列表第一个
          setSelectedModelId(chatModelList[0].id);
          localStorage.setItem(
            MODEL_STORAGE_KEY,
            chatModelList[0].id.toString(),
          );
        }
      } else {
        throw new Error(response.message || '获取模型列表失败');
      }
    } catch (error) {
      console.error('❌ [ModelSelector] 加载模型列表失败:', error);
      message.error('加载模型列表失败，请刷新页面重试');
    } finally {
      setIsLoadingModels(false);
    }
  }, [projectId]);

  /**
   * 选择模型
   */
  const selectModel = useCallback((modelId: number) => {
    setSelectedModelId(modelId);
    localStorage.setItem(MODEL_STORAGE_KEY, modelId.toString());
  }, []);

  /**
   * 获取当前选中的模型信息
   */
  const selectedModel =
    models?.chatModelList?.find((m) => m.id === selectedModelId) || null;

  // 组件初始化时加载模型列表
  useEffect(() => {
    if (projectId) {
      console.log('🤖 [ModelSelector] 项目ID变化，加载模型列表:', projectId);
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

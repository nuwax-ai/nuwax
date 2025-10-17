/**
 * AppDev 模型选择器 Hook
 * 管理模型列表加载、选择逻辑和自动重试机制
 */

import { listModels } from '@/services/appDev';
import type { ModelConfig } from '@/types/interfaces/appDev';
import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

const MODEL_STORAGE_KEY = 'appdev_selected_model_id';
const RETRY_DELAY = 3000; // 3秒后重试
const MAX_RETRY_COUNT = 3; // 最多重试3次

export const useAppDevModelSelector = (projectId: string) => {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * 加载模型列表
   */
  const loadModels = useCallback(async () => {
    if (!projectId) return;

    setIsLoadingModels(true);
    try {
      const response = await listModels(projectId);

      if (response.success && response.data) {
        setModels(response.data);

        // 获取上次使用的模型ID
        const lastUsedModelId = localStorage.getItem(MODEL_STORAGE_KEY);

        if (lastUsedModelId) {
          const modelExists = response.data.find(
            (m) => m.id === parseInt(lastUsedModelId),
          );
          if (modelExists) {
            setSelectedModelId(parseInt(lastUsedModelId));
            return;
          }
        }

        // 没有上次使用的模型时，优先使用 Anthropic 的第一个
        const anthropicModel = response.data.find(
          (m) => m.apiProtocol === 'Anthropic',
        );

        if (anthropicModel) {
          setSelectedModelId(anthropicModel.id);
          localStorage.setItem(MODEL_STORAGE_KEY, anthropicModel.id.toString());
        } else if (response.data.length > 0) {
          // 如果没有 Anthropic 模型，使用列表第一个
          setSelectedModelId(response.data[0].id);
          localStorage.setItem(
            MODEL_STORAGE_KEY,
            response.data[0].id.toString(),
          );
        }

        setRetryCount(0); // 重置重试计数
      } else {
        throw new Error(response.message || '获取模型列表失败');
      }
    } catch (error) {
      console.error('❌ [ModelSelector] 加载模型列表失败:', error);

      // 自动重试逻辑
      if (retryCount < MAX_RETRY_COUNT) {
        console.log(
          `🔄 [ModelSelector] ${RETRY_DELAY / 1000}秒后重试 (${
            retryCount + 1
          }/${MAX_RETRY_COUNT})`,
        );
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          loadModels();
        }, RETRY_DELAY);
      } else {
        message.error('加载模型列表失败，请刷新页面重试');
      }
    } finally {
      setIsLoadingModels(false);
    }
  }, [projectId, retryCount]);

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
  const selectedModel = models.find((m) => m.id === selectedModelId) || null;

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

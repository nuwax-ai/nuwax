/**
 * AppDev 模型选择器 Hook
 * 管理模型列表加载和选择逻辑
 */
import { dict } from '@/services/i18nRuntime';
import { apiModelList } from '@/services/modelConfig';
import { AgentComponentTypeEnum, TaskTypeEnum } from '@/types/enums/agent';
import {
  ModelTypeEnum,
  ModelUsageScenarioEnum,
} from '@/types/enums/modelConfig';
import type { ModelConfig, ModelLisDto } from '@/types/interfaces/appDev';
import { jumpBack } from '@/utils/router';
import { message, Modal } from 'antd';
import { useCallback, useEffect, useState } from 'react';

export const useAppDevModelSelector = (
  spaceId: number,
  projectId: string,
  hasPermission: boolean = true,
) => {
  // 模型对象（包含编码模型列表、视觉模型列表）
  const [models, setModels] = useState<ModelLisDto>();
  // 编码模型ID
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  // 视觉模型ID
  const [selectedMultiModelId, setSelectedMultiModelId] = useState<
    number | null
  >(null);
  // 模型列表加载状态
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  /**
   * 加载模型列表
   */
  const loadModels = useCallback(async () => {
    if (!projectId) return;

    setIsLoadingModels(true);
    try {
      const { data, message, success } = await apiModelList({
        modelType: TaskTypeEnum.Chat as any,
        spaceId: Number(spaceId),
      });

      if (success) {
        // 编码模型过滤：usageScenarios 必须包含 PageApp
        const chatModelList = (data || []).filter((item) =>
          item.usageScenarios?.includes(
            AgentComponentTypeEnum.PageApp as unknown as ModelUsageScenarioEnum,
          ),
        );

        // 视觉模型过滤：type 为 Multi
        const multiModelList = (data || []).filter(
          (item) => item.type === ModelTypeEnum.Multi,
        );

        const modelDto: ModelLisDto = {
          chatModelList: chatModelList as unknown as ModelConfig[],
          multiModelList: multiModelList as unknown as ModelConfig[],
        };

        setModels(modelDto);

        // 如果没有编码模型列表，则提示用户先配置默认聊天模型
        if (!chatModelList?.length) {
          Modal.confirm({
            title: dict('PC.Hooks.UseAppDevModelSelector.notice'),
            content: dict('PC.Hooks.UseAppDevModelSelector.configCodingModel'),
            // 核心代码：通过样式隐藏取消按钮
            cancelButtonProps: { style: { display: 'none' } },
            onOk() {
              jumpBack(`/space/${spaceId}/page-develop`);
            },
          });
        }
      } else {
        throw new Error(message || 'Failed to get model list');
      }
    } catch (error) {
      console.error('Failed to load model list:', error);
      message.error(
        dict('PC.Hooks.UseAppDevModelSelector.loadModelListFailed'),
      );
    } finally {
      setIsLoadingModels(false);
    }
  }, [projectId, spaceId]);

  /**
   * 选择编码模型
   */
  const selectModel = (modelId: number) => {
    setSelectedModelId(modelId);
  };

  /**
   * 选择视觉模型
   */
  const selectMultiModel = (modelId: number) => {
    setSelectedMultiModelId(modelId);
  };

  /**
   * 获取当前选中的模型信息
   */
  const selectedModel =
    models?.chatModelList?.find((m) => m.id === selectedModelId) || null;

  // 组件初始化时加载模型列表
  useEffect(() => {
    if (projectId && hasPermission) {
      loadModels();
    }
  }, [projectId, hasPermission]); // 移除 loadModels 依赖，避免重复执行

  return {
    models,
    selectedModelId,
    selectedModel,
    selectedMultiModelId,
    selectMultiModel,
    isLoadingModels,
    selectModel,
    reloadModels: loadModels,
  };
};

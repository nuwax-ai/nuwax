import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiAgentConfigUpdate } from '@/services/agentConfig';
import { apiAgentGenerateInfo } from '@/services/appDev';
import { apiPageUpdateProject } from '@/services/pageDev';
import { apiPluginHttpUpdate } from '@/services/plugin';
import { apiSkillUpdate } from '@/services/skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { useEffect, useRef } from 'react';
import { history, useLocation } from 'umi';

interface UseInitProjectMetadataProps {
  targetType: AgentComponentTypeEnum;
  targetId: number;
  onSuccess?: () => void;
}

export const useInitProjectMetadata = ({
  targetType,
  targetId,
  onSuccess,
}: UseInitProjectMetadataProps) => {
  const location = useLocation();
  const hasInitRef = useRef(false);

  useEffect(() => {
    const state = (location.state || history.location.state) as any;
    const prompt = state?.message;

    // 仅当是从新建页面 PUSH 过来，并且携带了 prompt，且当前组件未执行过初始化时触发
    if (
      history.action === 'PUSH' &&
      prompt &&
      targetId &&
      !hasInitRef.current
    ) {
      hasInitRef.current = true;

      const initMetadata = async () => {
        try {
          // 调用通用大模型生成基础元数据
          const res = await apiAgentGenerateInfo({ prompt });
          if (res?.code === SUCCESS_CODE && res?.data) {
            const meta = res.data;
            const updateParams = {
              id: targetId,
              name: meta.name,
              description: meta.description,
              icon: meta.iconUrl,
            };

            // 根据不同的组件类型，分发调用其特有的配置更新接口
            switch (targetType) {
              // 智能体
              case AgentComponentTypeEnum.Agent:
                await apiAgentConfigUpdate(updateParams as any);
                break;
              // 页面应用
              case AgentComponentTypeEnum.PageApp:
                await apiPageUpdateProject({
                  projectId: targetId,
                  projectName: meta.name,
                  projectDesc: meta.description,
                  icon: meta.iconUrl,
                } as any);
                break;
              // 技能
              case AgentComponentTypeEnum.Skill:
                await apiSkillUpdate(updateParams);
                break;
              // 插件
              case AgentComponentTypeEnum.Plugin:
                await apiPluginHttpUpdate(updateParams);
                break;
              default:
                break;
            }

            if (onSuccess) {
              onSuccess();
            }
          }
        } catch (error) {
          console.error(
            `Failed to initialize metadata for ${targetType}:`,
            error,
          );
        }
      };

      initMetadata();
    }
  }, [targetType, targetId, location.state, onSuccess]);
};

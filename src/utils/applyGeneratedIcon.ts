import {
  apiAgentConfigInfo,
  apiAgentConfigUpdate,
} from '@/services/agentConfig';
import { getProjectInfo } from '@/services/appDev';
import { apiPageUpdateProject } from '@/services/pageDev';
import {
  apiPluginCodeUpdate,
  apiPluginHttpUpdate,
  apiPluginInfo,
} from '@/services/plugin';
import { apiSkillDetail, apiSkillUpdate } from '@/services/skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PluginTypeEnum } from '@/types/enums/plugin';
import type { AgentConfigUpdateParams } from '@/types/interfaces/agent';
import type { GeneratedMetadata } from '@/utils/generatedMetadata';
import { pickIconAndDescription } from '@/utils/generatedMetadata';

/**
 * Prompt 跳转后写入已创建资源的 icon（不覆盖 name）
 */
export async function applyGeneratedIcon(
  targetType: AgentComponentTypeEnum,
  targetId: number,
  meta: GeneratedMetadata,
): Promise<void> {
  switch (targetType) {
    case AgentComponentTypeEnum.Agent: {
      const res = await apiAgentConfigInfo(targetId);
      const info = res?.data;
      if (!info) return;
      const patch = pickIconAndDescription(meta, info.description);
      if (!patch.icon) return;
      await apiAgentConfigUpdate({
        ...info,
        description: patch.description ?? info.description,
        icon: patch.icon,
      } as AgentConfigUpdateParams);
      break;
    }
    case AgentComponentTypeEnum.PageApp: {
      const res = await getProjectInfo(String(targetId));
      const project = res?.data;
      if (!project) return;
      const patch = pickIconAndDescription(meta, project.description);
      if (!patch.icon) return;
      await apiPageUpdateProject({
        projectId: targetId,
        projectName: project.name,
        projectDesc: patch.description ?? project.description,
        icon: patch.icon,
        coverImg: project.coverImg,
        coverImgSourceType: project.coverImgSourceType,
        needLogin: project.needLogin,
      });
      break;
    }
    case AgentComponentTypeEnum.Skill: {
      const res = await apiSkillDetail(targetId);
      const skill = res?.data;
      if (!skill) return;
      const patch = pickIconAndDescription(meta, skill.description);
      if (!patch.icon) return;
      await apiSkillUpdate({
        id: targetId,
        name: skill.name,
        description: patch.description ?? skill.description,
        icon: patch.icon,
      });
      break;
    }
    case AgentComponentTypeEnum.Plugin: {
      const res = await apiPluginInfo(targetId);
      const plugin = res?.data;
      if (!plugin) return;
      const patch = pickIconAndDescription(meta, plugin.description);
      if (!patch.icon) return;
      const payload = {
        id: targetId,
        name: plugin.name,
        description: patch.description ?? plugin.description,
        icon: patch.icon,
        config: plugin.config,
      };
      if (plugin.type === PluginTypeEnum.CODE) {
        await apiPluginCodeUpdate(payload);
      } else {
        await apiPluginHttpUpdate(payload);
      }
      break;
    }
    default:
      break;
  }
}

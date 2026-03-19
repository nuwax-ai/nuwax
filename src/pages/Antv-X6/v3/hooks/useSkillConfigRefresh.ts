import Constant from '@/constants/codes.constants';
import { SKILL_FORM_KEY } from '@/pages/Antv-X6/v3/constants/node.constants';
import service from '@/services/workflow';
import { CreatedNodeItem } from '@/types/interfaces/common';
import type { FormInstance } from 'antd';
import { useCallback } from 'react';
import { useModel } from 'umi';
import { workflowProxy } from '../services/workflowProxyV3';
import { workflowSaveService } from '../services/WorkflowSaveService';

/**
 * 添加工具后：保存工作流 → 拉取节点信息 → 回填工具列表参数配置
 * 解决添加工具后 inputArgBindConfigs / outputArgBindConfigs / targetConfig 为空的问题
 */
export const useSkillConfigRefresh = (form: FormInstance) => {
  const { getWorkflow } = useModel('workflowV3');

  const refreshSkillConfigs = useCallback(async () => {
    try {
      // 1. 同步当前表单数据到 proxy
      const drawerForm = getWorkflow('drawerForm');
      if (!drawerForm?.id) return;

      const values = form.getFieldsValue(true);
      const updateFormConfig = {
        ...drawerForm,
        nodeConfig: { ...drawerForm.nodeConfig, ...values },
      };
      workflowProxy.updateNode(JSON.parse(JSON.stringify(updateFormConfig)));

      // 2. 全量保存到后端
      const payload = workflowProxy.buildFullConfig();
      if (!payload) return;

      const saveRes = await service.saveWorkflow({
        workflowConfig: {
          ...payload,
          editVersion: workflowSaveService.getEditVersion(),
          forceCommit: 0 as const,
        },
      });
      if (
        saveRes.code === Constant.success &&
        saveRes.data !== null &&
        saveRes.data !== undefined
      ) {
        workflowSaveService.setEditVersion(saveRes.data);
      }

      // 3. 拉取后端最新节点信息（含完整的参数配置）
      const nodeRes = await service.getNodeConfig(drawerForm.id);
      if (nodeRes.code !== Constant.success || !nodeRes.data) return;

      const backendSkills = nodeRes.data?.nodeConfig?.[SKILL_FORM_KEY];
      if (!backendSkills) return;

      // 4. 按 type + typeId + toolName 匹配，用后端数据回填参数配置
      //    注意：后端不返回 targetId，需用 typeId 匹配
      const formSkills = form.getFieldsValue(true)[SKILL_FORM_KEY] || [];
      const merged = formSkills.map((item: CreatedNodeItem) => {
        const backendItem = backendSkills.find(
          (i: CreatedNodeItem) =>
            i.type === item.type &&
            (i.typeId === item.typeId || i.targetId === item.typeId) &&
            (i.toolName || '') === (item.toolName || ''),
        );
        return backendItem ? { ...item, ...backendItem } : item;
      });
      form.setFieldValue(SKILL_FORM_KEY, merged);
    } catch (error) {
      console.error('[useSkillConfigRefresh] 工具参数回填失败:', error);
    }
  }, [form, getWorkflow]);

  return { refreshSkillConfigs };
};

import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import {
  AgentDetailDto,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import type {
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import type { SelectedDocInfo } from '@/types/interfaces/repo';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import { history } from 'umi';

const useConversation = () => {
  // 创建会话
  const { runAsync: runAsyncConversationCreate } = useRequest(
    apiAgentConversationCreate,
    {
      manual: true,
      debounceMaxWait: 300,
    },
  );

  // 创建智能体会话
  const handleCreateConversation = async (
    agentId: number,
    attach?: {
      message: string;
      files?: UploadFileInfo[];
      infos?: AgentSelectedComponentInfo[];
      selectedComputerId?: string;
      /**
       * 发起会话时选择的工作目录（wiki #17）：仅个人电脑（selectedComputerId
       * 非 '-1'）时生效，随会话创建记录（sandboxId + workspaceDir）。
       */
      workspaceDir?: string;
      // 默认智能体详情
      defaultAgentDetail?: AgentDetailDto;
      // 变量参数
      variableParams?: Record<string, string | number> | null;
      // 消息来源
      messageSourceType?: MessageSourceType;
      // 技能 ID 列表
      skillIds?: number[];
      // 模型 ID
      modelId?: number;
      // 智能体模式
      agentMode?: AgentMode;
      /**
       * 首页项目上框：直接建会话绑定已有项目（不走隐式建项目），
       * 携带 projectId/devAgentId/sandboxId（契约先行，2026-09-10 后端未 ready）。
       */
      projectId?: number;
      /** 项目绑定的调试智能体 ID（全栈项目上框携带） */
      devAgentId?: number;
      /** 项目沙箱（上框项目自带，优先于个人电脑选择） */
      sandboxId?: number;
      /** 创建成功后的跳转 URL 前缀（尾部拼接会话 id；全栈跳 app-pro 用） */
      redirectUrl?: string;
      // 资料库已选文档（首页能力弹窗选中，随首条 chat 消息发送；
      // 专家组件已由调用方按 id+type 去重合并进 infos，不单独透传）
      selectedDocs?: SelectedDocInfo[];
    },
  ) => {
    const variableParams = attach?.variableParams;
    // wiki #17：选择个人电脑时把沙箱与工作目录记录到会话上
    const personalComputerId =
      attach?.selectedComputerId && attach.selectedComputerId !== '-1'
        ? attach.selectedComputerId
        : undefined;
    /**
     * TODO(契约缺口，2026-09-10)：选个人电脑 + 自定义目录时「隐式创建常规项目 +
     * 目录占用校验」的接口归属待后端确认。当前按假定形态实现——单次
     * conversation/create 携带 workspaceDir，由后端隐式建项目并校验占用；
     * 若契约改为前端两步走（先 normal-project/create 再挂会话），仅需在
     * 此处切换（全仓唯一改动点）。
     */
    const res = await runAsyncConversationCreate({
      agentId,
      devMode: false,
      variables: variableParams,
      // 项目上框：绑定已有项目（工作区由项目隐含，不携带 workspaceDir）；
      // 否则维持个人电脑口径（sandboxId + workspaceDir）
      ...(attach?.projectId
        ? {
            projectId: attach.projectId,
            ...(attach.devAgentId ? { devAgentId: attach.devAgentId } : {}),
            ...(attach.sandboxId ? { sandboxId: attach.sandboxId } : {}),
          }
        : personalComputerId
        ? {
            sandboxId: Number(personalComputerId),
            workspaceDir: attach?.workspaceDir || undefined,
          }
        : {}),
    });

    if (!res?.success) {
      // 创建失败（含目录被占用）时中止跳转，展示后端错误信息
      message.error(
        res?.message ||
          dict('PC.Components.WorkspaceDir.createConversationFailed'),
      );
      return;
    }

    const id = res.data?.id;
    if (id) {
      // 跳转会话页面；项目上框带 redirectUrl 时跳指定页（如全栈 IDE），
      // attach（含 message/files 等）作为 route state 由目标页自动发首条消息
      const url = attach?.redirectUrl
        ? `${attach.redirectUrl}${id}`
        : `/home/chat/${id}/${agentId}`;
      history.push(url, attach);
    }
  };

  return {
    handleCreateConversation,
    runAsyncConversationCreate,
  };
};

export default useConversation;

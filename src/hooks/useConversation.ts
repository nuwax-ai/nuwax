import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { CLOUD_SANDBOX_ID } from '@/constants/workspaceDirPolicy.constants';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  AgentDetailDto,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import type {
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import type { SelectedDocInfo } from '@/types/interfaces/repo';
import { emitConversationChanged } from '@/utils/directorySyncEvents';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import { history } from 'umi';
import { useCallback } from 'react';

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
  // useCallback 固定引用（bug 2348）：下游 useMenuNavigation.handlerClick →
  // SidebarNavLayout.handleNewTask 逐层依赖本引用，不固定会导致消费者 effect
  // 逐层摘挂、侧栏全树重渲染；body 仅消费入参与模块级稳定引用（message/dict/
  // history 均为 import，runAsync 为 ahooks 稳定句柄），无活动 state 闭包
  const handleCreateConversation = useCallback(async (
    agentId: number,
    attach?: {
      /** 首条消息（项目直建会话等场景可不带，目标页无 message 即不自动发送） */
      message?: string;
      files?: UploadFileInfo[];
      infos?: AgentSelectedComponentInfo[];
      selectedComputerId?: string;
      /**
       * 发起会话时选择的工作目录（wiki #17）：仅个人电脑（selectedComputerId
       * 非 '-1'）时生效，随会话创建记录（sandboxId + workspacePath）。
       */
      workspacePath?: string;
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
      /**
       * 上框/直建项目的类型（UserApp=全栈 / NormalProject=常规）。
       * 后端按 projectId 绑定项目时必填（2026-09-12 实测），缺省报「项目类型不能为空」。
       */
      projectType?: AgentComponentTypeEnum;
      /** 项目绑定的调试智能体 ID（全栈项目上框携带） */
      devAgentId?: number;
      /** 项目沙箱（创建者上框=项目绑定沙箱；参与者自选=云端 -1/个人电脑 id） */
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
     * conversation/create 携带 workspacePath，由后端隐式建项目并校验占用；
     * 若契约改为前端两步走（先 normal-project/create 再挂会话），仅需在
     * 此处切换（全仓唯一改动点）。
     */
    const res = await runAsyncConversationCreate({
      agentId,
      devMode: false,
      variables: variableParams,
      // 项目上框：绑定已有项目（工作区由项目隐含，不携带 workspacePath；
      // 参与者自选个人电脑沙箱例外，工作目录随会话记录）；
      // 否则统一携带 sandboxId：个人电脑传其 id（附 workspacePath），云端/未选传云电脑哨兵 -1
      ...(attach?.projectId
        ? {
            projectId: attach.projectId,
            // 项目类型为绑定项目时后端必填，调用方缺失时按常规项目兜底
            projectType:
              attach.projectType ?? AgentComponentTypeEnum.NormalProject,
            ...(attach.devAgentId ? { devAgentId: attach.devAgentId } : {}),
            ...(attach.sandboxId ? { sandboxId: attach.sandboxId } : {}),
            ...(attach.workspacePath
              ? { workspacePath: attach.workspacePath }
              : {}),
          }
        : {
            sandboxId: Number(personalComputerId ?? CLOUD_SANDBOX_ID),
            ...(personalComputerId
              ? { workspacePath: attach?.workspacePath || undefined }
              : {}),
          }),
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
      emitConversationChanged({
        operation: 'created',
        conversationId: String(id),
        ...(attach?.projectId
          ? {
              project: {
                projectId: String(attach.projectId),
                projectType:
                  attach.projectType ?? AgentComponentTypeEnum.NormalProject,
              },
            }
          : {}),
        origin: 'use-conversation',
        reason: 'create',
      });
      // 跳转会话页面；项目上框带 redirectUrl 时跳指定页（如全栈 IDE），
      // attach（含 message/files 等）作为 route state 由目标页自动发首条消息
      const url = attach?.redirectUrl
        ? `${attach.redirectUrl}${id}`
        : `/home/chat/${id}/${agentId}`;
      history.push(url, attach);
    }
  }, [runAsyncConversationCreate]);

  return {
    handleCreateConversation,
    runAsyncConversationCreate,
  };
};

export default useConversation;

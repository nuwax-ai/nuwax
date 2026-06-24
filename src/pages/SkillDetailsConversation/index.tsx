import { useInitProjectMetadata } from '@/hooks/useInitProjectMetadata';
import { ChatCore } from '@/pages/Chat';
import { apiSkillDetail } from '@/services/skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { SkillDetailInfo } from '@/types/interfaces/skill';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useModel, useParams, useRequest } from 'umi';
import SkillHeader from './components/SkillHeader';
import SkillPublishAction from './components/SkillPublishAction';

/**
 * 技能详情对话会话页面 - 共享 Chat 页面的核心对话组件，不展示右侧属性栏和分栏拖拽
 */
const SkillDetailsConversation: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = Number(searchParams.get('conversationId'));
  const agentId = Number(searchParams.get('agentId'));
  const skillId = Number(params.skillId) || agentId;

  const [skillInfo, setSkillInfo] = useState<SkillDetailInfo | null>(null);

  const conversationModel = useModel('conversationInfo');
  const fileTreeData = conversationModel?.fileTreeData;

  // 用 ref 记录是否为首次渲染以避开挂载时 fileTreeData 默认值触发的重复请求
  const isFirstRenderRef = useRef<boolean>(true);
  // 用 ref 记录是否已完成文件树数据的首次装载，以避开首次接口加载触发的重复请求
  const hasLoadedFileTreeRef = useRef<boolean>(false);

  // 请求技能详情
  const { run: runSkillInfo } = useRequest(apiSkillDetail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: any) => {
      // 兼容可能为 { code, data } 或直接为 data 的情况
      const data = result?.data !== undefined ? result.data : result;
      const { files } = data || {};
      if (Array.isArray(files) && files.length > 0) {
        setSkillInfo({
          ...data,
          files: files.map((item: any) => ({
            ...item,
            fileId: item.name,
          })),
        });
      } else {
        setSkillInfo(data);
      }
    },
  });

  useInitProjectMetadata({
    targetType: AgentComponentTypeEnum.Skill,
    targetId: skillId,
    onSuccess: () => {
      if (skillId) runSkillInfo(skillId);
    },
  });

  // 1. 初始化或 skillId 发生改变时拉取技能详情
  useEffect(() => {
    if (skillId) {
      runSkillInfo(skillId);
    }
  }, [skillId]);

  // 2. 监听文件树数据变化，重新同步技能详情（用于检测是否有未发布更新）
  useEffect(() => {
    // 首次渲染挂载时，跳过由 fileTreeData 初始状态触发的请求
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    // 首次文件列表接口数据装载完毕时，跳过请求并标记为已装载
    if (!hasLoadedFileTreeRef.current) {
      hasLoadedFileTreeRef.current = true;
      return;
    }
    if (skillId && fileTreeData) {
      runSkillInfo(skillId);
    }
  }, [fileTreeData, skillId]);

  return (
    <ChatCore
      id={id}
      agentId={agentId}
      locationState={location.state}
      showSidebar={false}
      showPayment={false}
      enableResizable={false}
      showClearContext={false}
      defaultFileTreeVisible={true}
      renderTitle={() => (
        <SkillHeader
          spaceId={spaceId}
          skillId={skillId}
          skillInfo={skillInfo}
          onRefresh={() => runSkillInfo(skillId)}
        />
      )}
      renderHeaderRight={() => (
        <SkillPublishAction
          spaceId={spaceId}
          skillId={skillId}
          skillInfo={skillInfo}
          onRefresh={() => runSkillInfo(skillId)}
        />
      )}
    />
  );
};

export default SkillDetailsConversation;

import WorkspaceLayout from '@/components/WorkspaceLayout';
import MainContent from './MainContent';

import { useRef, useState } from 'react';
import { useParams } from 'umi';
import CreateSkill from './CreateSkill';
import HeaderLeftSlot from './HeaderLeftSlot';
import HeaderRightSlot from './HeaderRightSlot';
import { MainContentRef } from './MainContent';

const SpaceSkillManage: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

  // 主要内容区域 ref
  const mainContentRef = useRef<MainContentRef>(null);

  // 创建技能
  const [openCreateSkill, setOpenCreateSkill] = useState(false);
  const handleCreateSkill = () => {
    setOpenCreateSkill(true);
  };
  const handleCreateSkillConfirm = () => {
    // 查询技能列表
    mainContentRef.current?.exposeQueryComponentList();
    setOpenCreateSkill(false);
  };
  return (
    <WorkspaceLayout
      title="技能管理"
      leftSlot={<HeaderLeftSlot />}
      rightSlot={<HeaderRightSlot onCreate={handleCreateSkill} />}
      hideScroll={true}
    >
      {/* 主要内容区域 */}
      <MainContent ref={mainContentRef} />
      {/* 创建技能弹窗 */}
      <CreateSkill
        spaceId={spaceId}
        open={openCreateSkill}
        onCancel={() => setOpenCreateSkill(false)}
        onConfirm={handleCreateSkillConfirm}
      />
    </WorkspaceLayout>
  );
};

export default SpaceSkillManage;

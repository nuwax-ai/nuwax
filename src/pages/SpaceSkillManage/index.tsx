import WorkspaceLayout from '@/components/WorkspaceLayout';
import MainContent from './MainContent';

import HeaderLeftSlot from './HeaderLeftSlot';
import HeaderRightSlot from './HeaderRightSlot';

export default function SpaceSkillManage() {
  return (
    <WorkspaceLayout
      title="技能管理"
      leftSlot={<HeaderLeftSlot />}
      rightSlot={<HeaderRightSlot />}
      hideScroll={true}
    >
      {/* 主要内容区域 */}
      <MainContent />
    </WorkspaceLayout>
  );
}

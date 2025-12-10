import WorkspaceLayout from '@/components/WorkspaceLayout';
import LeftSlot from './LeftSlot';
import MainContent from './MainContent';
import RightSuffixSlot from './RightSuffixSlot';

export default function SpaceSkillManage() {
  return (
    <WorkspaceLayout
      title="技能管理"
      leftSlot={<LeftSlot />}
      rightSuffixSlot={<RightSuffixSlot />}
      hideScroll={true}
    >
      {/* 主要内容区域 */}
      <MainContent />
    </WorkspaceLayout>
  );
}

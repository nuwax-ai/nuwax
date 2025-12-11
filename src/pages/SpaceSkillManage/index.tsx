import WorkspaceLayout from '@/components/WorkspaceLayout';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ComponentInfo } from '@/types/interfaces/library';
import { useRef, useState } from 'react';
import { history, useParams } from 'umi';
import CreateSkill from './CreateSkill';
import HeaderLeftSlot from './HeaderLeftSlot';
import HeaderRightSlot from './HeaderRightSlot';
import MainContent, { MainContentRef } from './MainContent';

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

  // 点击技能卡片
  const handleClickItem = (info: ComponentInfo) => {
    const { id } = info;
    history.push(`/space/${spaceId}/agent/${id}`);
  };

  // 删除技能
  const handleClickDelete = (info: ComponentInfo) => {
    console.log(info);
  };

  // 详情技能
  const handleClickDetail = (info: ComponentInfo) => {
    console.log(info);
  };

  // 点击技能卡片更多操作
  const handleClickMore = (item: CustomPopoverItem, info: ComponentInfo) => {
    const { action } = item as unknown as {
      action: ApplicationMoreActionEnum;
    };

    switch (action) {
      // 详情
      case ApplicationMoreActionEnum.Detail:
        handleClickDetail(info);
        break;
      // 删除
      case ApplicationMoreActionEnum.Del:
        handleClickDelete(info);
        break;
      default:
        break;
    }
  };

  return (
    <WorkspaceLayout
      title="技能管理"
      leftSlot={<HeaderLeftSlot />}
      rightSlot={<HeaderRightSlot onCreate={handleCreateSkill} />}
      hideScroll={true}
    >
      {/* 主要内容区域 */}
      <MainContent
        ref={mainContentRef}
        onClickItem={handleClickItem}
        onClickMore={handleClickMore}
      />
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

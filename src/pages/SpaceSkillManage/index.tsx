import WorkspaceLayout from '@/components/WorkspaceLayout';
import { apiDeleteSkill } from '@/services/library';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { SkillInfo } from '@/types/interfaces/library';
import { modalConfirm } from '@/utils/ant-custom';
import { message } from 'antd';
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

  // 创建技能模式
  const [createMode, setCreateMode] = useState<CreateUpdateModeEnum>(
    CreateUpdateModeEnum.Create,
  );

  // 当前技能信息
  const [currentSkillInfo, setCurrentSkillInfo] = useState<SkillInfo | null>(
    null,
  );

  // 创建技能
  const [openCreateSkill, setOpenCreateSkill] = useState(false);
  const handleCreateSkill = () => {
    setCreateMode(CreateUpdateModeEnum.Create);
    setOpenCreateSkill(true);
  };
  const handleCreateSkillConfirm = () => {
    // 查询技能列表
    mainContentRef.current?.exposeQueryComponentList();
    setOpenCreateSkill(false);
  };

  // 点击技能卡片
  const handleClickItem = (info: SkillInfo) => {
    const { id } = info;
    history.push(`/space/${spaceId}/skill-details/${id}`);
  };

  // 删除技能
  const handleClickDelete = (info: SkillInfo) => {
    // 二次确认
    modalConfirm('您确定要删除此技能吗?', '', () => {
      apiDeleteSkill(info.id).then(() => {
        // 提示删除成功
        message.success('技能删除成功');
        // 查询技能列表
        mainContentRef.current?.exposeQueryComponentList();
      });
    });
  };

  // 详情技能
  const handleClickDetail = (info: SkillInfo) => {
    handleClickItem(info);
  };

  // 编辑技能
  const handleClickEdit = (info: SkillInfo) => {
    setCurrentSkillInfo(info);
    setCreateMode(CreateUpdateModeEnum.Update);
    setOpenCreateSkill(true);
  };

  // 点击技能卡片更多操作
  const handleClickMore = (item: CustomPopoverItem, info: SkillInfo) => {
    const { action } = item as unknown as {
      action: ApplicationMoreActionEnum;
    };

    switch (action) {
      // 编辑
      case ApplicationMoreActionEnum.Edit:
        handleClickEdit(info);
        break;
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
        type={createMode}
        skillInfo={currentSkillInfo as SkillInfo | undefined}
        onCancel={() => setOpenCreateSkill(false)}
        onConfirm={handleCreateSkillConfirm}
      />
    </WorkspaceLayout>
  );
};

export default SpaceSkillManage;

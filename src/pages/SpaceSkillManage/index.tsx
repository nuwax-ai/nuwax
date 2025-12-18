import MoveCopyComponent from '@/components/MoveCopyComponent';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiDeleteSkill, apiSkillCopyToSpace } from '@/services/library';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { PageDevelopMoreActionEnum } from '@/types/enums/pageDev';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import {
  SkillCopyToSpaceParams,
  SkillCopyTypeEnum,
  type SkillInfo,
} from '@/types/interfaces/library';
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

  // 迁移、复制弹窗
  const [openMove, setOpenMove] = useState<boolean>(false);
  // 当前组件信息
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<SkillInfo | null>(null);

  // 加载中
  const [loadingSkill, setLoadingSkill] = useState<boolean>(false);

  // 复制到空间
  const handleClickCopyToSpace = (info: SkillInfo) => {
    console.log('复制到空间', info);
    setOpenMove(true);
    setCurrentComponentInfo(info);
  };

  // 确认复制到空间
  const handlerConfirmCopyToSpace = async (targetSpaceId: number) => {
    if (!currentComponentInfo) {
      message.error('技能信息不存在');
      return;
    }
    const data: SkillCopyToSpaceParams = {
      skillId: currentComponentInfo.id,
      targetSpaceId,
      copyType: SkillCopyTypeEnum.DEVELOP,
    };

    try {
      setLoadingSkill(true);
      const result = await apiSkillCopyToSpace(data);
      if (result.code === SUCCESS_CODE) {
        message.success('技能复制成功');
        // 查询技能列表
        mainContentRef.current?.exposeQueryComponentList();
        // 关闭弹窗
        setOpenMove(false);
      }
    } finally {
      setLoadingSkill(false);
    }
  };

  // 点击技能卡片更多操作
  const handleClickMore = (item: CustomPopoverItem, info: SkillInfo) => {
    const { action } = item as unknown as {
      action: ApplicationMoreActionEnum | PageDevelopMoreActionEnum;
    };

    switch (action) {
      // 复制到空间
      case PageDevelopMoreActionEnum.Copy_To_Space:
        handleClickCopyToSpace(info);
        break;
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

      {/*复制到空间弹窗*/}
      <MoveCopyComponent
        spaceId={spaceId}
        loading={loadingSkill}
        type={ApplicationMoreActionEnum.Copy_To_Space}
        mode={AgentComponentTypeEnum.Skill}
        open={openMove}
        title={currentComponentInfo?.name}
        onCancel={() => setOpenMove(false)}
        onConfirm={handlerConfirmCopyToSpace}
      />
    </WorkspaceLayout>
  );
};

export default SpaceSkillManage;

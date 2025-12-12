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

const SpaceTaskCenter: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

  // 主要内容区域 ref
  const mainContentRef = useRef<MainContentRef>(null);

  // 创建任务
  const [openCreateTask, setOpenCreateTask] = useState(false);
  const handleCreateTask = () => {
    setOpenCreateTask(true);
  };
  const handleCreateTaskConfirm = () => {
    // 查询任务列表
    mainContentRef.current?.exposeQueryComponentList();
    setOpenCreateTask(false);
  };

  // 点击任务卡片
  const handleClickItem = (info: ComponentInfo) => {
    const { id } = info;
    history.push(`/space/${spaceId}/agent/${id}`);
  };

  // 删除任务
  const handleClickDelete = (info: ComponentInfo) => {
    console.log(info);
  };

  // 详情任务
  const handleClickDetail = (info: ComponentInfo) => {
    console.log(info);
  };

  // 点击任务卡片更多操作
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
      title="任务中心"
      leftSlot={<HeaderLeftSlot />}
      rightSlot={<HeaderRightSlot onCreate={handleCreateTask} />}
      hideScroll={true}
    >
      {/* 主要内容区域 */}
      <MainContent
        ref={mainContentRef}
        onClickItem={handleClickItem}
        onClickMore={handleClickMore}
      />
      {/* 创建任务弹窗 */}
      <CreateSkill
        spaceId={spaceId}
        open={openCreateTask}
        onCancel={() => setOpenCreateTask(false)}
        onConfirm={handleCreateTaskConfirm}
      />
    </WorkspaceLayout>
  );
};

export default SpaceTaskCenter;

import MoveCopyComponent from '@/components/MoveCopyComponent';
import TipsBox from '@/components/TipsBox';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { useFileImport } from '@/hooks/useFileImport';
import { apiDeleteSkill, apiSkillCopyToSpace } from '@/services/library';
import { apiSkillExport, apiSkillImport } from '@/services/skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import {
  SkillCopyToSpaceParams,
  SkillCopyTypeEnum,
  type SkillInfo,
} from '@/types/interfaces/library';
import { modalConfirm } from '@/utils/ant-custom';
import { exportWholeProjectZip } from '@/utils/exportImportFile';
import { message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { history, useParams, useSearchParams } from 'umi';
import CreateSkill from './CreateSkill';
import HeaderLeftSlot from './HeaderLeftSlot';
import HeaderRightSlot from './HeaderRightSlot';
import ImportSkillProjectModal from './ImportSkillProjectModal';
import MainContent, { MainContentRef } from './MainContent';
import { SkillMoreActionEnum } from './type';

const SpaceSkillManage: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const [, setSearchParams] = useSearchParams();

  // 主要内容区域 ref
  const mainContentRef = useRef<MainContentRef>(null);

  // 创建技能模式
  const [createMode, setCreateMode] = useState<CreateUpdateModeEnum>(
    CreateUpdateModeEnum.Create,
  );

  // 创建技能
  const [openCreateSkill, setOpenCreateSkill] = useState(false);
  // 导出项目加载状态
  const [loadingExportProject, setLoadingExportProject] =
    useState<boolean>(false);

  // 导入技能项目弹窗
  const [openImportSkillProject, setOpenImportSkillProject] =
    useState<boolean>(false);

  const handleCreateSkill = () => {
    setCreateMode(CreateUpdateModeEnum.Create);
    setOpenCreateSkill(true);
  };

  // 导入技能
  const { triggerImport: handleImportSkill } = useFileImport({
    importApi: apiSkillImport,
    buildApiParams: (files) => ({
      file: files[0],
      // targetSkillId: 0, // 导入新技能时，targetSkillId 为 0
      targetSpaceId: spaceId,
    }),
    onSuccess: (id: number) => {
      // 跳转到技能详情页
      history.push(`/space/${spaceId}/skill-details/${id}`);
    },
  });

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
    modalConfirm('你确定要删除此技能吗?', info.name, () => {
      apiDeleteSkill(info.id).then(() => {
        // 提示删除成功
        message.success('技能删除成功');
        // 查询技能列表
        mainContentRef.current?.exposeQueryComponentList();
      });
    });
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

  // 导出项目
  const handleExportProject = async (info: SkillInfo) => {
    // 检查项目ID是否有效
    if (!info?.id) {
      message.error('技能ID不存在或无效，无法导出');
      return;
    }

    try {
      setLoadingExportProject(true);
      const result = await apiSkillExport(info.id);
      const filename = `skill-${info.id}.zip`;
      // 导出整个项目压缩包
      exportWholeProjectZip(result, filename);
      setLoadingExportProject(false);
      message.success('导出成功！');
    } catch (error) {
      setLoadingExportProject(false);
      console.error('导出项目失败:', error);
    }
  };

  // 点击技能卡片更多操作
  const handleClickMore = (item: CustomPopoverItem, info: SkillInfo) => {
    const { action } = item as unknown as {
      action: SkillMoreActionEnum;
    };

    switch (action) {
      // 复制到空间
      case SkillMoreActionEnum.Copy_To_Space:
        handleClickCopyToSpace(info);
        break;
      // 导出项目
      case SkillMoreActionEnum.Export_Project:
        handleExportProject(info);
        break;
      // 删除
      case SkillMoreActionEnum.Delete:
        handleClickDelete(info);
        break;
      default:
        break;
    }
  };

  // 监听菜单切换，重新加载数据
  useEffect(() => {
    if (history.location.state) {
      // 清空URL搜索参数（status和keyword）
      const newParams = new URLSearchParams();
      setSearchParams(newParams);
      // 重新加载技能列表
      mainContentRef.current?.exposeQueryComponentList();
    }
  }, [history.location.state]);

  // // 导入技能项目
  // const handleImportSkillProject = () => {
  //   setOpenImportSkillProject(true);
  // };

  // 确认导入技能项目
  const handleImportSkillProjectConfirm = () => {
    setOpenImportSkillProject(false);
  };

  return (
    <WorkspaceLayout
      title="技能管理"
      leftSlot={<HeaderLeftSlot />}
      rightSlot={
        <HeaderRightSlot
          onCreate={handleCreateSkill}
          onImport={handleImportSkill}
        />
      }
      hideScroll={true}
      extraContent={
        <TipsBox
          className="mt-0"
          visible={loadingExportProject}
          text="正在导出"
        />
      }
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

      {/* 导入技能项目弹窗 */}
      <ImportSkillProjectModal
        open={openImportSkillProject}
        onCancel={() => setOpenImportSkillProject(false)}
        onConfirm={handleImportSkillProjectConfirm}
      />
    </WorkspaceLayout>
  );
};

export default SpaceSkillManage;

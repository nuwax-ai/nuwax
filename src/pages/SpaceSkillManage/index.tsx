import MoveCopyComponent from '@/components/MoveCopyComponent';
import TipsBox from '@/components/TipsBox';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiDeleteSkill, apiSkillCopyToSpace } from '@/services/library';
import { apiSkillImport } from '@/services/skill';
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
import { exportFileViaBrowserDownload } from '@/utils/exportImportFile';
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

  // 迁移、复制弹窗
  const [openMove, setOpenMove] = useState<boolean>(false);
  // 当前组件信息
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<SkillInfo | null>(null);

  // 加载中
  const [loadingSkill, setLoadingSkill] = useState<boolean>(false);

  // 导入技能项目弹窗
  const [openImportSkillProject, setOpenImportSkillProject] =
    useState<boolean>(false);

  const handleCreateSkill = () => {
    setCreateMode(CreateUpdateModeEnum.Create);
    setOpenCreateSkill(true);
  };

  // 创建技能确认
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
    modalConfirm(
      dict('PC.Pages.SpaceSkillManage.deleteConfirmText'),
      info.name,
      () => {
        apiDeleteSkill(info.id).then(() => {
          // 提示删除成功
          message.success(dict('PC.Toast.Global.deletedSuccessfully'));
          // 查询技能列表
          mainContentRef.current?.exposeQueryComponentList();
        });
      },
    );
  };

  // 复制到空间
  const handleClickCopyToSpace = (info: SkillInfo) => {
    console.log('复制到空间', info);
    setOpenMove(true);
    setCurrentComponentInfo(info);
  };

  // 确认复制到空间
  const handlerConfirmCopyToSpace = async (targetSpaceId: number) => {
    if (!currentComponentInfo) {
      message.error(dict('PC.Pages.SpaceSkillManage.skillInfoNotFound'));
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
        message.success(
          dict('PC.Pages.SpaceSkillManage.skillCopiedSuccessfully'),
        );
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
      message.warning(
        dict('PC.Pages.SpaceSkillManage.skillIdInvalidForExport'),
      );
      return;
    }

    try {
      setLoadingExportProject(true);
      // 获取技能导出文件链接地址
      const linkUrl = `${process.env.BASE_URL}/api/skill/export/${info.id}`;
      // 通过浏览器下载文件
      exportFileViaBrowserDownload(linkUrl);
      message.success(dict('PC.Pages.SpaceSkillManage.exportSucceeded'));
    } catch (error) {
      console.error(dict('PC.Pages.SpaceSkillManage.exportFailedRetry'), error);
      message.error(dict('PC.Pages.SpaceSkillManage.exportFailedRetry'));
    } finally {
      setLoadingExportProject(false);
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

  // 导入技能项目
  const handleImportSkillProject = () => {
    setOpenImportSkillProject(true);
  };

  // 确认导入技能项目
  const handleImportSkillProjectConfirm = async (file: File) => {
    const {
      code,
      data: id,
      message: errorMessage,
    } = await apiSkillImport({
      file,
      targetSpaceId: spaceId,
    });

    if (code === SUCCESS_CODE) {
      message.success(dict('PC.Pages.SpaceSkillManage.importSucceeded'));
      setOpenImportSkillProject(false);
      // 跳转到技能详情页
      history.push(`/space/${spaceId}/skill-details/${id}`);
    } else {
      message.error(
        errorMessage || dict('PC.Pages.SpaceSkillManage.importFailed'),
      );
    }
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.SpaceSkillManage.pageTitle')}
      leftSlot={<HeaderLeftSlot />}
      rightSlot={
        <HeaderRightSlot
          onCreate={handleCreateSkill}
          onImport={handleImportSkillProject}
        />
      }
      hideScroll={true}
      centerSlot={
        <TipsBox
          className="mt-0"
          visible={loadingExportProject}
          text={dict('PC.Pages.SpaceSkillManage.exporting')}
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

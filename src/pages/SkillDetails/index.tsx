import FileTreeView from '@/components/FileTreeView';
import PublishComponentModal from '@/components/PublishComponentModal';
import TipsBox from '@/components/TipsBox';
import VersionHistory from '@/components/VersionHistory';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import CreateSkill from '@/pages/SpaceSkillManage/CreateSkill';
import ImportSkillProjectModal from '@/pages/SpaceSkillManage/ImportSkillProjectModal';
import { t } from '@/services/i18nRuntime';
import { apiSkillDetail } from '@/services/skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum, PublishStatusEnum } from '@/types/enums/common';
import { SkillInfo } from '@/types/interfaces/library';
import type { SkillDetailInfo } from '@/types/interfaces/skill';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRequest } from 'umi';
import SkillChatSession from './components/SkillChatSession';
import SkillHeader from './components/SkillHeader';
import { useSkillFiles } from './hooks/useSkillFiles';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 技能详情页面 (已重构，核心逻辑已拆分至 useSkillFiles 和 SkillModals)
 */
const SkillDetails: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const skillId = Number(params.skillId);

  // 技能信息
  const [skillInfo, setSkillInfo] = useState<SkillDetailInfo | null>(null);

  // 弹窗状态管理
  const [open, setOpen] = useState<boolean>(false);
  const [editSkillModalOpen, setEditSkillModalOpen] = useState<boolean>(false);
  const [versionHistoryModal, setVersionHistoryModal] =
    useState<boolean>(false);

  // 使用 ref 来解决 setFileTreeDataLoading 的循环依赖以及 ESLint 的 no-use-before-define 报错
  const setFileTreeDataLoadingRef = useRef<(loading: boolean) => void>(
    () => {},
  );

  // 查询技能信息
  const { run: runSkillInfo } = useRequest(apiSkillDetail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: async (result: SkillDetailInfo) => {
      setFileTreeDataLoadingRef.current(false);
      const { files } = result || {};
      if (Array.isArray(files) && files.length > 0) {
        setSkillInfo(() => ({
          ...result,
          files: files.map((item) => ({
            ...item,
            fileId: item.name,
          })),
        }));
      } else {
        setSkillInfo(result);
      }
    },
    onError: () => {
      setFileTreeDataLoadingRef.current(false);
    },
  });

  // 使用自定义 Hook 管理文件交互逻辑
  const {
    fileTreeViewRef,
    fileTreeDataLoading,
    setFileTreeDataLoading,
    isFullscreenPreview,
    setIsFullscreenPreview,
    isImportingProject,
    importProjectTrigger,
    openImportSkillProject,
    setOpenImportSkillProject,
    loadingExportProject,
    handleCheckUnsavedChanges,
    saveUnsavedFiles,
    handleDeleteFile,
    handleCreateFileNode,
    handleConfirmRenameFile,
    handleSaveFiles,
    handleUploadMultipleFiles,
    handleExportProject,
    handleImportProject,
    handleImportSkillProjectConfirm,
    hasUnsavedChanges,
  } = useSkillFiles({
    skillId,
    spaceId,
    skillInfo,
    setSkillInfo,
    runSkillInfo,
  });

  // 更新 ref 以便在 runSkillInfo 中调用
  setFileTreeDataLoadingRef.current = setFileTreeDataLoading;

  // 拦截离开页面
  useNavigationGuard({
    condition: hasUnsavedChanges,
    onConfirm: saveUnsavedFiles,
    title: t('PC.Pages.SkillDetails.unsavedTitle'),
    message: t('PC.Pages.SkillDetails.unsavedLeaveMessage'),
    confirmText: t('PC.Pages.SkillDetails.saveAndLeave'),
    discardText: t('PC.Pages.SkillDetails.leaveWithoutSaving'),
  });

  useEffect(() => {
    if (skillId) {
      setFileTreeDataLoading(true);
      runSkillInfo(skillId);
    }
  }, [skillId]);

  // 确认发布技能回调
  const handleConfirmPublish = () => {
    setOpen(false);
    const time = dayjs().toString();
    const _skillInfo = {
      ...skillInfo,
      publishDate: time,
      modified: time,
      publishStatus: PublishStatusEnum.Published,
    } as SkillDetailInfo;
    setSkillInfo(_skillInfo);
  };

  // 确认编辑技能信息
  const handleEditSkillConfirm = () => {
    setEditSkillModalOpen(false);
    setFileTreeDataLoading(true);
    runSkillInfo(skillId);
  };

  // 发布技能
  const handlePublishSkill = () => {
    if (!handleCheckUnsavedChanges()) {
      return;
    }
    setOpen(true);
  };

  // 编辑技能信息
  const handleEditSkill = () => {
    if (!handleCheckUnsavedChanges(t('PC.Pages.SkillDetails.actionEdit'))) {
      return;
    }
    setEditSkillModalOpen(true);
  };

  return (
    <div className={cx(styles['page-container'])}>
      {/* 技能头部 */}
      <SkillHeader
        spaceId={spaceId}
        skillInfo={skillInfo}
        onEditAgent={handleEditSkill}
        onPublish={handlePublishSkill}
        onToggleHistory={() => setVersionHistoryModal(!versionHistoryModal)}
        onImportProject={handleImportProject}
        onExportProject={handleExportProject}
        isExportingProject={loadingExportProject}
        onFullscreen={() => {
          setIsFullscreenPreview(true);
        }}
      />

      {/* 正在导出项目提示 */}
      <TipsBox
        className={cx(styles['mt-12'])}
        visible={loadingExportProject}
        text={t('PC.Pages.SkillDetails.exporting')}
      />

      <div className={cx(styles['layout-wrapper'])}>
        {/* 左侧：调试聊天会话区域 */}
        <div className={cx(styles['chat-section'])}>
          <SkillChatSession skillInfo={skillInfo} />
        </div>

        {/* 右侧：原有的详情内容区域 */}
        <div className={cx(styles['detail-section'])}>
          <div
            className={cx(
              'flex',
              'h-full',
              'flex-col',
              'overflow-hide',
              'relative',
            )}
          >
            <div className={cx('flex', 'flex-1', 'overflow-y')}>
              {/* 文件树视图 */}
              <FileTreeView
                taskAgentSelectedFileId={'SKILL.md'}
                initViewFileType={'code'}
                isImportProjectTrigger={importProjectTrigger}
                isProjectSkill={true}
                ref={fileTreeViewRef}
                fileTreeDataLoading={fileTreeDataLoading}
                originalFiles={skillInfo?.files || []}
                onUploadFiles={handleUploadMultipleFiles}
                onExportProject={handleExportProject}
                onRenameFile={handleConfirmRenameFile}
                onCreateFileNode={handleCreateFileNode}
                onSaveFiles={handleSaveFiles}
                onDeleteFile={handleDeleteFile}
                onImportProject={handleImportProject}
                isImportingProject={isImportingProject}
                showMoreActions={false}
                isFullscreenPreview={isFullscreenPreview}
                onFullscreenPreview={setIsFullscreenPreview}
                showFullscreenIcon={false}
                isFileTreePinned={true}
                showRefreshButton={false}
                isShowShare={false}
                isShowDownloadButton={false}
                isShowExportPdfButton={false}
              />

              {/*版本历史*/}
              <VersionHistory
                headerClassName={cx(styles['version-history-header'])}
                targetId={skillId}
                targetName={skillInfo?.name}
                targetType={AgentComponentTypeEnum.Skill}
                permissions={skillInfo?.permissions || []}
                visible={versionHistoryModal}
                onClose={() => setVersionHistoryModal(false)}
              />
            </div>

            {/*发布技能弹窗*/}
            <PublishComponentModal
              mode={AgentComponentTypeEnum.Skill}
              targetId={skillId}
              open={open}
              spaceId={spaceId}
              category={skillInfo?.category}
              onCancel={() => setOpen(false)}
              onConfirm={handleConfirmPublish}
            />

            {/* 创建技能弹窗 */}
            <CreateSkill
              spaceId={spaceId}
              open={editSkillModalOpen}
              type={CreateUpdateModeEnum.Update}
              skillInfo={skillInfo ? (skillInfo as SkillInfo) : undefined}
              onCancel={() => setEditSkillModalOpen(false)}
              onConfirm={handleEditSkillConfirm}
            />

            {/* 导入技能项目弹窗 */}
            <ImportSkillProjectModal
              open={openImportSkillProject}
              isCreate={false}
              onCancel={() => setOpenImportSkillProject(false)}
              onConfirm={handleImportSkillProjectConfirm}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillDetails;

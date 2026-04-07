import FileTreeView from '@/components/FileTreeView';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import { dict } from '@/services/i18nRuntime';
import { apiPublishedSkillInfo } from '@/services/plugin';
import { apiPublishTemplateCopy } from '@/services/publish';
import { AgentComponentTypeEnum, AllowCopyEnum } from '@/types/enums/agent';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { PublishTemplateCopyParams } from '@/types/interfaces/publish';
import { exportFileViaBrowserDownload } from '@/utils/exportImportFile';
import { jumpToSkill } from '@/utils/router';
import { Button, message, Space } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
import PluginHeader from '../PluginDetail/PluginHeader';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 技能详情
 */
const SkillDetail: React.FC = ({}) => {
  const params = useParams();
  const skillId = Number(params.skillId);
  // 复制弹窗
  const [openMove, setOpenMove] = useState<boolean>(false);
  // 导出项目加载状态
  const [loadingExportProject, setLoadingExportProject] =
    useState<boolean>(false);

  // 查询技能信息
  const {
    run: runSkillInfo,
    data: skillInfo,
    loading: loadingSkillInfo,
  } = useRequest(apiPublishedSkillInfo, {
    manual: true,
    debounceInterval: 300,
  });

  // 智能体、工作流、技能模板复制
  const { run: runCopyTemplate, loading: loadingCopyTemplate } = useRequest(
    apiPublishTemplateCopy,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (data: number, params: PublishTemplateCopyParams[]) => {
        message.success(
          dict('PC.Pages.Square.SkillDetail.templateCopySuccess'),
        );
        // 关闭弹窗
        setOpenMove(false);
        // 目标空间ID
        const { targetSpaceId } = params[0];
        // 跳转
        jumpToSkill(targetSpaceId, data);
      },
    },
  );

  useEffect(() => {
    if (skillId) {
      runSkillInfo(skillId);
    }
  }, [skillId]);

  // 智能体、工作流、技能模板复制
  const handlerConfirmCopyTemplate = (targetSpaceId: number) => {
    runCopyTemplate({
      targetType: AgentComponentTypeEnum.Skill,
      targetId: skillId,
      targetSpaceId,
    });
  };

  // 导出项目
  const handleExportProject = async () => {
    // 检查项目ID是否有效
    if (!skillId) {
      message.warning(dict('PC.Pages.Square.SkillDetail.skillIdInvalid'));
      return;
    }

    try {
      setLoadingExportProject(true);
      // 获取技能导出文件链接地址
      const linkUrl = `${process.env.BASE_URL}/api/published/skill/export/${skillId}`;
      // 通过浏览器下载文件
      exportFileViaBrowserDownload(linkUrl);
      message.success(dict('PC.Pages.Square.SkillDetail.exportSuccess'));
    } catch (error) {
      // 处理其他异常
      console.error(
        dict('PC.Pages.Square.SkillDetail.exportFailedRetry'),
        error,
      );
      message.error(dict('PC.Pages.Square.SkillDetail.exportFailedRetry'));
    } finally {
      setLoadingExportProject(false);
    }
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      {skillInfo?.id && (
        <PluginHeader
          targetInfo={skillInfo}
          targetType={SquareAgentTypeEnum.Skill}
          extraBeforeCollect={
            skillInfo?.allowCopy === AllowCopyEnum.Yes && (
              <Space>
                <Button
                  type="primary"
                  className={cx(styles['copy-btn'])}
                  onClick={() => setOpenMove(true)}
                >
                  {dict('PC.Pages.Square.SkillDetail.copyTemplate')}
                </Button>
                <Button
                  onClick={handleExportProject}
                  loading={loadingExportProject}
                >
                  {dict('PC.Pages.Square.SkillDetail.downloadExport')}
                </Button>
              </Space>
            )
          }
        />
      )}

      {/* 文件树视图 */}
      <FileTreeView
        // 通用型智能体选中文件ID
        taskAgentSelectedFileId={'SKILL.md'}
        // 加载状态
        fileTreeDataLoading={loadingSkillInfo}
        // 技能文件列表
        originalFiles={skillInfo?.files || []}
        // 是否只读
        readOnly={true}
        // 是否显示更多操作菜单
        showMoreActions={false}
        // 是否显示全屏图标
        showFullscreenIcon={false}
        // 文件树是否固定
        isFileTreePinned={true}
        // 不显示刷新按钮
        showRefreshButton={false}
        // 是否显示导出 PDF 按钮, 默认显示
        isShowExportPdfButton={false}
      />

      {/*智能体迁移弹窗*/}
      <MoveCopyComponent
        spaceId={skillInfo?.spaceId || 0}
        loading={loadingCopyTemplate}
        type={ApplicationMoreActionEnum.Copy_To_Space}
        mode={AgentComponentTypeEnum.Skill}
        open={openMove}
        isTemplate={true}
        title={skillInfo?.name}
        onCancel={() => setOpenMove(false)}
        onConfirm={handlerConfirmCopyTemplate}
      />
    </div>
  );
};

export default SkillDetail;

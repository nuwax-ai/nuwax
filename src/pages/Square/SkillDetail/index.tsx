import ConditionRender from '@/components/ConditionRender';
import FileTreeView from '@/components/FileTreeView';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import { apiPublishedSkillInfo } from '@/services/plugin';
import { apiPublishTemplateCopy } from '@/services/publish';
import { apiSkillExportSquare } from '@/services/skill';
import { AgentComponentTypeEnum, AllowCopyEnum } from '@/types/enums/agent';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { PublishTemplateCopyParams } from '@/types/interfaces/publish';
import { exportWholeProjectZip } from '@/utils/exportImportFile';
import { jumpToSkill } from '@/utils/router';
import { Button, message } from 'antd';
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
        message.success('模板复制成功');
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
      message.warning('技能ID不存在或无效，无法导出');
      return;
    }

    try {
      setLoadingExportProject(true);
      const result = await apiSkillExportSquare(skillId);

      // 判断是否成功
      if (!result.success) {
        // 导出失败，显示错误信息
        const errorMessage = result.error?.message || '导出失败';
        message.warning(errorMessage);
        setLoadingExportProject(false);
        return;
      }

      // 导出成功，处理文件下载
      if (result.data) {
        const filename = `skill-${skillId}.zip`;
        // 导出整个项目压缩包
        exportWholeProjectZip(result, filename);
        message.success('导出成功！');
      }
    } catch (error) {
      // 处理其他异常
      console.error('导出项目失败:', error);
      message.error('导出失败，请重试');
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
            <>
              <ConditionRender
                condition={skillInfo?.allowCopy === AllowCopyEnum.Yes}
              >
                {skillInfo?.allowCopy === AllowCopyEnum.Yes && (
                  <Button
                    type="primary"
                    className={cx(styles['copy-btn'])}
                    onClick={() => setOpenMove(true)}
                  >
                    复制模板
                  </Button>
                )}

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
              </ConditionRender>
              <Button
                onClick={handleExportProject}
                loading={loadingExportProject}
              >
                下载导出
              </Button>
            </>
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
    </div>
  );
};

export default SkillDetail;

import ConditionRender from '@/components/ConditionRender';
import FileTreeView from '@/components/FileTreeView';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import { apiPublishedSkillInfo } from '@/services/plugin';
import { apiPublishTemplateCopy } from '@/services/publish';
import { AgentComponentTypeEnum, AllowCopyEnum } from '@/types/enums/agent';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { PublishTemplateCopyParams } from '@/types/interfaces/publish';
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

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      {skillInfo?.id && (
        <PluginHeader
          targetInfo={skillInfo}
          targetType={SquareAgentTypeEnum.Skill}
          extraBeforeCollect={
            <ConditionRender
              condition={skillInfo?.allowCopy === AllowCopyEnum.Yes}
            >
              <Button
                type="primary"
                className={cx(styles['copy-btn'])}
                onClick={() => setOpenMove(true)}
              >
                复制模板
              </Button>
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
          }
        />
      )}

      {/* 文件树视图 */}
      <FileTreeView
        // 加载状态
        fileTreeDataLoading={loadingSkillInfo}
        // 技能文件列表
        originalFiles={skillInfo?.files || []}
        // 是否只读
        readOnly={true}
        // 是否显示更多操作菜单
        showMoreActions={false}
      />
    </div>
  );
};

export default SkillDetail;

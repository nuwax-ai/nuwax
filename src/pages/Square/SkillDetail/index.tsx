import PaymentSubscriptionModal from '@/components/business-component/ConversationDetails/PaymentSubscriptionModal';
import FileTreeView from '@/components/FileTreeView';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import useAgentSubscription from '@/hooks/useAgentSubscription';
import { apiQueryToolPricing } from '@/pages/SpaceResource/services/resource';
import {
  ToolPricingTargetType,
  type ResourcePricingConfigInfo,
} from '@/pages/SpaceResource/types/resource';
import type { SubscriptionPlanInfo } from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
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
import { history, useParams, useRequest } from 'umi';
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
  // 付费订阅弹窗（对齐会话页 PaymentSubscriptionModal）
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false);
  // 套餐列表来自 apiQueryToolPricing
  const [skillSubscriptionPlans, setSkillSubscriptionPlans] = useState<
    SubscriptionPlanInfo[]
  >([]);

  // 创建订阅订单
  const { createAgentSubscriptionOrder } = useAgentSubscription();

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

  // 查询目标对象定价配置
  const { run: loadSkillPricing, loading: loadingSkillPricing } = useRequest(
    apiQueryToolPricing,
    {
      manual: true,
      loadingDelay: 300,
      onSuccess: (data: ResourcePricingConfigInfo) => {
        setSkillSubscriptionPlans(data?.plans || []);
      },
    },
  );

  useEffect(() => {
    if (skillId) {
      runSkillInfo(skillId);
    }
  }, [skillId]);

  // 技能需付费且未订阅时自动打开订阅套餐弹窗
  useEffect(() => {
    if (!skillInfo) {
      return;
    }
    if (skillInfo.paymentRequired && !skillInfo.subscribed) {
      setOpenPaymentModal(true);

      // 查询技能定价配置
      loadSkillPricing({
        targetType: ToolPricingTargetType.SKILL,
        targetId: String(skillId),
      });
    }
  }, [skillInfo, skillId]);

  // 订阅技能套餐
  const handleSubscribeSkillPlan = (plan: SubscriptionPlanInfo) => {
    if (!plan.id) {
      message.warning(
        dict('PC.Pages.Square.SkillDetail.subscribeNeedsPlanConfigured'),
      );
      return;
    }

    // 创建订阅订单
    createAgentSubscriptionOrder(plan);
  };

  /** 手动打开订阅弹窗并拉取套餐（未订阅时自动打开弹窗同样在 useEffect 中请求定价） */
  const handleOpenSubscribeModal = () => {
    setOpenPaymentModal(true);
    loadSkillPricing({
      targetType: ToolPricingTargetType.SKILL,
      targetId: String(skillId),
    });
  };

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

  /** 返回广场技能列表 */
  const handleBack = () => {
    history.push('/square?cate_type=Skill');
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      {skillInfo?.id && (
        <PluginHeader
          targetInfo={skillInfo}
          targetType={SquareAgentTypeEnum.Skill}
          onBack={handleBack}
          extraBeforeCollect={
            <Space>
              {skillInfo.paymentRequired &&
                (skillInfo.subscribed ? (
                  <Button disabled>
                    {dict('PC.Pages.Square.SkillDetail.subscribed')}
                  </Button>
                ) : (
                  <Button type="primary" onClick={handleOpenSubscribeModal}>
                    {dict('PC.Pages.Square.SkillDetail.subscribeAction')}
                  </Button>
                ))}
              {skillInfo.allowCopy === AllowCopyEnum.Yes && (
                <>
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
                </>
              )}
            </Space>
          }
        />
      )}

      {/* 文件树视图 */}
      <FileTreeView
        // 通用型智能体选中文件ID
        taskAgentSelectedFileId={'SKILL.md'}
        // 加载状态
        fileTreeDataLoading={loadingSkillInfo}
        // 是否为项目技能模式
        isProjectSkill={true}
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
        // 技能不显示分享按钮
        isShowShare={false}
        // 技能不显示下载按钮
        isShowDownloadButton={false}
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

      {/* 付费订阅套餐弹窗 */}
      <PaymentSubscriptionModal
        open={openPaymentModal}
        loading={loadingSkillPricing}
        plans={skillSubscriptionPlans}
        userSubscribed={Boolean(skillInfo?.subscribed)}
        onClose={() => setOpenPaymentModal(false)}
        onSubscribe={handleSubscribeSkillPlan}
      />
    </div>
  );
};

export default SkillDetail;

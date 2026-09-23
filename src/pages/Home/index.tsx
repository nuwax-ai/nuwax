import agentImage from '@/assets/images/agent_image.png';
import type { AgentMode } from '@/components/business-component/AgentIntervention';
import {
  readAgentModeCache,
  writeAgentModeCache,
} from '@/components/business-component/AgentIntervention/hooks/useAgentInterventionLayer';
import ChatInputUnified, {
  type ChatInputUnifiedRef,
} from '@/components/business-component/ChatInputUnified';
import type { MentionItem } from '@/components/ChatInputHome/MentionPopup/types';
import {
  findDefaultAgent,
  findTypeFallbackAgent,
  getAllowedFunctionType,
  getProjectTypeByFunctionType,
  isAgentSelectable,
  isTaskAgentFunctionType,
  showSpaceSelectorForFunctionType,
} from '@/constants/recommendAgentPolicy.constants';
import { getWorkspaceDirPolicy } from '@/constants/workspaceDirPolicy.constants';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import useConversation from '@/hooks/useConversation';
import useHomePinnedProjectHandoff, {
  type PinnedProjectInfo,
} from '@/hooks/useHomePinnedProjectHandoff';
import usePinnedAgentHandoff from '@/hooks/usePinnedAgentHandoff';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import useSelectSkillHandoff, {
  type SelectedSkillInfo,
} from '@/hooks/useSelectSkillHandoff';
import useSummonExpertHandoff, {
  type SummonedExpertInfo,
} from '@/hooks/useSummonExpertHandoff';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { apiDisplayRecommendList } from '@/services/displayRecommend';
import { dict } from '@/services/i18nRuntime';
import { fetchChatboxCategories } from '@/services/square';
import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
} from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import type {
  AgentDetailDto,
  AgentManualComponentInfo,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import { type DisplayRecommendInfo } from '@/types/interfaces/displayRecommend';
import type { SelectedDocInfo } from '@/types/interfaces/repo';
import type { SquareCategoryInfo } from '@/types/interfaces/square';
import {
  buildHomeSendPlan,
  resolvePinnedSandboxSelectable,
} from '@/utils/homeSendPlan';
import { App } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useModel } from 'umi';
import { createProjectAndNavigate } from '../SpaceCreateProject/utils/projectCreateStrategy';
import ChatBoxRecommendNav from './components/ChatBoxRecommendNav';
import HomeCategoryTabs, {
  type HomeCategoryDef,
} from './components/HomeCategoryTabs';
import styles from './index.less';

const cx = classNames.bind(styles);
const EMPTY_MANUAL_COMPONENTS: AgentManualComponentInfo[] = [];

// 推荐位功能类型 → 项目类型 / 任务态 / 空间选择器映射已上移至
// @/constants/recommendAgentPolicy.constants（策略单源，弹窗选择等场景复用）

const Home: React.FC = () => {
  const { message } = App.useApp();
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const { getSpaceId } = useModel('spaceModel');
  const { setContext, contextMap } = useModel('pageHandoffContext');
  const { handleCreateConversation } = useConversation();
  const { consume: consumePinnedProject } = useHomePinnedProjectHandoff();
  const chatInputRef = useRef<ChatInputUnifiedRef>(null);
  const { consume: consumeSummonedExpert } = useSummonExpertHandoff();
  // 广场智能体上框通道（bug 2398）：广场/空间广场卡片点击透传进本页
  const { consume: consumePinnedAgent } = usePinnedAgentHandoff();
  const { consume: consumeSelectedSkill } = useSelectSkillHandoff();
  // 导航键：同路由 push（如侧栏搜索弹窗在 /home 内发起召唤/选择）也会生成新 key，
  // 供下方消费 effect 依赖触发重读（handoff 写入方不重挂 Home）
  const location = useLocation();
  const {
    selectedComponentList,
    selectedComponentDetails,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  const [agentDetail, setAgentDetail] = useState<AgentDetailDto>();
  const [selectedComputerId, setSelectedComputerId] = useState<string>('-1');
  /** 发起会话时选择的工作目录（wiki #17：仅个人电脑时随会话创建记录） */
  const [workspacePath, setWorkspaceDir] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<number>();
  const [selectedSpaceId, setSelectedSpaceId] = useState<number>();
  const [agentMode, setAgentMode] = useState<AgentMode>('yolo');
  const [recommendNavList, setRecommendNavList] = useState<
    DisplayRecommendInfo[]
  >([]);
  // 推荐位/内容分类两接口完成标记:输入框上方异步区块空态判定用(见 aboveInputEmpty)
  const [recommendLoaded, setRecommendLoaded] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  /** 内容分类 pill 数据源:已发布分类接口的 ChatBox 分类(与推荐管理配置同源) */
  const [chatboxCategories, setChatboxCategories] = useState<
    SquareCategoryInfo[]
  >([]);
  const [selectedRecommend, setSelectedRecommend] =
    useState<DisplayRecommendInfo>();
  /** 项目上框（项目列表「+ 新建会话」透传；存在期间约束智能体可选范围并直接建会话绑定项目） */
  const [pinnedProject, setPinnedProject] = useState<PinnedProjectInfo>();
  // 上框命中失败提示去重（同一项目只提示一次）
  const agentMissedPromptedRef = useRef<number>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  // 输入区上方内容分类:用户手动选择(null=未选过,自动取第一个有内容的分类)
  const [userPickedCategory, setUserPickedCategory] = useState<string | null>(
    null,
  );
  // 专家召唤回执（专家页「召唤」经 pageHandoffContext 一次性透传，刷新即失效）
  const [summonedExpert, setSummonedExpert] = useState<SummonedExpertInfo>();
  // 召唤专家图标：受保护地址(/api/f/)需 Bearer fetch 转 blob 展示
  const { displaySrc: summonedExpertIconSrc } = useAuthProtectedImageSrc(
    summonedExpert?.icon,
  );
  // 外部带入技能（广场技能卡「选择」经 pageHandoffContext 一次性透传，
  // 与专家召唤相互独立、互不覆盖）；复用「直接选技能」链路：转为编辑器
  // mention chip 回填，skillIds 由编辑器 selectedMentions 自然派生
  const [selectedSkill, setSelectedSkill] = useState<SelectedSkillInfo>();
  const skillDefaultMentions = useMemo<MentionItem[] | undefined>(() => {
    if (!selectedSkill) return undefined;
    return [
      {
        kind: 'skill',
        targetId: selectedSkill.skillId,
        name: selectedSkill.name,
        icon: selectedSkill.icon,
      },
    ];
  }, [selectedSkill]);

  // 召唤透传消费：读取即清；if 守卫规避 StrictMode 双执行把一次性值洗掉。
  // 依赖 location.key：侧栏搜索弹窗在 /home 内发起召唤时 push 同路由不重挂，
  // 凭新导航键重读透传值（一次性值已清，重复执行为 no-op）
  // 广场智能体上框（bug 2398）与召唤专家是同一「会话智能体槽位」（chip 展示 +
  // 提交时以该智能体创建会话）：payload 结构一致，后到者覆盖（两通道不会同时写入）
  useEffect(() => {
    const payload = consumeSummonedExpert() ?? consumePinnedAgent();
    if (payload) {
      setSummonedExpert(payload);
      // 指定智能体优先于推荐 pill：显式清掉 pill 选中态
      setSelectedRecommend(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // 技能选择透传消费：读取即清；if 守卫同上（与专家透传两份独立 key），依赖同上
  useEffect(() => {
    const payload = consumeSelectedSkill();
    if (payload) {
      setSelectedSkill(payload);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const defaultAgentId = tenantConfigInfo?.defaultAgentId;
  const isUserAppPinned =
    pinnedProject?.projectType === AgentComponentTypeEnum.UserApp;
  // 与推荐位的项目类型限制保持一致：项目上框后不允许通过 @ 绕过类型限制选择专家。
  const isProjectExpertRestricted = !!getAllowedFunctionType(pinnedProject);
  // 全栈项目自动确定智能体后，隐藏其关闭按钮。
  const isProjectAgentLocked = isUserAppPinned && !!selectedRecommend;
  // 常规项目参与者判定（多人参与）：owner === false（后端按当前用户视角回的
  // 布尔）时开放沙箱自选（云端/个人电脑+工作目录）——项目沙箱可能绑定创建者的
  // 个人电脑，参与者不可用；创建者本人/字段未回包走项目沙箱现状
  const pinnedParticipantSandbox = useMemo(
    () => resolvePinnedSandboxSelectable(pinnedProject),
    [pinnedProject],
  );
  // 会话对象优先级：召唤专家 > 推荐pill > 默认智能体；全栈上框命中推荐位前
  // 不回落租户默认智能体（出范围，且其详情会与命中详情并发、晚到覆盖工具
  // 选中——禅道bug2394）；常规项目上框维持默认兜底（发送链依赖它作 agentId）
  const currentAgentId =
    summonedExpert?.agentId ||
    selectedRecommend?.targetId ||
    (isUserAppPinned ? undefined : defaultAgentId);
  const agentTypeLoading =
    !!currentAgentId && agentDetail?.agentId !== currentAgentId;
  const supportsAgentCapabilities =
    !agentTypeLoading && agentDetail?.type !== AgentTypeEnum.ChatBot;

  const handleAgentModeChange = useCallback(
    (mode: AgentMode) => {
      setAgentMode(mode);
      if (currentAgentId) {
        writeAgentModeCache(mode, currentAgentId);
      }
    },
    [currentAgentId],
  );
  const selectedFunctionType = selectedRecommend?.functionType || '';
  const selectedProjectType = useMemo(
    () => getProjectTypeByFunctionType(selectedFunctionType),
    [selectedFunctionType],
  );
  // 全栈应用等不支持个人电脑的类型：电脑选择锁定云端、工作目录栏一并隐藏
  const disablePersonalComputer = selectedProjectType
    ? !getWorkspaceDirPolicy(selectedProjectType).personalComputer
    : false;
  const effectiveTaskAgentActive = selectedRecommend
    ? isTaskAgentFunctionType(selectedFunctionType)
    : false;
  // 上框项目自带空间（会话绑定项目），不再展示空间选择器
  const showSpaceSelector = pinnedProject
    ? false
    : selectedRecommend
    ? showSpaceSelectorForFunctionType(selectedFunctionType)
    : false;

  const runRecommendNavList = useCallback(async () => {
    try {
      const result = await apiDisplayRecommendList({ skipErrorHandler: true });
      if (result?.success === false) {
        setRecommendNavList([]);
        return;
      }

      const list = result?.data?.recChatBoxNav?.Agent || [];
      setRecommendNavList(
        [...list].sort((prev, next) => (prev.sort || 0) - (next.sort || 0)),
      );
    } catch {
      setRecommendNavList([]);
    } finally {
      // 成败均算完成:空态判定(aboveInputEmpty)依赖两接口都已落定
      setRecommendLoaded(true);
    }
  }, []);

  useEffect(() => {
    runRecommendNavList();
  }, [runRecommendNavList]);

  useEffect(() => {
    let cancelled = false;
    fetchChatboxCategories()
      .then((children) => {
        if (!cancelled) {
          setChatboxCategories(children);
          setCategoriesLoaded(true);
        }
      })
      .catch((error) => {
        console.error('fetch chatbox categories failed:', error);
        // 失败也标记完成:空态判定(aboveInputEmpty)不因失败挂起
        if (!cancelled) {
          setCategoriesLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // 切换会话对象（默认/推荐/专家）：重拉智能体详情；
    // 不在此清空输入——清输入只发生在用户显式切 pill/分类时（见对应 handler），
    // 选专家仅替换上方所选智能体，已输入内容与其他已选项保持；
    // cancelled 守卫：快速连续切换（上框命中/召唤/切 pill）时旧响应晚到
    // 不得覆盖新会话对象的详情与工具选中（禅道bug2394 根因之一）
    setAgentDetail(undefined);
    if (!currentAgentId) return;
    let cancelled = false;
    apiPublishedAgentInfo(currentAgentId)
      .then(({ data }) => {
        if (!cancelled) setAgentDetail(data);
      })
      .catch(() => {
        if (!cancelled) setAgentDetail(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [currentAgentId]);

  useEffect(() => {
    if (agentDetail) {
      if (agentDetail.allowChooseMode !== DefaultSelectedEnum.Yes) {
        setAgentMode('yolo');
      } else {
        const cached = readAgentModeCache(currentAgentId);
        setAgentMode(cached || 'yolo');
      }
    }
  }, [agentDetail, currentAgentId]);

  useEffect(() => {
    initSelectedComponentList(agentDetail?.manualComponents);
  }, [agentDetail?.manualComponents]);

  useEffect(() => {
    // 沙箱按 agent 绑定：这里不清空（清空会触发选择器以旧 agentId 任意回落），
    // 切换后的解析（该 agent 的记忆/云端默认）由 ComputerTypeSelector strictAgentMemory 承接
    setSelectedModelId(undefined);
    setSelectedSpaceId(undefined);
  }, [selectedRecommend]);

  // 消费项目上框（pageHandoffContext 一次性；依赖 contextMap 兼容已在 /home 不重挂载的场景）
  useEffect(() => {
    const pinned = consumePinnedProject();
    if (!pinned) return;
    // 同项目重复 pin（项目列表连续点「+」）只刷新上框数据（名称/图标可能
    // 更新），不重置选择态：重置会把会话对象弹回租户默认智能体，其详情与
    // 命中推荐位的详情并发，工具选中被默认工具覆盖（禅道bug2394）
    const isSameProject = pinnedProject?.projectId === pinned.projectId;
    setPinnedProject(pinned);
    if (isSameProject) return;
    agentMissedPromptedRef.current = undefined;
    // 上框项目自带空间/沙箱/工作区，复位与之互斥的选择
    setSummonedExpert(undefined);
    setSelectedRecommend(undefined);
    setUserPickedCategory(null);
    setSelectedComputerId('-1');
    setWorkspaceDir('');
    setSelectedModelId(undefined);
    setSelectedSpaceId(undefined);
  }, [contextMap, consumePinnedProject, pinnedProject?.projectId]);

  // 上框默认命中：全栈优先按项目 devAgentId 精确命中推荐位（列表晚到时同样生效）；
  // devAgentId 契约未 ready 或未命中时，按类型兜底唯一同类型推荐自动选中
  // （等价替用户手点）；0 个/多个同类型无法定位 → toast 提示手动选择
  // （同一项目只提示一次）；常规项目不自动命中智能体，保留用户手选的同类型
  // 智能体；刚消费上框时的旧选中已在上方清掉，未手选时发送由后端兜默认；
  // 推荐列表置灰（isAgentSelectable 的不可用判定）不受影响照常生效
  useEffect(() => {
    // 常规项目上框不自动命中，但必须保留用户手选的常规项目 Agent。
    // 切入上框时的旧推荐项由 consume effect 清理，不能在这里反复清空。
    // 用户随后显式选专家时也不再自动命中项目智能体，否则会叠出两个回执。
    if (!isUserAppPinned || selectedRecommend || summonedExpert) return;
    if (!recommendNavList.length) return; // 推荐列表未就绪不做未命中判定
    const hit =
      findDefaultAgent(recommendNavList, pinnedProject) ??
      findTypeFallbackAgent(recommendNavList, pinnedProject?.projectType);
    if (hit) {
      setSelectedRecommend(hit);
      // 同步切到命中项所在分类（受控 Segmented 直接置 key）。category 为空时
      // pill 归第一个分类且该分类必非空，autoCategoryKey 天然正确无需设置
      // （显式设置反而引入分类数据未到的竞态）
      if (hit.category) {
        setUserPickedCategory(hit.category);
      }
      return;
    }
    if (agentMissedPromptedRef.current !== pinnedProject?.projectId) {
      agentMissedPromptedRef.current = pinnedProject?.projectId;
      message.warning(dict('PC.Pages.Home.pinnedProject.agentMissed'));
    }
  }, [
    isUserAppPinned,
    pinnedProject,
    recommendNavList,
    selectedRecommend,
    summonedExpert,
  ]);

  const handleEnter = async (
    inputMessage: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
    modelId?: number,
    agentMode?: AgentMode,
    selectedDocs?: SelectedDocInfo[],
    expertComponents?: AgentSelectedComponentInfo[],
  ) => {
    if (submitting) return;

    if (!tenantConfigInfo) {
      message.warning(dict('PC.Pages.Home.noTenantInfo'));
      return;
    }
    // 上框期间会话对象未定（全栈未命中且未手选）引导手选，不误报租户信息缺失
    if (!currentAgentId) {
      message.warning(
        dict(
          pinnedProject
            ? 'PC.Pages.Home.pinnedProject.agentMissed'
            : 'PC.Pages.Home.noTenantInfo',
        ),
      );
      return;
    }

    // 专家 chip 合并进组件列表：与外部受控列表按 id+type 去重（对齐会话页规则）
    const mergedInfos = supportsAgentCapabilities
      ? [
          ...selectedComponentList,
          ...(expertComponents || []).filter(
            (expert) =>
              !selectedComponentList.some(
                (selected) =>
                  selected.id === expert.id && selected.type === expert.type,
              ),
          ),
        ]
      : [];

    setSubmitting(true);
    try {
      // 发送计划（决策与参数拼装单源 @/utils/homeSendPlan）：
      // 上框项目 → 直接建会话绑定项目 ＞ 项目类推荐 → 建项目 ＞ 纯会话
      const plan = buildHomeSendPlan({
        currentAgentId,
        pinnedProject,
        pinnedProjectSandboxSelection: pinnedParticipantSandbox,
        selectedFunctionType,
        message: inputMessage,
        files,
        skillIds: supportsAgentCapabilities ? skillIds : [],
        modelId: modelId || selectedModelId,
        agentMode,
        infos: mergedInfos,
        selectedDocs: supportsAgentCapabilities ? selectedDocs : [],
        selectedComputerId,
        workspacePath,
        selectedSpaceId,
        fallbackSpaceId: Number(getSpaceId()),
      });
      if (plan.kind === 'createProject') {
        if (!plan.spaceId) {
          message.warning(dict('PC.Pages.Home.noTenantInfo'));
          return;
        }
        await createProjectAndNavigate({
          payload:
            plan.payload.type === AgentComponentTypeEnum.PageApp
              ? {
                  ...plan.payload,
                  tools: plan.payload.tools?.map((item) => ({
                    ...item,
                    ...selectedComponentDetails.find(
                      (detail) =>
                        detail.id === item.id && detail.type === item.type,
                    ),
                  })),
                }
              : plan.payload,
          spaceId: plan.spaceId,
          tenantConfigInfo,
          setContext,
        });
        return;
      }
      await handleCreateConversation(plan.agentId, plan.attach);
    } finally {
      setSubmitting(false);
    }
  };

  // 内容分类列表(对话任务/项目开发/AI教育等):pill 来自已发布分类接口的
  // ChatBox 分类,推荐按 category(分类 key)归入对应 pill;
  // 存量未配置分类的推荐归入第一个 pill,避免内容丢失。
  // 上框期间不再过滤隐藏(2026-09-11 定调):全部 pill 展示,
  // 非同类型由 ChatBoxRecommendNav 按 isItemSelectable 置灰不可选
  const categoryNavList = useMemo<HomeCategoryDef[]>(() => {
    if (chatboxCategories.length === 0) return [];
    const firstKey = chatboxCategories[0].key;
    return chatboxCategories.map((category) => ({
      key: category.key,
      label: category.label,
      icon: category.icon,
      items: recommendNavList.filter(
        (item) => (item.category || firstKey) === category.key,
      ),
    }));
  }, [chatboxCategories, recommendNavList]);

  // 默认分类 = 第一个有内容的分类(数据到达时 Segmented 才首挂,值直接就位,
  // 避免挂载后回落引发滑块从起始分类滑过来的无意义动画);用户手动点过则优先
  const autoCategoryKey =
    categoryNavList.find((c) => c.items.length > 0)?.key ??
    chatboxCategories[0]?.key ??
    '';
  const activeCategory = userPickedCategory ?? autoCategoryKey;

  const activeCategoryItems =
    categoryNavList.find((c) => c.key === activeCategory)?.items ?? [];

  // 输入框上方异步区块(分类排+推荐 pill 行)终态空判定:两接口都完成且任一
  // 无数据 → 该区域永远不会有内容,收起高度预留避免长期留白;有数据时
  // 预留与真实内容等高,输入框自首帧起钉在最终位置(禅道bug2493)
  const aboveInputEmpty =
    recommendLoaded &&
    categoriesLoaded &&
    (recommendNavList.length === 0 || chatboxCategories.length === 0);

  const handleCategoryChange = (key: string) => {
    // 大类 Tab 仅切换推荐列表；会话框中已选智能体、草稿及其他配置保持不变。
    setUserPickedCategory(key);
  };

  const handleRecommendSelect = (item: DisplayRecommendInfo) => {
    // 推荐 pill = 显式切换会话对象，清掉召唤态（优先级让位）
    setSummonedExpert(undefined);
    // 上框全栈:已选中项再点不取消,避免回落到出范围的租户默认智能体
    const isDeselectBlocked =
      isUserAppPinned && selectedRecommend?.id === item.id;
    setSelectedRecommend((prev) =>
      prev?.id === item.id ? (isUserAppPinned ? prev : undefined) : item,
    );
    if (!isDeselectBlocked) {
      // 显式切换（或非上框取消）：沙箱交由选择器按新智能体绑定解析
      // （strictAgentMemory：其记忆，未绑定回落云端默认；此处不清空避免旧 agentId 回落），
      // 模型/空间复位，输入清空；外部技能 chip 随输入一并清
      setSelectedSkill(undefined);
      setSelectedModelId(undefined);
      setSelectedSpaceId(undefined);
      chatInputRef.current?.clear();
    }
    // 延迟以确保重新渲染后聚焦
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 0);
  };

  // 移除项目上框:恢复首页默认形态(全量推荐/默认门控/电脑复位)
  const handleClearPinnedProject = useCallback(() => {
    setPinnedProject(undefined);
    agentMissedPromptedRef.current = undefined;
    setSelectedRecommend(undefined);
    setUserPickedCategory(null);
    setWorkspaceDir('');
    setSelectedComputerId('-1');
    chatInputRef.current?.clear();
    chatInputRef.current?.focus();
  }, []);

  return (
    <div
      id="home-container"
      className={cx(styles.container, 'flex', 'flex-col', 'items-center')}
    >
      <main className={cx(styles.inputSection)}>
        <div className={cx(styles.titleContainer)}>
          <h2
            className={cx(styles.title)}
            dangerouslySetInnerHTML={{ __html: tenantConfigInfo?.homeSlogan }}
          />
          <p className={cx(styles['hero-subtitle'])}>
            {dict('PC.Pages.Home.heroSubtitle')}
          </p>
        </div>
        {/* 输入框上方异步区块高度预留(禅道bug2493):分类排与推荐 pill 行
            由接口数据晚到才渲染,不预留时输入框先高位出现、数据到位后被
            整体推下 ~118px(上下跳动);槽位自首帧钉住最终高度,数据到位
            恰好填满不再移位;终态确认无内容时收起(见 above-input-slot) */}
        <div
          className={cx(styles['above-input-slot'], {
            [styles['above-input-slot-empty']]: aboveInputEmpty,
          })}
        >
          {/* 推荐数据到达后再渲染分类区:Segmented 首挂时选中值即最终值,
              避免挂载后调整引发滑块从起始分类滑过来的动画 */}
          {recommendNavList.length > 0 && (
            <HomeCategoryTabs
              categories={categoryNavList}
              activeKey={activeCategory}
              onChange={handleCategoryChange}
            />
          )}
          <ChatBoxRecommendNav
            items={activeCategoryItems}
            guidQuestions={
              agentDetail?.agentId === currentAgentId
                ? agentDetail?.guidQuestionDtos
                : []
            }
            onQuestionClick={(text) => chatInputRef.current?.setText(text)}
            selectedId={selectedRecommend?.id}
            onSelect={handleRecommendSelect}
            // 上框期间非同类型智能体置灰不可选（全部展示不过滤）
            isItemSelectable={
              pinnedProject
                ? (item) => isAgentSelectable(item, pinnedProject)
                : undefined
            }
          />
        </div>
        <ChatInputUnified
          ref={chatInputRef}
          className={cx(styles.textarea)}
          onEnter={handleEnter}
          isClearInput={false}
          wholeDisabled={submitting}
          // 首页草稿：固定作用域 key（无会话 id），24h 内回首页恢复未发送输入
          draftKey="home"
          // 首页不展示会话调试悬浮按钮
          showDebugFab={false}
          showGuidQuestions={false}
          // 项目类型受限时，@ 与能力弹窗都不开放专家，资料库等入口保留。
          showExpertCapability={!isProjectExpertRestricted}
          // 首页 @：未受项目限制时显示专家与资料库，受限时只显示资料库。
          atHomePanel
          placeholder={selectedRecommend?.placeholder || undefined}
          manualComponents={
            agentDetail?.manualComponents || EMPTY_MANUAL_COMPONENTS
          }
          selectedComponentList={selectedComponentList}
          onSelectComponent={handleSelectComponent}
          isTaskAgentActive={effectiveTaskAgentActive}
          selectedComputerId={selectedComputerId}
          onComputerSelect={(id) => {
            setSelectedComputerId(id);
            // 切回云电脑时清掉已选工作目录（仅个人电脑生效）
            if (id !== selectedComputerId) setWorkspaceDir('');
          }}
          workspacePath={workspacePath}
          onWorkspaceDirChange={
            // 无目录能力的类型（全栈等）不传回调 → 工作目录栏不渲染
            disablePersonalComputer ? undefined : setWorkspaceDir
          }
          disablePersonalComputer={disablePersonalComputer}
          agentId={agentDetail?.agentId}
          guidQuestionDtos={
            agentDetail && agentDetail.agentId === currentAgentId
              ? agentDetail.guidQuestionDtos
              : []
          }
          agentSandboxId={agentDetail?.sandboxId}
          readonly={!agentDetail?.allowPrivateSandbox}
          // 沙箱按 agent 绑定：切换后由选择器解析该 agent 的记忆（未绑定回落云端默认）
          strictAgentMemory
          /* / 能力弹窗默认由首页开放；ChatBot 或详情加载期间由
             agentType/agentTypeLoading 统一关闭。 */
          allowOtherModel={agentDetail?.allowOtherModel}
          selectedModelId={selectedModelId}
          onModelSelect={setSelectedModelId}
          showSpaceSelector={showSpaceSelector}
          selectedSpaceId={selectedSpaceId}
          onSpaceSelect={setSelectedSpaceId}
          agentType={agentDetail?.type}
          agentTypeLoading={agentTypeLoading}
          selectedTag={
            selectedRecommend
              ? {
                  label: selectedRecommend.label,
                }
              : undefined
          }
          onClearSelectedTag={
            isProjectAgentLocked
              ? undefined
              : () => {
                  setSelectedRecommend(undefined);
                  chatInputRef.current?.clear();
                  chatInputRef.current?.focus();
                }
          }
          pinnedProject={
            pinnedProject
              ? {
                  name: pinnedProject.name,
                  projectType: pinnedProject.projectType,
                  icon: pinnedProject.icon ?? undefined,
                }
              : undefined
          }
          // 参与者上框常规项目：解除电脑选择器/工作目录栏隐藏（沙箱自选）
          pinnedProjectSandboxSelectable={pinnedParticipantSandbox}
          onClearPinnedProject={
            pinnedProject ? handleClearPinnedProject : undefined
          }
          agentMode={agentMode}
          onAgentModeChange={handleAgentModeChange}
          agentEnableVersionControl={agentDetail?.enableVersionControl}
          // 召唤专家 chip：提交时以该专家 agentId 创建会话（优先级高于推荐 pill）
          // 召唤专家 chip（透传契约见 useSummonExpertHandoff）：icon 缺失或
          // 受保护地址解析失败时回退默认智能体图，chip 恒有图标位
          summonedExpert={
            summonedExpert
              ? {
                  agentId: summonedExpert.agentId,
                  name: summonedExpert.name,
                  iconSrc: summonedExpertIconSrc || agentImage,
                }
              : undefined
          }
          onClearSummonedExpert={() => setSummonedExpert(undefined)}
          // 外部带入技能：复用「直接选技能」链路，编辑器回填 mention chip
          defaultMentions={skillDefaultMentions}
          // 能力弹窗选中专家 = 切换会话智能体：仅清上方所选的推荐智能体，
          // 输入内容与电脑/模型/空间等已选项保持；复用召唤链路
          // （chip 展示 + 提交时以专家 agentId 走会话创建）
          onExpertAgentSelect={(expert) => {
            if (isProjectExpertRestricted) return;
            setSelectedRecommend(undefined);
            setSummonedExpert({
              agentId: expert.targetId,
              name: expert.name,
              icon: expert.icon,
            });
          }}
        />
      </main>
      <footer className={cx(styles['foot-tip'])}>
        {dict('PC.Pages.Home.aiGeneratedTip')}
      </footer>
    </div>
  );
};

export default Home;

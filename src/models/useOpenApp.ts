import { MOBILE_BREAKPOINT } from '@/constants/layout.constants';
import { AgentDetailDto } from '@/types/interfaces/agent';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { history, useModel } from 'umi';

/** 跨路由保持窄屏判断，仅在跨越 MOBILE_BREAKPOINT 时改侧边栏，避免误伤桌面手动收起 */
let appSidebarPrevNarrow: boolean | null = null;

const useOpenApp = () => {
  // 是否是应用侧边栏模式
  const [isAppSidebarMode, setIsAppSidebarMode] = useState<boolean>(false);
  // 是否显示应用智能体侧边栏
  const [isAppSidebarVisible, setIsAppSidebarVisible] = useState<boolean>(true);
  // 应用智能体详情
  const [appAgentDetail, setAppAgentDetail] = useState<AgentDetailDto | null>();
  // 应用智能体详情加载状态
  const [appAgentDetailLoading, setAppAgentDetailLoading] =
    useState<boolean>(false);

  // 付费弹窗状态
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false);

  /** 前端维护的已试用次数（按智能体初始化，发送消息后递增，不超过可试用总数） */
  const [localCalledTrialCount, setLocalCalledTrialCount] = useState<number>(0);
  /** 当前智能体可试用总次数，用于递增上限 */
  const trialCountTotalRef = useRef<number>(0);
  /** localCalledTrialCount 所属的智能体 ID，切换智能体时丢弃旧缓存 */
  const localCalledTrialAgentIdRef = useRef<number | null>(null);

  // 状态管理
  const { setIsMobile } = useModel('layout');

  const isAppSidebarModeRef = useRef(isAppSidebarMode);
  isAppSidebarModeRef.current = isAppSidebarMode;

  // 设置为初始化应用侧边栏模式（默认是关闭的）
  useLayoutEffect(() => {
    if (
      location.pathname.startsWith('/app/chat/') ||
      location.pathname.startsWith('/app/')
    ) {
      setIsAppSidebarMode(true);
      appSidebarPrevNarrow = null;
    } else {
      setIsAppSidebarMode(false);
    }
  }, [location.pathname]);

  /**
   * 进入 /app 后按当前视口初始化侧栏；resize 防抖与主 Layout 一致。
   * 写在 model 内避免页面里解构 `setIsAppSidebarVisible` 触发 useModel 类型/生成代码不一致报错。
   */
  const runSidebarViewportSync = useCallback(() => {
    if (!isAppSidebarModeRef.current) return;
    const narrow = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(narrow);
    const prev = appSidebarPrevNarrow;
    if (prev === null) {
      appSidebarPrevNarrow = narrow;
      if (narrow) {
        setIsAppSidebarVisible(false);
      }
      return;
    }
    if (prev !== narrow) {
      appSidebarPrevNarrow = narrow;
      setIsAppSidebarVisible(!narrow);
    }
  }, []);

  useEffect(() => {
    if (!isAppSidebarMode) return;
    runSidebarViewportSync();
  }, [isAppSidebarMode, runSidebarViewportSync]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => runSidebarViewportSync(), 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [runSidebarViewportSync]);

  // 切换侧边栏显示状态
  const toggleAppSidebarVisible = () => {
    setIsAppSidebarVisible(!isAppSidebarVisible);
  };

  /** 窄屏下用于在点主内容或导航项后收起侧栏（不切换，避免与桌面手动收起语义混淆） */
  const closeAppSidebar = useCallback(() => {
    setIsAppSidebarVisible(false);
  }, []);

  /** 智能体切换时从接口初始化已试用次数，同智能体不重复覆盖 */
  const syncCalledTrialCountFromAgent = useCallback((agent: AgentDetailDto) => {
    const trialCount = agent.trialCount ?? 0;
    trialCountTotalRef.current = trialCount;

    // 切换至不同智能体：丢弃本地缓存，直接使用后端数据
    if (localCalledTrialAgentIdRef.current !== agent.agentId) {
      setLocalCalledTrialCount(
        Math.min(agent.calledTrialCount ?? 0, trialCount),
      );
      localCalledTrialAgentIdRef.current = agent.agentId;
      return;
    }

    /**
     * 计算已试用次数, 取最大值(因为从智能体主页跳转过来时，已试用次数可能已经递增了，
     * 但是后端接口返回的数据此时还没更新，因为进入页面立马就会弹窗，所以需要取最大值, 在跳转前就已经递增了)
     */
    setLocalCalledTrialCount((prev) => {
      const _calledTrialCount = Math.max(agent.calledTrialCount ?? 0, prev);

      /**
       * 此处取最小值，因为智能体详情页面、聊天页面都没有做数据清空操作，当进入不同智能体时，之前的数据依旧存在
       * 可能大约此时智能体接口返回的数据，所以需要取最小值，避免已使用数据超过可试用总次数
       * 重要：之所以离开页面没有做清空操作，是因为独立会话不同页面间切换页面时，需要保持数据
       */
      return Math.min(_calledTrialCount, trialCount);
    });
    localCalledTrialAgentIdRef.current = agent.agentId;
  }, []);

  /** 用户发送消息后已试用次数 +1，不超过可试用总次数 */
  const incrementCalledTrialCount = useCallback(() => {
    if (
      appAgentDetail?.agentId !== null &&
      appAgentDetail?.agentId !== undefined
    ) {
      localCalledTrialAgentIdRef.current = appAgentDetail.agentId;
    }
    setLocalCalledTrialCount((prev) => {
      const max = trialCountTotalRef.current;
      if (max <= 0) {
        return prev;
      }
      return Math.min(prev + 1, max);
    });
  }, [appAgentDetail?.agentId]);

  // 设置应用智能体详情
  const handleSetAppAgentDetail = (info: AgentDetailDto) => {
    setAppAgentDetail(info);
    setAppAgentDetailLoading(false);
    syncCalledTrialCountFromAgent(info);
  };

  // 清除已试用次数
  const clearCalledTrialCount = useCallback(() => {
    setLocalCalledTrialCount(0);
    trialCountTotalRef.current = 0;
    localCalledTrialAgentIdRef.current = null;
  }, []);

  // 创建应用智能体新会话
  const createAppNewConversation = (agentId: number) => {
    history.push(`/app/${agentId}`);
  };

  return {
    isAppSidebarMode,
    isAppSidebarVisible,
    toggleAppSidebarVisible,
    closeAppSidebar,
    appAgentDetail,
    handleSetAppAgentDetail,
    createAppNewConversation,
    appAgentDetailLoading,
    setAppAgentDetailLoading,
    openPaymentModal,
    setOpenPaymentModal,

    // 已试用次数
    localCalledTrialCount,
    incrementCalledTrialCount,
    clearCalledTrialCount,
  };
};

export default useOpenApp;

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

  // 设置应用智能体详情
  const handleSetAppAgentDetail = (info: AgentDetailDto) => {
    setAppAgentDetail(info);
  };

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
  };
};

export default useOpenApp;

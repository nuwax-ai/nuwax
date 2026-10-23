import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface CreditInsufficientSnapshot {
  visible: boolean;
  pageBannerClaimed: boolean;
}

interface CreditInsufficientScopeApi {
  snapshot: CreditInsufficientSnapshot;
  retainSession: () => () => void;
  retainPageBanner: () => () => void;
}

const CreditInsufficientContext =
  createContext<CreditInsufficientScopeApi | null>(null);

/**
 * 积分不足提示的页面作用域。
 * 缓存页面会同时挂着多个会话，不能用全局开关，否则别的会话也会冒出提示。
 */
export const CreditInsufficientProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const sessionHits = useRef(0);
  const pageBannerClaims = useRef(0);
  const [snapshot, setSnapshot] = useState<CreditInsufficientSnapshot>({
    visible: false,
    pageBannerClaimed: false,
  });

  const api = useMemo<CreditInsufficientScopeApi>(() => {
    const publish = () => {
      const next = {
        visible: sessionHits.current > 0,
        pageBannerClaimed: pageBannerClaims.current > 0,
      };
      setSnapshot((prev) =>
        prev.visible === next.visible &&
        prev.pageBannerClaimed === next.pageBannerClaimed
          ? prev
          : next,
      );
    };
    return {
      snapshot,
      retainSession: () => {
        sessionHits.current += 1;
        publish();
        return () => {
          sessionHits.current -= 1;
          publish();
        };
      },
      retainPageBanner: () => {
        pageBannerClaims.current += 1;
        publish();
        return () => {
          pageBannerClaims.current -= 1;
          publish();
        };
      },
    };
    // snapshot 只给读取方用，登记方法必须稳定
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ ...api, snapshot }), [api, snapshot]);

  return (
    <CreditInsufficientContext.Provider value={value}>
      {children}
    </CreditInsufficientContext.Provider>
  );
};

/** 已有页面级作用域时直接复用，否则在会话外包一层 */
export const CreditInsufficientScope: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const parent = useContext(CreditInsufficientContext);
  if (parent) {
    return <>{children}</>;
  }
  return <CreditInsufficientProvider>{children}</CreditInsufficientProvider>;
};

export function useCreditInsufficientSnapshot() {
  return (
    useContext(CreditInsufficientContext)?.snapshot ?? {
      visible: false,
      pageBannerClaimed: false,
    }
  );
}

/** 当前会话消息里出现积分扣减失败时登记；卸载或条件消失时撤销 */
export function useReportCreditInsufficient(active: boolean) {
  const retainSession = useContext(CreditInsufficientContext)?.retainSession;
  useLayoutEffect(() => {
    if (!active || !retainSession) {
      return;
    }
    return retainSession();
  }, [active, retainSession]);
}

/** 页面自己渲染顶部条后调用，避免会话区再渲染一条 */
export function useClaimCreditInsufficientPageBanner() {
  const retainPageBanner = useContext(
    CreditInsufficientContext,
  )?.retainPageBanner;
  useLayoutEffect(() => {
    if (!retainPageBanner) {
      return;
    }
    return retainPageBanner();
  }, [retainPageBanner]);
}

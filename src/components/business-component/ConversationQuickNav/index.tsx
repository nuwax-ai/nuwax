import { t } from '@/services/i18nRuntime';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { Tooltip } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { buildQuickNavBlocks, QuickNavBlock } from './blocks';

/**
 * 会话快捷导航（可复用组件）：会话内容区左缘的缩略导航条，一问一答一块。
 *
 * 接入方式（任意会话页面两行接入）：
 *   <ConversationQuickNav scrollContainerRef={滚动容器Ref} messageList={消息列表} />
 *
 * 挂载要求：
 * - 必须放在「覆盖会话区域、position: relative」的祖先容器内（作为水平定位
 *   基准：导航条 left=该容器左缘再左移 NAV_LEFT_INSET，垂直居中点按滚动容器
 *   实际几何动态计算，不含标题区）；
 * - scrollContainerRef 指向消息滚动容器（overflow: auto）；
 * - messageList 为该会话的 MessageInfo[]（消息需含服务端 id、role、文本）；
 * - 导航条 position:fixed 按视口坐标定位（左右多层 overflow 祖先会裁剪负偏移，
 *   fixed 不受影响）；挂载点到视口之间不得出现带 transform/filter 的祖先
 *   （会使 fixed 退化为相对该祖先定位）。
 *
 * 行为：块数 ≥4 且内容可滚动（scrollHeight ≥ 1.5×clientHeight）且容器宽 ≥600px
 * 时才显示；点击平滑定位到对应轮次；鼠标滑过时线条波浪式变长；样式在
 * src/global.less（conversation-quick-nav-* 全局类）。
 */

/** 显示门控：最少块数、内容滚动倍数、容器最小宽度（窄屏/移动隐藏） */
const MIN_BLOCK_COUNT = 4;
const SCROLLABLE_RATIO = 1.5;
const MIN_CONTAINER_WIDTH = 600;
/** scroll-spy 视口判定线：容器顶部往下 35% 处 */
const ACTIVE_THRESHOLD_RATIO = 0.35;

/**
 * 波浪：悬停点线条峰值宽度增量（px）与衰减半径（px）。
 * 用户调参（2026-09-14）：整体缩小一档——常态 12px、峰值 24px、相邻约 16px。
 */
const WAVE_MAX_EXTRA = 12;
const WAVE_SIGMA = 7;
/** 线条基础宽度（与 global.less 中 .conversation-quick-nav-line 的 width 一致） */
const LINE_BASE_WIDTH = 12;
/**
 * 左移量（px）：导航条 fixed 定位，left=定位上下文左缘再左移该值，
 * 进入内容区左缘留白（session-container 外层 main-content-box 的 20px 内边距）
 */
const NAV_LEFT_INSET = 10;

interface ConversationQuickNavProps {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  messageList: MessageInfo[];
}

const ConversationQuickNav: React.FC<ConversationQuickNavProps> = ({
  scrollContainerRef,
  messageList,
}) => {
  const blocks = useMemo(() => buildQuickNavBlocks(messageList), [messageList]);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  /**
   * 垂直居中点（视口坐标，fixed 定位）：
   * 以消息滚动容器（不含顶部标题区）的几何计算，rAF/ResizeObserver 时随动
   */
  const [centerTop, setCenterTop] = useState<number | null>(null);
  /** 左缘（视口坐标）= 定位上下文左缘 - NAV_LEFT_INSET */
  const [navLeft, setNavLeft] = useState<number | null>(null);
  const rafRef = useRef(0);
  const navRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<Array<HTMLButtonElement | null>>([]);
  const peakIndexRef = useRef<number | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  /** 线条纵向中心缓存：波浪内零布局读取，手势进入/导航滚动/块数变化时重建 */
  const centersRef = useRef<Array<number | null> | null>(null);
  /** 锚点 id → 相对内容顶部偏移缓存：与滚动无关，仅内容布局变化时重建 */
  const anchorTopsRef = useRef<Map<string, number> | null>(null);

  const readCenters = useCallback(() => {
    centersRef.current = linesRef.current.map((el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
  }, []);

  const schedulePreview = useCallback((index: number | null) => {
    if (peakIndexRef.current === index) return;
    peakIndexRef.current = index;
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    // 波峰换线时先收起旧卡片，避免旧内容还指向已经缩短的线。
    setPreviewIndex(null);
    if (index !== null) {
      previewTimerRef.current = window.setTimeout(() => {
        previewTimerRef.current = null;
        setPreviewIndex(index);
      }, 400);
    }
  }, []);

  useEffect(
    () => () => {
      if (previewTimerRef.current !== null) {
        window.clearTimeout(previewTimerRef.current);
      }
    },
    [],
  );

  /**
   * 波浪效果：以鼠标纵轴为中心按高斯衰减拉长附近线条。
   * 🔴不能走 requestAnimationFrame 节流：内嵌 webview 可见时也会把 rAF 压到
   * 极低频（实测 <1fps），rAF 驱动的波浪会整体失效；mousemove 事件本身不被
   * 节流，处理器只做缓存读取 + transform 写入（零布局），同步执行即可
   */
  const applyWave = useCallback(
    (clientY: number, hoveredIndex?: number) => {
      if (!centersRef.current) readCenters();
      const centers = centersRef.current;
      if (!centers) return;
      // 命中线条时以该线中心为波峰；空隙中仍跟随鼠标连续移动。
      // Tooltip 会单独接管按钮的 enter，不能只依赖外层容器的 enter 坐标。
      const waveY =
        hoveredIndex === undefined ? clientY : centers[hoveredIndex] ?? clientY;
      let peakIndex = hoveredIndex ?? -1;
      if (peakIndex < 0 || centers[peakIndex] === null) {
        let nearestDistance = Infinity;
        centers.forEach((center, index) => {
          if (center === null) return;
          const distance = Math.abs(center - clientY);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            peakIndex = index;
          }
        });
      }
      schedulePreview(peakIndex < 0 ? null : peakIndex);
      linesRef.current.forEach((el, i) => {
        if (!el) return;
        const center = centers[i];
        const distance = center === null ? Infinity : Math.abs(center - waveY);
        const extra =
          WAVE_MAX_EXTRA *
          Math.exp(-(distance * distance) / (2 * WAVE_SIGMA * WAVE_SIGMA));
        el.style.transform =
          extra <= 0.1
            ? ''
            : `scaleX(${(LINE_BASE_WIDTH + extra) / LINE_BASE_WIDTH})`;
      });
    },
    [readCenters, schedulePreview],
  );

  const resetWave = useCallback(() => {
    schedulePreview(null);
    centersRef.current = null;
    linesRef.current.forEach((el) => {
      if (el) {
        el.style.transform = '';
      }
    });
  }, [schedulePreview]);

  /** 单次测量：门控判定 + 垂直居中点 + 按锚点实测位置判定当前视口所在块 */
  const measure = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollHeight, clientHeight, clientWidth, scrollTop } = container;
    // 垂直居中参考=滚动容器（消息区）自身，标题区等 session 内其它部分不参与；
    // 导航条 fixed 按视口坐标定位，水平锚=定位上下文（offsetParent）左缘再左移
    const sessionEl = container.offsetParent;
    if (sessionEl) {
      const containerRect = container.getBoundingClientRect();
      const top = containerRect.top + clientHeight / 2;
      setCenterTop((prev) => (prev === top ? prev : top));
      const left = sessionEl.getBoundingClientRect().left - NAV_LEFT_INSET;
      setNavLeft((prev) => (prev === left ? prev : left));
    }
    const nextVisible =
      blocks.length >= MIN_BLOCK_COUNT &&
      scrollHeight >= clientHeight * SCROLLABLE_RATIO &&
      clientWidth >= MIN_CONTAINER_WIDTH;
    setVisible((prev) => (prev === nextVisible ? prev : nextVisible));
    if (!nextVisible) {
      setActiveIndex((prev) => (prev === -1 ? prev : -1));
      return;
    }

    // 锚点偏移与滚动无关（相对内容顶部），只在内容布局变化时重建；
    // 滚动帧复用缓存，避免每帧对全量消息 DOM 做 rect 读取造成滚动卡顿
    if (!anchorTopsRef.current) {
      const topById = new Map<string, number>();
      const containerTop = container.getBoundingClientRect().top;
      const collect = (
        selector: string,
        pickIds: (el: Element) => string[],
      ) => {
        container.querySelectorAll(selector).forEach((el) => {
          const top = el.getBoundingClientRect().top - containerTop + scrollTop;
          pickIds(el).forEach((id) => topById.set(id, top));
        });
      };
      collect('[data-server-message-id]', (el) => [
        el.getAttribute('data-server-message-id') || '',
      ]);
      collect('[data-server-message-ids]', (el) =>
        (el.getAttribute('data-server-message-ids') || '').split(/\s+/),
      );
      anchorTopsRef.current = topById;
    }
    const topById = anchorTopsRef.current;

    const threshold = scrollTop + clientHeight * ACTIVE_THRESHOLD_RATIO;
    let nextActive = -1;
    blocks.forEach((block, index) => {
      const top = topById.get(block.anchorId);
      if (top !== undefined && top <= threshold) {
        nextActive = index;
      }
    });
    // 容器已滚到底时强制点亮最后一块：末块可能永远到不了 35% 判定线
    if (scrollHeight - scrollTop - clientHeight <= 2) {
      nextActive = blocks.length - 1;
    }
    setActiveIndex((prev) => (prev === nextActive ? prev : nextActive));
  }, [blocks, scrollContainerRef]);

  const scheduleMeasure = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      measure();
    });
  }, [measure]);

  // 消息列表变化（新会话/流式追加）→ 锚点与线条几何缓存全部失效
  useEffect(() => {
    anchorTopsRef.current = null;
    centersRef.current = null;
  }, [blocks]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // 环境无 ResizeObserver（如部分 jsdom 测试）时退化为仅 scroll 监听
    if (typeof ResizeObserver === 'undefined') {
      container.addEventListener('scroll', scheduleMeasure, { passive: true });
      scheduleMeasure();
      return () => {
        container.removeEventListener('scroll', scheduleMeasure);
      };
    }

    // 内容高度变化（流式追加/Markdown 渲染/历史加载）使锚点偏移缓存失效，
    // 并补观察首个子节点（chat-wrapper），保证 scroll-spy 缓存不漂移
    const observer = new ResizeObserver(() => {
      anchorTopsRef.current = null;
      scheduleMeasure();
    });
    observer.observe(container);
    if (container.firstElementChild) {
      observer.observe(container.firstElementChild);
    }
    // 消息列表异步到达时容器自身盒高不变（空容器→有内容不改变容器盒尺寸），
    // ResizeObserver 不会触发，首屏测量停留在空数据态会导致导航条永不出现；
    // 补 childList 监听兜底，内容到达/替换时重新测量并补观察新的首子节点
    let mutation: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      mutation = new MutationObserver(() => {
        anchorTopsRef.current = null;
        if (container.firstElementChild) {
          observer.observe(container.firstElementChild);
        }
        scheduleMeasure();
      });
      mutation.observe(container, { childList: true, subtree: true });
    }
    container.addEventListener('scroll', scheduleMeasure, { passive: true });

    scheduleMeasure();
    return () => {
      observer.disconnect();
      mutation?.disconnect();
      container.removeEventListener('scroll', scheduleMeasure);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [scrollContainerRef, scheduleMeasure]);

  // fixed 视口坐标随窗口尺寸/整页滚动保持贴合：内容区位移但尺寸不变时
  // （如宿主页重排）ResizeObserver 不触发，须靠窗口级事件兜底
  useEffect(() => {
    const onWinScroll = () => scheduleMeasure();
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('scroll', onWinScroll, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', onWinScroll, { capture: true });
    };
  }, [scheduleMeasure]);

  const jumpToBlock = useCallback(
    (block: QuickNavBlock) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const { anchorId } = block;
      const el =
        container.querySelector(`[data-server-message-id="${anchorId}"]`) ||
        container.querySelector(`[data-server-message-ids~="${anchorId}"]`) ||
        container.querySelector(`[data-message-id="${anchorId}"]`);
      if (!el) return;
      // 只滚动消息容器并钳制范围：scrollIntoView 会连锁滚动所有可滚动祖先，
      // 末块无法居中时会把外层容器一起滚走，导致会话区整体上移、底部露出空白。
      // 目标位置=块顶对齐 scroll-spy 判定线（留 4px 浮点余量），保证点谁亮谁
      const elTop =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop;
      const maxTop = container.scrollHeight - container.clientHeight;
      const targetTop = Math.max(
        0,
        Math.min(
          elTop - container.clientHeight * ACTIVE_THRESHOLD_RATIO + 4,
          maxTop,
        ),
      );
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
    },
    [scrollContainerRef],
  );

  if (!visible || !blocks.length) {
    return null;
  }

  return (
    <div
      ref={navRef}
      className="conversation-quick-nav"
      data-testid="conversation-quick-nav"
      data-dbg={JSON.stringify({
        p: previewIndex,
        t: blocks.map((b) => `${b.anchorId}:${b.title.slice(0, 8)}`),
      })}
      aria-label={t('PC.Components.ConversationQuickNav.tooltip')}
      style={
        centerTop !== null && navLeft !== null
          ? { top: centerTop, left: navLeft }
          : undefined
      }
      onMouseEnter={(e) => {
        readCenters();
        const index = linesRef.current.indexOf(e.target as HTMLButtonElement);
        applyWave(e.clientY, index < 0 ? undefined : index);
      }}
      onMouseMove={(e) => {
        const index = linesRef.current.indexOf(e.target as HTMLButtonElement);
        applyWave(e.clientY, index < 0 ? undefined : index);
      }}
      onMouseLeave={resetWave}
      onScroll={() => {
        // 导航自身内部滚动后线条视口位置变化，中心缓存失效
        centersRef.current = null;
      }}
    >
      {blocks.map((block, index) => (
        <Tooltip
          key={block.key}
          color="white"
          placement="right"
          open={previewIndex === index}
          transitionName=""
          destroyOnHidden
          title={
            <div className="conversation-quick-nav-preview">
              {block.title && (
                <div className="conversation-quick-nav-preview-title">
                  {block.title}
                </div>
              )}
              {block.body && (
                <div className="conversation-quick-nav-preview-body">
                  {block.body}
                </div>
              )}
            </div>
          }
        >
          <button
            type="button"
            ref={(el) => {
              linesRef.current[index] = el;
            }}
            className={`conversation-quick-nav-line${
              index === activeIndex ? ' active' : ''
            }`}
            onMouseEnter={(e) => applyWave(e.clientY, index)}
            onClick={() => jumpToBlock(block)}
            data-testid="conversation-quick-nav-line"
          />
        </Tooltip>
      ))}
    </div>
  );
};

export default ConversationQuickNav;

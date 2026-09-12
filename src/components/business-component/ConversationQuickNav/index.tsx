import { t } from '@/services/i18nRuntime';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { Tooltip } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildQuickNavBlocks,
  QuickNavBlock,
} from './blocks';

/**
 * 会话快捷导航（可复用组件）：会话内容区左缘的缩略导航条，一问一答一块。
 *
 * 接入方式（任意会话页面两行接入）：
 *   <ConversationQuickNav scrollContainerRef={滚动容器Ref} messageList={消息列表} />
 *
 * 挂载要求：
 * - 必须放在「覆盖会话区域、position: relative」的祖先容器内（导航条 absolute
 *   贴该容器左缘，垂直居中点按滚动容器实际几何动态计算，不含标题区）；
 * - scrollContainerRef 指向消息滚动容器（overflow: auto）；
 * - messageList 为该会话的 MessageInfo[]（消息需含服务端 id、role、文本）。
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

/** 波浪：悬停点线条峰值宽度增量（px）与衰减半径（px） */
const WAVE_MAX_EXTRA = 8;
const WAVE_SIGMA = 16;
const LINE_BASE_WIDTH = 20;

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
  /**
   * 相对定位上下文（session-container）的垂直居中点：
   * 以消息滚动容器（不含顶部标题区）的几何计算，rAF/ResizeObserver 时随动
   */
  const [centerTop, setCenterTop] = useState<number | null>(null);
  const rafRef = useRef(0);
  const navRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<Array<HTMLButtonElement | null>>([]);
  const waveRafRef = useRef(0);

  /** 波浪效果：以鼠标纵轴为中心按高斯衰减拉长附近线条（直改 DOM，避开逐帧重渲染） */
  const applyWave = useCallback((clientY: number) => {
    if (waveRafRef.current) return;
    waveRafRef.current = window.requestAnimationFrame(() => {
      waveRafRef.current = 0;
      const els = linesRef.current;
      // 先批量读（一次回流），再批量写
      const centers = els.map((el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      els.forEach((el, i) => {
        if (!el) return;
        const center = centers[i];
        const distance = center === null ? Infinity : Math.abs(center - clientY);
        const extra =
          WAVE_MAX_EXTRA *
          Math.exp(-(distance * distance) / (2 * WAVE_SIGMA * WAVE_SIGMA));
        el.style.width = `${LINE_BASE_WIDTH + extra}px`;
      });
    });
  }, []);

  const resetWave = useCallback(() => {
    if (waveRafRef.current) {
      window.cancelAnimationFrame(waveRafRef.current);
      waveRafRef.current = 0;
    }
    linesRef.current.forEach((el) => {
      if (el) {
        el.style.width = '';
      }
    });
  }, []);

  /** 单次测量：门控判定 + 垂直居中点 + 按锚点实测位置判定当前视口所在块 */
  const measure = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollHeight, clientHeight, clientWidth, scrollTop } = container;
    // 垂直居中参考=滚动容器（消息区）自身，标题区等 session 内其它部分不参与
    const sessionEl = container.offsetParent;
    if (sessionEl) {
      const top =
        container.getBoundingClientRect().top -
        sessionEl.getBoundingClientRect().top +
        clientHeight / 2;
      setCenterTop((prev) => (prev === top ? prev : top));
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

    // 一趟收集所有锚点 id → 相对容器顶部的偏移（只读批量取 rect，一帧一次回流）
    const topById = new Map<string, number>();
    const containerTop = container.getBoundingClientRect().top;
    const collect = (selector: string, pickIds: (el: Element) => string[]) => {
      container.querySelectorAll(selector).forEach((el) => {
        const top =
          el.getBoundingClientRect().top - containerTop + scrollTop;
        pickIds(el).forEach((id) => topById.set(id, top));
      });
    };
    collect('[data-server-message-id]', (el) => [
      el.getAttribute('data-server-message-id') || '',
    ]);
    collect('[data-server-message-ids]', (el) =>
      (el.getAttribute('data-server-message-ids') || '').split(/\s+/),
    );

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

    // 内容高度变化（流式追加/Markdown 渲染/历史加载）不经容器盒尺寸反映，
    // 补观察首个子节点（chat-wrapper）保证 scroll-spy 缓存不漂移
    const observer = new ResizeObserver(() => scheduleMeasure());
    observer.observe(container);
    if (container.firstElementChild) {
      observer.observe(container.firstElementChild);
    }
    container.addEventListener('scroll', scheduleMeasure, { passive: true });

    scheduleMeasure();
    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', scheduleMeasure);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [scrollContainerRef, scheduleMeasure]);

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
      aria-label={t('PC.Components.ConversationQuickNav.tooltip')}
      style={centerTop !== null ? { top: centerTop } : undefined}
      onMouseMove={(e) => applyWave(e.clientY)}
      onMouseLeave={resetWave}
    >
      {blocks.map((block, index) => (
        <Tooltip
          key={block.key}
          color="white"
          placement="right"
          mouseEnterDelay={0.4}
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
            onClick={() => jumpToBlock(block)}
            data-testid="conversation-quick-nav-line"
          />
        </Tooltip>
      ))}
    </div>
  );
};

export default ConversationQuickNav;

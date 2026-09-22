/**
 * 共用拖拽分隔条（从 ResizableSplit 抽出的单源实现）
 * @description 会话详情面板分栏与单栏（style3）侧栏宽度拖拽共用同一分隔条：
 *   1px 隐形基线 + hover 意图满 800ms（JS 定时器加 hover-intent 类）/拖拽时跟随
 *   鼠标的短高亮段 + 「调整宽度」气泡 + 拖拽期全屏遮罩（盖住 iframe，保证
 *   document 级监听可达）。拖拽位置受控（position），坐标系 = 挂载点左缘起的
 *   像素值——挂载点的祖先容器须为 position:relative 且提供完整高度。
 */
import { t } from '@/services/i18nRuntime';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Draggable, { DraggableEvent } from 'react-draggable';
import styles from './index.module.less';

interface Props {
  /** 受控 x 位置（px，挂载容器左缘坐标系）；react-draggable 以 transform 下发 */
  position: number;
  /** 可拖下限（px，同坐标系）；不传则不限制 */
  minX?: number;
  /** 可拖上限（px，同坐标系）；不传则不限制 */
  maxX?: number;
  disabled?: boolean;
  /**
   * 拖拽中统一出口（clientX 视口坐标，父级自行换算容器相对值）：
   * Draggable onDrag 与全局 mousemove（iframe 场景经遮罩仍可达）都汇到这里
   */
  onDragMove?: (clientX: number) => void;
  /** 松手出口（单源 = Draggable onStop） */
  onDragEnd?: (clientX: number) => void;
  /** 拖拽起止状态同步（含拖拽中被卸载的兜底复位） */
  onDraggingChange?: (dragging: boolean) => void;
  /** 分隔线悬停颜色 */
  dividerHoverColor?: string;
  /** 分隔线拖拽时颜色 */
  dividerDraggingColor?: string;
  className?: string;
  /**
   * 可用高度：分隔条在挂载容器内的上下内缩（px），基线/命中区/hover 反馈
   * 都被约束在该纵向范围内；不传 = 全高（默认，兼容既有消费方）。
   * 典型场景：单栏侧栏把可拖范围对齐到菜单区，避开顶栏与底部用户栏
   */
  insetTop?: number;
  insetBottom?: number;
}

/** MouseEvent/TouchEvent 统一取 clientX（触屏取首触点） */
const extractClientX = (e: DraggableEvent): number | undefined => {
  if ('touches' in e) {
    return e.touches[0]?.clientX;
  }
  return (e as MouseEvent).clientX;
};

/**
 * hover 意图延时（ms）：悬停满该时长才显示高亮段/「调整宽度」气泡，鼠标路过
 * 分隔条不再误闪。实现用 JS 定时器满时加 hover-intent 类，而非 CSS
 * transition-delay——后者在淡出被打断重入时会把半透明中间值冻结整个延时
 * 周期再续淡入，表现为「可拖拽」指示态抖动/残影
 */
const HOVER_INTENT_DELAY_MS = 800;

const ResizeDivider: React.FC<Props> = ({
  position,
  minX,
  maxX,
  disabled = false,
  onDragMove,
  onDragEnd,
  onDraggingChange,
  // hover / 拖拽用中性深灰而非主题主色：主色在部分主题下是红色，
  // 落在分隔条上像错误态；这里要的是「可拖动」的中性反馈
  dividerHoverColor = '#8c8c8c',
  dividerDraggingColor = '#595959',
  className,
  insetTop = 0,
  insetBottom = 0,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  // 控制分隔线的延迟淡入
  const [dividerVisible, setDividerVisible] = useState(false);
  // hover 意图：满 HOVER_INTENT_DELAY_MS 才显示 grip/气泡；离开即取消并隐藏。
  // 拖拽不受影响（.dragging 常驻显示），进入后未满延时就按下拖也能立即见反馈
  const [isHoverIntent, setIsHoverIntent] = useState(false);
  const hoverIntentTimerRef = useRef<number | null>(null);
  // React-draggable 解决 findDOMNode 警告的 ref
  const dividerRef = useRef<HTMLDivElement>(null);
  // onDraggingChange 存 ref：卸载兜底时取最新回调，避免闭包过期
  const onDraggingChangeRef = useRef(onDraggingChange);
  onDraggingChangeRef.current = onDraggingChange;
  // 卸载兜底只关心「卸载那一刻是否在拖拽」，存 ref 避免闭包过期
  const isDraggingRef = useRef(false);
  isDraggingRef.current = isDragging;

  const clearHoverIntentTimer = useCallback(() => {
    if (hoverIntentTimerRef.current !== null) {
      window.clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearHoverIntentTimer();
    hoverIntentTimerRef.current = window.setTimeout(() => {
      hoverIntentTimerRef.current = null;
      setIsHoverIntent(true);
    }, HOVER_INTENT_DELAY_MS);
  }, [clearHoverIntentTimer]);

  const handleMouseLeave = useCallback(() => {
    clearHoverIntentTimer();
    setIsHoverIntent(false);
  }, [clearHoverIntentTimer]);

  // 卸载清意图定时器，防泄漏回调
  useEffect(() => clearHoverIntentTimer, [clearHoverIntentTimer]);

  // 延迟显示分隔线，产生淡入效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setDividerVisible(true);
    }, 300); // 延迟 300ms 后显示分隔线

    return () => clearTimeout(timer);
  }, []);

  // 拖拽中被卸载（布局切换/折叠等）：兜底通知父级结束态，防止其停在「拖拽中」
  useEffect(
    () => () => {
      if (isDraggingRef.current) {
        onDraggingChangeRef.current?.(false);
      }
    },
    [],
  );

  const updateDragging = useCallback((next: boolean) => {
    setIsDragging(next);
    onDraggingChangeRef.current?.(next);
  }, []);

  // 短高亮段与气泡共用鼠标 Y：直写分隔线上的 --hint-y 变量，不走 state，
  // 避免悬停/拖拽期间高频重渲；上下各留 24px（高亮段半高 20px + 余量），
  // 防止贴边时被容器 overflow:hidden 裁剪
  const updateHintY = useCallback((clientY: number) => {
    const divider = dividerRef.current;
    if (!divider) return;
    const rect = divider.getBoundingClientRect();
    const y = Math.min(
      Math.max(clientY - rect.top, 24),
      Math.max(rect.height - 24, 24),
    );
    divider.style.setProperty('--hint-y', `${y}px`);
  }, []);

  // 悬停时气泡跟随鼠标
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      updateHintY(e.clientY);
    },
    [updateHintY],
  );

  // 拖拽期全局监听走 effect（而非手工 add/remove）：卸载即清理，
  // 天然覆盖「拖拽中被卸载」的兜底；监听可达的前提是全屏遮罩已盖住 iframe
  useEffect(() => {
    if (!isDragging) return;

    document.body.style.userSelect = 'none';
    const handleGlobalMouseMove = (e: MouseEvent) => {
      updateHintY(e.clientY);
      onDragMove?.(e.clientX);
    };
    const handleGlobalMouseUp = () => {
      updateDragging(false);
    };
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, onDragMove, updateDragging, updateHintY]);

  const handleDragStart = useCallback(() => {
    updateDragging(true);
  }, [updateDragging]);

  const handleDrag = useCallback(
    (e: DraggableEvent) => {
      const clientX = extractClientX(e);
      if (typeof clientX === 'number') {
        onDragMove?.(clientX);
      }
    },
    [onDragMove],
  );

  const handleDragStop = useCallback(
    (e: DraggableEvent) => {
      updateDragging(false);
      const clientX = extractClientX(e);
      if (typeof clientX === 'number') {
        onDragEnd?.(clientX);
      }
    },
    [onDragEnd, updateDragging],
  );

  return (
    <>
      {/* 拖拽时的遮罩层，防止 iframe 干扰（fixed 定位不被挂载点裁剪） */}
      {isDragging && <div className={styles.dragOverlay} />}

      <Draggable
        nodeRef={dividerRef}
        axis="x"
        position={{ x: position, y: 0 }}
        onStart={handleDragStart}
        onDrag={handleDrag}
        onStop={handleDragStop}
        disabled={disabled}
        bounds={
          minX !== undefined || maxX !== undefined
            ? { left: minX, right: maxX }
            : undefined
        }
      >
        <div
          ref={dividerRef}
          className={`${styles.divider} ${disabled ? styles.disabled : ''} ${
            isDragging ? styles.dragging : ''
          } ${isHoverIntent ? styles['hover-intent'] : ''} ${className || ''}`}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={
            {
              '--divider-hover-color': dividerHoverColor,
              '--divider-dragging-color': dividerDraggingColor,
              opacity: dividerVisible ? 1 : 0,
              // 可用高度内缩：内联覆盖 less 基线的 top:0/height:100%；
              // 两值皆 0 时不注入，走基线全高
              ...(insetTop || insetBottom
                ? {
                    top: `${insetTop}px`,
                    height: `calc(100% - ${insetTop + insetBottom}px)`,
                  }
                : {}),
            } as React.CSSProperties
          }
        >
          {/* hover/拖拽时跟随鼠标的短高亮段：分隔条变色反馈的「变短」版 */}
          <span className={styles.resizeGrip} />
          {/* hover 提示气泡：自绘而非 antd Tooltip，避免其 ref 包装层与 Draggable 的 nodeRef 冲突 */}
          <span className={styles.resizeHint}>
            {t('PC.Components.ResizableSplit.resize')}
          </span>
        </div>
      </Draggable>
    </>
  );
};

export default ResizeDivider;

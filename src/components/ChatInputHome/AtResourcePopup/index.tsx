/**
 * AtResourcePopup — @ 资源弹层
 * @description @ 触发的浮动选择弹层（定位/键盘框架沿用旧 MentionPopup
 * 模式：fixed 视口坐标受控 + 高度回报），双模式：
 * - home    首页：专家（ExpertListView·convenient 便捷视图，最近召唤 +
 *           系统广场前 100 条去重合并）+ 资料库（KnowledgeListView·
 *           最近访问），均 variant=list；
 * - session 会话页：上下文文件（打开拉一次 + 客户端过滤，取数语义迁自
 *           旧 MentionPopup）+ 资料库（同 home）。
 * 搜索为 @ 后在聊天输入框继续输入的实时文本（searchText 受控）：
 * 专家/资料库经列表组件 keyword 防抖过滤，文件客户端过滤。
 * 键盘导航经 DOM 卡片代理（data-expert-key / data-knowledge-key /
 * data-at-file-key，↑↓ 逐项 + Enter 触发 click——专家行走 ExpertListView
 * 内聚的付费拦截门；←→ 切 tab），句柄签名对齐 MentionPopupHandle，
 * MentionEditor 的 handleKeyDown 转发零适配。
 * 底部「更多」仅专家/资料库 tab 展示（能力大弹窗无文件维度）。
 */

import ExpertListView from '@/components/business-component/ExpertListView';
import KnowledgeListView from '@/components/business-component/KnowledgeListView';
import { t } from '@/services/i18nRuntime';
import { ExportOutlined, FileTextOutlined } from '@ant-design/icons';
import { Button, Segmented, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { FetchMentionFiles, FileMentionItem } from '../MentionPopup/types';
import styles from './index.less';
import type {
  AtPopupMode,
  AtPopupTab,
  AtResourcePopupHandle,
  AtResourcePopupProps,
} from './types';

const cx = classNames.bind(styles);

/** 键盘导航卡片代理选择器：专家行/资料行（列表组件内聚）+ 文件行（本组件渲染） */
const CARD_SELECTOR =
  '[data-expert-key], [data-knowledge-key], [data-at-file-key]';

/** 键盘聚焦高亮全局类（专家/资料行卡片样式内聚在列表组件无法经 props 传入，经 DOM 类注入） */
const CARD_FOCUS_CLASS = 'at-popup-card-focus';

/** 文件列表截断上限（先过滤再截断，确保大列表后部文件仍可搜索到——沿用旧口径） */
const FILE_LIST_LIMIT = 100;

/** 模式 → tab 组成（顺序即展示顺序与 ←→ 切换顺序） */
const MODE_TABS: Record<AtPopupMode, AtPopupTab[]> = {
  home: ['expert', 'knowledge'],
  session: ['file', 'knowledge'],
};

const TAB_LABEL_KEY: Record<AtPopupTab, string> = {
  expert: 'PC.Components.AtResourcePopup.tabExpert',
  knowledge: 'PC.Components.AtResourcePopup.tabKnowledge',
  file: 'PC.Components.AtResourcePopup.tabFile',
};

/**
 * 上下文文件面板：打开拉一次 + 客户端过滤（取数/竞态语义迁自旧
 * MentionPopup：迟到响应丢弃、加载中不判定）；数据到达即回调
 * onAvailability（空=无上下文文件，宿主据此在最开始收敛 tabs——
 * 不出现「先展示文件 tab 再消失」的闪变）。
 * 面板常驻挂载（rendered 仅控制展示）：tabs 收敛为纯资料库后仍随
 * 弹层开合重拉数据，文件可用性变化（如会话中生成了新文件）实时
 * 校正恢复文件 tab——卸载式挂载会让收敛态死锁，新文件永不出现
 */
const FilePanel: React.FC<{
  visible: boolean;
  searchText: string;
  onFetchMentionFiles?: FetchMentionFiles;
  /** 是否渲染展示（false 时隐藏但仍取数/上报可用性） */
  rendered: boolean;
  onSelect: (item: FileMentionItem) => void;
  onAvailability: (empty: boolean) => void;
}> = ({
  visible,
  searchText,
  onFetchMentionFiles,
  rendered,
  onSelect,
  onAvailability,
}) => {
  const [files, setFiles] = useState<FileMentionItem[]>([]);
  // 初始即加载中：首帧渲染 loading 而非空列表
  const [loading, setLoading] = useState(true);
  // loading 的同步镜像：取数与空判定两个 effect 同 commit 执行，
  // 状态更新对后者不可见，空判定必须读 ref（沿用旧组件的竞态结论）
  const loadingRef = useRef(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible || !onFetchMentionFiles) {
      loadingRef.current = false;
      setLoading(false);
      return;
    }
    let cancelled = false;
    loadingRef.current = true;
    setFiles([]);
    setLoading(true);
    setError(false);
    Promise.resolve()
      .then(onFetchMentionFiles)
      .then((items) => {
        if (!cancelled) setFiles(items);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) {
          loadingRef.current = false;
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [visible, onFetchMentionFiles]);

  // 数据到达即上报可用性（与搜索词无关——空数据=无上下文文件；
  // 加载中/失败不判定，保持当前形态）
  useEffect(() => {
    if (!visible || loadingRef.current || error) return;
    onAvailability(files.length === 0);
  }, [visible, loading, error, files, onAvailability]);

  const items = useMemo(() => {
    const query = searchText.toLowerCase();
    return files
      .filter(
        (file) =>
          file.name.toLowerCase().includes(query) ||
          file.relativePath.toLowerCase().includes(query),
      )
      .slice(0, FILE_LIST_LIMIT);
  }, [files, searchText]);

  // 常驻挂载仅控展示：隐藏时保持取数/可用性上报（见组件头注释）
  if (!rendered) return null;
  return (
    <div className={cx(styles['file-list'])}>
      {(loading || error) && (
        <div className={cx(styles['file-state'])} role="status">
          {loading ? (
            <Spin size="small" />
          ) : (
            t('PC.Components.ChatInputCommands.loadFailed')
          )}
        </div>
      )}
      {!loading &&
        !error &&
        items.map((item) => (
          <div
            key={`file:${item.relativePath}`}
            data-at-file-key={item.relativePath}
            className={cx(styles['file-item'])}
            onClick={() => onSelect(item)}
          >
            <FileTextOutlined className={cx(styles['file-icon'])} />
            <span className={cx(styles['file-name'])}>{item.name}</span>
            <span className={cx(styles['file-path'])} title={item.relativePath}>
              {item.relativePath}
            </span>
          </div>
        ))}
      {!loading && !error && items.length === 0 && (
        <div className={cx(styles['file-state'])}>
          {t('PC.Components.ChatInputHomeMentionPopup.emptyNotFound')}
        </div>
      )}
    </div>
  );
};

const AtResourcePopup = forwardRef<AtResourcePopupHandle, AtResourcePopupProps>(
  (props, ref) => {
    const {
      visible,
      mode,
      position,
      maxHeight,
      searchText = '',
      onFetchMentionFiles,
      onSelectFile,
      onSelectDoc,
      onSelectExpert,
      onMore,
      onHeightChange,
    } = props;

    /**
     * 会话页上下文文件可用性：null=未判定 / false=无记录 / true=有记录。
     * 判定结果跨开合缓存（二次打开立即正确形态，不闪 tab）；每次打开
     * FilePanel 重拉数据实时校正；数据源引用变化（切换会话）时重置重判
     */
    const [fileAvailable, setFileAvailable] = useState<boolean | null>(null);
    useEffect(() => {
      setFileAvailable(null);
    }, [onFetchMentionFiles]);

    const tabs = useMemo(() => {
      // 会话页文件不可用时收敛为纯资料库——无切换必要,不渲染
      // 「上下文文件」tab（Segmented 单项时整体隐藏）
      if (mode === 'session' && fileAvailable === false) {
        return MODE_TABS.session.filter((tab) => tab !== 'file');
      }
      return MODE_TABS[mode];
    }, [mode, fileAvailable]);
    const [activeTab, setActiveTab] = useState<AtPopupTab>(tabs[0]);
    // tabs 收敛/模式变化时回落首项（activeTab 可能已被移除）
    useEffect(() => {
      setActiveTab((current) => (tabs.includes(current) ? current : tabs[0]));
    }, [tabs]);
    // 切换器显隐：单 tab 收敛隐藏；会话页判定期间（null）也隐藏——
    // 避免先展示「文件 tab」拉完为空再消失的闪变，判定完成即定型
    const showTabs =
      tabs.length > 1 && !(mode === 'session' && fileAvailable === null);

    // ---- 键盘导航（DOM 卡片代理，仿 CapabilityModal 内嵌列表方案）----
    const contentRef = useRef<HTMLDivElement>(null);
    // 默认预亮首项（@ 补全弹层惯例：打开即可 Enter 直选首项）
    const [focusIndex, setFocusIndex] = useState(0);
    // 仅键盘导航时滚动跟随（鼠标 hover 同步聚焦但不拽滚动条）
    const keyboardNavRef = useRef(false);

    const getCards = useCallback(
      () =>
        Array.from(
          contentRef.current?.querySelectorAll<HTMLElement>(CARD_SELECTOR) ??
            [],
        ),
      [],
    );

    // tab/搜索/可见性变化时复位聚焦（回到首项预亮）
    useEffect(() => {
      setFocusIndex(0);
    }, [activeTab, searchText, visible]);

    // 卡片数量变化时收敛聚焦序号防越界（effects 后于 DOM 提交执行）
    useEffect(() => {
      const count = getCards().length;
      setFocusIndex((index) => Math.min(index, Math.max(0, count - 1)));
    });

    // 聚焦高亮注入：列表数据/翻页后到时 focusIndex 未变化、普通 effect 不会
    // 重跑，经 MutationObserver 在内容 DOM 变化后重注入（纯 DOM 类操作，
    // 不触发 React 更新；列表组件重渲染整体重写 className，残留自动失效）
    const applyFocusClass = useCallback(() => {
      const root = contentRef.current;
      if (!root) return;
      root
        .querySelectorAll(`.${CARD_FOCUS_CLASS}`)
        .forEach((el) => el.classList.remove(CARD_FOCUS_CLASS));
      if (focusIndex >= 0) {
        getCards()[focusIndex]?.classList.add(CARD_FOCUS_CLASS);
      }
    }, [focusIndex, getCards]);

    useEffect(() => {
      const el = contentRef.current;
      if (!visible || !el) return;
      applyFocusClass();
      const observer = new MutationObserver(applyFocusClass);
      observer.observe(el, { childList: true, subtree: true });
      return () => observer.disconnect();
    }, [visible, applyFocusClass]);

    // 键盘导航滚动跟随
    useEffect(() => {
      if (!keyboardNavRef.current) {
        return;
      }
      keyboardNavRef.current = false;
      getCards()[focusIndex]?.scrollIntoView?.({ block: 'nearest' });
    }, [focusIndex, getCards]);

    // 鼠标 hover 同步聚焦（事件委托，内嵌列表组件无需逐行注入回调）
    const handleContentMouseMove = (e: React.MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const el = target?.closest(CARD_SELECTOR);
      if (!el) {
        return;
      }
      const index = getCards().indexOf(el as HTMLElement);
      if (index >= 0 && index !== focusIndex) {
        setFocusIndex(index);
      }
    };

    const switchTab = useCallback(
      (offset: 1 | -1) => {
        setActiveTab((current) => {
          const index = tabs.indexOf(current);
          return tabs[(index + offset + tabs.length) % tabs.length];
        });
      },
      [tabs],
    );

    useImperativeHandle(ref, () => ({
      handleArrowUp: () => {
        keyboardNavRef.current = true;
        setFocusIndex((index) => Math.max(0, index - 1));
      },
      handleArrowDown: () => {
        keyboardNavRef.current = true;
        const last = Math.max(0, getCards().length - 1);
        setFocusIndex((index) => Math.min(index + 1, last));
      },
      handleArrowLeft: () => switchTab(-1),
      handleArrowRight: () => switchTab(1),
      // 以聚焦高亮类寻址（等价 click：专家行走内聚付费拦截门，文件/资料行直选）
      handleSelectCurrentItem: () => {
        (
          contentRef.current?.querySelector(
            `.${CARD_FOCUS_CLASS}`,
          ) as HTMLElement | null
        )?.click();
      },
      resetSelectedIndex: () => setFocusIndex(0),
    }));

    // ---- 高度回报（向上展开时外部按高度贴光标重定位）----
    const rootRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const el = rootRef.current;
      if (!visible || !el || !onHeightChange) return;
      const report = () => onHeightChange(el.offsetHeight);
      report();
      const observer = new ResizeObserver(report);
      observer.observe(el);
      return () => observer.disconnect();
    }, [visible, onHeightChange]);

    // 文件面板数据到达回调：上报可用性（空 → tabs 收敛为纯资料库,由
    // tabs 兜底 effect 自动回落;非空 → 确认两 tab 形态;稳定引用防反复）
    const handleFileAvailability = useCallback((empty: boolean) => {
      setFileAvailable(!empty);
    }, []);

    if (!visible) return null;
    return (
      <div
        ref={rootRef}
        data-at-popup
        className={cx(styles.popup)}
        style={{
          position: 'fixed',
          left: position.left,
          ...(position.bottom !== undefined
            ? { bottom: position.bottom }
            : { top: position.top }),
          maxHeight,
        }}
        // 阻止弹层内 mousedown 默认行为：焦点保持在编辑器，
        // @ 后继续输入的实时搜索链路（searchText）不被打断
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* 分段 tab（单 tab 收敛或会话页判定期间隐藏——打开即判定文件
            可用性,避免「先展示文件 tab 拉完为空再消失」的闪变） */}
        {showTabs && (
          <div className={cx(styles.tabs)}>
            <Segmented
              block
              size="large"
              value={activeTab}
              onChange={(value) => setActiveTab(value as AtPopupTab)}
              options={tabs.map((tab) => ({
                label: t(TAB_LABEL_KEY[tab]),
                value: tab,
              }))}
            />
          </div>
        )}
        <div
          ref={contentRef}
          className={cx(
            styles.content,
            // 无切换器（单 tab 收敛/判定期间）时顶部补留白，列表不贴弹层上缘
            !showTabs && styles['content-no-tabs'],
          )}
          onMouseMove={handleContentMouseMove}
        >
          {activeTab === 'expert' && (
            <ExpertListView
              type="convenient"
              variant="list"
              keyword={searchText}
              onSelect={onSelectExpert}
              className={cx(styles['embed-list'])}
            />
          )}
          {activeTab === 'knowledge' && (
            <KnowledgeListView
              type="recent"
              variant="list"
              keyword={searchText}
              onSelect={onSelectDoc}
              className={cx(styles['embed-list'])}
            />
          )}
          {/* 文件面板常驻挂载：取数/可用性上报不随 tab 收敛停止
              （会话中生成新文件后重开弹层可实时恢复文件 tab），
              仅展示跟随 activeTab；home 模式无文件源不参与 */}
          {mode === 'session' && (
            <FilePanel
              visible={visible}
              rendered={activeTab === 'file'}
              searchText={searchText}
              onFetchMentionFiles={onFetchMentionFiles}
              onSelect={onSelectFile}
              onAvailability={handleFileAvailability}
            />
          )}
        </div>
        {/* 更多入口：仅专家/资料库 tab（能力大弹窗无文件维度），
            定位对应维度打开（专家仅首页开放范围）；block 按钮宽度由
            wrap 的 content 区约束（100%+水平 margin 会溢出弹层） */}
        {activeTab !== 'file' && (
          <div className={cx(styles['more-wrap'])}>
            <Button
              block
              className={cx(styles.more)}
              onClick={() => onMore(activeTab)}
            >
              <ExportOutlined className={cx(styles['more-icon'])} />
              {t('PC.Components.AtResourcePopup.more')}
            </Button>
          </div>
        )}
      </div>
    );
  },
);

export default AtResourcePopup;
export type {
  AtPopupMode,
  AtPopupTab,
  AtResourcePopupHandle,
  AtResourcePopupProps,
} from './types';

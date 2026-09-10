import React, { useEffect, useMemo, useRef, useState } from 'react';
import PopupList from './PopupList';
import type {
  FileMentionItem,
  MentionPopupHandle,
  MentionPopupProps,
} from './types';

/** 每次打开获取当前会话文件；输入搜索仅本地过滤，不重复请求。 */
const MentionPopup = React.forwardRef<MentionPopupHandle, MentionPopupProps>(
  (props, ref) => {
    const { visible, onFetchMentionFiles, searchText = '' } = props;
    const [files, setFiles] = useState<FileMentionItem[]>([]);
    // 初始即加载中：首次打开的渲染周期里展示 loading 而非空列表
    const [loading, setLoading] = useState(true);
    /**
     * loading 的同步镜像：打开弹层的那个渲染周期里，取数 effect 与自动收起
     * effect 同 commit 执行，状态更新对后者不可见——自动收起必须读 ref 才能拿到
     * 同步置位的「加载中」，否则弹层刚打开就被空列表逻辑收起（首次 @ 无效、
     * 第二次起因取数已完成才正常的根因）
     */
    const loadingRef = useRef(true);
    const [error, setError] = useState(false);
    useEffect(() => {
      if (!visible || !onFetchMentionFiles) {
        // 无数据源防御：避免停留在永久的加载态
        loadingRef.current = false;
        setLoading(false);
        return;
      }
      let cancelled = false;
      // 同步置位，同 commit 内的自动收起 effect 可见
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
    // 没有可提及的文件时不弹：打开且无搜索词时列表加载完为空，直接收起
    // （搜索态无结果保留空态提示，不打断用户输入；加载中判定读 loadingRef）
    useEffect(() => {
      if (!visible || loadingRef.current || error || searchText) return;
      if (files.length === 0) {
        props.onClose();
      }
    }, [visible, loading, error, searchText, files, props]);
    const items = useMemo(() => {
      const query = searchText.toLowerCase();
      // 先过滤再截断，确保大列表中的后部文件仍可搜索到。
      return files
        .filter(
          (file) =>
            file.name.toLowerCase().includes(query) ||
            file.relativePath.toLowerCase().includes(query),
        )
        .slice(0, 100);
    }, [files, searchText]);
    return (
      <PopupList
        {...props}
        ref={ref}
        items={items}
        loading={loading}
        error={error}
        onSelect={(item) => {
          if (item.kind === 'file') props.onSelect(item);
        }}
      />
    );
  },
);
export default MentionPopup;

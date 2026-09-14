/**
 * AtResourcePopup 类型定义：@ 资源弹层
 * @description 首页 @ = 专家(便捷视图) + 资料库(最近访问)；会话页 @ =
 * 上下文文件 + 资料库。专家/资料库列表内聚复用 ExpertListView /
 * KnowledgeListView（variant=list，数据/付费拦截/滚动分页自理），
 * 文件面板取数过滤迁自旧 MentionPopup；键盘导航经 DOM 卡片代理。
 */

import type { ExpertListItem } from '@/components/business-component/ExpertListView';
import type { KnowledgeListItem } from '@/components/business-component/KnowledgeListView';
import type { FetchMentionFiles, FileMentionItem } from '../MentionPopup/types';

/** 弹层模式：home=首页（专家+资料库）/ session=会话页（上下文文件+资料库） */
export type AtPopupMode = 'home' | 'session';

/** tab 标识：expert 专家 / knowledge 资料库 / file 上下文文件 */
export type AtPopupTab = 'expert' | 'knowledge' | 'file';

export interface AtResourcePopupProps {
  /** 是否可见 */
  visible: boolean;
  /** 弹层模式（决定 tab 组成与默认 tab） */
  mode: AtPopupMode;
  /** 弹层位置（视口坐标，由编辑器光标定位计算受控传入） */
  position: {
    /** 向下展开时使用 top 定位 */
    top?: number;
    left: number;
    /** 向上展开时使用 bottom 定位 */
    bottom?: number;
  };
  /** @ 后实时输入的搜索文本（受控；专家/资料库经列表组件内防抖，文件客户端过滤） */
  searchText?: string;
  /** 会话页上下文文件数据源（mode=session 必传） */
  onFetchMentionFiles?: FetchMentionFiles;
  /** 弹层最大高度（由外部按视口可用空间传入） */
  maxHeight?: number;
  /** 文件选中（编辑器删触发串后插 file chip） */
  onSelectFile: (item: FileMentionItem) => void;
  /** 资料选中（编辑器删触发串后插 doc chip） */
  onSelectDoc: (item: KnowledgeListItem) => void;
  /** 专家选中（首页切换会话智能体，不插 chip；付费拦截内聚在 ExpertListView） */
  onSelectExpert: (item: ExpertListItem) => void;
  /** 「更多」入口（仅专家/资料库 tab 展示）：打开能力大弹窗定位对应维度 */
  onMore: (tab: AtPopupTab) => void;
  /** 关闭回调（Esc / 空数据场景由编辑器侧触发） */
  onClose: () => void;
  /** 弹层内容高度变化回调（外部重新定位，向上展开时底边贴光标） */
  onHeightChange?: (height: number) => void;
}

/**
 * 键盘导航句柄：签名对齐 MentionPopupHandle——MentionEditor 的
 * handleKeyDown 弹层分支按此转发（↑↓ 逐项 / Enter 选中 / ←→ 切 tab）
 */
export interface AtResourcePopupHandle {
  /** 触发当前聚焦项的主操作（等价 click：专家行走内聚付费拦截门） */
  handleSelectCurrentItem: () => void;
  /** 上移聚焦项，到首项时停止 */
  handleArrowUp: () => void;
  /** 下移聚焦项（-1 未聚焦起步进首项） */
  handleArrowDown: () => void;
  /** 切换到上一个 tab（循环） */
  handleArrowLeft: () => void;
  /** 切换到下一个 tab（循环） */
  handleArrowRight: () => void;
  /** 复位聚焦（-1 未聚焦，不预亮首卡） */
  resetSelectedIndex: () => void;
}

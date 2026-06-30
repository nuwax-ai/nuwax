import type { CustomFormModalProps } from '@/types/interfaces/common';
import React from 'react';

/** 带提交防重的表单弹窗 Props（基于 CustomFormModal 扩展） */
export interface GuardedFormModalProps extends CustomFormModalProps {
  /** 底部额外按钮（显示在取消/确定左侧，如「跳过」） */
  footerExtra?: React.ReactNode;
}

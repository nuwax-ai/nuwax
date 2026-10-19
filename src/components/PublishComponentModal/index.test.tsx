import { SUCCESS_CODE } from '@/constants/codes.constants';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * NW-028 回归：发布链路「先 build（打包部署）再 publish/apply（提交发布申请）」。
 * 前置钩子（onBeforePublishFn）返回 false 或抛错时，必须阻断 publish/apply 提交。
 */

// vitest 禁止直接 import umi 模块，mock 最小面。
// useModel 返回值必须是稳定引用：组件的分类列表 effect 依赖这些数组，
// 每次渲染新建会触发 setState 无限循环。
vi.mock('umi', () => {
  const squareModel = {
    agentInfoList: [],
    pageAppInfoList: [],
    pluginInfoList: [],
    workflowInfoList: [],
    skillInfoList: [],
  };
  return {
    useModel: () => squareModel,
    // 最小 useRequest：run 即调 service，支持 formatResult/onSuccess；业务失败吞错避免未处理拒绝
    useRequest: (service: (...args: any[]) => any, options: any = {}) => ({
      run: (...args: any[]) => {
        Promise.resolve()
          .then(() => service(...args))
          .then((result: any) =>
            options.formatResult ? options.formatResult(result) : result,
          )
          .then((data: any) => options.onSuccess?.(data, args))
          .catch(() => {
            options.onError?.();
          });
      },
      loading: false,
      data: undefined,
    }),
  };
});

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('@/services/publish', () => ({
  apiPublishApply: vi.fn(() =>
    Promise.resolve({ code: SUCCESS_CODE, data: 'ok', message: '' }),
  ),
  apiPublishItemList: vi.fn(() =>
    Promise.resolve({ code: SUCCESS_CODE, data: [], message: '' }),
  ),
}));

vi.mock('@/services/workspace', () => ({
  apiSpaceList: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/hooks/useCategory', () => ({
  default: () => ({ runQueryCategory: vi.fn() }),
}));

// 弹窗外壳换成透传：按钮直接触发 onConfirm（内部走 form.submit → onFinish）
vi.mock('@/components/CustomFormModal', () => ({
  default: ({
    children,
    onConfirm,
  }: {
    children: React.ReactNode;
    onConfirm: () => void;
  }) => (
    <div>
      {children}
      <button type="button" onClick={onConfirm}>
        confirm
      </button>
    </div>
  ),
}));

vi.mock('@/components/LabelIcon', () => ({
  default: () => <span />,
}));

vi.mock('@/components/custom/SelectList', () => ({
  default: () => <div />,
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

import { AgentComponentTypeEnum } from '@/types/enums/agent';
import PublishComponentModal from '@/components/PublishComponentModal';
import { apiPublishApply } from '@/services/publish';

const baseProps = {
  mode: AgentComponentTypeEnum.Agent,
  spaceId: 1,
  targetId: 2,
  open: true,
  onCancel: () => {},
  onConfirm: vi.fn(),
};

const submitForm = async () => {
  const button = screen.getByRole('button', { name: 'confirm' });
  await act(async () => {
    fireEvent.click(button);
  });
};

describe('PublishComponentModal 发布前置钩子阻断（NW-028）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('前置钩子返回 false（构建失败）时不提交发布申请', async () => {
    const onBeforePublishFn = vi.fn().mockResolvedValue(false);
    render(
      <PublishComponentModal {...baseProps} onBeforePublishFn={onBeforePublishFn} />,
    );

    await submitForm();
    // 留出异步链时间，确认 publish/apply 始终未被调用
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(onBeforePublishFn).toHaveBeenCalledTimes(1);
    expect(apiPublishApply).not.toHaveBeenCalled();
    expect(baseProps.onConfirm).not.toHaveBeenCalled();
  });

  it('前置钩子抛错（构建网络异常）时不提交发布申请', async () => {
    const onBeforePublishFn = vi.fn().mockRejectedValue(new Error('network'));
    render(
      <PublishComponentModal {...baseProps} onBeforePublishFn={onBeforePublishFn} />,
    );

    await submitForm();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(apiPublishApply).not.toHaveBeenCalled();
    expect(baseProps.onConfirm).not.toHaveBeenCalled();
  });

  it('前置钩子成功时发布申请正常提交（既有链路不回归）', async () => {
    const onBeforePublishFn = vi.fn().mockResolvedValue(true);
    render(
      <PublishComponentModal {...baseProps} onBeforePublishFn={onBeforePublishFn} />,
    );

    await submitForm();
    await waitFor(() => {
      expect(apiPublishApply).toHaveBeenCalledTimes(1);
    });
    expect(apiPublishApply).toHaveBeenCalledWith(
      expect.objectContaining({ targetId: 2, items: [] }),
    );
  });
});

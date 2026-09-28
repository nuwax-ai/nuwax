import RecommendAddModal from '@/pages/SystemManagement/RecommendManage/components/RecommendAddModal';
import { apiSystemSaveDisplayRecommend } from '@/pages/SystemManagement/RecommendManage/services/recomment';
import { DisplayRecTypeEnum } from '@/pages/SystemManagement/RecommendManage/types';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const fetchApi = vi.hoisted(() => vi.fn());
vi.mock(
  '@/pages/SystemManagement/RecommendManage/utils/publishedTargetSource',
  () => ({
    PUBLISHED_TARGET_SOURCE_MAP: {
      Agent: { fetchApi, buildParams: () => ({}) },
    },
  }),
);
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils', () => ({ getTime: () => '' }));
vi.mock('@/utils/workflow', () => ({ getImg: () => '' }));
vi.mock('@/components/custom/EllipsisTooltip', () => ({
  EllipsisTooltip: ({ text }: any) => <span>{text}</span>,
}));
vi.mock('@/components/custom/Loading', () => ({
  default: () => <span>加载中</span>,
}));
vi.mock('@/pages/SystemManagement/RecommendManage/services/recomment', () => ({
  apiSystemSaveDisplayRecommend: vi.fn(),
}));
vi.mock(
  '@/pages/SystemManagement/RecommendManage/components/RecommendAddModal/index.less',
  () => ({ default: {} }),
);

const item = {
  targetId: 71,
  name: '已推荐的智能体',
  description: '',
  icon: '/agent.png',
  publishUser: { avatar: '/avatar.png' },
};
const addLabel = 'PC.Components.Created.add';
const callbacks = { onCancel: vi.fn(), onSuccess: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  fetchApi.mockResolvedValue({
    code: '0000',
    data: { records: [item], pages: 1 },
  });
  vi.mocked(apiSystemSaveDisplayRecommend).mockResolvedValue({
    code: '0000',
  } as any);
});
afterEach(cleanup);

it('同一目标成功后仍可再次添加，排序按本次弹窗递增', async () => {
  const { rerender } = render(
    <RecommendAddModal
      open
      recType={DisplayRecTypeEnum.Home}
      defaultSort={10}
      {...callbacks}
    />,
  );
  fireEvent.click(await screen.findByRole('button', { name: addLabel }));
  await waitFor(() => expect(callbacks.onSuccess).toHaveBeenCalledTimes(1));
  rerender(
    <RecommendAddModal
      open
      recType={DisplayRecTypeEnum.Home}
      defaultSort={11}
      {...callbacks}
    />,
  );
  const button = screen.getByRole('button', { name: addLabel });
  expect(button).toBeEnabled();
  fireEvent.click(button);
  await waitFor(() => expect(callbacks.onSuccess).toHaveBeenCalledTimes(2));
  expect(
    vi.mocked(apiSystemSaveDisplayRecommend).mock.calls.map(([data]) => ({
      targetId: data.targetId,
      sort: data.sort,
    })),
  ).toEqual([
    { targetId: 71, sort: 10 },
    { targetId: 71, sort: 11 },
  ]);
  expect(screen.queryByText('PC.Components.Created.added')).toBeNull();
});

it('保存进行中阻止连点，完成后重新允许添加', async () => {
  let resolveSave!: (value: any) => void;
  vi.mocked(apiSystemSaveDisplayRecommend).mockReturnValueOnce(
    new Promise((resolve) => {
      resolveSave = resolve;
    }),
  );
  render(
    <RecommendAddModal
      open
      recType={DisplayRecTypeEnum.Home}
      defaultSort={10}
      {...callbacks}
    />,
  );
  const button = await screen.findByRole('button', { name: addLabel });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(apiSystemSaveDisplayRecommend).toHaveBeenCalledOnce();
  resolveSave({ code: '0000' });
  await waitFor(() => expect(callbacks.onSuccess).toHaveBeenCalledOnce());
  fireEvent.click(button);
  await waitFor(() =>
    expect(apiSystemSaveDisplayRecommend).toHaveBeenCalledTimes(2),
  );
});

it('选择模式只回填目标，不直接保存推荐', async () => {
  const onPick = vi.fn();
  render(
    <RecommendAddModal
      open
      mode="pick"
      onPick={onPick}
      recType={DisplayRecTypeEnum.ChatBoxNav}
      defaultSort={1}
      {...callbacks}
    />,
  );
  fireEvent.click(await screen.findByRole('button', { name: addLabel }));
  expect(onPick).toHaveBeenCalledWith(item, 'Agent');
  expect(apiSystemSaveDisplayRecommend).not.toHaveBeenCalled();
});

import NormalProjectDetail from '@/pages/SpaceProjectManage/NormalProjectDetail';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getProject: vi.fn(),
  getConversations: vi.fn(),
  pin: vi.fn(),
}));

vi.mock('umi', async () => {
  const { useRealUmiRequest } = await import('../helpers/useRealUmiRequest');
  return {
    useRequest: useRealUmiRequest,
    useParams: () => ({ spaceId: '1', projectId: '6' }),
    history: { push: vi.fn(), replace: vi.fn() },
  };
});
vi.mock('@/services/userProjectApp', () => ({
  apiNormalProjectGetById: mocks.getProject,
}));
vi.mock('@/pages/SpaceProjectManage/services', () => ({
  apiUserProjectConversations: mocks.getConversations,
}));
vi.mock('@/services/userService', () => ({
  UserService: { getUserInfoFromStorage: () => ({ id: 77 }) },
}));
vi.mock('@/hooks/useHomePinnedProjectHandoff', () => ({
  default: () => ({ pin: mocks.pin }),
}));
vi.mock('@/hooks/useDirectorySync', () => ({
  useProjectChanged: vi.fn(),
  useConversationChanged: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/pages/SpaceProjectManage/type', () => ({ openProject: vi.fn() }));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/components/custom/Loading', () => ({ default: () => null }));
vi.mock('@/components/custom/TooltipIcon', () => ({ default: () => null }));
vi.mock('@/pages/SpaceProjectManage/NormalProjectDetail/index.less', () => ({
  default: {},
}));
vi.mock('@/pages/SpaceProjectManage/components/ConversationPanel', () => ({
  default: ({ onCreate }: { onCreate: () => void }) => (
    <button type="button" onClick={onCreate}>
      新建任务
    </button>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getProject.mockResolvedValue({
    code: '0000',
    data: {
      projectId: 6,
      projectType: AgentComponentTypeEnum.NormalProject,
      name: '常规项目',
      creatorId: 77,
      sandboxId: 417,
      sandboxType: 'Personal',
      agentWorkspacePath: '/work/project',
      fileWorkspacePath: '/files/project',
    },
  });
  mocks.getConversations.mockResolvedValue({ code: '0000', data: [] });
});

afterEach(cleanup);

it('详情页新建任务携带项目电脑类型和执行目录，点击不重复加载详情', async () => {
  render(<NormalProjectDetail />);
  await screen.findByRole('heading', { name: '常规项目' });
  fireEvent.click(screen.getByRole('button', { name: '新建任务' }));

  expect(mocks.pin).toHaveBeenCalledWith(
    expect.objectContaining({
      projectId: 6,
      spaceId: 1,
      projectType: AgentComponentTypeEnum.NormalProject,
      sandboxId: 417,
      sandboxType: 'Personal',
      workspacePath: '/work/project',
      owner: true,
    }),
  );
  await waitFor(() => expect(mocks.getProject).toHaveBeenCalledTimes(1));
});

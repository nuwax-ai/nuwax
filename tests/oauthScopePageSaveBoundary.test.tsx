import AppProjectDetail from '@/pages/SpaceProjectManage/AppProjectDetail';
import ThirdAppDetail from '@/pages/SpaceProjectManage/ThirdAppDetail';
import type { ThirdAppOauth2Info } from '@/pages/SpaceProjectManage/services/thirdAppOauth2';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { OAuth2ScopeApplyStatusEnum } from '@/types/interfaces/oauth2Scope';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  settingGet: vi.fn(),
  settingSave: vi.fn(),
  infoGet: vi.fn(),
  success: vi.fn(),
}));

// 用真实 useRequest 保留 onSuccess(result, requestParams) 的请求边界。
vi.mock('umi', async () => {
  const { useRequest } = await import('ahooks');
  return {
    useRequest,
    useParams: () => ({ spaceId: '1', projectId: '42', appId: '42' }),
    history: { push: vi.fn(), replace: vi.fn() },
  };
});
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return { ...actual, message: { ...actual.message, success: h.success } };
});
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/pages/SpaceProjectManage/services/thirdAppOauth2', () => ({
  apiThirdAppOauth2SettingGet: h.settingGet,
  apiThirdAppOauth2SettingSave: h.settingSave,
  apiThirdAppOauth2InfoGet: h.infoGet,
  apiThirdAppOauth2SecretGet: vi.fn(),
  apiThirdAppOauth2CredentialRegenerate: vi.fn(),
}));
vi.mock('@/services/userProjectApp', () => ({
  apiUserAppGetById: async () => ({
    id: 42,
    name: '测试应用',
    deployType: 'platform',
  }),
}));
vi.mock('@/services/userAppDomain', () => ({
  UserAppDomainTypeEnum: { Custom: 'Custom', Prod: 'Prod' },
  apiUserAppDomainList: async () => [],
  apiUserAppDomainCreate: vi.fn(),
  apiUserAppDomainDelete: vi.fn(),
}));
vi.mock('@/services/userService', () => ({ UserService: {} }));
vi.mock('@/pages/SpaceProjectManage/services', () => ({
  apiUserProjectConversations: async () => [],
}));
vi.mock('@/pages/SpaceProjectManage/services/privateServer', () => ({
  apiPrivateServerList: vi.fn(),
  apiPrivateServerSetDeployTarget: vi.fn(),
}));
vi.mock('@/hooks/useDirectorySync', () => ({
  useProjectChanged: vi.fn(),
  useConversationChanged: vi.fn(),
}));
vi.mock('@/hooks/useHomePinnedProjectHandoff', () => ({
  default: () => ({ pin: vi.fn() }),
}));
vi.mock('@/utils/clipboard', () => ({ copyTextToClipboard: vi.fn() }));
vi.mock('@/utils/common', () => ({
  isValidDomain: vi.fn(),
  normalizeDomain: vi.fn(),
}));
vi.mock('@/utils/directorySyncEvents', () => ({
  applyConversationChangedToList: vi.fn(),
}));
vi.mock('@/utils/homeSendPlan', () => ({ resolveProjectOwnerFlag: vi.fn() }));
vi.mock('@/pages/SpaceProjectManage/type', () => ({ openProject: vi.fn() }));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/components/custom/Loading', () => ({ default: () => null }));
vi.mock('@/components/custom/TooltipIcon', () => ({
  default: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));
vi.mock('@/components/business-component/AppDevPublishVersionRecords', () => ({
  default: () => null,
}));
vi.mock('@/components/PublishComponentModal', () => ({ default: () => null }));
vi.mock('@/pages/SpaceProjectManage/components/ConversationPanel', () => ({
  default: () => null,
}));
vi.mock(
  '@/pages/SpaceProjectManage/AppProjectDetail/components/PrivateServerPanel',
  () => ({
    default: () => null,
  }),
);
vi.mock('@/pages/SpaceProjectManage/ThirdAppDetail/index.less', () => ({
  default: {},
}));
vi.mock('@/pages/SpaceProjectManage/AppProjectDetail/index.less', () => ({
  default: {},
}));
// 只替换勾选控件；读取初值、保存请求和提示均走真实详情页。
vi.mock('@/pages/SpaceProjectManage/components/OAuthScopeSetting', () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string[];
    onChange: (value: string[]) => void;
  }) => (
    <input
      aria-label="scope-draft"
      value={JSON.stringify(value)}
      onChange={(event) => onChange(JSON.parse(event.target.value))}
    />
  ),
}));

const A = ['profile', 'chat:read'];
const B = ['profile', 'im:read'];
const C = ['profile', 'tool:exec'];
const savedMessage = 'PC.Common.Global.saveSuccess';
const submittedMessage = 'PC.Components.OAuthScopeSetting.submitted';

function setting(status: OAuth2ScopeApplyStatusEnum): ThirdAppOauth2Info {
  return {
    projectId: 42,
    clientId: 'test-client',
    hasClientSecret: false,
    homepageUrl: 'https://old.example',
    redirectUri: 'https://old.example/callback',
    scopes: A,
    pendingScopes: B,
    scopeApplyStatus: status,
    enabled: true,
  };
}

const cases = [
  {
    name: 'Pending 只改地址，不重提待审 B',
    status: OAuth2ScopeApplyStatusEnum.Pending,
    draft: B,
    scopes: undefined,
    message: savedMessage,
  },
  {
    name: 'Pending B 改 C，提交新的待审 C',
    status: OAuth2ScopeApplyStatusEnum.Pending,
    draft: C,
    scopes: C,
    message: submittedMessage,
  },
  {
    name: 'Pending B 改回生效 A，也提交 A',
    status: OAuth2ScopeApplyStatusEnum.Pending,
    draft: A,
    scopes: A,
    message: submittedMessage,
  },
  {
    name: 'Pending 同一集合仅换序，不重提审核',
    status: OAuth2ScopeApplyStatusEnum.Pending,
    draft: [...B].reverse(),
    scopes: undefined,
    message: savedMessage,
  },
  {
    name: 'Approved 未改 scope，只保存地址',
    status: OAuth2ScopeApplyStatusEnum.Approved,
    draft: A,
    scopes: undefined,
    message: savedMessage,
  },
  {
    name: 'Approved A 改 C，提交审核',
    status: OAuth2ScopeApplyStatusEnum.Approved,
    draft: C,
    scopes: C,
    message: submittedMessage,
  },
  {
    name: 'Rejected 未改 scope，只保存地址',
    status: OAuth2ScopeApplyStatusEnum.Rejected,
    draft: A,
    scopes: undefined,
    message: savedMessage,
  },
  {
    name: 'Rejected A 改 C，重新提交审核',
    status: OAuth2ScopeApplyStatusEnum.Rejected,
    draft: C,
    scopes: C,
    message: submittedMessage,
  },
  {
    name: '发送 scope 但回包 Approved，提示普通保存成功',
    status: OAuth2ScopeApplyStatusEnum.Approved,
    draft: C,
    scopes: C,
    responseStatus: OAuth2ScopeApplyStatusEnum.Approved,
    message: savedMessage,
  },
];

describe.each([
  {
    name: '三方应用',
    Component: ThirdAppDetail,
    pageKey: 'ThirdAppDetail',
    projectType: AgentComponentTypeEnum.ThirdApp,
  },
  {
    name: '网站应用',
    Component: AppProjectDetail,
    pageKey: 'AppProjectDetail',
    projectType: AgentComponentTypeEnum.UserApp,
  },
])('$name OAuth scope 保存边界', ({ Component, pageKey, projectType }) => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it.each(cases)(
    '$name',
    async ({ status, draft, scopes, responseStatus, message }) => {
      const initial = setting(status);
      h.settingGet.mockResolvedValue({ code: '0000', data: initial });
      h.infoGet.mockResolvedValue({
        code: '0000',
        data: { ...initial, name: '测试应用' },
      });
      h.settingSave.mockResolvedValue({
        code: '0000',
        data: {
          ...initial,
          scopeApplyStatus:
            responseStatus ?? OAuth2ScopeApplyStatusEnum.Pending,
        },
      });

      render(<Component />);
      if (projectType === AgentComponentTypeEnum.UserApp) {
        fireEvent.click(
          screen.getByRole('tab', { name: `PC.Pages.${pageKey}.tabSetting` }),
        );
      }
      const scopeInput = await screen.findByLabelText('scope-draft');
      await waitFor(() => {
        expect(scopeInput).toHaveValue(
          JSON.stringify(status === OAuth2ScopeApplyStatusEnum.Pending ? B : A),
        );
        expect(
          screen.getByPlaceholderText(`PC.Pages.${pageKey}.homeUrlPlaceholder`),
        ).toHaveValue(initial.homepageUrl);
      });
      fireEvent.change(scopeInput, {
        target: { value: JSON.stringify(draft) },
      });
      fireEvent.change(
        screen.getByPlaceholderText(`PC.Pages.${pageKey}.homeUrlPlaceholder`),
        {
          target: { value: '  https://new.example  ' },
        },
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'PC.Common.Global.save' }),
      );

      const expected = {
        projectId: 42,
        projectType,
        homepageUrl: 'https://new.example',
        redirectUri: initial.redirectUri,
        ...(scopes === undefined ? {} : { scopes }),
      };
      await waitFor(() =>
        expect(h.settingSave.mock.calls).toEqual([[expected]]),
      );
      await waitFor(() => expect(h.success.mock.calls).toEqual([[message]]));
    },
  );
});

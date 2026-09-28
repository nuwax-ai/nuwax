import UserApp from '@/pages/UserApp';
import { apiUserAppDomainList } from '@/services/userProjectApp';
import { UserAppDomainTypeEnum } from '@/types/interfaces/userProject';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ registerRenderer: vi.fn() }));

vi.mock('umi', async () => {
  const { useRequest } = await import('ahooks');
  return {
    useModel: () => ({ registerRenderer: h.registerRenderer }),
    useRequest: (service: () => Promise<{ data: unknown }>, options: object) =>
      useRequest(async () => (await service()).data, options),
  };
});
vi.mock('@/services/userProjectApp', () => ({
  apiUserAppDomainList: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));
vi.mock('@/components/business-component/AppPageState/index.less', () => ({
  default: { pageState: 'app-page-state' },
}));
vi.mock('@/components/business-component/AppDevEmptyState/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/business-component', () => ({
  PagePreviewIframe: ({
    pagePreviewData,
  }: {
    pagePreviewData: { uri: string };
  }) => <iframe title="app-preview" src={pagePreviewData.uri} />,
}));

function renderApp(appId = 169, homepageUrl = '') {
  const route = render(<UserApp />);
  const Renderer = h.registerRenderer.mock.calls[0][0];
  route.unmount();
  return render(<Renderer appId={appId} homepageUrl={homepageUrl} />);
}

describe('UserApp 应用页面状态', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiUserAppDomainList).mockResolvedValue({
      code: '0000',
      success: true,
      data: [],
    } as any);
  });
  afterEach(cleanup);

  it.each([
    { name: 'BizError', info: { code: '4030' } },
    { response: { status: 403 } },
  ])('权限失败展示权限状态，不伪装成空数据：%j', async (error) => {
    vi.mocked(apiUserAppDomainList).mockRejectedValue(error);
    renderApp();
    expect(
      await screen.findByText(
        'PC.Components.AppDevEmptyState.permissionDeniedTitle',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('PC.Pages.UserApp.emptyDomain')).toBeNull();
    expect(screen.queryByTitle('app-preview')).toBeNull();
  });

  it('成功但没有域名时仍展示正常空态', async () => {
    renderApp();
    expect(
      await screen.findByText('PC.Pages.UserApp.emptyDomain'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'PC.Components.AppDevEmptyState.permissionDeniedTitle',
      ),
    ).toBeNull();
  });

  it('普通加载失败与权限失败区分', async () => {
    vi.mocked(apiUserAppDomainList).mockRejectedValue(new Error('network'));
    renderApp();
    expect(
      await screen.findByText('PC.Pages.UserApp.loadFailed'),
    ).toBeInTheDocument();
    expect(screen.queryByText('PC.Pages.UserApp.emptyDomain')).toBeNull();
    expect(
      screen.queryByText(
        'PC.Components.AppDevEmptyState.permissionDeniedTitle',
      ),
    ).toBeNull();
  });

  it('第三方主页直接加载，不请求全栈应用域名', () => {
    renderApp(169, 'https://third-party.example/');
    expect(screen.getByTitle('app-preview')).toHaveAttribute(
      'src',
      'https://third-party.example/',
    );
    expect(apiUserAppDomainList).not.toHaveBeenCalled();
  });

  it('有域名时保留 Custom 优于 Prod 的预览顺序', async () => {
    vi.mocked(apiUserAppDomainList).mockResolvedValue({
      code: '0000',
      success: true,
      data: [
        { domain: 'prod.example', domainType: UserAppDomainTypeEnum.Prod },
        { domain: 'custom.example', domainType: UserAppDomainTypeEnum.Custom },
      ],
    } as any);
    renderApp();
    expect(await screen.findByTitle('app-preview')).toHaveAttribute(
      'src',
      'https://custom.example',
    );
  });
});

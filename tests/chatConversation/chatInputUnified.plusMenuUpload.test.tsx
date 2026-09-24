/**
 * ChatInputUnified + 号菜单附件上传回归测试：
 * 文件选择器常驻输入区，菜单项整行点击打开选择器，文件统一走
 * uploadFilesToServer（fetch）。菜单关闭不卸载选择器，弹层生命周期
 * 不影响文件选择及上传状态更新。
 * 桩法对齐 chatInputUnified.plusMenu.test.tsx。
 */
import ChatInputUnified from '@/components/business-component/ChatInputUnified';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ChatInputHome/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('umi', () => ({
  useModel: () => ({ tenantConfigInfo: { enableSubscription: 0 } }),
  useLocation: () => ({ pathname: '/home', search: '' }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/hooks/useSubscription', () => ({
  default: () => ({
    createSubscriptionOrder: vi.fn(),
    querySkillSubscriptionPlans: vi.fn(),
    loadingTargetPricing: false,
    targetSubscriptionPlans: [],
    mySubscriptionInfo: null,
    loadingMySubscription: false,
  }),
}));

// 编辑器桩
vi.mock('@/components/ChatInputHome/MentionEditor', async () => {
  const React = await import('react');
  return {
    DEFAULT_CAPABILITY_RESOURCE_TYPES: ['skill', 'connector', 'knowledge'],
    default: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        focus: vi.fn(),
        clear: vi.fn(),
      }));
      return React.createElement('div', { 'data-testid': 'mention-editor' });
    }),
  };
});

// 附件列表桩：捕获 files prop 供断言
const uploadListState = vi.hoisted(() => ({ files: [] as any[] }));
vi.mock('@/components/ChatUploadFile', async () => {
  const React = await import('react');
  return {
    default: (props: any) => {
      uploadListState.files = props.files ?? [];
      return React.createElement('div', { 'data-testid': 'chat-upload-file' });
    },
  };
});

const connectorPage = vi.hoisted(() => vi.fn());
vi.mock('@/services/systemManage', () => ({
  apiConnectorProviderPageList: connectorPage,
}));

const userConfig = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue({ data: null }),
  set: vi.fn().mockResolvedValue({ code: '0000' }),
}));
vi.mock('@/services/userConfig', () => ({
  apiUserConfigGet: (key: string) => userConfig.get(key),
  apiUserConfigSet: (data: any) => userConfig.set(data),
  chatboxConfigKey: (agentId: number | string) => `chatbox.config.${agentId}`,
}));

vi.mock('@/components/ChatInputHome/ComputerTypeSelector', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatInputHome/WorkspaceDirPickerModal', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatInputHome/SpaceSelector', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatInputHome/ModelSelector', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatInputHome/ManualComponentItem', () => ({
  default: () => null,
}));
vi.mock('@/components/base/SvgIcon', () => ({
  default: () => null,
}));
vi.mock('@/components/PermissionMask', () => ({ default: () => null }));
vi.mock('@/components/business-component/PaymentSubscriptionModal', () => ({
  default: () => null,
}));
// 语音底座桩
vi.mock('@/components/business-component/VoiceInput', async () => {
  const React = await import('react');
  const wrap = (testid: string) => (props: any) =>
    React.createElement(
      'div',
      { 'data-testid': testid },
      props.children ?? null,
    );
  return {
    ChatInputVoiceFooter: {
      Provider: ({ children }: any) =>
        typeof children === 'function' ? children(false) : children,
      HideWhenActive: wrap('voice-hide'),
      Expand: wrap('voice-expand'),
      Right: ({ children, defaultActions }: any) =>
        React.createElement(
          'div',
          { 'data-testid': 'voice-right' },
          defaultActions ?? null,
          children ?? null,
        ),
    },
    mergeVoiceTranscript: (prev: string, next: string) => prev + next,
  };
});

const UPLOAD_URL = expect.stringContaining('/api/file/upload');

function renderInput(props: Record<string, any> = {}) {
  return render(
    <ChatInputUnified
      onEnter={vi.fn()}
      agentId={101}
      agentMode="yolo"
      onAgentModeChange={vi.fn()}
      {...props}
    />,
  );
}

/** 点开 + 菜单并选中附件项（菜单随即关闭，模拟真实时序） */
async function pickFileThroughPlusMenu(file: File) {
  const plusBox = document.querySelector('.plus-box');
  fireEvent.click(plusBox!);
  await waitFor(() =>
    expect(
      screen.getByText('PC.Components.ChatInputHome.attachFile'),
    ).toBeInTheDocument(),
  );

  fireEvent.click(screen.getByRole('menuitem', { name: /attachFile/ }));

  const fileInput = await waitFor(() => {
    const input = document.querySelector(
      'input[type=file]',
    ) as HTMLInputElement | null;
    expect(input).toBeTruthy();
    return input as HTMLInputElement;
  });
  fireEvent.change(fileInput, { target: { files: [file] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  userConfig.get.mockResolvedValue({ data: null });
  userConfig.set.mockResolvedValue({ code: '0000' });
  connectorPage.mockResolvedValue({
    code: '0000',
    data: { records: [], pageNum: 1 },
  });
  localStorage.clear();
  localStorage.setItem(ACCESS_TOKEN, 'test-token');
  uploadListState.files = [];
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const SUCCESS_RESP = {
  code: '0000',
  data: {
    url: 'https://cdn.example.com/aliyun-captcha.js',
    key: 'tmp/123/aliyun-captcha.js',
    fileName: 'aliyun-captcha.js',
    mimeType: 'text/javascript',
    size: 7196,
  },
};

const IMG_SUCCESS_RESP = {
  code: '0000',
  data: {
    url: 'https://cdn.example.com/shot.png',
    key: 'tmp/124/shot.png',
    fileName: 'shot.png',
    mimeType: 'image/png',
    size: 4,
  },
};

describe('+ 号菜单附件上传（常驻文件选择器）', () => {
  it('选文件后走 fetch 上传，成功后附件从 uploading 变 done', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve(SUCCESS_RESP) });
    vi.stubGlobal('fetch', fetchMock);

    renderInput();
    await pickFileThroughPlusMenu(
      new File(['export const a = 1;'], 'aliyun-captcha.js', {
        type: 'text/javascript',
      }),
    );

    // chip 以 uploading 起步（fetch 立即 resolve 时可能已翻 done）
    await waitFor(() => expect(uploadListState.files.length).toBe(1));
    expect(['uploading', 'done']).toContain(uploadListState.files[0].status);

    // 上传走 fetch（cookie 同源鉴权 + type=tmp），而非 antd 内置 XHR
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toEqual(UPLOAD_URL);
    // cookie 登录线（033cd84a2）起上传鉴权走同源 cookie，不再携带 Bearer 头
    expect(init.credentials).toBe('include');
    expect(init.headers).toBeUndefined();
    expect(init.body.get('type')).toBe('tmp');

    // fetch 成功返回后状态落 done
    await waitFor(() => {
      expect(uploadListState.files[0]?.status).toBe('done');
    });
    expect(uploadListState.files[0]?.percent).toBe(100);
    expect(uploadListState.files[0]?.url).toBe(
      'https://cdn.example.com/aliyun-captcha.js',
    );
  });

  it('接口返回业务失败码时附件转 error，不再停留在 uploading', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ code: '1234', message: 'fail' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderInput();
    await pickFileThroughPlusMenu(
      new File(['x'], 'b.txt', { type: 'text/plain' }),
    );

    await waitFor(() => {
      expect(uploadListState.files[0]?.status).toBe('error');
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('图片文件同样走 fetch 上传并落 done（含服务端 url/mimeType）', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve(IMG_SUCCESS_RESP) });
    vi.stubGlobal('fetch', fetchMock);

    renderInput();
    await pickFileThroughPlusMenu(
      new File([new Uint8Array([137, 80, 78, 71])], 'shot.png', {
        type: 'image/png',
      }),
    );

    await waitFor(() => expect(uploadListState.files.length).toBe(1));
    expect(uploadListState.files[0]?.type).toBe('image/png');
    await waitFor(() => {
      expect(uploadListState.files[0]?.status).toBe('done');
    });
    expect(uploadListState.files[0]?.url).toBe(
      'https://cdn.example.com/shot.png',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

import FileTreePreviewPanel from '@/components/business-component/FileTreePreviewPanel';
import ConversationAgentFilePreview from '@/pages/ConversationAgent/ConversationAgentFilePreview';
import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

// 常量经 i18nRuntime 传递依赖 umi，组件边界测试隔离运行时服务。
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('umi', () => ({}));

vi.mock('@/components/business-component/FileTreeGitSourcePanel', () => ({
  default: () => null,
}));
vi.mock('@/components/business-component/GitVersionRecordPanel', () => ({
  default: () => null,
}));
vi.mock('@/components/business-component/ChangeFileGitDiffView', () => ({
  default: () => null,
}));
vi.mock(
  '@/components/business-component/FileTreePreviewPanel/FileTreeViewPanel',
  () => ({ default: () => null }),
);
vi.mock(
  '@/components/business-component/FileTreePreviewPanel/hooks/useFileTreePreviewView',
  () => ({ useFileTreePreviewView: vi.fn() }),
);
vi.mock(
  '@/components/business-component/FileTreePreviewPanel/hooks/useFileTreePreviewPanel',
  () => ({
    useFileTreePreviewPanel: () => ({
      header: null,
      content: null,
      restartOverlay: null,
    }),
  }),
);
vi.mock(
  '@/components/business-component/FileTreePreviewPanel/index.less',
  () => ({
    default: new Proxy({}, { get: (_, key) => String(key) }),
  }),
);
vi.mock(
  '@/pages/ConversationAgent/ConversationAgentFilePreview/index.less',
  () => ({ default: {} }),
);
vi.mock(
  '@/pages/ConversationAgent/ConversationAgentFilePreview/FilePathHeader',
  () => ({ default: () => null }),
);
vi.mock(
  '@/pages/ConversationAgent/ConversationAgentFilePreview/ToolTabContent',
  () => ({ default: () => null }),
);
vi.mock(
  '@/pages/ConversationAgent/ConversationAgentFilePreview/hooks/usePreviewTabs',
  () => ({ WORKSPACE_PREVIEW_TOOL_IDS: [] }),
);

describe('2469 文件预览全屏壳避让', () => {
  it.each([false, true])(
    '公共预览仅在全屏 %s 挂统一避让标记',
    (isFullscreen) => {
      const { container } = render(
        <FileTreePreviewPanel
          {...({
            tree: { isFileTreeVisible: false },
            preview: { isFullscreen, changeFiles: [] },
            viewMode: 'preview',
          } as unknown as ComponentProps<typeof FileTreePreviewPanel>)}
        />,
      );
      expect(
        container.firstElementChild?.classList.contains(
          'immersive-shell-fullscreen',
        ),
      ).toBe(isFullscreen);
    },
  );

  it.each([false, true])(
    '智能体内层预览仅在全屏 %s 挂统一避让标记',
    (isFullscreen) => {
      const { container } = render(
        <ConversationAgentFilePreview
          {...({
            preview: {
              isFullscreen,
              renderPreviewContent: () => null,
              filePathHeaderProps: {},
            },
            activeTab: null,
          } as unknown as ComponentProps<typeof ConversationAgentFilePreview>)}
        />,
      );
      expect(
        container.firstElementChild?.classList.contains(
          'immersive-shell-fullscreen',
        ),
      ).toBe(isFullscreen);
    },
  );
});

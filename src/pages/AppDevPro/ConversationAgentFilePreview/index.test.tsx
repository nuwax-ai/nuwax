import type { FileTreePreviewViewPreview } from '@/components/business-component/FileTreePreviewPanel/types';
import type { ChangeFileInfo } from '@/components/business-component/FileTreePreviewPanel/types/file-tree';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PreviewTab } from './hooks/usePreviewTabs';
import ConversationAgentFilePreview from './index';

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/components/business-component/ChangeFileGitDiffView', () => ({
  default: ({ fileId }: { fileId: string }) => (
    <div data-testid="diff">{fileId}</div>
  ),
}));
vi.mock('./FilePathHeader', () => ({
  default: ({ active }: { active: boolean }) => (
    <div data-testid="file-header">{String(active)}</div>
  ),
}));
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('./ToolTabContent/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock(
  '@/components/business-component/FileTreePreviewPanel/index.less',
  () => ({
    default: new Proxy({}, { get: (_, key) => String(key) }),
  }),
);

const preview = {
  renderPreviewContent: () => <div data-testid="file-content">文件内容</div>,
  filePathHeaderProps: {},
  isFullscreen: false,
} as FileTreePreviewViewPreview;
const toolTab = (toolId: PreviewTab['toolId']): PreviewTab => ({
  id: `tool:${toolId}`,
  type: 'tool',
  toolId,
  label: '',
});

describe('AppDevPro 工具面板映射', () => {
  it.each([
    'preview',
    'version-control',
    'database',
    'database-config',
  ] as const)('已有 %s 独立 prop 仍渲染原面板', (toolId) => {
    render(
      <ConversationAgentFilePreview
        preview={preview}
        activeTab={toolTab(toolId)}
        previewPanel="应用"
        versionPanel="版本"
        databasePanel="数据库"
        databaseConfigPanel="配置"
      />,
    );
    expect(
      screen.getByText(
        {
          preview: '应用',
          'version-control': '版本',
          database: '数据库',
          'database-config': '配置',
        }[toolId],
      ),
    ).toHaveClass('workspace-panel');
  });

  it('新面板映射覆盖旧 prop，并支持原占位工具，无需新增渲染分支', () => {
    const { rerender } = render(
      <ConversationAgentFilePreview
        preview={preview}
        activeTab={toolTab('database')}
        databasePanel="旧数据库"
        toolPanels={{ database: '新数据库', arrange: '编排面板' }}
      />,
    );
    expect(screen.queryByText('旧数据库')).toBeNull();
    expect(screen.getByText('新数据库')).toBeInTheDocument();
    rerender(
      <ConversationAgentFilePreview
        preview={preview}
        activeTab={toolTab('arrange')}
        toolPanels={{ arrange: '编排面板' }}
      />,
    );
    expect(screen.getByText('编排面板')).toBeInTheDocument();
  });

  it('缺少数据库面板时保留原占位，版本空面板仍为空白', () => {
    const { rerender } = render(
      <ConversationAgentFilePreview
        preview={preview}
        activeTab={toolTab('database-config')}
      />,
    );
    expect(
      screen.getByText('PC.Pages.AppDevPro.databaseConfigDesc'),
    ).toBeInTheDocument();
    rerender(
      <ConversationAgentFilePreview
        preview={preview}
        activeTab={toolTab('version-control')}
      />,
    );
    expect(
      screen.queryByText(
        'PC.Pages.ConversationAgentTabPicker.versionControlDesc',
      ),
    ).toBeNull();
  });

  it.each(['database', 'database-config'] as const)(
    '%s 面板保留合法的 0/false ReactNode',
    (toolId) => {
      const panelProps = (value: React.ReactNode) => ({
        databasePanel: toolId === 'database' ? value : undefined,
        databaseConfigPanel: toolId === 'database-config' ? value : undefined,
      });
      const { container, rerender } = render(
        <ConversationAgentFilePreview
          preview={preview}
          activeTab={toolTab(toolId)}
          {...panelProps(0)}
        />,
      );
      expect(screen.getByText('0')).toHaveClass('workspace-panel');
      rerender(
        <ConversationAgentFilePreview
          preview={preview}
          activeTab={toolTab(toolId)}
          {...panelProps(false)}
        />,
      );
      expect(container.querySelector('.workspace-panel')).toBeEmptyDOMElement();
    },
  );

  it.each(['database', 'database-config'] as const)(
    '%s 面板为 null/undefined 时继续显示原工具占位',
    (toolId) => {
      const panelProps = (value: null | undefined) => ({
        databasePanel: toolId === 'database' ? value : undefined,
        databaseConfigPanel: toolId === 'database-config' ? value : undefined,
      });
      const { rerender } = render(
        <ConversationAgentFilePreview
          preview={preview}
          activeTab={toolTab(toolId)}
          {...panelProps(null)}
        />,
      );
      const description =
        toolId === 'database'
          ? 'PC.Pages.AppDevPro.databaseDesc'
          : 'PC.Pages.AppDevPro.databaseConfigDesc';
      expect(screen.getByText(description)).toBeInTheDocument();
      rerender(
        <ConversationAgentFilePreview
          preview={preview}
          activeTab={toolTab(toolId)}
          {...panelProps(undefined)}
        />,
      );
      expect(screen.getByText(description)).toBeInTheDocument();
    },
  );

  it('diff 优先于文件；不匹配的 diff 回退预览，隐藏态继续透传文件分享可见性', () => {
    const activeTab: PreviewTab = {
      id: 'diff:src/a.ts',
      type: 'file',
      fileId: 'src/a.ts',
      isDiff: true,
      label: 'a.ts',
    };
    const diffFile = {
      fileId: 'src/a.ts',
      fileContent: 'after',
      originalFileContent: 'before',
    } as ChangeFileInfo;
    const { rerender } = render(
      <ConversationAgentFilePreview
        preview={preview}
        activeTab={activeTab}
        diffFile={diffFile}
      />,
    );
    expect(screen.getByTestId('diff')).toHaveTextContent('src/a.ts');
    expect(screen.queryByTestId('file-content')).toBeNull();
    rerender(
      <ConversationAgentFilePreview
        active={false}
        preview={preview}
        activeTab={activeTab}
        diffFile={{ ...diffFile, fileId: 'src/b.ts' }}
      />,
    );
    expect(screen.getByTestId('file-content')).toBeInTheDocument();
    expect(screen.getByTestId('file-header')).toHaveTextContent('false');
  });
});

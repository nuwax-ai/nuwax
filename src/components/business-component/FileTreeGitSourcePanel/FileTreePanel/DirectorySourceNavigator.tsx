import { dict } from '@/services/i18nRuntime';
import {
  DeleteOutlined,
  DownOutlined,
  FolderOpenOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Dropdown, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import type { FileTreeContainerProps } from '../types/file-tree-git-source';

type Navigation = NonNullable<FileTreeContainerProps['dataSourceNavigation']>;

const DirectorySourceNavigator: React.FC<{ navigation: Navigation }> = ({
  navigation,
}) => {
  const menu = useMemo(
    () => ({
      selectable: true,
      selectedKeys: [navigation.currentSourceId],
      onClick: ({ key }: { key: string }) => {
        if (key === '__open__') void navigation.onOpenRoots();
        else void navigation.onSelectSource(key);
      },
      items: [
        {
          key: 'workspace',
          icon: <FolderOutlined />,
          label: dict('PC.Chat.LocalFiles.workspaceLabel'),
        },
        ...navigation.roots.map((root) => ({
          key: root.id,
          icon: <FolderOutlined />,
          disabled: !root.available,
          label: (
            <span
              style={{
                display: 'flex',
                minWidth: 220,
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <Tooltip title={root.path} placement="right">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {root.label}
                  {!root.available
                    ? dict('PC.Chat.LocalFiles.unavailableSuffix')
                    : ''}
                </span>
              </Tooltip>
              <Button
                type="text"
                size="small"
                aria-label={dict('PC.Chat.LocalFiles.removeRoot')}
                icon={<DeleteOutlined />}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void navigation.onRemoveRoot(root.id);
                }}
              />
            </span>
          ),
        })),
        { type: 'divider' as const },
        {
          key: '__open__',
          icon: <FolderOpenOutlined />,
          label: dict('PC.Chat.LocalFiles.openLocalDirectory'),
        },
      ],
    }),
    [navigation],
  );

  const pathParts = navigation.currentPath.split('/').filter(Boolean);
  const breadcrumbItems = [
    {
      title: (
        <button
          type="button"
          onClick={() => void navigation.onNavigate('')}
          style={{ border: 0, padding: 0, background: 'transparent' }}
        >
          {navigation.currentLabel}
        </button>
      ),
    },
    ...pathParts.map((part, index) => ({
      title: (
        <button
          type="button"
          onClick={() =>
            void navigation.onNavigate(pathParts.slice(0, index + 1).join('/'))
          }
          style={{ border: 0, padding: 0, background: 'transparent' }}
        >
          {part}
        </button>
      ),
    })),
  ];

  return (
    <div style={{ padding: '12px 12px 4px' }}>
      <Dropdown menu={menu} trigger={['click']}>
        <Button
          block
          size="large"
          style={{ display: 'flex', justifyContent: 'space-between' }}
          icon={<FolderOutlined />}
        >
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Breadcrumb items={breadcrumbItems} />
          </span>
          <DownOutlined />
        </Button>
      </Dropdown>
      {pathParts.length > 0 && (
        <Button
          type="text"
          size="small"
          style={{ marginTop: 4 }}
          title={dict('PC.Chat.LocalFiles.upToParent')}
          onClick={() =>
            void navigation.onNavigate(pathParts.slice(0, -1).join('/'))
          }
        >
          ↑ &nbsp;..
        </Button>
      )}
    </div>
  );
};

export default DirectorySourceNavigator;

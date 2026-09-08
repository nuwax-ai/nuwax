import { transformFlatListToTree } from '@/utils/appDevUtils';
import {
  parentDirectory,
  workspaceNodeId,
  workspaceRelativePath,
} from '../utils/fileDataSource';

describe('workspace directory file helpers', () => {
  it('normalizes legacy relative paths and source-qualified node ids', () => {
    expect(workspaceNodeId('src/main.ts')).toBe('workspace:src/main.ts');
    expect(workspaceRelativePath('src/main.ts')).toBe('src/main.ts');
    expect(workspaceRelativePath('workspace:src/main.ts')).toBe('src/main.ts');
    expect(parentDirectory('src/main.ts')).toBe('src');
    expect(parentDirectory('README.md')).toBe('');
  });

  it('keeps directories containing dots as folders', () => {
    const [node] = transformFlatListToTree(
      [
        {
          name: 'foo.bar',
          fileId: 'workspace:foo.bar',
          dataSourceId: 'workspace',
          relativePath: 'foo.bar',
          isDir: true,
        },
      ],
      false,
    );

    expect(node).toMatchObject({
      id: 'workspace:foo.bar',
      name: 'foo.bar',
      type: 'folder',
    });
  });
});

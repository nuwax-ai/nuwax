import type { FileNode } from '@/types/interfaces/appDev';
import { describe, expect, it } from 'vitest';
import { fileMovePaths, movedFileId, movedFileNode } from './fileMove';
const folder = { id: 'workspace:src', name: 'src', type: 'folder' } as FileNode;
describe('workspace moves', () => {
  it('keeps plain and workspace-prefixed tabs in the same renamed subtree', () => {
    expect(
      movedFileId('docs/a.md', 'workspace:docs', 'workspace:archive/docs'),
    ).toBe('archive/docs/a.md');
    expect(movedFileId('workspace:docs/a.md', 'docs', 'archive/docs')).toBe(
      'workspace:archive/docs/a.md',
    );
    expect(movedFileId('docs2/a.md', 'docs', 'archive/docs')).toBe(
      'docs2/a.md',
    );
  });
  it('moves files and folders within the project without changing names', () => {
    expect(fileMovePaths(folder, 'archive')).toEqual({
      source: 'src',
      destination: 'archive/src',
    });
  });
  it.each([
    'src',
    'src/nested',
    '../outside',
    '/tmp',
    'C:/temp',
    'C:\\temp',
    '\\\\server\\share',
    'a/../b',
  ])('rejects escaping or self-contained target %s', (target) =>
    expect(() => fileMovePaths(folder, target)).toThrow(),
  );
  it('updates descendant identities and absolute local provenance without touching siblings', () => {
    const child = {
      id: 'workspace:src/a.txt',
      name: 'a.txt',
      type: 'file',
      localFile: { cId: '7', contextId: 'ctx', path: 'C:/work/src/a.txt' },
    } as FileNode;
    expect(movedFileNode(child, 'src', 'archive/src')).toMatchObject({
      id: 'workspace:archive/src/a.txt',
      parentPath: 'archive/src',
      localFile: { path: 'C:/work/archive/src/a.txt' },
    });
    expect(movedFileNode(child, 'other', 'archive/other')).toBe(child);
  });
});

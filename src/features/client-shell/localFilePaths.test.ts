import { describe, expect, it } from 'vitest';
import { splitLocalToolFilePath } from './localFilePaths';

describe('tool file native path splitting', () => {
  it.each([
    ['C:\\readme.md', 'C:\\', 'readme.md'],
    ['C:/readme.md', 'C:/', 'readme.md'],
    ['C:\\Users\\readme.md', 'C:\\Users', 'readme.md'],
    ['\\\\server\\share\\readme.md', '\\\\server\\share', 'readme.md'],
    ['/readme.md', '/', 'readme.md'],
    ['/work/readme.md', '/work', 'readme.md'],
    ['sub/readme.md', '/workspace', 'sub/readme.md'],
  ])('%s retains its native directory', (target, targetDir, relativePath) => {
    expect(splitLocalToolFilePath(target, '/workspace')).toEqual({
      targetDir,
      relativePath,
    });
  });
});

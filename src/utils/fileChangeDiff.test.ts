import { describe, expect, it } from 'vitest';
import {
  normalizeFileDiffItems,
  parseUnifiedDiffToFileDiff,
} from './fileChangeDiff';

describe('fileChangeDiff', () => {
  it('parses unified diff text from permission raw input', () => {
    const items = parseUnifiedDiffToFileDiff(
      [
        'Index: /home/user/app/.env',
        '===================================================================',
        '--- /home/user/app/.env',
        '+++ /home/user/app/.env',
        '@@ -0,0 +1,2 @@',
        '+# API Key',
        '+VITE_KEY=YOUR_KEY',
      ].join('\n'),
    );

    expect(items).toEqual([
      {
        path: '/home/user/app/.env',
        oldText: '',
        newText: '# API Key\nVITE_KEY=YOUR_KEY',
      },
    ]);
  });

  it('normalizes write and edit tool results without diff data array', () => {
    expect(
      normalizeFileDiffItems({
        input: {
          filePath: '/home/user/app/.env',
          content: 'VITE_KEY=YOUR_KEY\n',
        },
      }),
    ).toEqual([
      {
        path: '/home/user/app/.env',
        oldText: '',
        newText: 'VITE_KEY=YOUR_KEY\n',
      },
    ]);

    expect(
      normalizeFileDiffItems({
        input: {
          filePath: '/home/user/app/index.html',
          oldString: '<title>old</title>',
          newString: '<title>new</title>',
        },
      }),
    ).toEqual([
      {
        path: '/home/user/app/index.html',
        oldText: '<title>old</title>',
        newText: '<title>new</title>',
      },
    ]);
  });
});

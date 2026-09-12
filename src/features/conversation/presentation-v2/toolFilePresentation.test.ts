import { describe, expect, it } from 'vitest';

import {
  getFileTypeInfo,
  isConversationSandboxPath,
  splitFilePath,
} from './toolFilePresentation';

describe('isConversationSandboxPath', () => {
  it('会话沙箱工作区路径命中', () => {
    expect(isConversationSandboxPath('/home/user/1562087/a.md')).toBe(true);
    expect(
      isConversationSandboxPath('/home/user/1562087/demoSrc/sub/a.png'),
    ).toBe(true);
  });

  it('非会话工作区路径不命中', () => {
    expect(isConversationSandboxPath('/home/user/Desktop/a.md')).toBe(false);
    expect(isConversationSandboxPath('/home/user/')).toBe(false);
    expect(isConversationSandboxPath('/etc/hosts')).toBe(false);
    expect(isConversationSandboxPath('src/index.tsx')).toBe(false);
  });
});

describe('splitFilePath', () => {
  it('拆出目录与文件名', () => {
    expect(splitFilePath('/home/user/1562087/markdown-style-test.md')).toEqual({
      dir: '/home/user/1562087',
      name: 'markdown-style-test.md',
      ext: 'md',
    });
  });

  it('多级子目录取最后一段为文件名', () => {
    expect(splitFilePath('src/components/FilePathHeader/index.tsx')).toEqual({
      dir: 'src/components/FilePathHeader',
      name: 'index.tsx',
      ext: 'tsx',
    });
  });

  it('根目录文件目录为空', () => {
    expect(splitFilePath('README.md')).toEqual({
      dir: '',
      name: 'README.md',
      ext: 'md',
    });
  });

  it('多个点取最后一个为扩展名', () => {
    expect(splitFilePath('demo/a.test.ts').ext).toBe('ts');
    expect(splitFilePath('demo/a.test.ts').name).toBe('a.test.ts');
  });

  it('点开头的隐藏文件不算扩展名', () => {
    expect(splitFilePath('repo/.gitignore')).toEqual({
      dir: 'repo',
      name: '.gitignore',
      ext: '',
    });
  });

  it('容忍结尾斜杠', () => {
    expect(splitFilePath('src/dir/')).toEqual({
      dir: 'src',
      name: 'dir',
      ext: '',
    });
  });

  it('扩展名转小写', () => {
    expect(splitFilePath('demo/Readme.MD').ext).toBe('md');
  });
});

describe('getFileTypeInfo', () => {
  it('常见扩展名命中映射', () => {
    expect(getFileTypeInfo('type.ts')).toEqual({ label: 'TS', bg: '#3178c6' });
    expect(getFileTypeInfo('readme.md').label).toBe('MD');
    expect(getFileTypeInfo('index.tsx').label).toBe('TSX');
  });

  it('浅底色徽标带深色文字', () => {
    expect(getFileTypeInfo('app.js').color).toBe('#1f2328');
  });

  it('未知扩展名给中性灰底 + 大写缩写', () => {
    const info = getFileTypeInfo('demo/data.xyz');
    expect(info.bg).toBe('#8a8f98');
    expect(info.label).toBe('XYZ');
  });

  it('无扩展名归为 FILE', () => {
    expect(getFileTypeInfo('Dockerfile').label).toBe('FILE');
    expect(getFileTypeInfo('repo/.gitignore').label).toBe('FILE');
  });

  it('长扩展名截断到 4 字符', () => {
    expect(getFileTypeInfo('a.heic').label).toBe('HEIC');
    expect(getFileTypeInfo('a.abcdef').label).toBe('ABCD');
  });
});

import { describe, expect, it } from 'vitest';
import {
  isAuthProtectedFileUrl,
  resolveAuthProtectedFileFetchUrl,
} from './authProtectedFileUrl';

describe('authProtectedFileUrl', () => {
  it('detects /api/f/ paths as auth protected', () => {
    expect(
      isAuthProtectedFileUrl(
        'https://testagent.xspaceagi.com/api/f/s3/default/20260703/a.png',
      ),
    ).toBe(true);
    expect(isAuthProtectedFileUrl('/api/f/s3/default/a.png')).toBe(true);
  });

  it('does not treat public CDN urls as auth protected', () => {
    expect(isAuthProtectedFileUrl('https://cdn.example.com/1.png')).toBe(false);
  });

  it('resolves relative paths with BASE_URL', () => {
    expect(resolveAuthProtectedFileFetchUrl('/api/f/s3/a.png')).toBe(
      `${process.env.BASE_URL}/api/f/s3/a.png`,
    );
  });
});

import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { businessCredentials } from './businessCookie';

const originalBase = process.env.BASE_URL;
afterEach(() => {
  vi.unstubAllGlobals();
  process.env.BASE_URL = originalBase;
});

describe('business cookie request scope', () => {
  it('includes ticket for same-origin business URLs and relative paths', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://biz.example.com' },
    });
    process.env.BASE_URL = '';
    expect(businessCredentials('/api/user/getLoginInfo')).toBe('include');
    expect(businessCredentials('https://biz.example.com/api/f/image')).toBe(
      'include',
    );
    expect(businessCredentials('https://other.example.com/api/f/image')).toBe(
      'omit',
    );
  });
  it('includes only configured cross-origin dev API', () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    process.env.BASE_URL = 'https://biz.example.com';
    expect(
      businessCredentials('https://biz.example.com/api/user/getLoginInfo'),
    ).toBe('include');
    expect(businessCredentials('http://localhost:3000/other')).toBe('omit');
  });
  it('keeps a protected image as a real cookie-authenticated URL', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://biz.example.com' },
    });
    process.env.BASE_URL = '';
    expect(useAuthProtectedImageSrc('/api/f/image.png').displaySrc).toBe(
      '/api/f/image.png',
    );
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth, isNuwaClaw, native, nuwaClawHost } from './index';

/**
 * nuwaClawHost 统一对外接入层单测：
 * 验证「桥存在透传 / 桥缺失 no-op / 桥抛错降级」三态行为，
 * 确保浏览器环境（无桥）与桌面宿主（有桥）调用点都安全。
 */
describe('nuwaClawHost（统一对外接入层）', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  let original: unknown;

  beforeEach(() => {
    original = (window as any).NuwaClawBridge;
  });
  afterEach(() => {
    if (original === undefined) delete (window as any).NuwaClawBridge;
    else (window as any).NuwaClawBridge = original;
    warnSpy.mockClear();
  });

  describe('isNuwaClaw', () => {
    it('桥存在 → true（聚合对象与具名导出一致）', () => {
      (window as any).NuwaClawBridge = { auth: {}, native: {} };
      expect(isNuwaClaw()).toBe(true);
      expect(nuwaClawHost.isNuwaClaw()).toBe(true);
    });
    it('桥缺失 → false', () => {
      delete (window as any).NuwaClawBridge;
      expect(isNuwaClaw()).toBe(false);
    });
  });

  describe('auth.getToken', () => {
    it('桥返回 token → 透传', async () => {
      (window as any).NuwaClawBridge = {
        auth: { getToken: async () => 'abc' },
      };
      await expect(auth.getToken()).resolves.toBe('abc');
    });
    it('无桥 → null（no-op）', async () => {
      delete (window as any).NuwaClawBridge;
      await expect(auth.getToken()).resolves.toBeNull();
    });
    it('getToken 未实现 → null', async () => {
      (window as any).NuwaClawBridge = { auth: {} };
      await expect(auth.getToken()).resolves.toBeNull();
    });
    it('桥抛错 → 降级 null 且 warn', async () => {
      (window as any).NuwaClawBridge = {
        auth: {
          getToken: async () => {
            throw new Error('x');
          },
        },
      };
      await expect(auth.getToken()).resolves.toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('auth.persistToken', () => {
    it('调宿主 persistToken 并透传结果', async () => {
      const fn = vi.fn(async () => true);
      (window as any).NuwaClawBridge = { auth: { persistToken: fn } };
      await expect(auth.persistToken('t')).resolves.toBe(true);
      expect(fn).toHaveBeenCalledWith('t');
    });
    it('无桥 → false', async () => {
      delete (window as any).NuwaClawBridge;
      await expect(auth.persistToken('t')).resolves.toBe(false);
    });
    it('桥抛错 → 降级 false', async () => {
      (window as any).NuwaClawBridge = {
        auth: {
          persistToken: async () => {
            throw new Error('x');
          },
        },
      };
      await expect(auth.persistToken('t')).resolves.toBe(false);
    });
  });

  describe('auth.clear', () => {
    it('调宿主 clear', async () => {
      const fn = vi.fn(async () => true);
      (window as any).NuwaClawBridge = { auth: { clear: fn } };
      await auth.clear();
      expect(fn).toHaveBeenCalled();
    });
    it('无桥 → 不抛（no-op）', async () => {
      delete (window as any).NuwaClawBridge;
      await expect(auth.clear()).resolves.toBeUndefined();
    });
    it('桥抛错 → 吞掉不抛（不阻塞 nuwax 自身登出）', async () => {
      (window as any).NuwaClawBridge = {
        auth: {
          clear: async () => {
            throw new Error('x');
          },
        },
      };
      await expect(auth.clear()).resolves.toBeUndefined();
    });
  });

  describe('native.saveImage', () => {
    it('调宿主 saveImage 透传结果', async () => {
      const fn = vi.fn(async () => ({ success: true, path: '/tmp/a.png' }));
      (window as any).NuwaClawBridge = { native: { saveImage: fn } };
      const r = await native.saveImage('http://x/a.png');
      expect(r.success).toBe(true);
      expect(r.path).toBe('/tmp/a.png');
      expect(fn).toHaveBeenCalledWith('http://x/a.png', undefined);
    });
    it('带 filename → 透传', async () => {
      const fn = vi.fn(async () => ({ success: true }));
      (window as any).NuwaClawBridge = { native: { saveImage: fn } };
      await native.saveImage('http://x/a.png', 'pic.png');
      expect(fn).toHaveBeenCalledWith('http://x/a.png', 'pic.png');
    });
    it('无桥 → {success:false}（浏览器端不拦截）', async () => {
      delete (window as any).NuwaClawBridge;
      expect(await native.saveImage('x')).toEqual({ success: false });
    });
    it('桥抛错 → {success:false,error}', async () => {
      (window as any).NuwaClawBridge = {
        native: {
          saveImage: async () => {
            throw new Error('boom');
          },
        },
      };
      const r = await native.saveImage('x');
      expect(r.success).toBe(false);
      expect(r.error).toBe('boom');
    });
  });
});

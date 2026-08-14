import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  auth,
  isImmersiveShell,
  isMac,
  isNuwaClaw,
  isShellWindow,
  isWinLinuxShell,
  native,
  needsTopRightAvoid,
  nuwaClawHost,
  shellAvoid,
} from './index';

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

  describe('isShellWindow / isImmersiveShell（独立窗口标记）', () => {
    const originalHref = window.location.href;
    afterEach(() => {
      window.history.replaceState(null, '', originalHref);
    });
    it('URL 带 _shell=1 → 独立窗口；桌面端下沉浸式判定为 false（恢复浏览器式布局）', () => {
      (window as any).NuwaClawBridge = { auth: {}, native: {} };
      window.history.replaceState(null, '', '/agent/123?_shell=1');
      expect(isShellWindow()).toBe(true);
      expect(isImmersiveShell()).toBe(false);
    });
    it('无 _shell 标记 + 有桥 → 沉浸式主窗口', () => {
      (window as any).NuwaClawBridge = { auth: {}, native: {} };
      window.history.replaceState(null, '', '/home');
      expect(isShellWindow()).toBe(false);
      expect(isImmersiveShell()).toBe(true);
    });
    it('浏览器端（无桥）即使误带 _shell → isImmersiveShell 仍 false', () => {
      delete (window as any).NuwaClawBridge;
      window.history.replaceState(null, '', '/home?_shell=1');
      expect(isImmersiveShell()).toBe(false);
    });
  });

  describe('native.openWindow（新开独立窗口）', () => {
    it('桥返回 success → 透传', async () => {
      const openWindow = vi.fn().mockResolvedValue({ success: true });
      (window as any).NuwaClawBridge = { native: { openWindow } };
      await expect(native.openWindow('/agent/123')).resolves.toEqual({
        success: true,
      });
      expect(openWindow).toHaveBeenCalledWith('/agent/123');
    });
    it('无桥 → {success:false}（jumpTo 分流据此回落页内导航）', async () => {
      delete (window as any).NuwaClawBridge;
      await expect(native.openWindow('/agent/123')).resolves.toEqual({
        success: false,
      });
    });
    it('桥抛错 → 降级 {success:false} 且 warn', async () => {
      (window as any).NuwaClawBridge = {
        native: { openWindow: vi.fn().mockRejectedValue(new Error('boom')) },
      };
      await expect(native.openWindow('/agent/123')).resolves.toEqual({
        success: false,
        error: 'boom',
      });
    });
  });

  describe('平台判定与避让（isMac / needsTopRightAvoid / shellAvoid）', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });
    it('mac 平台 → isMac true；有桥也无需右上避让（红绿灯在左上）', () => {
      vi.stubGlobal('navigator', { platform: 'MacIntel' });
      (window as any).NuwaClawBridge = { auth: {} };
      expect(isMac()).toBe(true);
      expect(needsTopRightAvoid()).toBe(false);
      expect(nuwaClawHost.isMac()).toBe(true);
    });
    it('Windows 壳 → 需要右上避让（自绘三键贴角）', () => {
      vi.stubGlobal('navigator', { platform: 'Win32' });
      (window as any).NuwaClawBridge = { auth: {} };
      expect(isMac()).toBe(false);
      expect(isWinLinuxShell()).toBe(true);
      expect(needsTopRightAvoid()).toBe(true);
    });
    it('Windows 浏览器（无桥）→ 不需要避让', () => {
      vi.stubGlobal('navigator', { platform: 'Win32' });
      delete (window as any).NuwaClawBridge;
      expect(needsTopRightAvoid()).toBe(false);
    });
    it('独立窗口（_shell=1）→ 无需右上避让（系统标题栏承担顶部）', () => {
      vi.stubGlobal('navigator', { platform: 'Win32' });
      (window as any).NuwaClawBridge = { auth: {} };
      const originalHref = window.location.href;
      window.history.replaceState(null, '', '/agent/123?_shell=1');
      expect(needsTopRightAvoid()).toBe(false);
      window.history.replaceState(null, '', originalHref);
    });
    it('shellAvoid 暴露统一避让尺寸（聚合对象与具名导出同源）', () => {
      expect(shellAvoid.TOP).toBeGreaterThan(0);
      expect(shellAvoid.RIGHT).toBeGreaterThan(0);
      expect(nuwaClawHost.shellAvoid).toBe(shellAvoid);
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

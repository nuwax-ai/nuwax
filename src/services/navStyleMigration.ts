/**
 * 存量导航风格一次性迁移：style1/style2 → style3（单栏模式）
 *
 * 背景：单栏导航（主导航改造）上线期间是硬编码替换、无视 navigationStyle 配置，
 * 且 initNuwaClawTheme 启动时会把当时的默认值 style1 写入用户主题配置——存量
 * 用户存储里普遍存在 style1 回声。迁移为可切换布局类型（默认 style3）后，若不
 * 迁移存量数据，这些用户会被打回旧经典布局（与迁移前实际所见相反）。
 *
 * 策略：一次性把用户存储中的 navigationStyleId(style1/style2) 改写为 style3，
 * guard 标记保证只生效一次；迁移后用户在设置里的显式选择不再被覆盖。
 * 注：本模块保持零 '@/...' 依赖（纯字符串常量），便于 vitest 直接单测。
 */

/** 迁移 guard 的 localStorage 键（一次性标记，非配置通道） */
export const NAV_STYLE_MIGRATION_GUARD_KEY = 'xagi-nav-style-migrated-style3';

/** 用户主题配置的 localStorage 键（与 STORAGE_KEYS.USER_THEME_CONFIG 同值） */
export const USER_THEME_CONFIG_STORAGE_KEY = 'xagi-user-theme-config';

/** 可注入的存储接口（测试替身用） */
export interface KVStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * 执行一次性迁移。
 * @returns 是否执行了迁移（首次运行 true；guard 已存在则 false）
 */
export function migrateLegacyNavigationStyleToStyle3(
  storage: KVStorage,
): boolean {
  if (storage.getItem(NAV_STYLE_MIGRATION_GUARD_KEY)) {
    return false;
  }

  const raw = storage.getItem(USER_THEME_CONFIG_STORAGE_KEY);
  if (raw) {
    try {
      const config = JSON.parse(raw);
      if (
        config &&
        (config.navigationStyleId === 'style1' ||
          config.navigationStyleId === 'style2')
      ) {
        config.navigationStyleId = 'style3';
        config.timestamp = Date.now();
        storage.setItem(
          USER_THEME_CONFIG_STORAGE_KEY,
          JSON.stringify(config),
        );
      }
    } catch {
      // 坏数据不阻断启动，仅跳过迁移改写
    }
  }

  storage.setItem(NAV_STYLE_MIGRATION_GUARD_KEY, String(Date.now()));
  return true;
}

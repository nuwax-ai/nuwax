interface EntryWindow {
  location: { href: string; replace: (url: string) => void };
  navigator: { userAgent: string };
  __POWERED_BY_QIANKUN__?: boolean;
  __NUWAX_IM_ENTRY_REDIRECT__?: string;
}
export function getImEntryRedirect(
  href: string,
  mobile: boolean,
): string | null;
export function redirectStandaloneImEntry(browser: EntryWindow): boolean;
export function getImEntryRedirectScript(): string;

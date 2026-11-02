import type { HostThemeSnapshot } from '../../types/interfaces/hostBridge';
import {
  canonicalPath,
  tokenToAntd,
  tokenToCssVariables,
  type ThemeSurface,
  type ThemeTokens,
} from './core';

/** The caller owns the returned URLs: dispose only after every consumer stops using css. */
export function createMicroThemePayload(
  snapshot: HostThemeSnapshot,
  doc: Document = document,
) {
  const urlApi = doc.defaultView?.URL ?? URL;
  const urls = new Map<string, string>();
  const dispose = () => {
    for (const url of urls.values()) urlApi.revokeObjectURL(url);
    urls.clear();
  };
  try {
    const css = {} as Record<ThemeSurface, string>;
    for (const surface of ['web', 'shell', 'message', 'repo'] as const) {
      css[surface] = snapshot.css[surface].replace(
        /theme-asset:([^\s"'()]+)(?=[\s"'()]|$)/g,
        (_, encoded: string) => {
          const path = decodeURIComponent(encoded);
          if (canonicalPath(path) !== path)
            throw new Error('Unsafe theme asset path');
          const asset = Object.prototype.hasOwnProperty.call(
            snapshot.assets,
            path,
          )
            ? snapshot.assets[path]
            : undefined;
          if (!asset) throw new Error(`Missing theme asset: ${path}`);
          let url = urls.get(path);
          if (!url) {
            const binary = atob(asset.base64);
            const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
            url = urlApi.createObjectURL(
              new Blob([bytes], { type: asset.mime }),
            );
            urls.set(path, url);
          }
          return url;
        },
      );
    }
    return {
      revision: snapshot.revision,
      mode: snapshot.mode,
      variables: tokenToCssVariables(snapshot.tokens as ThemeTokens),
      antdTokens: tokenToAntd(snapshot.tokens as ThemeTokens),
      css,
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

export function createThemeApplicator(
  root: HTMLElement,
  surface: ThemeSurface,
) {
  const attrs = ['data-theme-surface', 'data-theme', 'data-theme-id'];
  const originalAttrs = new Map(
    attrs.map((key) => [key, root.getAttribute(key)]),
  );
  const originals = new Map<string, [string, string]>();
  let revision = -1,
    disposed = false;
  let current: ReturnType<typeof createMicroThemePayload> | undefined;
  let style: HTMLStyleElement | undefined;
  const own = (name: string, value: string) => {
    if (!originals.has(name))
      originals.set(name, [
        root.style.getPropertyValue(name),
        root.style.getPropertyPriority(name),
      ]);
    root.style.setProperty(name, value);
  };
  return {
    apply(snapshot: HostThemeSnapshot): boolean {
      if (
        disposed ||
        !Number.isSafeInteger(snapshot.revision) ||
        snapshot.revision <= revision
      )
        return false;
      const next = createMicroThemePayload(snapshot, root.ownerDocument);
      const nextStyle = root.ownerDocument.createElement('style');
      nextStyle.textContent = next.css[surface];
      try {
        (root === root.ownerDocument.documentElement
          ? root.ownerDocument.head
          : root
        ).appendChild(nextStyle);
        for (const key of originals.keys())
          if (key.startsWith('--') && !(key in next.variables)) {
            const old = originals.get(key)!;
            if (old[0]) root.style.setProperty(key, ...old);
            else root.style.removeProperty(key);
          }
        for (const [key, value] of Object.entries(next.variables))
          own(key, value);
        own('background-color', String(snapshot.tokens['app.bg']));
        own('color', String(snapshot.tokens['text.primary']));
        own('font-family', String(snapshot.tokens['font.family']));
        own('font-size', String(snapshot.tokens['font.size']));
        own('color-scheme', snapshot.mode);
        root.setAttribute('data-theme-surface', surface);
        root.setAttribute('data-theme', snapshot.mode);
        root.setAttribute('data-theme-id', snapshot.themeId);
      } catch (error) {
        nextStyle.remove();
        next.dispose();
        throw error;
      }
      // Publish replacement CSS before releasing the previous resources.
      style?.remove();
      current?.dispose();
      style = nextStyle;
      current = next;
      revision = snapshot.revision;
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      style?.remove();
      current?.dispose();
      for (const [key, [value, priority]] of originals) {
        if (value) root.style.setProperty(key, value, priority);
        else root.style.removeProperty(key);
      }
      for (const [key, value] of originalAttrs) {
        if (value === null) root.removeAttribute(key);
        else root.setAttribute(key, value);
      }
    },
  };
}

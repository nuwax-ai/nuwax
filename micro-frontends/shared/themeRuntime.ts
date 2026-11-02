/** 仅由主站 overlay 构建复制；不依赖主站 React 或业务源码。 */
export interface MicroThemePayload {
  revision: number;
  mode: 'light' | 'dark';
  variables: Record<string, string>;
  antdTokens: object;
  css: string;
}

export function createMicroThemeStore() {
  let root: HTMLElement | undefined;
  let current: MicroThemePayload | undefined;
  let style: HTMLStyleElement | undefined;
  let observer: MutationObserver | undefined;
  let originalAttributes = new Map<string, string | null>();
  const originalStyles = new Map<string, string>();
  let marked = new WeakSet<HTMLElement>();
  const listeners = new Set<() => void>();
  const parts = [
    ['.conv-pane, .library-nav, .portal-sidebar, .doc-sidebar', 'sidebar'],
    ['.chat-pane, .portal-main, .doc-main', 'conversation'],
    ['.chat-composer, .composer, .input-area, .chat-input-area', 'input'],
    ['.message-bubble, .bubble', 'message-bubble'],
    ['.search-box, .search-wrap', 'search'],
  ];
  const mark = (node: Element) => {
    for (const [selector, part] of parts) {
      const elements = [...node.querySelectorAll<HTMLElement>(selector)];
      if (node.matches(selector)) elements.push(node as HTMLElement);
      for (const element of elements)
        if (!element.hasAttribute('data-theme-part')) {
          element.setAttribute('data-theme-part', part);
          marked.add(element);
        }
    }
  };
  const own = (key: string, value: string) => {
    if (!root) return;
    if (!originalStyles.has(key))
      originalStyles.set(key, root.style.getPropertyValue(key));
    root.style.setProperty(key, value);
  };
  const update = (next?: MicroThemePayload) => {
    if (
      !root ||
      !next ||
      !Number.isSafeInteger(next.revision) ||
      next.revision <= (current?.revision ?? -1) ||
      typeof next.css !== 'string'
    )
      return;
    const replacement = root.ownerDocument.createElement('style');
    replacement.textContent = next.css;
    root.ownerDocument.head.appendChild(replacement);
    for (const [key, value] of Object.entries(next.variables)) own(key, value);
    root.setAttribute('data-theme', next.mode);
    style?.remove();
    style = replacement;
    current = next;
    listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        /* Isolate subscribers. */
      }
    });
  };
  const dispose = () => {
    observer?.disconnect();
    observer = undefined;
    style?.remove();
    style = undefined;
    root
      ?.querySelectorAll<HTMLElement>('[data-theme-part]')
      .forEach((element) => {
        if (marked.has(element)) element.removeAttribute('data-theme-part');
      });
    marked = new WeakSet();
    if (root) {
      for (const [key, value] of originalStyles) {
        if (value) root.style.setProperty(key, value);
        else root.style.removeProperty(key);
      }
      for (const [key, value] of originalAttributes) {
        if (value === null) root.removeAttribute(key);
        else root.setAttribute(key, value);
      }
    }
    originalStyles.clear();
    root = undefined;
    current = undefined;
  };
  return {
    begin(
      element: HTMLElement,
      surface: 'message' | 'repo',
      payload?: MicroThemePayload,
    ) {
      dispose();
      root = element;
      originalAttributes = new Map(
        ['data-theme-surface', 'data-theme'].map((key) => [
          key,
          element.getAttribute(key),
        ]),
      );
      root.setAttribute('data-theme-surface', surface);
      mark(root);
      observer = new MutationObserver((records) => {
        for (const record of records)
          for (const node of record.addedNodes)
            if (node instanceof Element) mark(node);
      });
      observer.observe(root, { childList: true, subtree: true });
      update(payload);
    },
    update,
    dispose,
    getSnapshot: () => current,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

import { getCurrentLang, translateLiteralText } from './i18nRuntime';

const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label'] as const;

const IGNORE_SELECTOR = [
  'script',
  'style',
  'code',
  'pre',
  'textarea',
  'input[type="hidden"]',
  '[contenteditable="true"]',
  '[data-i18n-ignore="true"]',
  '.monaco-editor',
  '.ds-markdown',
  '[class*="markdown"]',
  '[class*="message-content"]',
  '[class*="chat-message"]',
  '[class*="conversation-content"]',
].join(',');

let observer: MutationObserver | null = null;
let started = false;

const isIgnoredElement = (el: Element | null): boolean => {
  if (!el) return true;
  return !!el.closest(IGNORE_SELECTOR);
};

const translateTextNode = (node: Text): void => {
  const parent = node.parentElement;
  if (isIgnoredElement(parent)) return;

  const rawText = node.nodeValue || '';
  if (!rawText.trim()) return;

  const translated = translateLiteralText(rawText);
  if (translated !== rawText) {
    node.nodeValue = translated;
  }
};

const translateElementAttributes = (el: Element): void => {
  if (isIgnoredElement(el)) return;

  TRANSLATABLE_ATTRIBUTES.forEach((attr) => {
    const rawValue = el.getAttribute(attr);
    if (!rawValue || !rawValue.trim()) return;

    const translated = translateLiteralText(rawValue);
    if (translated !== rawValue) {
      el.setAttribute(attr, translated);
    }
  });
};

const traverseAndTranslate = (root: Node): void => {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text);
    return;
  }

  if (
    root.nodeType !== Node.ELEMENT_NODE &&
    root.nodeType !== Node.DOCUMENT_NODE
  ) {
    return;
  }

  const element = root as Element;
  if (root.nodeType === Node.ELEMENT_NODE) {
    translateElementAttributes(element);
  }

  root.childNodes.forEach((childNode) => {
    traverseAndTranslate(childNode);
  });
};

const handleMutationList = (mutations: MutationRecord[]): void => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        traverseAndTranslate(node);
      });
      return;
    }

    if (
      mutation.type === 'characterData' &&
      mutation.target.nodeType === Node.TEXT_NODE
    ) {
      translateTextNode(mutation.target as Text);
      return;
    }

    if (
      mutation.type === 'attributes' &&
      mutation.target.nodeType === Node.ELEMENT_NODE
    ) {
      const attr = mutation.attributeName;
      if (attr && TRANSLATABLE_ATTRIBUTES.includes(attr as any)) {
        translateElementAttributes(mutation.target as Element);
      }
    }
  });
};

const stopI18nDomTranslator = (): void => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  started = false;
};

export const startI18nDomTranslator = (): (() => void) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => undefined;
  }

  if (started) {
    return () => stopI18nDomTranslator();
  }

  // 中文模式不需要运行时替换
  if (getCurrentLang().startsWith('zh')) {
    return () => undefined;
  }

  started = true;
  traverseAndTranslate(document.body);

  observer = new MutationObserver(handleMutationList);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
  });

  return () => stopI18nDomTranslator();
};

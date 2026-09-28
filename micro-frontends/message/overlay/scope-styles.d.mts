interface CssParent {
  type: string;
  name?: string;
  parent?: CssParent;
}

interface CssRoot {
  walkAtRules(visitor: (rule: { name: string; params: string }) => void): void;
  walkRules(
    visitor: (rule: { selector: string; parent?: CssParent }) => void,
  ): void;
  walkDecls(
    visitor: (declaration: { prop: string; value: string }) => void,
  ): void;
}

export const MESSAGE_SCOPE: string;
export function splitSelectorList(value: string): string[];
export function scopeSelector(selector: string): string;
export function messageScopedStyles(): {
  postcssPlugin: string;
  Once(root: CssRoot): void;
};

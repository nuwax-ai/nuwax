interface CssParent {
  type: string;
  name?: string;
  parent?: CssParent;
}

interface CssRule {
  selector: string;
  parent?: CssParent;
}

interface CssRoot {
  walkAtRules(visitor: (rule: { name: string; params: string }) => void): void;
  walkRules(visitor: (rule: CssRule) => void): void;
  walkDecls(visitor: (declaration: { prop: string; value: string }) => void): void;
}

export const REPO_SCOPE: string;
export function splitSelectorList(value: string): string[];
export function scopeSelector(selector: string): string;
export function repoScopedStyles(): {
  postcssPlugin: string;
  Once(root: CssRoot): void;
};

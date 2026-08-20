import { Options } from 'micromark-extension-cjk-friendly-gfm-strikethrough';
export { Options } from 'micromark-extension-cjk-friendly-gfm-strikethrough';

/**
 * Make Markdown strikethrough (`~~`) in GFM more friendly with Chinese, Japanese, and Korean (CJK)
 */
declare function remarkGfmStrikethroughCjkFriendly(this: unknown, options?: Options | null): void;

export { remarkGfmStrikethroughCjkFriendly as default };

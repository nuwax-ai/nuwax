import { Extension } from 'micromark-util-types';

/**
 * Make Markdown emphasis (`**`) in CommonMark more friendly with Chinese, Japanese, and Korean (CJK).
 */
declare function cjkFriendlyExtension(): Extension;

export { cjkFriendlyExtension };

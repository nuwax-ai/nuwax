import { Extension } from 'micromark-util-types';

interface Options {
    singleTilde?: boolean;
}
/**
 * Create an extension for `micromark` to enable GFM strikethrough syntax.
 *
 * @param {Options | null | undefined} [options={}]
 *   Configuration.
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions`, to
 *   enable GFM strikethrough syntax.
 */
declare function gfmStrikethroughCjkFriendly(options?: Options | null | undefined): Extension;

export { type Options, gfmStrikethroughCjkFriendly };

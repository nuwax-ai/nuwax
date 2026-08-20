// src/index.ts
import {
  gfmStrikethroughCjkFriendly
} from "micromark-extension-cjk-friendly-gfm-strikethrough";
function remarkGfmStrikethroughCjkFriendly(options) {
  const data = this.data();
  const micromarkExtensions = (
    // biome-ignore lint/suspicious/noAssignInExpressions: base plugin (remark-gfm) already does this
    data.micromarkExtensions || (data.micromarkExtensions = [])
  );
  micromarkExtensions.push(gfmStrikethroughCjkFriendly(options));
}
export {
  remarkGfmStrikethroughCjkFriendly as default
};

// src/index.ts
import { cjkFriendlyExtension } from "micromark-extension-cjk-friendly";
function remarkCjkFriendly() {
  const data = this.data();
  const micromarkExtensions = (
    // biome-ignore lint/suspicious/noAssignInExpressions: base plugin (remark-gfm) already does this
    data.micromarkExtensions || (data.micromarkExtensions = [])
  );
  micromarkExtensions.push(cjkFriendlyExtension());
}
export {
  remarkCjkFriendly as default
};

import {version as $gfwmN$version} from "react";


function $b24d1bc31a0f941d$export$a9d04c5684123369(value) {
    const pieces = (0, $gfwmN$version).split('.');
    const major = parseInt(pieces[0], 10);
    if (major >= 19) return value;
    // compatibility with React < 19
    return value ? 'true' : undefined;
}


export {$b24d1bc31a0f941d$export$a9d04c5684123369 as inertValue};
//# sourceMappingURL=inertValue.mjs.map

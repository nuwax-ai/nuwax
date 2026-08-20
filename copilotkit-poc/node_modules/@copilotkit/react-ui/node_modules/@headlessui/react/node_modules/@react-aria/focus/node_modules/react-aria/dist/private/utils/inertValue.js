import {version as $cL9yt$version} from "react";


function $6bb6fdf3d2910861$export$a9d04c5684123369(value) {
    const pieces = (0, $cL9yt$version).split('.');
    const major = parseInt(pieces[0], 10);
    if (major >= 19) return value;
    // compatibility with React < 19
    return value ? 'true' : undefined;
}


export {$6bb6fdf3d2910861$export$a9d04c5684123369 as inertValue};
//# sourceMappingURL=inertValue.js.map

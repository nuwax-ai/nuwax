var $aly0M$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "inertValue", function () { return $157aeca1deaf7e45$export$a9d04c5684123369; });

function $157aeca1deaf7e45$export$a9d04c5684123369(value) {
    const pieces = (0, $aly0M$react.version).split('.');
    const major = parseInt(pieces[0], 10);
    if (major >= 19) return value;
    // compatibility with React < 19
    return value ? 'true' : undefined;
}


//# sourceMappingURL=inertValue.cjs.map

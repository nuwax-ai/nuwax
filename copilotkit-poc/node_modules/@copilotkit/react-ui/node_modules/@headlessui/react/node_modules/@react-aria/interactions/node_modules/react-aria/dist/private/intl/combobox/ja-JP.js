var $43202bff607388dd$exports = {};
$43202bff607388dd$exports = {
    "buttonLabel": `\u{5019}\u{88DC}\u{3092}\u{8868}\u{793A}`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} \u{500B}\u{306E}\u{30AA}\u{30D7}\u{30B7}\u{30E7}\u{30F3}`,
            other: ()=>`${formatter.number(args.optionCount)} \u{500B}\u{306E}\u{30AA}\u{30D7}\u{30B7}\u{30E7}\u{30F3}`
        })}\u{3092}\u{5229}\u{7528}\u{3067}\u{304D}\u{307E}\u{3059}\u{3002}`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`\u{5165}\u{529B}\u{3055}\u{308C}\u{305F}\u{30B0}\u{30EB}\u{30FC}\u{30D7} ${args.groupTitle}\u{3001}${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} \u{500B}\u{306E}\u{30AA}\u{30D7}\u{30B7}\u{30E7}\u{30F3}`,
                    other: ()=>`${formatter.number(args.groupCount)} \u{500B}\u{306E}\u{30AA}\u{30D7}\u{30B7}\u{30E7}\u{30F3}`
                })}\u{3092}\u{542B}\u{3080}\u{3002}`,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `\u{3001}\u{9078}\u{629E}\u{6E08}\u{307F}`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `\u{5019}\u{88DC}`,
    "selectedAnnouncement": (args)=>`${args.optionText}\u{3001}\u{9078}\u{629E}\u{6E08}\u{307F}`
};


export {$43202bff607388dd$exports as default};
//# sourceMappingURL=ja-JP.js.map

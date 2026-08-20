var $6d7a00b6a8bff1e6$exports = {};
$6d7a00b6a8bff1e6$exports = {
    "buttonLabel": `\u{639}\u{631}\u{636} \u{627}\u{644}\u{645}\u{642}\u{62A}\u{631}\u{62D}\u{627}\u{62A}`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} \u{62E}\u{64A}\u{627}\u{631}`,
            other: ()=>`${formatter.number(args.optionCount)} \u{62E}\u{64A}\u{627}\u{631}\u{627}\u{62A}`
        })} \u{645}\u{62A}\u{627}\u{62D}\u{629}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`\u{627}\u{644}\u{645}\u{62C}\u{645}\u{648}\u{639}\u{629} \u{627}\u{644}\u{645}\u{62F}\u{62E}\u{644}\u{629} ${args.groupTitle}, \u{645}\u{639} ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} \u{62E}\u{64A}\u{627}\u{631}`,
                    other: ()=>`${formatter.number(args.groupCount)} \u{62E}\u{64A}\u{627}\u{631}\u{627}\u{62A}`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, \u{645}\u{62D}\u{62F}\u{62F}`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `\u{645}\u{642}\u{62A}\u{631}\u{62D}\u{627}\u{62A}`,
    "selectedAnnouncement": (args)=>`${args.optionText}\u{60C} \u{645}\u{62D}\u{62F}\u{62F}`
};


export {$6d7a00b6a8bff1e6$exports as default};
//# sourceMappingURL=ar-AE.js.map

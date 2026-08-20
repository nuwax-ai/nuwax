var $681d5c0fd0803d75$exports = {};
$681d5c0fd0803d75$exports = {
    "buttonLabel": `\u{C81C}\u{C548} \u{C0AC}\u{D56D} \u{D45C}\u{C2DC}`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)}\u{AC1C} \u{C635}\u{C158}`,
            other: ()=>`${formatter.number(args.optionCount)}\u{AC1C} \u{C635}\u{C158}`
        })}\u{C744} \u{C0AC}\u{C6A9}\u{D560} \u{C218} \u{C788}\u{C2B5}\u{B2C8}\u{B2E4}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`\u{C785}\u{B825}\u{D55C} \u{ADF8}\u{B8F9} ${args.groupTitle}, ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)}\u{AC1C} \u{C635}\u{C158}`,
                    other: ()=>`${formatter.number(args.groupCount)}\u{AC1C} \u{C635}\u{C158}`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, \u{C120}\u{D0DD}\u{B428}`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `\u{C81C}\u{C548}`,
    "selectedAnnouncement": (args)=>`${args.optionText}, \u{C120}\u{D0DD}\u{B428}`
};


export {$681d5c0fd0803d75$exports as default};
//# sourceMappingURL=ko-KR.js.map

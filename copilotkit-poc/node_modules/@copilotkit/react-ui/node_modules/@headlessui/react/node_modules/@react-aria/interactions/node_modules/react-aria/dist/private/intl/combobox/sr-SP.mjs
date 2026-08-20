var $35792d4e62f2d9ad$exports = {};
$35792d4e62f2d9ad$exports = {
    "buttonLabel": `Prika\u{17E}i predloge`,
    "countAnnouncement": (args, formatter)=>`Dostupno jo\u{161}: ${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opcija`,
            other: ()=>`${formatter.number(args.optionCount)} opcije/a`
        })}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Unesena grupa ${args.groupTitle}, s ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opcijom`,
                    other: ()=>`${formatter.number(args.groupCount)} optione/a`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, izabranih`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Predlozi`,
    "selectedAnnouncement": (args)=>`${args.optionText}, izabrano`
};


export {$35792d4e62f2d9ad$exports as default};
//# sourceMappingURL=sr-SP.mjs.map

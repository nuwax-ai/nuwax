module.exports = {
    "buttonLabel": `\u{5D4}\u{5E6}\u{5D2} \u{5D4}\u{5E6}\u{5E2}\u{5D5}\u{5EA}`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`\u{5D0}\u{5E4}\u{5E9}\u{5E8}\u{5D5}\u{5EA} ${formatter.number(args.optionCount)}`,
            other: ()=>`${formatter.number(args.optionCount)} \u{5D0}\u{5E4}\u{5E9}\u{5E8}\u{5D5}\u{5D9}\u{5D5}\u{5EA}`
        })} \u{5D1}\u{5DE}\u{5E6}\u{5D1} \u{5D6}\u{5DE}\u{5D9}\u{5DF}.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`\u{5E0}\u{5DB}\u{5E0}\u{5E1} \u{5DC}\u{5E7}\u{5D1}\u{5D5}\u{5E6}\u{5D4} ${args.groupTitle}, \u{5E2}\u{5DD} ${formatter.plural(args.groupCount, {
                    one: ()=>`\u{5D0}\u{5E4}\u{5E9}\u{5E8}\u{5D5}\u{5EA} ${formatter.number(args.groupCount)}`,
                    other: ()=>`${formatter.number(args.groupCount)} \u{5D0}\u{5E4}\u{5E9}\u{5E8}\u{5D5}\u{5D9}\u{5D5}\u{5EA}`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, \u{5E0}\u{5D1}\u{5D7}\u{5E8}`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `\u{5D4}\u{5E6}\u{5E2}\u{5D5}\u{5EA}`,
    "selectedAnnouncement": (args)=>`${args.optionText}, \u{5E0}\u{5D1}\u{5D7}\u{5E8}`
};


//# sourceMappingURL=he-IL.cjs.map

module.exports = {
    "buttonLabel": `Zobrazi\u{165} n\xe1vrhy`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} mo\u{17E}nos\u{165}`,
            other: ()=>`${formatter.number(args.optionCount)} mo\u{17E}nosti/-\xed`
        })} k dispoz\xedcii.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Zadan\xe1 skupina ${args.groupTitle}, s ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} mo\u{17E}nos\u{165}ou`,
                    other: ()=>`${formatter.number(args.groupCount)} mo\u{17E}nos\u{165}ami`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, vybrat\xe9`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `N\xe1vrhy`,
    "selectedAnnouncement": (args)=>`${args.optionText}, vybrat\xe9`
};


//# sourceMappingURL=sk-SK.cjs.map

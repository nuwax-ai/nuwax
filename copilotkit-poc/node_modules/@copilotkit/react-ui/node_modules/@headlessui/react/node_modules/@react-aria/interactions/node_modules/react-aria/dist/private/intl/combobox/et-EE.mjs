var $5ae036907590ca8d$exports = {};
$5ae036907590ca8d$exports = {
    "buttonLabel": `Kuva soovitused`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} valik`,
            other: ()=>`${formatter.number(args.optionCount)} valikud`
        })} saadaval.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Sisestatud r\xfchm ${args.groupTitle}, valikuga ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} valik`,
                    other: ()=>`${formatter.number(args.groupCount)} valikud`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, valitud`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Soovitused`,
    "selectedAnnouncement": (args)=>`${args.optionText}, valitud`
};


export {$5ae036907590ca8d$exports as default};
//# sourceMappingURL=et-EE.mjs.map

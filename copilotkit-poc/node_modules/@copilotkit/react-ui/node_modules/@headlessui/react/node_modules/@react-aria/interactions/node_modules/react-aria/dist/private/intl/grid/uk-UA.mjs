var $6bfd9245cbb46b69$exports = {};
$6bfd9245cbb46b69$exports = {
    "deselectedItem": (args)=>`${args.item} \u{43D}\u{435} \u{432}\u{438}\u{431}\u{440}\u{430}\u{43D}\u{43E}.`,
    "longPressToSelect": `\u{412}\u{438}\u{43A}\u{43E}\u{43D}\u{430}\u{439}\u{442}\u{435} \u{434}\u{43E}\u{432}\u{433}\u{435} \u{43D}\u{430}\u{442}\u{438}\u{441}\u{43D}\u{435}\u{43D}\u{43D}\u{44F}, \u{449}\u{43E}\u{431} \u{43F}\u{435}\u{440}\u{435}\u{439}\u{442}\u{438} \u{432} \u{440}\u{435}\u{436}\u{438}\u{43C} \u{432}\u{438}\u{431}\u{43E}\u{440}\u{443}.`,
    "select": `\u{412}\u{438}\u{431}\u{440}\u{430}\u{442}\u{438}`,
    "selectedAll": `\u{423}\u{441}\u{456} \u{435}\u{43B}\u{435}\u{43C}\u{435}\u{43D}\u{442}\u{438} \u{432}\u{438}\u{431}\u{440}\u{430}\u{43D}\u{43E}.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `\u{416}\u{43E}\u{434}\u{43D}\u{438}\u{445} \u{435}\u{43B}\u{435}\u{43C}\u{435}\u{43D}\u{442}\u{456}\u{432} \u{43D}\u{435} \u{432}\u{438}\u{431}\u{440}\u{430}\u{43D}\u{43E}`,
            one: ()=>`${formatter.number(args.count)} \u{435}\u{43B}\u{435}\u{43C}\u{435}\u{43D}\u{442} \u{432}\u{438}\u{431}\u{440}\u{430}\u{43D}\u{43E}`,
            other: ()=>`\u{412}\u{438}\u{431}\u{440}\u{430}\u{43D}\u{43E} \u{435}\u{43B}\u{435}\u{43C}\u{435}\u{43D}\u{442}\u{456}\u{432}: ${formatter.number(args.count)}`
        })}.`,
    "selectedItem": (args)=>`${args.item} \u{432}\u{438}\u{431}\u{440}\u{430}\u{43D}\u{43E}.`
};


export {$6bfd9245cbb46b69$exports as default};
//# sourceMappingURL=uk-UA.mjs.map

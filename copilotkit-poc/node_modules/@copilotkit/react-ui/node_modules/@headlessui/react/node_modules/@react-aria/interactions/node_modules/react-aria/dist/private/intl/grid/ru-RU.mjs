var $a0d888b9e3d893ba$exports = {};
$a0d888b9e3d893ba$exports = {
    "deselectedItem": (args)=>`${args.item} \u{43D}\u{435} \u{432}\u{44B}\u{431}\u{440}\u{430}\u{43D}\u{43E}.`,
    "longPressToSelect": `\u{41D}\u{430}\u{436}\u{43C}\u{438}\u{442}\u{435} \u{438} \u{443}\u{434}\u{435}\u{440}\u{436}\u{438}\u{432}\u{430}\u{439}\u{442}\u{435} \u{434}\u{43B}\u{44F} \u{432}\u{445}\u{43E}\u{434}\u{430} \u{432} \u{440}\u{435}\u{436}\u{438}\u{43C} \u{432}\u{44B}\u{431}\u{43E}\u{440}\u{430}.`,
    "select": `\u{412}\u{44B}\u{431}\u{440}\u{430}\u{442}\u{44C}`,
    "selectedAll": `\u{412}\u{44B}\u{431}\u{440}\u{430}\u{43D}\u{44B} \u{432}\u{441}\u{435} \u{44D}\u{43B}\u{435}\u{43C}\u{435}\u{43D}\u{442}\u{44B}.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `\u{41D}\u{435}\u{442} \u{432}\u{44B}\u{431}\u{440}\u{430}\u{43D}\u{43D}\u{44B}\u{445} \u{44D}\u{43B}\u{435}\u{43C}\u{435}\u{43D}\u{442}\u{43E}\u{432}`,
            one: ()=>`${formatter.number(args.count)} \u{44D}\u{43B}\u{435}\u{43C}\u{435}\u{43D}\u{442} \u{432}\u{44B}\u{431}\u{440}\u{430}\u{43D}`,
            other: ()=>`${formatter.number(args.count)} \u{44D}\u{43B}\u{435}\u{43C}\u{435}\u{43D}\u{442}\u{43E}\u{432} \u{432}\u{44B}\u{431}\u{440}\u{430}\u{43D}\u{43E}`
        })}.`,
    "selectedItem": (args)=>`${args.item} \u{432}\u{44B}\u{431}\u{440}\u{430}\u{43D}\u{43E}.`
};


export {$a0d888b9e3d893ba$exports as default};
//# sourceMappingURL=ru-RU.mjs.map

module.exports = {
    "close": `Aizv\u{113}rt`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} pazi\u{146}ojums`,
            other: ()=>`${formatter.number(args.count)} pazi\u{146}ojumi`
        })}.`
};


//# sourceMappingURL=lv-LV.cjs.map

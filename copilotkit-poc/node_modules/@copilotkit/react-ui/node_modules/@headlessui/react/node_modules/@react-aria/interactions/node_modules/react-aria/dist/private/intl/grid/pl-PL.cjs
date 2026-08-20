module.exports = {
    "deselectedItem": (args)=>`Nie zaznaczono ${args.item}.`,
    "longPressToSelect": `Naci\u{15B}nij i przytrzymaj, aby wej\u{15B}\u{107} do trybu wyboru.`,
    "select": `Zaznacz`,
    "selectedAll": `Wszystkie zaznaczone elementy.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nie zaznaczono \u{17C}adnych element\xf3w`,
            one: ()=>`${formatter.number(args.count)} zaznaczony element`,
            other: ()=>`${formatter.number(args.count)} zaznaczonych element\xf3w`
        })}.`,
    "selectedItem": (args)=>`Zaznaczono ${args.item}.`
};


//# sourceMappingURL=pl-PL.cjs.map

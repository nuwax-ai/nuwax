module.exports = {
    "close": `Cerrar`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} notificaci\xf3n`,
            other: ()=>`${formatter.number(args.count)} notificaciones`
        })}.`
};


//# sourceMappingURL=es-ES.cjs.map

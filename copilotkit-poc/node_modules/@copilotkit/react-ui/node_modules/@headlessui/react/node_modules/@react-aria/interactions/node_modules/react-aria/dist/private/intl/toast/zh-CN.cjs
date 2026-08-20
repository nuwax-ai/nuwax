module.exports = {
    "close": `\u{5173}\u{95ED}`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{4E2A}\u{901A}\u{77E5}`,
            other: ()=>`${formatter.number(args.count)} \u{4E2A}\u{901A}\u{77E5}`
        })}\u{3002}`
};


//# sourceMappingURL=zh-CN.cjs.map

module.exports = {
    "close": `\u{95DC}\u{9589}`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{500B}\u{901A}\u{77E5}`,
            other: ()=>`${formatter.number(args.count)} \u{500B}\u{901A}\u{77E5}`
        })}\u{3002}`
};


//# sourceMappingURL=zh-TW.cjs.map

module.exports = {
    "close": `\u{9589}\u{3058}\u{308B}`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} \u{500B}\u{306E}\u{901A}\u{77E5}`,
            other: ()=>`${formatter.number(args.count)} \u{500B}\u{306E}\u{901A}\u{77E5}`
        })}\u{3002}`
};


//# sourceMappingURL=ja-JP.cjs.map

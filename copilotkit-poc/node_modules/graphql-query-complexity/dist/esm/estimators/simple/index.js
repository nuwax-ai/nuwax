export default function (options) {
    const defaultComplexity = options && typeof options.defaultComplexity === 'number'
        ? options.defaultComplexity
        : 1;
    return (args) => {
        return defaultComplexity + args.childComplexity;
    };
}

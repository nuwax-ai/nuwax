"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComplexityDirective = void 0;
const graphql_1 = require("graphql");
const lodash_get_1 = __importDefault(require("lodash.get"));
function createComplexityDirective(options) {
    const mergedOptions = Object.assign({ name: 'complexity' }, (options || {}));
    return new graphql_1.GraphQLDirective({
        name: mergedOptions.name,
        description: 'Define a relation between the field and other nodes',
        locations: [graphql_1.DirectiveLocation.FIELD_DEFINITION],
        args: {
            value: {
                type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt),
                description: 'The complexity value for the field',
            },
            multipliers: {
                type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)),
            },
        },
    });
}
exports.createComplexityDirective = createComplexityDirective;
function default_1(options = {}) {
    const directive = createComplexityDirective(options);
    return (args) => {
        // Ignore if astNode is undefined
        if (!args.field.astNode) {
            return;
        }
        const values = (0, graphql_1.getDirectiveValues)(directive, args.field.astNode);
        // Ignore if no directive set
        if (!values) {
            return;
        }
        // Get multipliers
        let totalMultiplier = 1;
        if (values.multipliers && Array.isArray(values.multipliers)) {
            totalMultiplier = values.multipliers.reduce((aggregated, multiplier) => {
                const multiplierValue = (0, lodash_get_1.default)(args.args, multiplier);
                if (typeof multiplierValue === 'number') {
                    return aggregated * multiplierValue;
                }
                if (Array.isArray(multiplierValue)) {
                    return aggregated * multiplierValue.length;
                }
                return aggregated;
            }, totalMultiplier);
        }
        return (Number(values.value) + args.childComplexity) * totalMultiplier;
    };
}
exports.default = default_1;

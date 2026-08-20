import { getDirectiveValues, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLString, GraphQLDirective, DirectiveLocation, } from 'graphql';
import get from 'lodash.get';
export function createComplexityDirective(options) {
    const mergedOptions = Object.assign({ name: 'complexity' }, (options || {}));
    return new GraphQLDirective({
        name: mergedOptions.name,
        description: 'Define a relation between the field and other nodes',
        locations: [DirectiveLocation.FIELD_DEFINITION],
        args: {
            value: {
                type: new GraphQLNonNull(GraphQLInt),
                description: 'The complexity value for the field',
            },
            multipliers: {
                type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
            },
        },
    });
}
export default function (options = {}) {
    const directive = createComplexityDirective(options);
    return (args) => {
        // Ignore if astNode is undefined
        if (!args.field.astNode) {
            return;
        }
        const values = getDirectiveValues(directive, args.field.astNode);
        // Ignore if no directive set
        if (!values) {
            return;
        }
        // Get multipliers
        let totalMultiplier = 1;
        if (values.multipliers && Array.isArray(values.multipliers)) {
            totalMultiplier = values.multipliers.reduce((aggregated, multiplier) => {
                const multiplierValue = get(args.args, multiplier);
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

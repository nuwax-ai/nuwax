export function useErrorCoordinate() {
    return {
        onExecute({ args }) {
            args.schemaCoordinateInErrors = true;
        },
    };
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useErrorCoordinate = useErrorCoordinate;
function useErrorCoordinate() {
    return {
        onExecute({ args }) {
            args.schemaCoordinateInErrors = true;
        },
    };
}

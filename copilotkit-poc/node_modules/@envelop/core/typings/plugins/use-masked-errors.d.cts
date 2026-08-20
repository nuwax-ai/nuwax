import { Plugin } from '@envelop/types';
export declare const DEFAULT_ERROR_MESSAGE = "Unexpected error.";
export type MaskError = (error: unknown, message: string) => Error;
export type SerializableGraphQLErrorLike = Error & {
    name: 'GraphQLError';
    toJSON(): {
        message: string;
    };
    extensions?: Record<string, unknown>;
};
export declare function isGraphQLError(error: unknown): error is Error & {
    originalError?: Error;
};
export declare function isOriginalGraphQLError(error: unknown): error is Error & {
    originalError?: Error;
};
export declare const createDefaultMaskError: (isDev: boolean) => MaskError;
export declare const defaultMaskError: MaskError;
export type UseMaskedErrorsOpts = {
    /** The function used for identify and mask errors. */
    maskError?: MaskError;
    /** The error message that shall be used for masked errors. */
    errorMessage?: string;
};
export declare function useMaskedErrors<PluginContext extends Record<string, any> = {}>(opts?: UseMaskedErrorsOpts): Plugin<PluginContext>;

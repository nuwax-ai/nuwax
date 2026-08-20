import { DefaultContext, Maybe, Plugin } from '@envelop/types';
export declare const useSchema: (schema: any) => Plugin;
export declare const useSchemaByContext: (schemaLoader: (context: Maybe<DefaultContext>) => any) => Plugin;

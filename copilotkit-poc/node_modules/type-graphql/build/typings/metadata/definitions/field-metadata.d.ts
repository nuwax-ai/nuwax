import { type TypeOptions, type TypeValueThunk } from "../../decorators/types.js";
import { type Complexity } from "../../typings/index.js";
import { type Middleware } from "../../typings/middleware.js";
import { type DirectiveMetadata } from "./directive-metadata.js";
import { type ExtensionsMetadata } from "./extensions-metadata.js";
import { type ParamMetadata } from "./param-metadata.js";
export interface FieldMetadata {
    target: Function;
    schemaName: string;
    name: string;
    getType: TypeValueThunk;
    typeOptions: TypeOptions;
    description: string | undefined;
    deprecationReason: string | undefined;
    complexity: Complexity | undefined;
    params?: ParamMetadata[];
    roles?: any[];
    middlewares?: Array<Middleware<any>>;
    directives?: DirectiveMetadata[];
    extensions?: ExtensionsMetadata;
    simple?: boolean;
}
